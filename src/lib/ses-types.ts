// Subset of the SES event-publishing payload shapes we care about.
// Full reference: https://docs.aws.amazon.com/ses/latest/dg/event-publishing-retrieving-sns-contents.html

export type SesEventType =
  | "Send"
  | "Delivery"
  | "Bounce"
  | "Complaint"
  | "Open"
  | "Click"
  | "Reject"
  | "RenderingFailure"
  | "DeliveryDelay";

export interface SesMail {
  timestamp: string;
  messageId: string;
  source: string;
  sourceArn?: string;
  sendingAccountId?: string;
  destination: string[];
  headersTruncated?: boolean;
  headers?: { name: string; value: string }[];
  commonHeaders?: {
    from?: string[];
    to?: string[];
    subject?: string;
    messageId?: string;
  };
  tags?: Record<string, string[]>;
}

export interface SesNotification {
  eventType?: SesEventType;
  notificationType?: "Bounce" | "Complaint" | "Delivery";
  mail: SesMail;
  bounce?: {
    bounceType: string;
    bounceSubType: string;
    bouncedRecipients: { emailAddress: string; diagnosticCode?: string }[];
    timestamp: string;
    feedbackId?: string;
  };
  complaint?: {
    complainedRecipients: { emailAddress: string }[];
    timestamp: string;
    complaintFeedbackType?: string;
    feedbackId?: string;
  };
  delivery?: {
    timestamp: string;
    processingTimeMillis?: number;
    recipients: string[];
    smtpResponse?: string;
    remoteMtaIp?: string;
    reportingMTA?: string;
  };
  open?: {
    ipAddress?: string;
    timestamp: string;
    userAgent?: string;
  };
  click?: {
    ipAddress?: string;
    timestamp: string;
    userAgent?: string;
    link?: string;
    linkTags?: Record<string, string[]>;
  };
  reject?: { reason: string };
  failure?: { templateName?: string; errorMessage?: string };
  deliveryDelay?: {
    delayType: string;
    expirationTime?: string;
    delayedRecipients?: { emailAddress: string; diagnosticCode?: string }[];
    timestamp: string;
  };
  send?: Record<string, never>;
}

export function inferEventType(n: SesNotification): SesEventType {
  if (n.eventType) return n.eventType;
  // Fall back to the legacy SES->SNS "notificationType" shape
  switch (n.notificationType) {
    case "Bounce":
      return "Bounce";
    case "Complaint":
      return "Complaint";
    case "Delivery":
      return "Delivery";
  }
  return "Send";
}

export function domainOf(address: string): string {
  const at = address.lastIndexOf("@");
  return at === -1 ? address : address.slice(at + 1).toLowerCase();
}
