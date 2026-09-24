drop policy "Staff reads property documents" on public.property_documents;
create policy "Property staff reads property documents"
on public.property_documents for select to authenticated
using (private.has_staff_role(array['administrator', 'property_manager']::public.staff_role[]));

drop policy "Staff reads enquiries" on public.enquiries;
create policy "Property staff reads enquiries"
on public.enquiries for select to authenticated
using (private.has_staff_role(array['administrator', 'property_manager']::public.staff_role[]));

drop policy "Staff reads inspections" on public.inspections;
create policy "Property staff reads inspections"
on public.inspections for select to authenticated
using (private.has_staff_role(array['administrator', 'property_manager']::public.staff_role[]));

drop policy "Staff reads seller submissions" on public.seller_submissions;
create policy "Property staff reads seller submissions"
on public.seller_submissions for select to authenticated
using (private.has_staff_role(array['administrator', 'property_manager']::public.staff_role[]));
