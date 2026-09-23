import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";

if (!process.env.SUPABASE_DB_PASSWORD) {
  throw new Error("SUPABASE_DB_PASSWORD is required");
}

const pooler = new URL((await readFile("supabase/.temp/pooler-url", "utf8")).trim());
pooler.password = process.env.SUPABASE_DB_PASSWORD;

const cli = path.resolve("node_modules/supabase/dist/supabase.js");
const child = spawn(process.execPath, [cli, "db", "push", "--db-url", pooler.toString(), "--yes"], {
  stdio: "inherit",
});
child.on("error", () => { process.exitCode = 1; });
child.on("exit", (code) => { process.exitCode = code === 0 ? 0 : 1; });
