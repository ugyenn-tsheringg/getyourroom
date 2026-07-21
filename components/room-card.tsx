import Image from "next/image";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { Image02Icon } from "@hugeicons/core-free-icons";
import { Card, CardContent } from "@/components/ui/card";
import { SaveButton } from "@/components/save-button";
import { roomTypeLabel } from "@/lib/districts";
import type { Room } from "@/lib/types";

export function RoomCard({
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
      <Card className="gap-0 rounded-3xl py-0 ring-foreground/8 transition-shadow hover:ring-foreground/15">
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          {room.images[0] ? (
            <Image
              src={room.images[0]}
              alt={title}
              fill
              priority={priority}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className={
                "object-cover transition-transform duration-500 group-hover:scale-[1.03]" +
                (unavailable ? " opacity-60" : "")
              }
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <HugeiconsIcon icon={Image02Icon} className="size-8 text-muted-foreground/40" />
            </div>
          )}
          <div className="absolute top-2 left-2 flex flex-col items-start gap-1.5">
            {room.listing_type === "exchange" && (
              <span className="rounded-full bg-foreground px-2.5 py-1 text-[11px] font-bold tracking-wide text-background uppercase">
                For exchange
              </span>
            )}
            {unavailable && (
              <span className="rounded-full bg-foreground/70 px-2.5 py-1 text-xs font-medium text-background">
                No longer available
              </span>
            )}
          </div>
          {onToggleSave && (
            <SaveButton
              saved={Boolean(saved)}
              onToggle={onToggleSave}
              className="absolute top-2 right-2"
            />
          )}
        </div>
        <CardContent className="space-y-1 p-4">
          <p className="font-medium leading-snug">{title}</p>
          <p className="text-sm text-muted-foreground">{room.district}</p>
          <p className="pt-1 text-[15px] font-semibold">
            Nu. {room.price.toLocaleString("en-IN")}{" "}
            <span className="font-normal text-muted-foreground">/ month</span>
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
