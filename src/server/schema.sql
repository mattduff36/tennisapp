CREATE TABLE IF NOT EXISTS app_settings (
  id integer PRIMARY KEY CHECK (id = 1),
  court_count integer NOT NULL CHECK (court_count >= 1 AND court_count <= 8),
  game_mode text NOT NULL CHECK (game_mode IN ('singles', 'doubles')),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS courts (
  id uuid PRIMARY KEY,
  sort_order integer NOT NULL UNIQUE,
  name text NOT NULL,
  name_key text NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS players (
  id uuid PRIMARY KEY,
  token uuid NOT NULL UNIQUE,
  name text NOT NULL,
  name_key text NOT NULL UNIQUE,
  status text NOT NULL CHECK (status IN ('waiting', 'on_court')),
  court_id uuid REFERENCES courts (id),
  joined_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT players_status_court_ck CHECK (
    (status = 'waiting' AND court_id IS NULL)
    OR (status = 'on_court' AND court_id IS NOT NULL)
  )
);

ALTER TABLE players ADD COLUMN IF NOT EXISTS token uuid;
UPDATE players SET token = id WHERE token IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS players_token_idx ON players (token);
CREATE INDEX IF NOT EXISTS players_court_id_idx ON players (court_id);
CREATE INDEX IF NOT EXISTS players_status_idx ON players (status);

INSERT INTO app_settings (id, court_count, game_mode)
VALUES (1, 3, 'doubles')
ON CONFLICT (id) DO NOTHING;

INSERT INTO courts (id, sort_order, name, name_key)
SELECT gen_random_uuid(), seed.sort_order, seed.name, seed.name_key
FROM (
  VALUES
    (1, 'Court 1', 'court 1'),
    (2, 'Court 2', 'court 2'),
    (3, 'Court 3', 'court 3')
) AS seed(sort_order, name, name_key)
WHERE NOT EXISTS (SELECT 1 FROM courts);
