import "server-only";
import { Resend } from "resend";
import { createElement } from "react";

const client = new Resend(process.env.RESEND_API_KEY!);

const FROM = "Sunwealth Real Estate <inspections@sunwealthrealestate.com>";

export type InspectionEmailData = {
  contactName: string;
  contactEmail: string;
  propertyTitle: string;
  propertyArea: string;
  propertyPrice: string;
  agentName: string;
  agentEmail: string;
  agentWhatsapp: string;
  inspectionDatetime: string;  // pre-formatted, e.g. "Thursday, 1 May 2025 at 10:00 (WAT)"
  isVirtual: boolean;
  videoCallUrl?: string;
  calBookingId: string;
};

export async function sendInspectionConfirmation(
  data: InspectionEmailData,
): Promise<void> {
  const { InspectionConfirmationEmail } = await import(
    "@/emails/inspection-confirmation"
  );
  const { error } = await client.emails.send({
    from: FROM,
    to: data.contactEmail,
    subject: `Inspection confirmed — ${data.propertyTitle}`,
    react: createElement(InspectionConfirmationEmail, data),
  });
  if (error) throw new Error(`Confirmation email failed: ${error.message}`);
}

export async function sendInspectionReminder(
  data: InspectionEmailData & { hoursUntil: 24 | 2 },
): Promise<void> {
  const { InspectionReminderEmail } = await import(
    "@/emails/inspection-reminder"
  );
  const subject =
    data.hoursUntil === 24
      ? `Reminder: your inspection is tomorrow — ${data.propertyTitle}`
      : `Your inspection is in 2 hours — ${data.propertyTitle}`;

  const { error } = await client.emails.send({
    from: FROM,
    to: data.contactEmail,
    subject,
    react: createElement(InspectionReminderEmail, data),
  });
  if (error) throw new Error(`Reminder email failed: ${error.message}`);
}
