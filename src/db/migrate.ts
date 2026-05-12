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
