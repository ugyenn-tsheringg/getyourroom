"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { Image02Icon } from "@hugeicons/core-free-icons";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { roomTypeLabel } from "@/lib/districts";
import { fetchRoomsByOwner } from "@/lib/rooms";
import { supabase } from "@/lib/supabase";
import { isRoomUnavailable, type Room } from "@/lib/types";
import { useSession } from "@/lib/use-session";
import { cn } from "@/lib/utils";

function statusBadge(room: Room) {
  if (room.status === "rented") return <Badge variant="outline">Rented</Badge>;
  if (isRoomUnavailable(room)) return <Badge variant="outline" className="text-muted-foreground">Expired</Badge>;
  return <Badge variant="secondary">Available</Badge>;
}

export default function MyListingsPage() {
  const router = useRouter();
  const session = useSession();
  const [rooms, setRooms] = useState<Room[] | null>(null);
  const [deleting, setDeleting] = useState<Room | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session === null) router.replace("/login?next=/my-listings");
  }, [session, router]);

  useEffect(() => {
    if (session) fetchRoomsByOwner(session.user.id).then(setRooms).catch(() => setError("Couldn't load your listings."));
  }, [session]);

  if (!session) return null;

  async function toggleStatus(room: Room) {
    const status = room.status === "available" ? "rented" : "available";
    const { error } = await supabase.from("rooms").update({ status }).eq("id", room.id);
    if (error) setError(error.message);
    else setRooms((prev) => prev!.map((r) => (r.id === room.id ? { ...r, status } : r)));
  }

  async function confirmDelete() {
    if (!deleting) return;
    setBusy(true);
    const { error } = await supabase.from("rooms").delete().eq("id", deleting.id);
    setBusy(false);
    if (error) setError(error.message);
    else setRooms((prev) => prev!.filter((r) => r.id !== deleting.id));
    setDeleting(null);
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">My listings</h1>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        Manage the rooms you&apos;ve posted — mark them as rented, edit details, or remove them.
      </p>

      {error && <p className="mt-6 text-sm text-destructive">{error}</p>}

      <div className="mt-8 space-y-4">
        {rooms === null ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-3xl" />)
        ) : rooms.length === 0 ? (
          <div className="py-16 text-center">
            <p className="font-medium">You haven&apos;t posted any rooms yet</p>
            <Link href="/post" className={cn(buttonVariants({ size: "sm" }), "mt-4 rounded-full px-4")}>
              Post a room
            </Link>
          </div>
        ) : (
          rooms.map((room) => (
            <div
              key={room.id}
              className="flex flex-col gap-4 rounded-3xl p-4 ring-1 ring-foreground/8 sm:flex-row sm:items-center"
            >
              <Link
                href={`/rooms/${room.id}`}
                className="relative aspect-[4/3] w-full shrink-0 overflow-hidden rounded-2xl bg-muted sm:w-36"
              >
                {room.images[0] ? (
                  <Image src={room.images[0]} alt="" fill sizes="144px" className="object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <HugeiconsIcon icon={Image02Icon} className="size-6 text-muted-foreground/40" />
                  </div>
                )}
              </Link>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Link href={`/rooms/${room.id}`} className="truncate font-medium hover:underline">
                    {roomTypeLabel(room.room_type)} in {room.place}
                  </Link>
                  {statusBadge(room)}
                </div>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {room.district} · Nu. {room.price.toLocaleString("en-IN")} / month
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Button variant="outline" size="sm" className="rounded-full" onClick={() => toggleStatus(room)}>
                    {room.status === "available" ? "Mark as rented" : "Mark as available"}
                  </Button>
                  <Link
                    href={`/rooms/${room.id}/edit`}
                    className={cn(buttonVariants({ variant: "outline", size: "sm" }), "rounded-full")}
                  >
                    Edit
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-full text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => setDeleting(room)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <Dialog open={deleting !== null} onOpenChange={(open) => !open && setDeleting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this listing?</DialogTitle>
            <DialogDescription>
              {deleting &&
                `${roomTypeLabel(deleting.room_type)} in ${deleting.place} will be removed permanently. This can't be undone.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" className="rounded-full" onClick={() => setDeleting(null)}>
              Cancel
            </Button>
            <Button
              className="rounded-full bg-destructive text-white hover:bg-destructive/90"
              disabled={busy}
              onClick={confirmDelete}
            >
              {busy ? "Deleting…" : "Delete listing"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
