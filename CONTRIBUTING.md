# Contributing to SESPulse

Thanks for your interest in making SESPulse better! This project is small
enough that the contribution flow is intentionally lightweight.

## Reporting bugs

Open an issue with:

- What you were trying to do
- What happened (logs from the `worker` container are usually the most useful)
- Your AWS region and roughly what SES event types you were sending

Please **do not paste real bounce/complaint payloads** that contain
recipient email addresses — redact them first.

## Proposing changes

For anything non-trivial, open an issue first to discuss the design. For
small fixes (typos, obvious bugs, dependency bumps) feel free to send a PR
directly.

## Local development

```sh
git clone https://github.com/venelinkochev/sespulse
cd sespulse
cp .env.example .env             # fill in AWS creds + SES_EVENTS_QUEUE_URL
npm install
docker compose up -d db          # just Postgres
npm run db:migrate
npm run worker:dev &             # background — polls your SQS queue
npm run dev                      # http://localhost:3000
```

If you don't have a real SQS queue handy yet, the dashboard still renders;
it'll just show empty states until events arrive.

## Code style

- TypeScript strict mode, ESM-everywhere
- Tailwind utility classes (no inline `style` props)
- Server Components by default; only mark a component `"use client"` if it
  actually needs to (state, effects, event handlers)
- Database changes go in `src/db/schema.ts` and `src/db/migrate.ts` together

## Scope

SESPulse aims to stay a focused, self-hostable SES dashboard. Things that
fit:

- New chart types or visualizations on top of the existing event data
- Better filtering and search in logs
- Additional ingestion sources (Kinesis Firehose, direct SES->EventBridge)
- Alerting hooks (Slack/webhook when bounce rate spikes, etc.)

Things that don't fit:

- A full email-sending UI — SESPulse is a *monitoring* tool, not a sender
- Wrapping non-SES providers — the SES event shape is core to the schema

## License

By contributing, you agree that your contributions will be licensed under
the MIT License.
