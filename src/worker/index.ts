import {
  SQSClient,
  ReceiveMessageCommand,
  DeleteMessageBatchCommand,
  type Message as SqsMessage,
} from "@aws-sdk/client-sqs";
import { sql } from "drizzle-orm";
import { db } from "../db/client";
import { events, messages } from "../db/schema";
import {
  domainOf,
  inferEventType,
  type SesNotification,
} from "../lib/ses-types";

const QUEUE_URL = process.env.SES_EVENTS_QUEUE_URL;
if (!QUEUE_URL) {
  console.error("SES_EVENTS_QUEUE_URL is not set");
  process.exit(1);
}

const sqs = new SQSClient({ region: process.env.AWS_REGION ?? "us-east-1" });

let running = true;
process.on("SIGINT", () => {
  running = false;
});
process.on("SIGTERM", () => {
  running = false;
});

async function handleNotification(
  notif: SesNotification,
  snsMessageId: string | undefined
) {
  const eventType = inferEventType(notif);
  const mail = notif.mail;
  const occurredAt = new Date(
    notif.bounce?.timestamp ??
      notif.complaint?.timestamp ??
      notif.delivery?.timestamp ??
      notif.open?.timestamp ??
      notif.click?.timestamp ??
      notif.deliveryDelay?.timestamp ??
      mail.timestamp
  );
  const sentAt = new Date(mail.timestamp);

  const fromAddress =
    mail.commonHeaders?.from?.[0] ?? mail.source ?? "unknown@unknown";
  const cleanedFrom = fromAddress.match(/<([^>]+)>/)?.[1] ?? fromAddress;
  const fromDomain = domainOf(cleanedFrom);
  const toAddresses = mail.destination ?? [];
  const toDomain = toAddresses[0] ? domainOf(toAddresses[0]) : null;
  const subject = mail.commonHeaders?.subject ?? null;

  // Upsert message row
  await db
    .insert(messages)
    .values({
      messageId: mail.messageId,
      fromAddress: cleanedFrom,
      fromDomain,
      toAddresses,
      toDomain,
      subject,
      configurationSet: (mail as any).configurationSet ?? null,
      sourceArn: mail.sourceArn ?? null,
      sentAt,
      lastEventType: eventType,
      lastEventAt: occurredAt,
    })
    .onConflictDoUpdate({
      target: messages.messageId,
      set: {
        lastEventType: sql`CASE WHEN ${messages.lastEventAt} IS NULL OR ${messages.lastEventAt} < ${occurredAt.toISOString()} THEN ${eventType} ELSE ${messages.lastEventType} END`,
        lastEventAt: sql`GREATEST(${messages.lastEventAt}, ${occurredAt.toISOString()})`,
      },
    });

  await db
    .insert(events)
    .values({
      messageId: mail.messageId,
      eventType,
      occurredAt,
      bounceType: notif.bounce?.bounceType ?? null,
      bounceSubType: notif.bounce?.bounceSubType ?? null,
      complaintFeedbackType: notif.complaint?.complaintFeedbackType ?? null,
      diagnostic:
        notif.bounce?.bouncedRecipients?.[0]?.diagnosticCode ??
        notif.reject?.reason ??
        notif.failure?.errorMessage ??
        null,
      ipAddress: notif.open?.ipAddress ?? notif.click?.ipAddress ?? null,
      userAgent: notif.open?.userAgent ?? notif.click?.userAgent ?? null,
      link: notif.click?.link ?? null,
      snsMessageId: snsMessageId ?? null,
      payload: notif as any,
    })
    .onConflictDoNothing({ target: events.snsMessageId });
}

async function processSqsMessage(m: SqsMessage): Promise<boolean> {
  try {
    if (!m.Body) return true;
    const outer = JSON.parse(m.Body);

    // SNS-wrapped payload: { Type: "Notification", Message: "<json string>", MessageId: ... }
    let notif: SesNotification;
    let snsMessageId: string | undefined;
    if (outer.Type === "Notification" && typeof outer.Message === "string") {
      notif = JSON.parse(outer.Message);
      snsMessageId = outer.MessageId;
    } else if (outer.Type === "SubscriptionConfirmation") {
      console.warn(
        "Received SNS SubscriptionConfirmation in SQS. Confirm the subscription via the SubscribeURL:",
        outer.SubscribeURL
      );
      return true; // delete from queue
    } else {
      // Either raw message delivery, or a direct SES->SNS payload.
      notif = outer as SesNotification;
      snsMessageId = m.MessageId;
    }

    if (!notif?.mail?.messageId) {
      console.warn("Skipping payload with no mail.messageId");
      return true;
    }

    await handleNotification(notif, snsMessageId);
    return true;
  } catch (err) {
    console.error("Failed to process SQS message", m.MessageId, err);
    return false;
  }
}

async function poll() {
  console.log(`Polling ${QUEUE_URL}`);
  while (running) {
    try {
      const res = await sqs.send(
        new ReceiveMessageCommand({
          QueueUrl: QUEUE_URL,
          MaxNumberOfMessages: 10,
          WaitTimeSeconds: 20,
          VisibilityTimeout: 60,
        })
      );
      const msgs = res.Messages ?? [];
      if (msgs.length === 0) continue;

      const toDelete: { Id: string; ReceiptHandle: string }[] = [];
      for (const m of msgs) {
        const ok = await processSqsMessage(m);
        if (ok && m.ReceiptHandle && m.MessageId) {
          toDelete.push({ Id: m.MessageId, ReceiptHandle: m.ReceiptHandle });
        }
      }

      if (toDelete.length > 0) {
        await sqs.send(
          new DeleteMessageBatchCommand({
            QueueUrl: QUEUE_URL,
            Entries: toDelete,
          })
        );
      }
    } catch (err) {
      console.error("Polling error", err);
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
  console.log("Worker shutting down.");
}

poll();
