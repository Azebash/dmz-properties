insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('property-documents', 'property-documents', false, 3145728, array['application/pdf'])
on conflict (id) do update set public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "Property staff reads private document objects"
on storage.objects for select to authenticated
using (bucket_id = 'property-documents'
  and private.has_staff_role(array['administrator', 'property_manager']::public.staff_role[]));

create function public.add_property_document(
  p_property_id uuid, p_storage_path text, p_document_type text,
  p_display_name text, p_notes text
)
returns uuid language plpgsql security definer set search_path = ''
as $$
declare
  actor uuid := (select auth.uid());
  document_id uuid;
begin
  if not private.has_staff_role(array['administrator', 'property_manager']::public.staff_role[]) then
    raise insufficient_privilege using message = 'property document editing is not permitted';
  end if;
  perform 1 from public.properties where id = p_property_id for update;
  if not found then raise no_data_found using message = 'property not found'; end if;
  if p_storage_path !~ ('^' || p_property_id::text || '/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}[.]pdf$')
    or p_document_type is null or p_document_type not in ('offer_letter', 'title_document', 'survey_plan', 'other')
    or char_length(trim(coalesce(p_display_name, ''))) not between 5 and 120
    or char_length(coalesce(p_notes, '')) > 500 then
    raise check_violation using message = 'document fields are invalid';
  end if;
  insert into public.property_documents
    (property_id, storage_path, document_type, display_name, notes, created_by)
  values (p_property_id, p_storage_path, p_document_type, trim(p_display_name),
    nullif(trim(p_notes), ''), actor)
  returning id into document_id;
  insert into public.audit_events (actor_id, entity_type, entity_id, action, next_value)
  values (actor, 'property_document', document_id::text, 'created',
    jsonb_build_object('propertyId', p_property_id, 'type', p_document_type,
      'name', trim(p_display_name), 'status', 'submitted'));
  return document_id;
end;
$$;

create function public.update_property_document(
  p_document_id uuid, p_document_type text, p_display_name text, p_notes text
)
returns public.verification_status language plpgsql security definer set search_path = ''
as $$
declare
  actor uuid := (select auth.uid());
  previous_row public.property_documents%rowtype;
  next_row public.property_documents%rowtype;
begin
  if not private.has_staff_role(array['administrator', 'property_manager']::public.staff_role[]) then
    raise insufficient_privilege using message = 'property document editing is not permitted';
  end if;
  select * into previous_row from public.property_documents
  where id = p_document_id for update;
  if not found then raise no_data_found using message = 'property document not found'; end if;
  if p_document_type is null or p_document_type not in ('offer_letter', 'title_document', 'survey_plan', 'other')
    or char_length(trim(coalesce(p_display_name, ''))) not between 5 and 120
    or char_length(coalesce(p_notes, '')) > 500 then
    raise check_violation using message = 'document fields are invalid';
  end if;
  if previous_row.document_type = p_document_type
    and previous_row.display_name = trim(p_display_name)
    and previous_row.notes is not distinct from nullif(trim(p_notes), '') then
    return previous_row.verification_status;
  end if;
  update public.property_documents set
    document_type = p_document_type, display_name = trim(p_display_name),
    notes = nullif(trim(p_notes), ''),
    verification_status = case when verification_status in ('approved', 'rejected')
      then 'submitted'::public.verification_status else verification_status end
  where id = p_document_id returning * into next_row;
  insert into public.audit_events
    (actor_id, entity_type, entity_id, action, previous_value, next_value)
  values (actor, 'property_document', p_document_id::text, 'updated',
    jsonb_build_object('type', previous_row.document_type, 'name', previous_row.display_name,
      'status', previous_row.verification_status),
    jsonb_build_object('type', next_row.document_type, 'name', next_row.display_name,
      'status', next_row.verification_status));
  return next_row.verification_status;
end;
$$;

create function public.transition_property_document(
  p_document_id uuid, p_status public.verification_status, p_review_confirmed boolean
)
returns public.verification_status language plpgsql security definer set search_path = ''
as $$
declare
  actor uuid := (select auth.uid());
  previous_status public.verification_status;
begin
  if not private.has_staff_role(array['administrator', 'property_manager']::public.staff_role[]) then
    raise insufficient_privilege using message = 'property document review is not permitted';
  end if;
  select verification_status into previous_status from public.property_documents
  where id = p_document_id for update;
  if not found then raise no_data_found using message = 'property document not found'; end if;
  if not (
    (previous_status = 'submitted' and p_status in ('approved', 'rejected'))
    or (previous_status = 'approved' and p_status = 'withdrawn')
    or (previous_status in ('rejected', 'withdrawn') and p_status = 'submitted')
  ) then
    raise check_violation using message = 'invalid document status transition';
  end if;
  if p_status = 'approved' and p_review_confirmed is distinct from true then
    raise check_violation using message = 'document review requires confirmation';
  end if;
  update public.property_documents set verification_status = p_status where id = p_document_id;
  insert into public.audit_events
    (actor_id, entity_type, entity_id, action, previous_value, next_value)
  values (actor, 'property_document', p_document_id::text, 'status_changed',
    jsonb_build_object('status', previous_status),
    jsonb_build_object('status', p_status, 'reviewConfirmed', p_review_confirmed is true));
  return p_status;
end;
$$;

revoke all on function public.add_property_document(uuid,text,text,text,text) from public, anon;
revoke all on function public.update_property_document(uuid,text,text,text) from public, anon;
revoke all on function public.transition_property_document(uuid,public.verification_status,boolean) from public, anon;
grant execute on function public.add_property_document(uuid,text,text,text,text) to authenticated;
grant execute on function public.update_property_document(uuid,text,text,text) to authenticated;
grant execute on function public.transition_property_document(uuid,public.verification_status,boolean) to authenticated;
