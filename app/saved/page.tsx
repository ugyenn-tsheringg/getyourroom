"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { RoomCard } from "@/components/room-card";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchSavedRooms, unsaveRoom } from "@/lib/saved";
import { isRoomUnavailable, type Room } from "@/lib/types";
import { useSession } from "@/lib/use-session";
import { cn } from "@/lib/utils";

export default function SavedPage() {
  const router = useRouter();
  const session = useSession();
  const [rooms, setRooms] = useState<Room[] | null>(null);

  useEffect(() => {
    if (session === null) router.replace("/login?next=/saved");
  }, [session, router]);

  useEffect(() => {
    if (session) fetchSavedRooms().then(setRooms).catch(() => setRooms([]));
  }, [session]);

  if (!session) return null;

  async function handleUnsave(roomId: string) {
    setRooms((prev) => prev!.filter((r) => r.id !== roomId));
    await unsaveRoom(roomId).catch(() => {});
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Saved rooms</h1>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        Listings you&apos;ve saved. Tap the heart again to remove one.
      </p>

      <div className="mt-8">
        {rooms === null ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[4/3] rounded-3xl" />
            ))}
          </div>
        ) : rooms.length === 0 ? (
          <div className="py-16 text-center">
            <p className="font-medium">Nothing saved yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Tap the heart on any listing to keep it here.
            </p>
            <Link href="/" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "mt-4 rounded-full")}>
              Browse rooms
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {rooms.map((room) => (
              <RoomCard
                key={room.id}
                room={room}
                saved
                onToggleSave={() => handleUnsave(room.id)}
                unavailable={isRoomUnavailable(room)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
