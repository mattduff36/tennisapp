import type { PoolClient } from "@neondatabase/serverless";
import { SCHEMA_STATEMENTS } from "@/server/schema";
import { withClient } from "@/server/db";
import type { PinStore } from "./pin-store";
import { emptyPinRecord, type PinRecord } from "./settings-pin";

type PinRow = {
  pin_hash: string | null;
  pin_salt: string | null;
  pin_unlock_token: string | null;
};

let schemaReady: Promise<void> | null = null;

async function ensureSchemaOnce(): Promise<void> {
  if (!schemaReady) {
    schemaReady = withClient(async (client) => {
      for (const statement of SCHEMA_STATEMENTS) {
        await client.query(statement);
      }
    });
  }
  await schemaReady;
}

function mapRecord(row: PinRow | undefined): PinRecord {
  if (!row) {
    return emptyPinRecord();
  }
  return {
    hash: row.pin_hash,
    salt: row.pin_salt,
    unlockToken: row.pin_unlock_token,
  };
}

async function loadRecord(client: PoolClient): Promise<PinRecord> {
  const result = await client.query<PinRow>(
    "SELECT pin_hash, pin_salt, pin_unlock_token FROM app_settings WHERE id = 1",
  );
  return mapRecord(result.rows[0]);
}

export function createNeonPinStore(): PinStore {
  return {
    async load() {
      await ensureSchemaOnce();
      return withClient((client) => loadRecord(client));
    },
    async save(record) {
      await ensureSchemaOnce();
      await withClient(async (client) => {
        await client.query("BEGIN");
        try {
          await client.query("SELECT id FROM app_settings WHERE id = 1 FOR UPDATE");
          await client.query(
            `UPDATE app_settings
             SET pin_hash = $1, pin_salt = $2, pin_unlock_token = $3, updated_at = now()
             WHERE id = 1`,
            [record.hash, record.salt, record.unlockToken],
          );
          await client.query("COMMIT");
        } catch (error) {
          await client.query("ROLLBACK");
          throw error;
        }
      });
    },
  };
}
