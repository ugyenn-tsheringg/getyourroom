"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon, InformationCircleIcon, Tick02Icon } from "@hugeicons/core-free-icons";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export type PhotoStatus = "scanning" | "verified" | "existing";

export function PhotoThumb({
  src,
  status,
  onRemove,
  label,
}: {
  src: string;
  status: PhotoStatus;
  onRemove: () => void;
  label: string;
}) {
  const lineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status !== "scanning" || !lineRef.current) return;
    const tween = gsap.fromTo(
      lineRef.current,
      { top: "-10%" },
      { top: "100%", duration: 1.3, ease: "power1.inOut", repeat: -1, yoyo: true }
    );
    return () => {
      tween.kill();
    };
  }, [status]);

  return (
    <div className="relative aspect-square overflow-hidden rounded-2xl border bg-muted">
      <Image
        src={src}
        alt={label}
        fill
        unoptimized={src.startsWith("blob:")}
        sizes="160px"
        className="object-cover"
      />

      {status === "scanning" && (
        <div className="absolute inset-0 bg-foreground/10" aria-label="Checking photo">
          <div
            ref={lineRef}
            className="absolute left-0 h-[10%] w-full bg-gradient-to-b from-transparent via-background/90 to-transparent"
            style={{ top: "-10%" }}
          />
        </div>
      )}

      {status === "verified" && (
        <div className="absolute bottom-1.5 left-1.5 flex items-center gap-1 rounded-full bg-background/90 py-0.5 pr-1 pl-2 text-[10px] font-medium backdrop-blur-sm">
          <HugeiconsIcon icon={Tick02Icon} className="size-3" strokeWidth={2.5} />
          Verified
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger className="flex items-center text-muted-foreground">
                <HugeiconsIcon icon={InformationCircleIcon} className="size-3" />
                <span className="sr-only">About photo verification</span>
              </TooltipTrigger>
              <TooltipContent className="max-w-56">
                Images are automatically scanned using Sightengine to check for
                inappropriate content or images that aren&apos;t of an actual room.
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )}

      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${label}`}
        className="absolute top-1.5 right-1.5 flex size-6 items-center justify-center rounded-full bg-foreground/70 text-background"
      >
        <HugeiconsIcon icon={Cancel01Icon} className="size-3.5" />
      </button>
    </div>
  );
}
