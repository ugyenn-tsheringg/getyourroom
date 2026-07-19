"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Filters } from "@/components/filters";
import { Pagination } from "@/components/pagination";
import { RoomCard } from "@/components/room-card";
import { SaveSearchButton } from "@/components/save-search-button";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchRoomsPage, PAGE_SIZE } from "@/lib/rooms";
import type { Room } from "@/lib/types";
import { useSaved } from "@/lib/use-saved";

export function Browse() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { savedIds, toggleSaved } = useSaved();

  const filters = useMemo(
    () => ({
      district: searchParams.get("district") ?? undefined,
      place: searchParams.get("place") ?? undefined,
      roomType: searchParams.get("type") ?? undefined,
      minPrice: searchParams.get("min") ? Number(searchParams.get("min")) : undefined,
      maxPrice: searchParams.get("max") ? Number(searchParams.get("max")) : undefined,
    }),
    [searchParams]
  );

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
    <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
      <section className="py-14 text-center sm:py-20">
        <p className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
          Rooms for rent across Bhutan
        </p>
        <h1 className="mx-auto mt-3 max-w-2xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
          Your next room is a few clicks away
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
          Studios, 1BHKs, and family flats from Thimphu to Paro — posted
          directly by owners with photos, prices, and direct contact. Browse freely,
          no account needed.
        </p>
      </section>

      <Filters />

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
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2 pb-4">
              <p className="text-sm text-muted-foreground">
                {total} {total === 1 ? "room" : "rooms"} available
                {totalPages > 1 && ` · page ${page} of ${totalPages}`}
              </p>
              <SaveSearchButton filters={filters} />
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
  );
}
