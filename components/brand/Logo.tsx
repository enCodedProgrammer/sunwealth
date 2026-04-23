import { cn } from "@/lib/cn";

type LogoProps = {
  width?: number;
  className?: string;
  title?: string;
};

const VIEW_W = 200;
const VIEW_H = 64;

function LogoMark({
  textColor,
  width = 160,
  className,
  title = "Sunwealth Real Estate",
}: LogoProps & { textColor: string }) {
  const height = (width * VIEW_H) / VIEW_W;
  return (
    <svg
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      width={width}
      height={height}
      role="img"
      aria-label={title}
      className={cn("block", className)}
    >
      <title>{title}</title>
      <text
        x={VIEW_W / 2}
        y="30"
        textAnchor="middle"
        fontFamily="var(--font-fraunces)"
        fontWeight="500"
        fontSize="28"
        fill={textColor}
        style={{ fontFeatureSettings: "'liga' 1, 'dlig' 1" }}
      >
        sunwealth
      </text>
      <line
        x1="60"
        x2="140"
        y1="40"
        y2="40"
        stroke="var(--sun-gold)"
        strokeWidth="1"
      />
      <text
        x={VIEW_W / 2}
        y="56"
        textAnchor="middle"
        fontFamily="var(--font-fraunces)"
        fontWeight="500"
        fontSize="10"
        letterSpacing="2"
        fill={textColor}
      >
        real estate
      </text>
    </svg>
  );
}

export function LogoDark(props: LogoProps) {
  return <LogoMark {...props} textColor="var(--sun-ink)" />;
}

export function LogoLight(props: LogoProps) {
  return <LogoMark {...props} textColor="var(--sun-paper)" />;
}
