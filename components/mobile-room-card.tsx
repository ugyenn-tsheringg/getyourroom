import Image from "next/image";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { Image02Icon } from "@hugeicons/core-free-icons";
import { SaveButton } from "@/components/save-button";
import { roomTypeLabel } from "@/lib/districts";
import { timeAgo } from "@/lib/time";
import type { Room } from "@/lib/types";
import { cn } from "@/lib/utils";

// Mobile-only listing card: horizontal (photo left, details right). Dedicated
// component — the desktop RoomCard is untouched.
export function MobileRoomCard({
  room,
  priority = false,
  saved,
  onToggleSave,
  unavailable = false,
}: {
  room: Room;
  priority?: boolean;
  saved?: boolean;
  onToggleSave?: () => void;
  unavailable?: boolean;
}) {
  const title = `${roomTypeLabel(room.room_type)} in ${room.place}`;

  return (
    <Link href={`/rooms/${room.id}`} className="group block">
      <div className="flex gap-3 rounded-3xl border border-border/70 bg-card p-3 shadow-sm ring-1 ring-foreground/5 transition-shadow hover:shadow-md">
        {/* Photo */}
        <div className="relative min-h-28 w-28 shrink-0 self-stretch overflow-hidden rounded-2xl bg-muted">
          {room.images[0] ? (
            <Image
              src={room.images[0]}
              alt={title}
              fill
              priority={priority}
              sizes="112px"
              className={cn("object-cover", unavailable && "opacity-60")}
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <HugeiconsIcon icon={Image02Icon} className="size-7 text-muted-foreground/40" />
            </div>
          )}
          {room.listing_type === "exchange" && (
            <span className="absolute top-1.5 left-1.5 rounded-full bg-foreground px-2 py-0.5 text-[10px] font-bold tracking-wide text-background uppercase">
              For exchange
            </span>
          )}
        </div>

        {/* Details */}
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-start gap-2">
            <p className="line-clamp-2 flex-1 font-medium leading-snug">{title}</p>
            {onToggleSave && (
              <SaveButton
                saved={Boolean(saved)}
                onToggle={onToggleSave}
                className="-mt-1 -mr-1 shrink-0"
              />
            )}
          </div>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {room.place}, {room.district}
          </p>
          <p className="mt-1.5 text-[15px] font-semibold">
            Nu. {room.price.toLocaleString("en-IN")}{" "}
            <span className="font-normal text-muted-foreground">/ month</span>
          </p>
          {unavailable ? (
            <p className="mt-0.5 text-xs font-medium text-muted-foreground">No longer available</p>
          ) : (
            <p className="mt-0.5 text-xs text-muted-foreground">Posted {timeAgo(room.created_at)}</p>
          )}
        </div>
      </div>
    </Link>
  );
}
