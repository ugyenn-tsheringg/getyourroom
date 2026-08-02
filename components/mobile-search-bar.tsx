"use client";

import { useMemo, useRef, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { SearchIcon, Cancel01Icon, Location09Icon } from "@hugeicons/core-free-icons";
import {
  Command,
  CommandEmpty,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DISTRICTS, DISTRICTS_AND_PLACES } from "@/lib/districts";
import { useBrowseParams } from "@/lib/use-browse-params";
import { cn } from "@/lib/utils";

type LocationOption =
  | { kind: "district"; key: string; district: string; label: string }
  | { kind: "area"; key: string; district: string; place: string; label: string };

// Flat, searchable list of every district and every area (each area tagged with
// its parent district) — the single source the unified search matches against.
const LOCATION_OPTIONS: LocationOption[] = DISTRICTS.flatMap((district) => [
  { kind: "district" as const, key: `d:${district}`, district, label: district },
  ...(DISTRICTS_AND_PLACES[district] ?? []).map((place) => ({
    kind: "area" as const,
    key: `a:${district}:${place}`,
    district,
    place,
    label: place,
  })),
]);

export function MobileSearchBar() {
  const { searchParams, setParams } = useBrowseParams();
  const district = searchParams.get("district");
  const place = searchParams.get("place");

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // List-only matching: results always come from LOCATION_OPTIONS, never free
  // text. Empty query shows the districts as a starting point; typing matches
  // area or district names case-insensitively (an area also surfaces when its
  // parent district matches, e.g. "Paro" reveals Bondey, Shaba…).
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return LOCATION_OPTIONS.filter((o) => o.kind === "district");
    const matches = LOCATION_OPTIONS.filter((o) =>
      o.kind === "district"
        ? o.label.toLowerCase().includes(q)
        : o.label.toLowerCase().includes(q) || o.district.toLowerCase().includes(q)
    );
    // Districts first, then areas — keeps the broadest options on top.
    return matches.sort((a, b) =>
      a.kind === b.kind ? 0 : a.kind === "district" ? -1 : 1
    );
  }, [query]);

  const selectedLabel = place ?? district ?? null;

  function choose(option: LocationOption) {
    if (option.kind === "district") {
      setParams({ district: option.district, place: null });
    } else {
      setParams({ district: option.district, place: option.place });
    }
    setQuery("");
    setOpen(false);
  }

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setQuery("");
      }}
    >
      <div className="relative">
        <PopoverTrigger
          className={cn(
            "flex h-13 w-full items-center gap-3 rounded-2xl bg-white px-4 text-left shadow-lg ring-1 ring-black/5 transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/60 dark:bg-card dark:ring-white/10"
          )}
        >
          <HugeiconsIcon icon={SearchIcon} strokeWidth={2} className="size-5 shrink-0 text-muted-foreground" />
          <span className="min-w-0 flex-1">
            {selectedLabel ? (
              <span className="block">
                <span className="block truncate text-sm font-medium text-foreground">
                  {selectedLabel}
                </span>
                {place && (
                  <span className="block truncate text-xs text-muted-foreground">{district}</span>
                )}
              </span>
            ) : (
              <span className="block truncate text-sm text-muted-foreground">
                Search any district or area
              </span>
            )}
          </span>
        </PopoverTrigger>

        {selectedLabel && (
          <button
            type="button"
            aria-label="Clear location"
            onClick={() => setParams({ district: null, place: null })}
            className="absolute top-1/2 right-3 flex size-7 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} className="size-4" />
          </button>
        )}
      </div>

      <PopoverContent
        className="w-(--anchor-width) p-0"
        align="start"
        sideOffset={8}
        positionMethod="fixed"
        initialFocus={() => {
          requestAnimationFrame(() => inputRef.current?.focus({ preventScroll: true }));
          return false;
        }}
      >
        <Command shouldFilter={false}>
          <div className="p-1 pb-0">
            <div className="flex h-10 items-center gap-2 rounded-2xl bg-input/40 px-3">
              <HugeiconsIcon icon={SearchIcon} strokeWidth={2} className="size-4 shrink-0 opacity-50" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search any district or area"
                className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>
          </div>
          <CommandList className="p-1">
            <CommandEmpty>No matching district or area.</CommandEmpty>
            {results.map((option) => (
              <CommandItem
                key={option.key}
                value={option.key}
                onSelect={() => choose(option)}
              >
                {option.kind === "area" && (
                  <HugeiconsIcon
                    icon={Location09Icon}
                    strokeWidth={2}
                    className="size-4 shrink-0 text-muted-foreground"
                  />
                )}
                <span className="truncate">{option.label}</span>
                <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                  {option.kind === "district" ? "District" : option.district}
                </span>
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
