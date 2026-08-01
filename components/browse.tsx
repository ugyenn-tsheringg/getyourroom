"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Filters } from "@/components/filters";
import { MobileHero } from "@/components/mobile-hero";
import { MobileFilterSheet } from "@/components/mobile-filter-sheet";
import { FilterChips } from "@/components/filter-chips";
import { Pagination } from "@/components/pagination";
import { RoomCard } from "@/components/room-card";
import { MobileRoomCard } from "@/components/mobile-room-card";
import { SaveSearchButton } from "@/components/save-search-button";
import { ToastProvider, Toaster } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchRoomsPage, PAGE_SIZE, type RoomFilters } from "@/lib/rooms";
import type { Room } from "@/lib/types";
import { useSaved } from "@/lib/use-saved";

export function Browse() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { savedIds, toggleSaved } = useSaved();

  const filters = useMemo((): RoomFilters => {
    const kind = searchParams.get("kind");
    return {
      district: searchParams.get("district") ?? undefined,
      place: searchParams.get("place") ?? undefined,
      roomType: searchParams.get("type") ?? undefined,
      minPrice: searchParams.get("min") ? Number(searchParams.get("min")) : undefined,
      maxPrice: searchParams.get("max") ? Number(searchParams.get("max")) : undefined,
      listingType: kind === "exchange" || kind === "rental" ? kind : undefined,
    };
  }, [searchParams]);

  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const [rooms, setRooms] = useState<Room[] | null>(null);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setRooms(null);
    setError(null);
    fetchRoomsPage(filters, page)
      .then((data) => {
        if (cancelled) return;
        setRooms(data.rooms);
        setTotal(data.total);
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message);
      });
    return () => {
      cancelled = true;
    };
  }, [filters, page]);

  function goToPage(next: number) {
    const params = new URLSearchParams(searchParams.toString());
    if (next <= 1) params.delete("page");
    else params.set("page", String(next));
    router.replace(params.size ? `/?${params}` : "/");
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <ToastProvider>
    <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
      {/* Mobile (below md): shorter hero with unified search, a filter sheet, and active-filter chips */}
      <div className="md:hidden">
        <MobileHero />
        <FilterChips className="mt-4" />
      </div>

      {/* Desktop (md and up): unchanged hero + inline filters */}
      <section className="relative mt-4 hidden overflow-hidden rounded-3xl bg-primary bg-[radial-gradient(55%_65%_at_50%_100%,var(--muted)_0%,var(--primary)_100%)] text-center md:block">
        <div className="relative px-4 pt-8 pb-12 sm:pt-10 sm:pb-14">
          <p className="text-sm font-medium tracking-wide text-white/80 uppercase">
            Rooms for rent across Bhutan
          </p>
          <h1 className="mx-auto mt-2 max-w-2xl text-4xl font-semibold tracking-tight text-balance text-white sm:text-5xl">
            Your next room is a few clicks away
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-base leading-7 text-white/85 sm:text-lg">
            Studios, 1BHKs, and family flats from Thimphu to Paro — posted
            directly by owners with photos, prices, and direct contact. Browse freely,
            no account needed.
          </p>
        </div>
      </section>

      <div className="relative z-10 mx-auto -mt-8 hidden w-[93%] rounded-3xl bg-background p-3 shadow-lg ring-1 ring-black/5 md:block">
        <Filters />
      </div>

      <section className="py-8 pb-16">
        {error ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            Something went wrong loading rooms. Please try again.
          </p>
        ) : rooms === null ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-[4/3] rounded-3xl" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-1/3" />
              </div>
            ))}
          </div>
        ) : rooms.length === 0 ? (
          <>
            <div className="flex flex-wrap items-center justify-end gap-2 pb-4">
              {/* Desktop keeps the top-level Save-this-search; mobile shows the Filter button (which itself contains Save inside the sheet) */}
              <span className="hidden md:block">
                <SaveSearchButton filters={filters} />
              </span>
              <span className="md:hidden">
                <MobileFilterSheet />
              </span>
            </div>
            <div className="py-16 text-center">
              <p className="font-medium">No rooms match your filters</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Try adjusting or clearing your search.
              </p>
              {searchParams.size > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4 rounded-full"
                  onClick={() => router.replace("/", { scroll: false })}
                >
                  Clear filters
                </Button>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2 pb-4">
              <p className="text-sm text-muted-foreground">
                {total} {total === 1 ? "room" : "rooms"} available
                {totalPages > 1 && ` · page ${page} of ${totalPages}`}
              </p>
              {/* Desktop keeps the top-level Save-this-search; mobile shows the Filter button (which itself contains Save inside the sheet) */}
              <span className="hidden md:block">
                <SaveSearchButton filters={filters} />
              </span>
              <span className="md:hidden">
                <MobileFilterSheet />
              </span>
            </div>
            {/* Mobile: single-column horizontal cards */}
            <div className="flex flex-col gap-3 md:hidden">
              {rooms.map((room, i) => (
                <MobileRoomCard
                  key={room.id}
                  room={room}
                  priority={i < 3}
                  saved={savedIds.has(room.id)}
                  onToggleSave={() => toggleSaved(room.id)}
                />
              ))}
            </div>
            {/* Desktop (md and up): unchanged grid of vertical cards */}
            <div className="hidden grid-cols-1 gap-6 sm:grid-cols-2 md:grid lg:grid-cols-3">
              {rooms.map((room, i) => (
                <RoomCard
                  key={room.id}
                  room={room}
                  priority={i < 3}
                  saved={savedIds.has(room.id)}
                  onToggleSave={() => toggleSaved(room.id)}
                />
              ))}
            </div>
            <Pagination page={page} totalPages={totalPages} onPageChange={goToPage} />
          </>
        )}
      </section>
    </div>
    <Toaster />
    </ToastProvider>
  );
}
