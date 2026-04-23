import type { Property } from "./types";

type AreaUnit = Property["size"]["unit"];

const nairaFormatter = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  currencyDisplay: "narrowSymbol",
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat("en-GB");

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

export function formatNaira(amount: number): string {
  return nairaFormatter.format(amount);
}

export function formatArea(value: number, unit: AreaUnit): string {
  const formatted = numberFormatter.format(value);
  if (unit === "sqm") return `${formatted} sqm`;
  const noun = value === 1 ? unit : `${unit}s`;
  return `${formatted} ${noun}`;
}

export function formatDate(isoDate: string): string {
  return dateFormatter.format(new Date(isoDate));
}
