"use client";

import { MobileSearchBar } from "@/components/mobile-search-bar";

// Mobile-only hero: a shorter banner (~30% less height than desktop) whose only
// input is the unified search bar. No dropdown filters live here — those move
// into the filter sheet, keeping the first screen focused on fast browsing.
export function MobileHero() {
  return (
    <section className="relative mt-4 overflow-hidden rounded-3xl bg-primary bg-[radial-gradient(60%_70%_at_50%_100%,var(--muted)_0%,var(--primary)_100%)]">
      <div className="relative px-5 pt-7 pb-6">
        <p className="text-xs font-medium tracking-wide text-white/80 uppercase">
          Rooms for rent across Bhutan
        </p>
        <h1 className="mt-1.5 text-2xl font-semibold tracking-tight text-balance text-white">
          Your next room is a few taps away
        </h1>
        <p className="mt-2 text-sm leading-6 text-white/85">
          Posted directly by owners — browse freely, no account needed.
        </p>
        <div className="mt-5">
          <MobileSearchBar />
        </div>
      </div>
    </section>
  );
}
