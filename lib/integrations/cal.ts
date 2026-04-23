import { createHmac, timingSafeEqual } from "crypto";

// ─── Webhook payload types ────────────────────────────────────────────────────
// Covers the subset of Cal.com's V2 webhook shape that we actually consume.

export type CalTrigger =
  | "BOOKING_CREATED"
  | "BOOKING_CANCELLED"
  | "BOOKING_RESCHEDULED"
  | "BOOKING_CONFIRMED"
  | "BOOKING_REQUESTED"
  | "BOOKING_REJECTED";

export type CalAttendee = {
  name: string;
  email: string;
  timeZone: string;
};

export type CalBookingPayload = {
  uid: string;
  title: string;
  startTime: string;   // ISO 8601
  endTime: string;
  attendees: CalAttendee[];
  organizer: { name: string; email: string; timeZone: string };
  /** Custom metadata passed via embed URL: metadata[propertyId], metadata[leadId] */
  metadata: Record<string, string>;
  location?: string;
  videoCallData?: { url: string };
  /** Present on BOOKING_RESCHEDULED — uid of the old/cancelled booking */
  rescheduleUid?: string;
  responses?: {
    name?: { value: string };
    email?: { value: string };
    phone?: { value: string };
    notes?: { value: string };
  };
};

export type CalWebhookEvent = {
  triggerEvent: CalTrigger;
  createdAt: string;
  payload: CalBookingPayload;
};

// ─── Embed URL builder ────────────────────────────────────────────────────────

/**
 * Takes an agent's calBookingUrl (e.g. "https://cal.com/sunwealth/inspection")
 * and returns an embed-ready URL with property metadata pre-filled so the
 * webhook can correlate bookings back to properties.
 */
export function buildBookingEmbedUrl(
  agentCalUrl: string,
  opts: {
    propertyId: string;
    propertyTitle?: string;
    leadId?: string;
  },
): string {
  const url = new URL(agentCalUrl);
  url.searchParams.set("embed", "true");
  url.searchParams.set("metadata[propertyId]", opts.propertyId);
  url.searchParams.set("metadata[source]", "sunwealth-website");
  if (opts.leadId) {
    url.searchParams.set("metadata[leadId]", opts.leadId);
  }
  if (opts.propertyTitle) {
    // Pre-fill the notes field so agents see the property name immediately.
    url.searchParams.set("notes", `Inspection for: ${opts.propertyTitle}`);
  }
  return url.toString();
}

// ─── Webhook signature verification ──────────────────────────────────────────

/**
 * Verifies the X-Cal-Signature-256 header using HMAC-SHA256.
 * Uses timing-safe comparison to prevent timing attacks.
 */
export function verifyCalSignature(
  rawBody: string,
  signatureHeader: string | null,
  secret: string,
): boolean {
  if (!signatureHeader) return false;

  const expected = `sha256=${createHmac("sha256", secret)
    .update(rawBody, "utf8")
    .digest("hex")}`;

  const expectedBuf = Buffer.from(expected, "utf8");
  const receivedBuf = Buffer.from(signatureHeader, "utf8");

  // timingSafeEqual requires equal-length buffers.
  if (expectedBuf.length !== receivedBuf.length) return false;

  return timingSafeEqual(expectedBuf, receivedBuf);
}
