"use client";

import { Input } from "@/components/ui/Input";

type Props = {
  min: string;
  max: string;
  onMinChange: (v: string) => void;
  onMaxChange: (v: string) => void;
};

export function PriceRange({ min, max, onMinChange, onMaxChange }: Props) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <Input
        label="Min (₦)"
        type="number"
        inputMode="numeric"
        min="0"
        value={min}
        onChange={(e) => onMinChange(e.target.value)}
        placeholder="0"
      />
      <Input
        label="Max (₦)"
        type="number"
        inputMode="numeric"
        min="0"
        value={max}
        onChange={(e) => onMaxChange(e.target.value)}
        placeholder="Any"
      />
    </div>
  );
}
