"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  deleteSavedSearch,
  describeSearch,
  fetchSavedSearches,
  type SavedSearch,
} from "@/lib/saved-searches";
import { cn } from "@/lib/utils";

// Self-contained saved-searches list (fetch + render + delete). Used by the
// mobile Saved page's "Searches" sub-tab. The desktop /saved-searches page is
// left untouched.
export function SavedSearchesList() {
  const [searches, setSearches] = useState<SavedSearch[] | null>(null);

  useEffect(() => {
    fetchSavedSearches().then(setSearches).catch(() => setSearches([]));
  }, []);

  async function handleDelete(id: string) {
    setSearches((prev) => prev && prev.filter((s) => s.id !== id));
    await deleteSavedSearch(id).catch(() => {});
  }

  return (
    <div className="space-y-3">
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
  );
}
