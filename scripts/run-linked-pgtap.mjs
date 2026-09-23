import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import postgres from "postgres";

const password = process.env.SUPABASE_DB_PASSWORD;
if (!password) throw new Error("SUPABASE_DB_PASSWORD is required");

const poolerUrl = (
  await readFile(path.resolve("supabase/.temp/pooler-url"), "utf8")
).trim();
const connection = new URL(poolerUrl);
connection.password = password;

const sql = postgres(connection.toString(), {
  ssl: "require",
  max: 1,
  idle_timeout: 2,
  connect_timeout: 15,
});

try {
  const testsDirectory = path.resolve("supabase/tests");
  const testFiles = (await readdir(testsDirectory))
    .filter((file) => file.endsWith(".test.sql"))
    .sort();
  if (!testFiles.length) throw new Error("No pgTAP files were found");

  for (const file of testFiles) {
    const source = await readFile(path.join(testsDirectory, file), "utf8");
    const results = await sql.unsafe(source).simple();
    const messages = results
      .flatMap((result) => Array.from(result))
      .flatMap((row) => Object.values(row))
      .filter((value) => typeof value === "string")
      .filter((value) => /^(ok|not ok|1\.\.)/.test(value));

    console.log(file);
    for (const message of messages) console.log(message);
    if (messages.some((message) => message.startsWith("not ok"))) process.exitCode = 1;
    if (!messages.some((message) => message.startsWith("1.."))) {
      throw new Error(`${file} did not return a pgTAP plan`);
    }
  }
} finally {
  await sql.end();
}
