-- Notification bots and their destinations, replacing the three ZALO_* secrets.
--
-- Env vars could hold one bot and two chat ids. They could not hold N, because
-- every extra destination meant a new secret name, a new field on AppEnv, a new
-- entry in wrangler.toml's `required` list and a deploy — and a name missing
-- from that list is simply `undefined` at runtime with no warning anywhere.
-- Rows do not have that failure mode.
--
-- Two tables rather than one because a bot and a destination have different
-- lifetimes: swapping a group must not touch the token, and adding a group must
-- not touch the bot.
CREATE TABLE bots (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  code       TEXT NOT NULL UNIQUE,
  name       TEXT NOT NULL,
  platform   TEXT NOT NULL DEFAULT 'ZALO' CHECK (platform IN ('ZALO')),
  -- Encrypted, never plaintext: `v1.<iv_b64>.<ciphertext_b64>`, AES-GCM under
  -- BOT_ENCRYPTION_KEY. A bot token can send messages as the bot to every chat
  -- it is in, which is enough to post a fake invoice notice with someone
  -- else's bank account into the tenants' group. Ciphertext here means a D1
  -- export, an MCP `d1_database_query`, or a screenshot of a query result
  -- hands over nothing usable.
  token      TEXT NOT NULL,
  -- Turning a bot off keeps its targets and their chat ids; deleting loses them.
  active     INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
  created_at TEXT NOT NULL
);

CREATE TABLE bot_targets (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  code        TEXT NOT NULL UNIQUE,
  bot_id      INTEGER NOT NULL REFERENCES bots (id),
  -- Decides the *content*, not just the count. GROUP gets the message with no
  -- room name and no amount; MANAGER gets the figures. That split is the whole
  -- reason the app does not tell one tenant what another owes, so it is a
  -- CHECK-constrained enum rather than a free-text label.
  kind        TEXT NOT NULL CHECK (kind IN ('GROUP', 'MANAGER')),
  chat_id     TEXT NOT NULL,
  label       TEXT NOT NULL,
  -- NULL means every building. RESTRICT rather than ON DELETE SET NULL: SET
  -- NULL would silently widen a target from one building to all of them.
  building_id INTEGER REFERENCES buildings (id),
  active      INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
  -- One chat must not receive the same message twice from the same bot.
  UNIQUE (bot_id, chat_id)
);

-- The routing query filters on exactly this pair.
CREATE INDEX IF NOT EXISTS idx_bot_targets_kind ON bot_targets (kind, active);
