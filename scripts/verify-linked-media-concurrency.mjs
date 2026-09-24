import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import postgres from "postgres";

if (!process.env.SUPABASE_DB_PASSWORD) throw new Error("SUPABASE_DB_PASSWORD is required");
const url = new URL((await readFile("supabase/.temp/pooler-url", "utf8")).trim());
url.password = process.env.SUPABASE_DB_PASSWORD;
const sql = postgres(url.toString(), { ssl: "require", max: 2, connect_timeout: 15 });

async function runRace(first) {
  const propertyId = randomUUID();
  const mediaId = randomUUID();
  const reference = `RACE-${propertyId.slice(0, 8)}`;
  await sql`
    insert into public.properties (
      id,reference,slug,title,source,property_type,status,location_name,description
    ) values (
      ${propertyId},${reference},${`race-${propertyId}`},'Temporary race fixture',
      'owner_resale','House','draft','KYC Homes Phase II','Temporary private classification check'
    )
  `;
  try {
    await sql`
      insert into public.property_media (
        id,property_id,storage_path,alt_text,estate_context
      ) values (
        ${mediaId},${propertyId},${`${propertyId}/${randomUUID()}.webp`},
        'Temporary estate context photograph',true
      )
    `;

    let releaseFirst = () => {};
    let firstUpdated = () => {};
    const hold = new Promise((resolve) => { releaseFirst = resolve; });
    const started = new Promise((resolve) => { firstUpdated = resolve; });
    const firstTransaction = sql.begin(async (tx) => {
      if (first === "property") {
        await tx`update public.properties set property_type='Virgin Land' where id=${propertyId}`;
      } else {
        await tx`update public.property_media set estate_context=false where id=${mediaId}`;
      }
      firstUpdated();
      await hold;
    });
    await started;
    const secondTransaction = sql.begin(async (tx) => {
      if (first === "property") {
        await tx`update public.property_media set estate_context=false where id=${mediaId}`;
      } else {
        await tx`update public.properties set property_type='Virgin Land' where id=${propertyId}`;
      }
    });
    await new Promise((resolve) => setTimeout(resolve, 150));
    releaseFirst();
    const results = await Promise.allSettled([firstTransaction, secondTransaction]);
    if (results[0].status !== "fulfilled" || results[1].status !== "rejected" ||
      results[1].reason?.code !== "23514") {
      throw new Error(`${first}-first media classification race did not enforce the invariant`);
    }
    console.log(`${first}-first classification race rejected the conflicting edit`);
  } finally {
    await sql`delete from public.properties where id=${propertyId}`;
  }
}

try {
  await runRace("property");
  await runRace("media");
} finally {
  await sql.end();
}
