import type { PoolClient } from "@neondatabase/serverless";
import { SCHEMA_STATEMENTS } from "@/server/schema";
import { withClient } from "@/server/db";
import {
  isGameMode,
  isReadyRule,
  type GameMode,
  type PlayerStatus,
  type ReadyRule,
  type SessionState,
} from "../model/session";
import type { SessionApplyResult, SessionRepository } from "./session-repository";

type SettingsRow = {
  court_count: number;
  game_mode: string;
  ready_rule: string;
};

type CourtRow = {
  id: string;
  sort_order: number;
  name: string;
  name_key: string;
  started_at: Date | string | null;
};

type PlayerRow = {
  id: string;
  token: string;
  name: string;
  name_key: string;
  claimed: boolean;
  status: string;
  court_id: string | null;
  joined_at: Date | string;
};

let schemaReady: Promise<void> | null = null;

function toIso(value: Date | string): string {
  if (value instanceof Date) {
    return value.toISOString();
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toISOString();
}

function mapState(
  settings: SettingsRow,
  courts: CourtRow[],
  players: PlayerRow[],
): SessionState {
  const gameMode: GameMode = isGameMode(settings.game_mode)
    ? settings.game_mode
    : "doubles";
  const readyRule: ReadyRule = isReadyRule(settings.ready_rule)
    ? settings.ready_rule
    : "longest_wait";

  return {
    settings: {
      courtCount: settings.court_count,
      gameMode,
      readyRule,
    },
    courts: courts.map((court) => ({
      id: court.id,
      sortOrder: court.sort_order,
      name: court.name,
      nameKey: court.name_key,
      startedAt: court.started_at ? toIso(court.started_at) : null,
    })),
    players: players.map((player) => ({
      id: player.id,
      token: player.token,
      name: player.name,
      nameKey: player.name_key,
      claimed: player.claimed !== false,
      status: player.status as PlayerStatus,
      courtId: player.court_id,
      joinedAt: toIso(player.joined_at),
    })),
  };
}

async function ensureSchema(client: PoolClient): Promise<void> {
  for (const statement of SCHEMA_STATEMENTS) {
    await client.query(statement);
  }
}

async function ensureSchemaOnce(): Promise<void> {
  if (!schemaReady) {
    schemaReady = withClient((client) => ensureSchema(client));
  }
  await schemaReady;
}

async function loadState(client: PoolClient): Promise<SessionState> {
  const settingsResult = await client.query<SettingsRow>(
    "SELECT court_count, game_mode, ready_rule FROM app_settings WHERE id = 1",
  );
  const settings = settingsResult.rows[0];
  if (!settings) {
    throw new Error("Session settings row is missing");
  }

  const courtsResult = await client.query<CourtRow>(
    "SELECT id, sort_order, name, name_key, started_at FROM courts ORDER BY sort_order",
  );
  const playersResult = await client.query<PlayerRow>(
    "SELECT id, token, name, name_key, claimed, status, court_id, joined_at FROM players",
  );

  return mapState(settings, courtsResult.rows, playersResult.rows);
}

async function saveState(client: PoolClient, state: SessionState): Promise<void> {
  await client.query(
    `UPDATE app_settings
     SET court_count = $1, game_mode = $2, ready_rule = $3, updated_at = now()
     WHERE id = 1`,
    [state.settings.courtCount, state.settings.gameMode, state.settings.readyRule],
  );

  await client.query("DELETE FROM players");

  const courtIds = state.courts.map((court) => court.id);
  if (courtIds.length === 0) {
    await client.query("DELETE FROM courts");
  } else {
    await client.query("DELETE FROM courts WHERE NOT (id = ANY($1::uuid[]))", [
      courtIds,
    ]);
  }

  for (const court of state.courts) {
    await client.query(
      `INSERT INTO courts (id, sort_order, name, name_key, started_at)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (id) DO UPDATE SET
         sort_order = EXCLUDED.sort_order,
         name = EXCLUDED.name,
         name_key = EXCLUDED.name_key,
         started_at = EXCLUDED.started_at`,
      [court.id, court.sortOrder, court.name, court.nameKey, court.startedAt],
    );
  }

  for (const player of state.players) {
    await client.query(
      `INSERT INTO players (id, token, name, name_key, claimed, status, court_id, joined_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (id) DO UPDATE SET
         token = EXCLUDED.token,
         name = EXCLUDED.name,
         name_key = EXCLUDED.name_key,
         claimed = EXCLUDED.claimed,
         status = EXCLUDED.status,
         court_id = EXCLUDED.court_id,
         joined_at = EXCLUDED.joined_at`,
      [
        player.id,
        player.token,
        player.name,
        player.nameKey,
        player.claimed,
        player.status,
        player.courtId,
        player.joinedAt,
      ],
    );
  }
}

export function createNeonSessionRepository(): SessionRepository {
  return {
    async load() {
      await ensureSchemaOnce();
      return withClient(async (client) => loadState(client));
    },
    async transact<T>(apply: (state: SessionState) => SessionApplyResult<T>) {
      await ensureSchemaOnce();
      return withClient(async (client) => {
        await client.query("BEGIN");
        try {
          await client.query("SELECT id FROM app_settings WHERE id = 1 FOR UPDATE");
          await client.query("SELECT id FROM courts FOR UPDATE");
          await client.query("SELECT id FROM players FOR UPDATE");
          const current = await loadState(client);
          const result = apply(current);
          if (result.changed) {
            await saveState(client, result.next);
          }
          await client.query("COMMIT");
          return result.value;
        } catch (error) {
          await client.query("ROLLBACK");
          throw error;
        }
      });
    },
  };
}
