"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { RoomForm } from "@/components/room-form";
import { useSession } from "@/lib/use-session";

export default function PostRoomPage() {
  const router = useRouter();
  const session = useSession();

  useEffect(() => {
    if (session === null) router.replace("/login?next=/post");
  }, [session, router]);

  if (!session) return null;

  return (
    <div className="mx-auto w-full max-w-xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Post a room</h1>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        Fill in the details below — your listing goes live immediately.
      </p>
      <RoomForm />
    </div>
  );
}
