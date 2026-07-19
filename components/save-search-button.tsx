"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import type { RoomFilters } from "@/lib/rooms";
import { saveSearch } from "@/lib/saved-searches";
import { useSession } from "@/lib/use-session";

export function SaveSearchButton({ filters }: { filters: RoomFilters }) {
  const session = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [state, setState] = useState<"idle" | "saving" | "saved">("idle");

  async function handleClick() {
    if (!session) {
      const next = searchParams.size ? `${pathname}?${searchParams}` : pathname;
      router.push(`/login?next=${encodeURIComponent(next)}`);
      return;
    }
    setState("saving");
    try {
      await saveSearch(filters, session.user.id);
      setState("saved");
    } catch {
      setState("idle");
    }
  }

  if (state === "saved") {
    return (
      <Link
        href="/saved-searches"
        className="text-sm text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
      >
        Search saved — we&apos;ll email you about new matches
      </Link>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className="rounded-full"
      disabled={state === "saving"}
      onClick={handleClick}
    >
      {state === "saving" ? "Saving…" : "Save this search"}
    </Button>
  );
}
