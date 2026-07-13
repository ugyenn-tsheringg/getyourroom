"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RoomForm } from "@/components/room-form";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchRoom } from "@/lib/rooms";
import type { Room } from "@/lib/types";
import { useSession } from "@/lib/use-session";

export default function EditRoomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const session = useSession();
  const [room, setRoom] = useState<Room | null | undefined>(undefined);
  const [isAdmin, setIsAdmin] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    if (session === null) router.replace(`/login?next=/rooms/${id}/edit`);
  }, [session, router, id]);

  useEffect(() => {
    fetchRoom(id).then(setRoom);
  }, [id]);

  useEffect(() => {
    if (!session) return;
    fetch("/api/admin/check", {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
      .then((res) => res.json())
      .then((json) => setIsAdmin(Boolean(json.isAdmin)))
      .catch(() => setIsAdmin(false));
  }, [session]);

  const isOwner = Boolean(session && room && room.user_id === session.user.id);

  useEffect(() => {
    // Neither the owner nor the admin (RLS blocks the update anyway) — send them back
    if (session && room && isAdmin === false && !isOwner) router.replace("/my-listings");
  }, [session, room, isAdmin, isOwner, router]);

  if (!session || room === undefined || isAdmin === undefined) {
    return (
      <div className="mx-auto w-full max-w-xl px-4 py-10 sm:px-6">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="mt-6 h-64 rounded-3xl" />
      </div>
    );
  }

  if (room === null) {
    return (
      <div className="mx-auto w-full max-w-xl px-4 py-24 text-center sm:px-6">
        <h1 className="text-xl font-semibold tracking-tight">Listing not found</h1>
      </div>
    );
  }

  if (!isOwner && !isAdmin) return null;

  return (
    <div className="mx-auto w-full max-w-xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Edit listing</h1>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        {!isOwner && isAdmin
          ? `Editing ${room.vendor_name}'s listing as the site admin.`
          : "Changes go live as soon as you save."}
      </p>
      <RoomForm initial={room} adminOverride={!isOwner && isAdmin} />
    </div>
  );
}
