import {
  pgTable,
  text,
  timestamp,
  jsonb,
  index,
  serial,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const messages = pgTable(
  "messages",
  {
    messageId: text("message_id").primaryKey(),
    fromAddress: text("from_address").notNull(),
    fromDomain: text("from_domain").notNull(),
    toAddresses: text("to_addresses").array().notNull(),
    toDomain: text("to_domain"),
    subject: text("subject"),
    configurationSet: text("configuration_set"),
    sourceArn: text("source_arn"),
    sentAt: timestamp("sent_at", { withTimezone: true }).notNull(),
    lastEventType: text("last_event_type"),
    lastEventAt: timestamp("last_event_at", { withTimezone: true }),
  },
  (t) => ({
    fromDomainIdx: index("messages_from_domain_idx").on(t.fromDomain),
    sentAtIdx: index("messages_sent_at_idx").on(t.sentAt),
    lastEventTypeIdx: index("messages_last_event_type_idx").on(t.lastEventType),
  })
);

export const events = pgTable(
  "events",
  {
    id: serial("id").primaryKey(),
    messageId: text("message_id")
      .notNull()
      .references(() => messages.messageId, { onDelete: "cascade" }),
    eventType: text("event_type").notNull(),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
    bounceType: text("bounce_type"),
    bounceSubType: text("bounce_sub_type"),
    complaintFeedbackType: text("complaint_feedback_type"),
    diagnostic: text("diagnostic"),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    link: text("link"),
    snsMessageId: text("sns_message_id"),
    payload: jsonb("payload").notNull(),
  },
  (t) => ({
    messageIdIdx: index("events_message_id_idx").on(t.messageId),
    typeIdx: index("events_type_idx").on(t.eventType),
    occurredAtIdx: index("events_occurred_at_idx").on(t.occurredAt),
    snsDedupeIdx: uniqueIndex("events_sns_dedupe_idx").on(t.snsMessageId),
  })
);

export type Message = typeof messages.$inferSelect;
export type Event = typeof events.$inferSelect;
