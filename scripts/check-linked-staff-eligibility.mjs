import { readFile } from "node:fs/promises";
import postgres from "postgres";

if (!process.env.SUPABASE_DB_PASSWORD) throw new Error("SUPABASE_DB_PASSWORD is required");
const connection = new URL((await readFile("supabase/.temp/pooler-url", "utf8")).trim());
connection.password = process.env.SUPABASE_DB_PASSWORD;
const sql = postgres(connection.toString(), { ssl: "require", max: 1, connect_timeout: 15 });
try {
  const [counts] = await sql`
    select count(*) filter (where p.active) as active_staff,
      count(*) filter (where p.active and p.role = 'administrator'
        and u.email_confirmed_at is not null
        and nullif(u.encrypted_password, '') is not null
        and (u.banned_until is null or u.banned_until <= now())) as eligible_administrators,
      count(*) filter (where p.active and (
        u.email_confirmed_at is null or nullif(u.encrypted_password, '') is null
        or u.banned_until > now())) as ineligible_active_staff
    from public.staff_profiles p join auth.users u on u.id = p.user_id
  `;
  console.log(JSON.stringify(counts));
  if (Number(counts.eligible_administrators) < 1) process.exitCode = 1;
} finally {
  await sql.end();
}
