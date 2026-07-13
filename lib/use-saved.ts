"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { fetchSavedRoomIds, saveRoom, unsaveRoom } from "./saved";
import { useSession } from "./use-session";

// Saved-room ids for the signed-in user, plus a toggle that redirects
// signed-out users to the login page.
export function useSaved() {
  const session = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [ids, setIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (session) fetchSavedRoomIds().then(setIds).catch(() => {});
    else setIds(new Set());
  }, [session]);

  const toggle = useCallback(
    async (roomId: string) => {
      if (!session) {
        router.push(`/login?next=${encodeURIComponent(pathname)}`);
        return;
      }
      if (ids.has(roomId)) {
        setIds((prev) => {
          const next = new Set(prev);
          next.delete(roomId);
          return next;
        });
        await unsaveRoom(roomId).catch(() => {});
      } else {
        setIds((prev) => new Set(prev).add(roomId));
        await saveRoom(roomId, session.user.id).catch(() => {});
      }
    },
    [session, ids, router, pathname]
  );

  return { savedIds: ids, toggleSaved: toggle, signedIn: Boolean(session) };
}
