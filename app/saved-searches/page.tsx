"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  deleteSavedSearch,
  describeSearch,
  fetchSavedSearches,
  type SavedSearch,
} from "@/lib/saved-searches";
import { useSession } from "@/lib/use-session";
import { cn } from "@/lib/utils";

export default function SavedSearchesPage() {
  const router = useRouter();
  const session = useSession();
  const [searches, setSearches] = useState<SavedSearch[] | null>(null);

  useEffect(() => {
    if (session === null) router.replace("/login?next=/saved-searches");
  }, [session, router]);

  useEffect(() => {
    if (session) fetchSavedSearches().then(setSearches).catch(() => setSearches([]));
  }, [session]);

  if (!session) return null;

  async function handleDelete(id: string) {
    setSearches((prev) => prev && prev.filter((s) => s.id !== id));
    await deleteSavedSearch(id).catch(() => {});
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Saved searches</h1>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        We check for new listings once a day and email you when something matches.
      </p>

      <div className="mt-8 space-y-3">
        {searches === null ? (
          Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-3xl" />)
        ) : searches.length === 0 ? (
          <div className="py-16 text-center">
            <p className="font-medium">No saved searches yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Set some filters on the browse page, then tap “Save this search.”
            </p>
            <Link href="/" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "mt-4 rounded-full")}>
              Browse rooms
            </Link>
          </div>
        ) : (
          searches.map((search) => (
            <div
              key={search.id}
              className="flex items-center justify-between gap-4 rounded-3xl px-5 py-4 ring-1 ring-foreground/8"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">{describeSearch(search)}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Saved{" "}
                  {new Date(search.created_at).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="shrink-0 rounded-full text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => handleDelete(search.id)}
              >
                Delete
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
