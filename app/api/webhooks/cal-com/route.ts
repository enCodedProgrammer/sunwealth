import { verifyCalSignature } from "@/lib/integrations/cal";
import type { CalWebhookEvent, CalBookingPayload } from "@/lib/integrations/cal";
import {
  createInspection,
  getInspectionByCalId,
  getPropertyForBooking,
  getAgentForSubBrand,
  updateInspectionByCalId,
  updateLeadToInspectionBooked,
  revertLeadFromInspection,
  logPipelineEvent,
} from "@/lib/db/inspections";
import { sendInspectionConfirmation } from "@/lib/integrations/resend";
import type { InspectionEmailData } from "@/lib/integrations/resend";
import { formatNaira } from "@/lib/format";

export const runtime = "nodejs";

export async function POST(req: Request): Promise<Response> {
  // ── 1. Read raw body (must precede any parsing for HMAC) ─────────────
  const rawBody = await req.text();

  // ── 2. Verify signature ──────────────────────────────────────────────
  const secret = process.env.CAL_COM_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[cal-webhook] CAL_COM_WEBHOOK_SECRET not configured");
    return Response.json({ error: "Webhook not configured" }, { status: 500 });
  }

  const signature = req.headers.get("X-Cal-Signature-256");
  if (!verifyCalSignature(rawBody, signature, secret)) {
    return Response.json({ error: "Invalid signature" }, { status: 401 });
  }

  // ── 3. Parse ─────────────────────────────────────────────────────────
  let event: CalWebhookEvent;
  try {
    event = JSON.parse(rawBody) as CalWebhookEvent;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { triggerEvent, payload } = event;

  // ── 4. Route by event type ───────────────────────────────────────────
  switch (triggerEvent) {
    case "BOOKING_CREATED":
    case "BOOKING_CONFIRMED":
      await handleBookingCreated(payload);
      break;

    case "BOOKING_CANCELLED":
    case "BOOKING_REJECTED":
      await handleBookingCancelled(payload);
      break;

    case "BOOKING_RESCHEDULED":
      await handleBookingRescheduled(payload);
      break;

    default:
      // Unknown trigger — acknowledge without action.
      break;
  }

  return Response.json({ received: true });
}

// ─── Handlers ────────────────────────────────────────────────────────────────

async function handleBookingCreated(payload: CalBookingPayload): Promise<void> {
  const { uid, startTime, attendees, metadata, videoCallData, location } = payload;

  const propertyId = metadata?.propertyId;
  const leadId = metadata?.leadId;

  if (!propertyId) {
    await logPipelineEvent({
      pipeline: "inspection-booking",
      event: "booking-created",
      outcome: "skipped",
      metadata: { calUid: uid, reason: "no propertyId in metadata" },
    });
    return;
  }

  // Idempotency: skip if already processed.
  const existing = await getInspectionByCalId(uid);
  if (existing) {
    await logPipelineEvent({
      pipeline: "inspection-booking",
      event: "booking-created",
      outcome: "skipped",
      propertyId,
      leadId,
      metadata: { calUid: uid, reason: "already processed" },
    });
    return;
  }

  const attendee = attendees[0];
  const isVirtual = !!(
    videoCallData?.url ||
    location?.toLowerCase().includes("zoom") ||
    location?.toLowerCase().includes("meet")
  );

  let inspectionId: string;
  try {
    inspectionId = await createInspection({
      propertyId,
      leadId,
      contactName: attendee?.name,
      contactEmail: attendee?.email,
      preferredAt: startTime,
      isVirtual,
      calBookingId: uid,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await logPipelineEvent({
      pipeline: "inspection-booking",
      event: "booking-created",
      outcome: "failed",
      propertyId,
      leadId,
      error: message,
      metadata: { calUid: uid },
    });
    return;
  }

  // Advance lead status (only if the lead is in a state that makes sense to advance).
  if (leadId) {
    try {
      await updateLeadToInspectionBooked(leadId);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await logPipelineEvent({
        pipeline: "inspection-booking",
        event: "lead-status-update",
        outcome: "failed",
        propertyId,
        leadId,
        error: message,
        metadata: { calUid: uid },
      });
      // Non-fatal — continue to email.
    }
  }

  // Send confirmation email.
  if (attendee?.email) {
    try {
      const emailData = await buildEmailData({
        propertyId,
        contactName: attendee.name,
        contactEmail: attendee.email,
        startTime,
        isVirtual,
        videoCallUrl: videoCallData?.url,
        calBookingId: uid,
      });
      if (emailData) {
        await sendInspectionConfirmation(emailData);
        await logPipelineEvent({
          pipeline: "inspection-booking",
          event: "confirmation-email-sent",
          outcome: "success",
          propertyId,
          leadId,
          metadata: { calUid: uid, inspectionId },
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await logPipelineEvent({
        pipeline: "inspection-booking",
        event: "confirmation-email-sent",
        outcome: "failed",
        propertyId,
        leadId,
        error: message,
        metadata: { calUid: uid, inspectionId },
      });
      // Non-fatal — the booking was created; only the email failed.
    }
  }

  await logPipelineEvent({
    pipeline: "inspection-booking",
    event: "booking-created",
    outcome: "success",
    propertyId,
    leadId,
    metadata: { calUid: uid, inspectionId },
  });
}

async function handleBookingCancelled(payload: CalBookingPayload): Promise<void> {
  const { uid, metadata } = payload;
  const propertyId = metadata?.propertyId;
  const leadId = metadata?.leadId;

  const inspection = await getInspectionByCalId(uid);
  if (!inspection) {
    await logPipelineEvent({
      pipeline: "inspection-booking",
      event: "booking-cancelled",
      outcome: "skipped",
      propertyId,
      metadata: { calUid: uid, reason: "inspection record not found" },
    });
    return;
  }

  try {
    await updateInspectionByCalId(uid, { status: "cancelled" });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await logPipelineEvent({
      pipeline: "inspection-booking",
      event: "booking-cancelled",
      outcome: "failed",
      propertyId: inspection.propertyId,
      leadId: inspection.leadId ?? leadId,
      error: message,
      metadata: { calUid: uid },
    });
    return;
  }

  // Revert lead status if it was advanced to inspection-booked.
  const resolvedLeadId = inspection.leadId ?? leadId;
  if (resolvedLeadId) {
    try {
      await revertLeadFromInspection(resolvedLeadId);
    } catch {
      // Non-fatal.
    }
  }

  await logPipelineEvent({
    pipeline: "inspection-booking",
    event: "booking-cancelled",
    outcome: "success",
    propertyId: inspection.propertyId,
    leadId: resolvedLeadId ?? undefined,
    metadata: { calUid: uid },
  });
}

async function handleBookingRescheduled(payload: CalBookingPayload): Promise<void> {
  // Cal.com sends BOOKING_RESCHEDULED with the new booking details.
  // The old booking uid is in `rescheduleUid`.
  const { uid: newUid, startTime, rescheduleUid, metadata } = payload;
  const propertyId = metadata?.propertyId;

  if (!rescheduleUid) {
    await logPipelineEvent({
      pipeline: "inspection-booking",
      event: "booking-rescheduled",
      outcome: "skipped",
      propertyId,
      metadata: { calUid: newUid, reason: "missing rescheduleUid" },
    });
    return;
  }

  const inspection = await getInspectionByCalId(rescheduleUid);
  if (!inspection) {
    await logPipelineEvent({
      pipeline: "inspection-booking",
      event: "booking-rescheduled",
      outcome: "skipped",
      propertyId,
      metadata: { oldCalUid: rescheduleUid, newCalUid: newUid, reason: "old inspection not found" },
    });
    return;
  }

  try {
    await updateInspectionByCalId(rescheduleUid, {
      preferredAt: startTime,
      newCalBookingId: newUid,
      // Keep status as 'confirmed' — a reschedule is still a confirmed booking.
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await logPipelineEvent({
      pipeline: "inspection-booking",
      event: "booking-rescheduled",
      outcome: "failed",
      propertyId: inspection.propertyId,
      leadId: inspection.leadId ?? undefined,
      error: message,
      metadata: { oldCalUid: rescheduleUid, newCalUid: newUid },
    });
    return;
  }

  await logPipelineEvent({
    pipeline: "inspection-booking",
    event: "booking-rescheduled",
    outcome: "success",
    propertyId: inspection.propertyId,
    leadId: inspection.leadId ?? undefined,
    metadata: { oldCalUid: rescheduleUid, newCalUid: newUid, newStart: startTime },
  });
}

// ─── Email data builder ───────────────────────────────────────────────────────

async function buildEmailData(opts: {
  propertyId: string;
  contactName: string;
  contactEmail: string;
  startTime: string;
  isVirtual: boolean;
  videoCallUrl?: string;
  calBookingId: string;
}): Promise<InspectionEmailData | null> {
  const property = await getPropertyForBooking(opts.propertyId);
  if (!property) return null;

  const agent = await getAgentForSubBrand(property.subBrand);

  const datetime = new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Africa/Lagos",
    timeZoneName: "short",
  }).format(new Date(opts.startTime));

  return {
    contactName: opts.contactName,
    contactEmail: opts.contactEmail,
    propertyTitle: property.title,
    propertyArea: `${property.location.area}, ${property.location.city}`,
    propertyPrice: formatNaira(property.price.amount),
    agentName: agent?.name ?? "Sunwealth Team",
    agentEmail: agent?.email ?? "hello@sunwealthrealestate.com",
    agentWhatsapp: agent?.whatsapp ?? "+234 903 837 9755",
    inspectionDatetime: datetime,
    isVirtual: opts.isVirtual,
    videoCallUrl: opts.videoCallUrl,
    calBookingId: opts.calBookingId,
  };
}
