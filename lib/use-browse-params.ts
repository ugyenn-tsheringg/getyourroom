"use client";

import { useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";

// Shared reader/writer for the browse filter query string. Mirrors the desktop
// Filters component's setParams so mobile controls stay in lockstep with it:
// any filter change also resets pagination back to page 1.
export function useBrowseParams() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const setParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value) params.set(key, value);
        else params.delete(key);
      }
      params.delete("page"); // changing any filter starts back at page 1
      router.replace(params.size ? `/?${params}` : "/", { scroll: false });
    },
    [router, searchParams]
  );

  const clearAll = useCallback(() => {
    router.replace("/", { scroll: false });
  }, [router]);

  return { searchParams, setParams, clearAll };
}
