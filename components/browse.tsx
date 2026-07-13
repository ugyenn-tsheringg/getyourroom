"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Filters } from "@/components/filters";
import { RoomCard } from "@/components/room-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchRooms } from "@/lib/rooms";
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

  const [rooms, setRooms] = useState<Room[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setRooms(null);
    setError(null);
    fetchRooms(filters)
      .then((data) => {
        if (!cancelled) setRooms(data);
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message);
      });
    return () => {
      cancelled = true;
    };
  }, [filters]);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
      <section className="py-10 sm:py-14">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Find a room in Bhutan
        </h1>
        <p className="mt-2 max-w-xl text-muted-foreground">
          Rooms and flats for rent, posted directly by owners. Browse freely — no
          account needed.
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
            <p className="pb-4 text-sm text-muted-foreground">
              {rooms.length} {rooms.length === 1 ? "room" : "rooms"} available
            </p>
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
          </>
        )}
      </section>
    </div>
  );
}
