drop function public.check_enquiry_rate_limit(text, integer, integer);

create function public.check_enquiry_rate_limit(
  p_identifier_hash text,
  p_max_requests integer default 5,
  p_window_seconds integer default 60
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_count integer;
  window_interval interval;
begin
  if char_length(p_identifier_hash) < 32 then
    raise exception 'identifier hash is invalid';
  end if;
  if p_max_requests < 1 or p_window_seconds < 1 then
    raise exception 'rate-limit configuration is invalid';
  end if;

  window_interval := make_interval(secs => p_window_seconds);

  insert into private.enquiry_rate_limits (
    identifier_hash,
    window_started_at,
    request_count
  ) values (
    p_identifier_hash,
    now(),
    1
  )
  on conflict (identifier_hash) do update set
    window_started_at = case
      when private.enquiry_rate_limits.window_started_at <= now() - window_interval
        then now()
      else private.enquiry_rate_limits.window_started_at
    end,
    request_count = case
      when private.enquiry_rate_limits.window_started_at <= now() - window_interval
        then 1
      else private.enquiry_rate_limits.request_count + 1
    end
  returning private.enquiry_rate_limits.request_count into current_count;

  if random() < 0.01 then
    delete from private.enquiry_rate_limits
    where window_started_at < now() - interval '1 day';
  end if;

  return current_count > p_max_requests;
end;
$$;

revoke all on function public.check_enquiry_rate_limit(text, integer, integer)
from public, anon, authenticated;
grant execute on function public.check_enquiry_rate_limit(text, integer, integer)
to service_role;
