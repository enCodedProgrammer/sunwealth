import "server-only";
import { createAdminClient } from "./admin";
import type { InspectionStatus } from "@/lib/types";

// ─── Row shapes (snake_case from Postgres) ───────────────────────────────────

type AgentRow = {
  id: string;
  name: string;
  role: string;
  email: string;
  whatsapp: string;
  cal_booking_url: string;
};

type PropertyBookingRow = {
  id: string;
  slug: string;
  title: string;
  sub_brand: "sales" | "rent" | "land";
  location: { area: string; city: string; state: string };
  price: { amount: number; currency: string; basis: string };
  images: { src: string; alt: string; isPrimary?: boolean; order: number }[];
};

// ─── Public shapes (camelCase for callers) ───────────────────────────────────

export type PropertyForBooking = {
  id: string;
  slug: string;
  title: string;
  subBrand: "sales" | "rent" | "land";
  location: { area: string; city: string; state: string };
  price: { amount: number; currency: string; basis: string };
  primaryImageSrc: string;
  primaryImageAlt: string;
};

export type AgentForBooking = {
  id: string;
  name: string;
  email: string;
  whatsapp: string;
  calBookingUrl: string;
};

export type InspectionRecord = {
  id: string;
  propertyId: string;
  leadId: string | null;
  contactName: string | null;
  contactEmail: string | null;
  preferredAt: string | null;
  isVirtual: boolean;
  status: InspectionStatus;
  calBookingId: string | null;
};

// ─── Queries ─────────────────────────────────────────────────────────────────

export async function getPropertyForBooking(
  propertyId: string,
): Promise<PropertyForBooking | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("properties")
    .select("id, slug, title, sub_brand, location, price, images")
    .eq("id", propertyId)
    .neq("status", "sold")
    .maybeSingle();

  if (error) throw new Error(`Property lookup failed: ${error.message}`);
  if (!data) return null;

  const row = data as unknown as PropertyBookingRow;
  const primary = row.images.find((i) => i.isPrimary) ?? row.images[0];

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    subBrand: row.sub_brand,
    location: row.location,
    price: row.price,
    primaryImageSrc: primary?.src ?? "",
    primaryImageAlt: primary?.alt ?? row.title,
  };
}

export async function getAgentForSubBrand(
  subBrand: string,
): Promise<AgentForBooking | null> {
  const admin = createAdminClient();
  // Prefer senior over junior ("senior" sorts after "junior" alphabetically,
  // so descending order surfaces seniors first).
  const { data, error } = await admin
    .from("agents")
    .select("id, name, email, whatsapp, cal_booking_url")
    .eq("is_active", true)
    .in("sub_brand", [subBrand, "all"])
    .order("role", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(`Agent lookup failed: ${error.message}`);
  if (!data) return null;

  const row = data as unknown as AgentRow;
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    whatsapp: row.whatsapp,
    calBookingUrl: row.cal_booking_url,
  };
}

export async function getInspectionByCalId(
  calBookingId: string,
): Promise<InspectionRecord | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("inspection_requests")
    .select(
      "id, property_id, lead_id, contact_name, contact_email, preferred_at, is_virtual, status, cal_booking_id",
    )
    .eq("cal_booking_id", calBookingId)
    .maybeSingle();

  if (error) throw new Error(`Inspection lookup failed: ${error.message}`);
  if (!data) return null;

  const row = data as Record<string, unknown>;
  return {
    id: row.id as string,
    propertyId: row.property_id as string,
    leadId: (row.lead_id as string | null) ?? null,
    contactName: (row.contact_name as string | null) ?? null,
    contactEmail: (row.contact_email as string | null) ?? null,
    preferredAt: (row.preferred_at as string | null) ?? null,
    isVirtual: row.is_virtual as boolean,
    status: row.status as InspectionStatus,
    calBookingId: (row.cal_booking_id as string | null) ?? null,
  };
}

// ─── Mutations ───────────────────────────────────────────────────────────────

export type CreateInspectionInput = {
  propertyId: string;
  leadId?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  preferredAt?: string;
  isVirtual?: boolean;
  calBookingId: string;
};

export async function createInspection(
  input: CreateInspectionInput,
): Promise<string> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("inspection_requests")
    .insert({
      property_id: input.propertyId,
      lead_id: input.leadId ?? null,
      contact_name: input.contactName ?? null,
      contact_email: input.contactEmail ?? null,
      contact_phone: input.contactPhone ?? null,
      preferred_at: input.preferredAt ?? null,
      is_virtual: input.isVirtual ?? false,
      cal_booking_id: input.calBookingId,
      status: "confirmed",
    })
    .select("id")
    .single();

  if (error) throw new Error(`Create inspection failed: ${error.message}`);
  return (data as Record<string, string>).id;
}

export async function updateInspectionByCalId(
  calBookingId: string,
  updates: {
    status?: InspectionStatus;
    preferredAt?: string;
    newCalBookingId?: string;
  },
): Promise<void> {
  const patch: Record<string, unknown> = {};
  if (updates.status !== undefined) patch.status = updates.status;
  if (updates.preferredAt !== undefined) patch.preferred_at = updates.preferredAt;
  if (updates.newCalBookingId !== undefined)
    patch.cal_booking_id = updates.newCalBookingId;

  const admin = createAdminClient();
  const { error } = await admin
    .from("inspection_requests")
    .update(patch)
    .eq("cal_booking_id", calBookingId);

  if (error) throw new Error(`Update inspection failed: ${error.message}`);
}

export async function updateLeadToInspectionBooked(
  leadId: string,
): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin
    .from("leads")
    .update({ status: "inspection-booked", last_contact_at: new Date().toISOString() })
    .eq("id", leadId)
    .in("status", ["new", "qualified"]);
  // Only advance statuses that make sense — don't overwrite 'negotiating' etc.

  if (error) throw new Error(`Lead status update failed: ${error.message}`);
}

export async function revertLeadFromInspection(leadId: string): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin
    .from("leads")
    .update({ status: "qualified", last_contact_at: new Date().toISOString() })
    .eq("id", leadId)
    .eq("status", "inspection-booked");

  if (error) throw new Error(`Lead revert failed: ${error.message}`);
}

// ─── Observability ────────────────────────────────────────────────────────────

export async function logPipelineEvent(input: {
  pipeline: string;
  event: string;
  outcome: "success" | "skipped" | "failed";
  propertyId?: string;
  leadId?: string;
  error?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin.from("pipeline_events").insert({
    pipeline: input.pipeline,
    event: input.event,
    outcome: input.outcome,
    property_id: input.propertyId ?? null,
    lead_id: input.leadId ?? null,
    error: input.error ?? null,
    metadata: input.metadata ?? {},
  });

  // Never throw — logging must not break the main flow.
  if (error) console.error("[pipeline_events] insert failed:", error.message);
}
