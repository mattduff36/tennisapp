import { neonConfig, Pool } from "@neondatabase/serverless";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

const url = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
if (!url) {
  throw new Error("DATABASE_URL is not set");
}

const schemaPath = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../src/server/schema.sql",
);
const schema = readFileSync(schemaPath, "utf8");
const statements = schema
  .split(/;\s*\n/)
  .map((statement) => statement.trim())
  .filter(Boolean);

const pool = new Pool({ connectionString: url });
const client = await pool.connect();
try {
  for (const statement of statements) {
    await client.query(statement);
  }
  console.log(`Migrated ${statements.length} statements.`);
} finally {
  client.release();
  await pool.end();
}
