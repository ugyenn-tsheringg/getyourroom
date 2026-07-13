"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { FavouriteIcon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";

export function SaveButton({
  saved,
  onToggle,
  className,
}: {
  saved: boolean;
  onToggle: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-label={saved ? "Remove from saved" : "Save listing"}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onToggle();
      }}
      className={cn(
        "flex size-9 items-center justify-center rounded-full backdrop-blur-sm transition-colors",
        saved
          ? "bg-foreground text-background"
          : "bg-background/80 text-foreground hover:bg-background",
        className
      )}
    >
      <HugeiconsIcon icon={FavouriteIcon} className="size-4.5" strokeWidth={2} />
    </button>
  );
}
