"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon } from "@hugeicons/core-free-icons";
import { roomTypeLabel } from "@/lib/districts";
import { useBrowseParams } from "@/lib/use-browse-params";
import { cn } from "@/lib/utils";

const nu = (n: number) => `Nu. ${n.toLocaleString("en-IN")}`;

type Chip = { key: string; label: string; clear: Record<string, null> };

export function FilterChips({ className }: { className?: string }) {
  const { searchParams, setParams, clearAll } = useBrowseParams();

  const district = searchParams.get("district");
  const place = searchParams.get("place");
  const type = searchParams.get("type");
  const kind = searchParams.get("kind");
  const min = searchParams.get("min");
  const max = searchParams.get("max");

  const chips: Chip[] = [];
  // Removing the district also drops the area, since an area can't stand alone.
  if (district) chips.push({ key: "district", label: district, clear: { district: null, place: null } });
  if (place) chips.push({ key: "place", label: place, clear: { place: null } });
  if (type) chips.push({ key: "type", label: roomTypeLabel(type), clear: { type: null } });
  if (kind)
    chips.push({
      key: "kind",
      label: kind === "exchange" ? "Exchange" : "Rentals",
      clear: { kind: null },
    });
  if (min || max) {
    const label =
      min && max
        ? `${nu(Number(min))} – ${nu(Number(max))}`
        : min
          ? `From ${nu(Number(min))}`
          : `Under ${nu(Number(max))}`;
    chips.push({ key: "price", label, clear: { min: null, max: null } });
  }

  if (chips.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {chips.map((chip) => (
        <button
          key={chip.key}
          type="button"
          onClick={() => setParams(chip.clear)}
          className="flex items-center gap-1.5 rounded-full bg-secondary py-1.5 pr-2 pl-3 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary/70"
        >
          <span className="truncate">{chip.label}</span>
          <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} className="size-3.5 text-muted-foreground" />
        </button>
      ))}
      <button
        type="button"
        onClick={clearAll}
        className="rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground underline-offset-2 transition-colors hover:text-foreground hover:underline"
      >
        Clear all
      </button>
    </div>
  );
}
