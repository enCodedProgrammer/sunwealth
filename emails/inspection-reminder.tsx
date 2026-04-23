import type { InspectionEmailData } from "@/lib/integrations/resend";

// ─── Shared tokens (mirrored from inspection-confirmation) ─────────────────
const color = {
  ink: "#0B0E13",
  paper: "#FAF7F1",
  gold: "#C9A254",
  stone: "#A8A49D",
  sand: "#EDE9E1",
  amber: "#92400E", // warm dark for the reminder banner background
};

const font = {
  body: "Arial, Helvetica, sans-serif",
  mono: "'Courier New', Courier, monospace",
};

// ─── Sub-components ─────────────────────────────────────────────────────────

function GoldBar() {
  return <div style={{ height: "4px", backgroundColor: color.gold }} />;
}

function Header() {
  return (
    <div style={{ backgroundColor: color.ink, padding: "24px 32px", textAlign: "center" as const }}>
      <p
        style={{
          margin: 0,
          fontFamily: font.mono,
          fontSize: "11px",
          letterSpacing: "0.12em",
          textTransform: "uppercase" as const,
          color: color.gold,
        }}
      >
        Sunwealth Real Estate
      </p>
    </div>
  );
}

function Divider() {
  return <div style={{ height: "1px", backgroundColor: color.sand, margin: "24px 0" }} />;
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        margin: "0 0 4px",
        fontSize: "10px",
        fontFamily: font.mono,
        letterSpacing: "0.1em",
        textTransform: "uppercase" as const,
        color: color.stone,
      }}
    >
      {children}
    </p>
  );
}

function DetailRow({ label, value }: { label: string; value: string | React.ReactNode }) {
  return (
    <div style={{ marginBottom: "16px" }}>
      <Label>{label}</Label>
      <p style={{ margin: 0, fontSize: "15px", color: color.ink, fontWeight: 500 }}>{value}</p>
    </div>
  );
}

// ─── Main template ───────────────────────────────────────────────────────────

export function InspectionReminderEmail({
  contactName,
  propertyTitle,
  propertyArea,
  agentName,
  agentEmail,
  agentWhatsapp,
  inspectionDatetime,
  isVirtual,
  videoCallUrl,
  hoursUntil,
}: InspectionEmailData & { hoursUntil: 24 | 2 }) {
  const firstName = contactName.split(" ")[0];
  const isToday = hoursUntil === 2;

  return (
    <div
      style={{
        margin: 0,
        padding: 0,
        fontFamily: font.body,
        backgroundColor: color.paper,
        color: color.ink,
      }}
    >
      <div style={{ maxWidth: "600px", margin: "0 auto", backgroundColor: color.paper }}>
        <GoldBar />
        <Header />

        {/* Reminder banner */}
        <div
          style={{
            backgroundColor: isToday ? color.amber : color.ink,
            padding: "16px 32px",
            textAlign: "center" as const,
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: "13px",
              fontFamily: font.mono,
              letterSpacing: "0.08em",
              textTransform: "uppercase" as const,
              color: color.gold,
              fontWeight: 600,
            }}
          >
            {isToday ? "Today" : "Tomorrow"} · Inspection reminder
          </p>
        </div>

        {/* Body */}
        <div style={{ padding: "40px 32px" }}>
          <h1
            style={{
              margin: "0 0 8px",
              fontSize: "26px",
              fontWeight: 700,
              lineHeight: 1.2,
              color: color.ink,
            }}
          >
            {isToday
              ? "Your inspection is in 2 hours."
              : "Your inspection is tomorrow."}
          </h1>
          <p style={{ margin: "0 0 32px", fontSize: "15px", color: color.stone }}>
            {isToday
              ? `Hi ${firstName} — just a quick reminder before you head in.`
              : `Hi ${firstName} — a reminder that you have an inspection booked for tomorrow.`}
          </p>

          {/* Property */}
          <div
            style={{
              backgroundColor: color.sand,
              borderLeft: `3px solid ${color.gold}`,
              padding: "20px 24px",
              marginBottom: "32px",
            }}
          >
            <p
              style={{
                margin: "0 0 4px",
                fontSize: "10px",
                fontFamily: font.mono,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: color.stone,
              }}
            >
              Property
            </p>
            <p style={{ margin: "0 0 4px", fontSize: "17px", fontWeight: 700, color: color.ink }}>
              {propertyTitle}
            </p>
            <p style={{ margin: 0, fontSize: "13px", color: color.stone }}>{propertyArea}</p>
          </div>

          <DetailRow label="Date & time" value={inspectionDatetime} />
          <DetailRow
            label="Type"
            value={isVirtual ? "Virtual inspection (video call)" : "In-person inspection"}
          />

          {isVirtual && videoCallUrl ? (
            <div style={{ marginBottom: "16px" }}>
              <Label>Video call link</Label>
              <a
                href={videoCallUrl}
                style={{
                  color: color.gold,
                  fontSize: "15px",
                  fontWeight: 500,
                  textDecoration: "underline",
                }}
              >
                Join meeting
              </a>
            </div>
          ) : null}

          {!isVirtual ? (
            <>
              <Divider />
              <h2
                style={{
                  margin: "0 0 12px",
                  fontSize: "13px",
                  fontFamily: font.mono,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: color.stone,
                  fontWeight: 600,
                }}
              >
                Quick checklist
              </h2>
              <ul
                style={{
                  margin: 0,
                  paddingLeft: "20px",
                  fontSize: "14px",
                  color: color.ink,
                  lineHeight: 1.7,
                }}
              >
                <li>Government-issued ID</li>
                <li>Your list of questions for the agent</li>
                <li>Budget and payment preference if not yet discussed</li>
              </ul>
            </>
          ) : null}

          <Divider />

          {/* Agent */}
          <h2
            style={{
              margin: "0 0 16px",
              fontSize: "13px",
              fontFamily: font.mono,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: color.stone,
              fontWeight: 600,
            }}
          >
            Your agent
          </h2>
          <DetailRow label="Name" value={agentName} />
          <DetailRow label="Email" value={agentEmail} />
          <DetailRow label="WhatsApp" value={agentWhatsapp} />

          <Divider />

          <p style={{ margin: "0 0 24px", fontSize: "14px", color: color.stone }}>
            Need to cancel or reschedule? Please let your agent know as soon as
            possible.
          </p>

          <a
            href={`https://wa.me/${agentWhatsapp.replace(/\D/g, "")}`}
            style={{
              display: "inline-block",
              padding: "12px 24px",
              backgroundColor: color.gold,
              color: color.ink,
              fontSize: "14px",
              fontWeight: 600,
              textDecoration: "none",
              borderRadius: "2px",
            }}
          >
            Message agent on WhatsApp
          </a>
        </div>

        {/* Footer */}
        <div
          style={{ backgroundColor: color.ink, padding: "24px 32px", textAlign: "center" as const }}
        >
          <p style={{ margin: "0 0 4px", fontSize: "11px", color: color.stone, lineHeight: 1.6 }}>
            Sunwealth Real Estate Limited · RC 1739523
          </p>
          <p style={{ margin: 0, fontSize: "11px", color: color.stone }}>
            +234 903 837 9755 · sunwealthrealestate.com
          </p>
        </div>
        <GoldBar />
      </div>
    </div>
  );
}
