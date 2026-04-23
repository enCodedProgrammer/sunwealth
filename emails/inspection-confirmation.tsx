import type { InspectionEmailData } from "@/lib/integrations/resend";

// ─── Shared tokens ─────────────────────────────────────────────────────────
const color = {
  ink: "#0B0E13",
  paper: "#FAF7F1",
  gold: "#C9A254",
  stone: "#A8A49D",
  sand: "#EDE9E1",
};

const font = {
  body: "Arial, Helvetica, sans-serif",
  mono: "'Courier New', Courier, monospace",
};

const base: React.CSSProperties = {
  margin: 0,
  padding: 0,
  fontFamily: font.body,
  backgroundColor: color.paper,
  color: color.ink,
};

// ─── Sub-components ────────────────────────────────────────────────────────

function GoldBar() {
  return (
    <div
      style={{ height: "4px", backgroundColor: color.gold, width: "100%" }}
    />
  );
}

function Header() {
  return (
    <div
      style={{
        backgroundColor: color.ink,
        padding: "24px 32px",
        textAlign: "center" as const,
      }}
    >
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
  return (
    <div
      style={{
        height: "1px",
        backgroundColor: color.sand,
        margin: "24px 0",
      }}
    />
  );
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

function Value({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ margin: 0, fontSize: "15px", color: color.ink, fontWeight: 500 }}>
      {children}
    </p>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string | React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: "16px" }}>
      <Label>{label}</Label>
      <Value>{value}</Value>
    </div>
  );
}

// ─── Main template ─────────────────────────────────────────────────────────

export function InspectionConfirmationEmail({
  contactName,
  propertyTitle,
  propertyArea,
  propertyPrice,
  agentName,
  agentEmail,
  agentWhatsapp,
  inspectionDatetime,
  isVirtual,
  videoCallUrl,
}: InspectionEmailData) {
  const firstName = contactName.split(" ")[0];

  return (
    <div style={base}>
      {/* Wrapper */}
      <div
        style={{
          maxWidth: "600px",
          margin: "0 auto",
          backgroundColor: color.paper,
        }}
      >
        <GoldBar />
        <Header />

        {/* Body */}
        <div style={{ padding: "40px 32px" }}>
          {/* Greeting */}
          <h1
            style={{
              margin: "0 0 8px",
              fontSize: "26px",
              fontWeight: 700,
              lineHeight: 1.2,
              color: color.ink,
            }}
          >
            Your inspection is confirmed.
          </h1>
          <p style={{ margin: "0 0 32px", fontSize: "15px", color: color.stone }}>
            Hi {firstName} — everything is set. Here are your booking details.
          </p>

          {/* Property box */}
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
            <p
              style={{
                margin: "0 0 4px",
                fontSize: "17px",
                fontWeight: 700,
                color: color.ink,
              }}
            >
              {propertyTitle}
            </p>
            <p style={{ margin: "0 0 8px", fontSize: "13px", color: color.stone }}>
              {propertyArea}
            </p>
            <p
              style={{
                margin: 0,
                fontSize: "15px",
                fontFamily: font.mono,
                fontWeight: 600,
                color: color.gold,
              }}
            >
              {propertyPrice}
            </p>
          </div>

          {/* Booking details */}
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
                What to bring
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
                <li>Valid government-issued ID</li>
                <li>
                  Any questions about title documents — we will have all originals
                  available for review
                </li>
                <li>
                  A note of your budget and preferred payment structure if you have
                  not discussed these with your agent yet
                </li>
              </ul>
            </>
          ) : null}

          <Divider />

          {/* CTA */}
          <p style={{ margin: "0 0 24px", fontSize: "14px", color: color.stone }}>
            Need to reschedule or have a question? Reply to this email or message
            your agent directly on WhatsApp.
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
          style={{
            backgroundColor: color.ink,
            padding: "24px 32px",
            textAlign: "center" as const,
          }}
        >
          <p
            style={{
              margin: "0 0 4px",
              fontSize: "11px",
              color: color.stone,
              lineHeight: 1.6,
            }}
          >
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
