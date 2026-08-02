"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  FilterHorizontalIcon,
  FavouriteIcon,
  Location09Icon,
  Home09Icon,
  ArrowDataTransferHorizontalIcon,
  Tag01Icon,
} from "@hugeicons/core-free-icons";
import { Combobox } from "@/components/combobox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RangeSlider } from "@/components/ui/slider";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetBody,
  SheetFooter,
} from "@/components/ui/sheet";
import { useToast } from "@/components/ui/toast";
import { DISTRICTS, DISTRICTS_AND_PLACES, ROOM_TYPES } from "@/lib/districts";
import type { RoomFilters } from "@/lib/rooms";
import { saveSearch } from "@/lib/saved-searches";
import { useBrowseParams } from "@/lib/use-browse-params";
import { useSession } from "@/lib/use-session";
import { cn } from "@/lib/utils";

const PRICE_FLOOR = 1000;
const PRICE_CEIL = 100000;
const PRICE_STEP = 1000;

type Draft = {
  district: string;
  place: string;
  roomType: string | null;
  kind: string | null;
  price: [number, number];
};

const LISTING_KINDS = [
  { value: null as string | null, label: "All" },
  { value: "rental", label: "Rentals" },
  { value: "exchange", label: "Exchange" },
];

const nu = (n: number) => `Nu. ${n.toLocaleString("en-IN")}`;

export function MobileFilterSheet() {
  const router = useRouter();
  const session = useSession();
  const toast = useToast();
  const { searchParams, setParams } = useBrowseParams();

  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [minText, setMinText] = useState(String(PRICE_FLOOR));
  const [maxText, setMaxText] = useState(String(PRICE_CEIL));

  function emptyDraft(): Draft {
    return { district: "", place: "", roomType: null, kind: null, price: [PRICE_FLOOR, PRICE_CEIL] };
  }

  // Seed the draft from the live URL so anything already chosen in the hero
  // search (or a chip) shows up pre-filled when the sheet opens.
  function draftFromParams(): Draft {
    const min = Number(searchParams.get("min"));
    const max = Number(searchParams.get("max"));
    return {
      district: searchParams.get("district") ?? "",
      place: searchParams.get("place") ?? "",
      roomType: searchParams.get("type"),
      kind: searchParams.get("kind"),
      price: [
        min >= PRICE_FLOOR ? min : PRICE_FLOOR,
        max > 0 && max <= PRICE_CEIL ? max : PRICE_CEIL,
      ],
    };
  }

  function handleOpenChange(next: boolean) {
    if (next) {
      const d = draftFromParams();
      setDraft(d);
      setMinText(String(d.price[0]));
      setMaxText(String(d.price[1]));
    }
    setOpen(next);
  }

  function draftToFilters(d: Draft): RoomFilters {
    return {
      district: d.district || undefined,
      place: d.place || undefined,
      roomType: d.roomType ?? undefined,
      listingType: d.kind === "rental" || d.kind === "exchange" ? d.kind : undefined,
      minPrice: d.price[0] > PRICE_FLOOR ? d.price[0] : undefined,
      maxPrice: d.price[1] < PRICE_CEIL ? d.price[1] : undefined,
    };
  }

  function setPrice(next: [number, number]) {
    setDraft((d) => ({ ...d, price: next }));
    setMinText(String(next[0]));
    setMaxText(String(next[1]));
  }

  function commitMin(text: string) {
    const n = parseInt(text, 10);
    const clamped = Number.isNaN(n)
      ? PRICE_FLOOR
      : Math.min(Math.max(n, PRICE_FLOOR), draft.price[1] - PRICE_STEP);
    setPrice([clamped, draft.price[1]]);
  }

  function commitMax(text: string) {
    const n = parseInt(text, 10);
    const clamped = Number.isNaN(n)
      ? PRICE_CEIL
      : Math.max(Math.min(n, PRICE_CEIL), draft.price[0] + PRICE_STEP);
    setPrice([draft.price[0], clamped]);
  }

  function applyFilters() {
    setParams({
      district: draft.district || null,
      place: draft.place || null,
      type: draft.roomType,
      kind: draft.kind,
      min: draft.price[0] > PRICE_FLOOR ? String(draft.price[0]) : null,
      max: draft.price[1] < PRICE_CEIL ? String(draft.price[1]) : null,
    });
    setOpen(false);
  }

  function resetFilters() {
    const d = emptyDraft();
    setDraft(d);
    setMinText(String(d.price[0]));
    setMaxText(String(d.price[1]));
  }

  async function saveThisSearch() {
    if (!session) {
      // Carry the current draft into the URL so it survives the login round-trip.
      const p = new URLSearchParams();
      if (draft.district) p.set("district", draft.district);
      if (draft.place) p.set("place", draft.place);
      if (draft.roomType) p.set("type", draft.roomType);
      if (draft.kind) p.set("kind", draft.kind);
      if (draft.price[0] > PRICE_FLOOR) p.set("min", String(draft.price[0]));
      if (draft.price[1] < PRICE_CEIL) p.set("max", String(draft.price[1]));
      const next = p.size ? `/?${p}` : "/";
      router.push(`/login?next=${encodeURIComponent(next)}`);
      return;
    }
    setSaving(true);
    try {
      await saveSearch(draftToFilters(draft), session.user.id);
      toast.add({
        title: "Search saved",
        description: "We'll email you when a new match is posted.",
        timeout: 4000,
      });
    } catch {
      toast.add({
        title: "Couldn't save search",
        description: "Something went wrong — please try again.",
        timeout: 4000,
      });
    } finally {
      setSaving(false);
    }
  }

  const districtItems = [
    { value: "", label: "All districts" },
    ...DISTRICTS.map((d) => ({ value: d, label: d })),
  ];
  const placeItems = [
    { value: "", label: "All areas" },
    ...(draft.district ? DISTRICTS_AND_PLACES[draft.district] ?? [] : []).map((p) => ({
      value: p,
      label: p,
    })),
  ];

  // Count of active filters (price min+max collapse to one) for the trigger badge.
  const activeCount =
    (searchParams.get("district") ? 1 : 0) +
    (searchParams.get("place") ? 1 : 0) +
    (searchParams.get("type") ? 1 : 0) +
    (searchParams.get("kind") ? 1 : 0) +
    (searchParams.get("min") || searchParams.get("max") ? 1 : 0);

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger
        render={
          <Button variant="outline" size="lg" className="gap-2 rounded-full px-5" />
        }
      >
        <HugeiconsIcon icon={FilterHorizontalIcon} strokeWidth={2} className="size-4" />
        Filter
        {activeCount > 0 && (
          <span className="ml-0.5 flex size-5 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
            {activeCount}
          </span>
        )}
      </SheetTrigger>

      <SheetContent>
        <SheetHeader>
          <SheetTitle>Filters</SheetTitle>
        </SheetHeader>

        <SheetBody className="space-y-7 pb-6">
          {/* Location */}
          <section className="space-y-3">
            <h3 className="flex items-center gap-1.5 text-sm font-medium text-foreground">
              <HugeiconsIcon icon={Location09Icon} strokeWidth={2} className="size-4 text-muted-foreground" />
              Location
            </h3>
            <div className="space-y-2">
              <Combobox
                className="h-11 w-full rounded-2xl"
                placeholder="All districts"
                searchPlaceholder="Search districts…"
                items={districtItems}
                value={draft.district}
                onChange={(value) =>
                  setDraft((d) => ({ ...d, district: value, place: "" }))
                }
              />
              <Combobox
                className="h-11 w-full rounded-2xl"
                placeholder="All areas"
                searchPlaceholder="Search areas…"
                items={placeItems}
                value={draft.place}
                onChange={(value) => setDraft((d) => ({ ...d, place: value }))}
                disabled={!draft.district}
              />
            </div>
          </section>

          {/* Room type */}
          <section className="space-y-3">
            <h3 className="flex items-center gap-1.5 text-sm font-medium text-foreground">
              <HugeiconsIcon icon={Home09Icon} strokeWidth={2} className="size-4 text-muted-foreground" />
              Room type
            </h3>
            <div className="flex flex-wrap gap-2">
              <Chip
                selected={draft.roomType === null}
                onClick={() => setDraft((d) => ({ ...d, roomType: null }))}
              >
                Any
              </Chip>
              {ROOM_TYPES.map((t) => (
                <Chip
                  key={t.value}
                  selected={draft.roomType === t.value}
                  onClick={() => setDraft((d) => ({ ...d, roomType: t.value }))}
                >
                  {t.label}
                </Chip>
              ))}
            </div>
          </section>

          {/* Listing type */}
          <section className="space-y-3">
            <h3 className="flex items-center gap-1.5 text-sm font-medium text-foreground">
              <HugeiconsIcon icon={ArrowDataTransferHorizontalIcon} strokeWidth={2} className="size-4 text-muted-foreground" />
              Listing type
            </h3>
            <div className="flex gap-1 rounded-full bg-muted p-1">
              {LISTING_KINDS.map((k) => (
                <button
                  key={k.label}
                  type="button"
                  onClick={() => setDraft((d) => ({ ...d, kind: k.value }))}
                  className={cn(
                    "flex-1 rounded-full py-2 text-sm font-medium transition-colors",
                    draft.kind === k.value
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {k.label}
                </button>
              ))}
            </div>
          </section>

          {/* Price */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                <HugeiconsIcon icon={Tag01Icon} strokeWidth={2} className="size-4 text-muted-foreground" />
                Price range
              </h3>
              <span className="text-sm text-muted-foreground">
                {nu(draft.price[0])} –{" "}
                {draft.price[1] >= PRICE_CEIL ? `${nu(PRICE_CEIL)}+` : nu(draft.price[1])}
              </span>
            </div>
            <RangeSlider
              min={PRICE_FLOOR}
              max={PRICE_CEIL}
              step={PRICE_STEP}
              value={draft.price}
              onValueChange={setPrice}
            />
            <div className="flex items-center gap-3">
              <label className="flex-1 space-y-1">
                <span className="text-xs text-muted-foreground">Min (Nu.)</span>
                <Input
                  type="number"
                  inputMode="numeric"
                  className="rounded-2xl"
                  value={minText}
                  onChange={(e) => setMinText(e.target.value)}
                  onBlur={(e) => commitMin(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
                />
              </label>
              <span className="mt-5 text-muted-foreground">–</span>
              <label className="flex-1 space-y-1">
                <span className="text-xs text-muted-foreground">Max (Nu.)</span>
                <Input
                  type="number"
                  inputMode="numeric"
                  className="rounded-2xl"
                  value={maxText}
                  onChange={(e) => setMaxText(e.target.value)}
                  onBlur={(e) => commitMax(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
                />
              </label>
            </div>
          </section>
        </SheetBody>

        <SheetFooter className="space-y-2.5">
          <Button
            variant="outline"
            size="lg"
            className="w-full gap-2 rounded-full"
            onClick={saveThisSearch}
            disabled={saving}
          >
            <HugeiconsIcon icon={FavouriteIcon} strokeWidth={2} className="size-4" />
            {saving ? "Saving…" : "Save this search"}
          </Button>
          <div className="flex gap-2.5">
            <Button
              variant="ghost"
              size="lg"
              className="rounded-full px-5"
              onClick={resetFilters}
            >
              Reset
            </Button>
            <Button size="lg" className="flex-1 rounded-full" onClick={applyFilters}>
              Apply filters
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function Chip({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
        selected
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-input/30 text-foreground hover:bg-input/50"
      )}
    >
      {children}
    </button>
  );
}
