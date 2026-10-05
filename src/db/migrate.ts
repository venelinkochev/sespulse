import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL!, { max: 1 });

const ddl = `
CREATE TABLE IF NOT EXISTS messages (
  message_id          TEXT PRIMARY KEY,
  from_address        TEXT NOT NULL,
  from_domain         TEXT NOT NULL,
  to_addresses        TEXT[] NOT NULL,
  to_domain           TEXT,
  subject             TEXT,
  configuration_set   TEXT,
  source_arn          TEXT,
  sent_at             TIMESTAMPTZ NOT NULL,
  last_event_type     TEXT,
  last_event_at       TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS messages_from_domain_idx ON messages(from_domain);
CREATE INDEX IF NOT EXISTS messages_sent_at_idx ON messages(sent_at DESC);
CREATE INDEX IF NOT EXISTS messages_last_event_type_idx ON messages(last_event_type);

CREATE TABLE IF NOT EXISTS events (
  id                       SERIAL PRIMARY KEY,
  message_id               TEXT NOT NULL REFERENCES messages(message_id) ON DELETE CASCADE,
  event_type               TEXT NOT NULL,
  occurred_at              TIMESTAMPTZ NOT NULL,
  bounce_type              TEXT,
  bounce_sub_type          TEXT,
  complaint_feedback_type  TEXT,
  diagnostic               TEXT,
  ip_address               TEXT,
  user_agent               TEXT,
  link                     TEXT,
  sns_message_id           TEXT,
  payload                  JSONB NOT NULL
);

CREATE INDEX IF NOT EXISTS events_message_id_idx ON events(message_id);
CREATE INDEX IF NOT EXISTS events_type_idx ON events(event_type);
CREATE INDEX IF NOT EXISTS events_occurred_at_idx ON events(occurred_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS events_sns_dedupe_idx ON events(sns_message_id);

-- Recipient addresses arrive in several forms: bare (a@x.com), with a
-- display name (Name <a@x.com>, "Name" <A@X.com>), in any casing. These
-- reduce one address, or every address in an array, to a bare lowercase
-- key. Keep the two expressions identical, and keep them in step with
-- bareAddress() in src/lib/address.ts.
CREATE OR REPLACE FUNCTION sespulse_bare_address(addr text) RETURNS text
  LANGUAGE sql IMMUTABLE PARALLEL SAFE AS $$
    SELECT lower(btrim(COALESCE(substring(addr from '<([^<>]+)>'), addr)))
  $$;
CREATE OR REPLACE FUNCTION sespulse_bare_addresses(addrs text[]) RETURNS text[]
  LANGUAGE sql IMMUTABLE PARALLEL SAFE AS $$
    SELECT COALESCE(array_agg(lower(btrim(COALESCE(substring(a from '<([^<>]+)>'), a)))), '{}')
    FROM unnest(addrs) a
  $$;

-- Recipient lookups on the Recipients page match on the normalized keys.
DROP INDEX IF EXISTS messages_to_addresses_idx;
CREATE INDEX IF NOT EXISTS messages_recipient_keys_idx
  ON messages USING GIN (sespulse_bare_addresses(to_addresses));

-- Single-row table the worker updates as it polls SQS. Lets the dashboard
-- and /api/health tell "no mail being sent" apart from "worker is down".
CREATE TABLE IF NOT EXISTS worker_heartbeat (
  id             INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  last_poll_at   TIMESTAMPTZ NOT NULL,
  last_event_at  TIMESTAMPTZ
);
`;

async function main() {
  console.log("Running migrations...");
  await sql.unsafe(ddl);
  console.log("Migrations complete.");
  await sql.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
