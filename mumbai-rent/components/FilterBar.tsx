"use client";

import type { BHK, Filters, Furnishing } from "@/lib/types";
import { clsx } from "clsx";

interface FilterBarProps {
  filters: Filters;
  onFiltersChange: (next: Filters) => void;
}

const bhkOptions: Array<{ label: string; value: BHK | null }> = [
  { label: "All", value: null },
  { label: "1BHK", value: 1 },
  { label: "2BHK", value: 2 },
  { label: "3BHK", value: 3 },
  { label: "3BHK+", value: 4 },
];

const furnishingOptions: Array<{ label: string; value: Furnishing | null }> = [
  { label: "All", value: null },
  { label: "Unfurnished", value: "unfurnished" },
  { label: "Semi", value: "semi" },
  { label: "Fully", value: "fully" },
];

const gatedOptions: Array<{ label: string; value: boolean | null }> = [
  { label: "All", value: null },
  { label: "Gated", value: true },
  { label: "Non-Gated", value: false },
];

function chipClass(active: boolean): string {
  return clsx(
    "rounded-full border px-3 py-1.5 text-xs font-medium whitespace-nowrap transition md:text-sm",
    active
      ? "border-mumbai-orange bg-mumbai-orange text-white"
      : "border-slate-600 text-slate-300 hover:border-slate-400"
  );
}

export default function FilterBar({ filters, onFiltersChange }: FilterBarProps) {
  return (
    <div className="w-full overflow-x-auto border-t border-slate-800/80 bg-void/95 px-4 py-2 backdrop-blur">
      <div className="flex min-w-max items-center gap-2">
        {bhkOptions.map((option) => (
          <button
            key={`bhk-${option.label}`}
            type="button"
            onClick={() => onFiltersChange({ ...filters, bhk: option.value })}
            className={chipClass(filters.bhk === option.value)}
          >
            {option.label}
          </button>
        ))}
        <span className="mx-1 h-5 w-px bg-slate-700" />
        {furnishingOptions.map((option) => (
          <button
            key={`furnishing-${option.label}`}
            type="button"
            onClick={() => onFiltersChange({ ...filters, furnishing: option.value })}
            className={chipClass(filters.furnishing === option.value)}
          >
            {option.label}
          </button>
        ))}
        <span className="mx-1 h-5 w-px bg-slate-700" />
        {gatedOptions.map((option) => (
          <button
            key={`gated-${option.label}`}
            type="button"
            onClick={() => onFiltersChange({ ...filters, gated: option.value })}
            className={chipClass(filters.gated === option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
