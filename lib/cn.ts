type ClassValue = string | number | null | undefined | false | ClassValue[];

export function cn(...classes: ClassValue[]): string {
  const out: string[] = [];
  for (const c of classes) {
    if (!c) continue;
    if (Array.isArray(c)) out.push(cn(...c));
    else out.push(String(c));
  }
  return out.join(" ");
}
