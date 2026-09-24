-- Staff are deactivated and audited, not silently removed through Auth deletion.
alter table public.staff_profiles drop constraint staff_profiles_user_id_fkey;
alter table public.staff_profiles add constraint staff_profiles_user_id_fkey
foreign key (user_id) references auth.users(id) on delete restrict;
