"use client";

import { use, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { CallIcon, Image02Icon, WhatsappIcon } from "@hugeicons/core-free-icons";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ReportDialog } from "@/components/report-dialog";
import { SaveButton } from "@/components/save-button";
import { roomTypeLabel } from "@/lib/districts";
import { fetchRoom } from "@/lib/rooms";
import { supabase } from "@/lib/supabase";
import { isRoomUnavailable, type Room } from "@/lib/types";
import { useSaved } from "@/lib/use-saved";
import { useSession } from "@/lib/use-session";
import { cn } from "@/lib/utils";

// Bhutan numbers are 8 digits; wa.me and tel: need the country code.
function withCountryCode(phone: string) {
  const digits = phone.replace(/\D/g, "");
  return digits.length === 8 ? `975${digits}` : digits;
}

function Gallery({ images, title }: { images: string[]; title: string }) {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(1);

  useEffect(() => {
    if (!api) return;
    const onSelect = () => setCurrent(api.selectedScrollSnap() + 1);
    api.on("select", onSelect);
    return () => {
      api.off("select", onSelect);
    };
  }, [api]);

  if (images.length === 0) {
    return (
      <div className="flex aspect-[16/10] items-center justify-center rounded-3xl bg-muted sm:aspect-[2/1]">
        <div className="flex flex-col items-center gap-2 text-muted-foreground/50">
          <HugeiconsIcon icon={Image02Icon} className="size-10" />
          <p className="text-sm">No photos for this listing</p>
        </div>
      </div>
    );
  }

  return (
    <Carousel setApi={setApi} className="relative">
      <CarouselContent>
        {images.map((src, i) => (
          <CarouselItem key={src}>
            <div className="relative aspect-[16/10] overflow-hidden rounded-3xl bg-muted sm:aspect-[2/1]">
              <Image
                src={src}
                alt={`${title} — photo ${i + 1}`}
                fill
                priority={i === 0}
                sizes="(max-width: 1024px) 100vw, 1024px"
                className="object-cover"
              />
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      {images.length > 1 && (
        <>
          <CarouselPrevious className="left-3 bg-background/80 backdrop-blur-sm" />
          <CarouselNext className="right-3 bg-background/80 backdrop-blur-sm" />
          <span className="absolute right-3 bottom-3 rounded-full bg-foreground/70 px-2.5 py-1 text-xs font-medium text-background">
            {current} / {images.length}
          </span>
        </>
      )}
    </Carousel>
  );
}

export default function RoomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const session = useSession();
  const [room, setRoom] = useState<Room | null | undefined>(undefined);
  const { savedIds, toggleSaved } = useSaved();
  const counted = useRef(false);

  useEffect(() => {
    fetchRoom(id).then(setRoom);
  }, [id]);

  // Count the view once per visit (ref guards React strict-mode double effects)
  useEffect(() => {
    if (counted.current) return;
    counted.current = true;
    supabase.rpc("increment_room_view", { room: id }).then(() => {});
  }, [id]);

  if (room === undefined) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
        <Skeleton className="aspect-[16/10] rounded-3xl sm:aspect-[2/1]" />
        <Skeleton className="mt-8 h-8 w-1/2" />
        <Skeleton className="mt-3 h-4 w-1/3" />
      </div>
    );
  }

  if (room === null) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 py-24 text-center sm:px-6">
        <h1 className="text-xl font-semibold tracking-tight">Listing not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This room may have been removed.
        </p>
        <Link href="/" className={cn(buttonVariants({ variant: "outline" }), "mt-6 rounded-full")}>
          Browse all rooms
        </Link>
      </div>
    );
  }

  const title = `${roomTypeLabel(room.room_type)} in ${room.place}`;
  const amenities = (room.amenities ?? "")
    .split(",")
    .map((a) => a.trim())
    .filter(Boolean);
  const posted = new Date(room.created_at).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
      <Link
        href="/"
        className="mb-6 inline-block text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        ← All rooms
      </Link>

      {isRoomUnavailable(room) && (
        <div className="mb-4 rounded-2xl bg-muted px-4 py-3 text-sm text-muted-foreground">
          This room is no longer available.
        </div>
      )}

      <div className="relative">
        <Gallery images={room.images} title={title} />
        <SaveButton
          saved={savedIds.has(room.id)}
          onToggle={() => toggleSaved(room.id)}
          className="absolute top-3 right-3 z-10"
        />
      </div>

      <div className="mt-8 grid items-start gap-10 lg:grid-cols-[1fr_360px]">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
          <p className="mt-1 text-muted-foreground">
            {room.place}, {room.district}
          </p>
          <p className="mt-4 text-xl font-semibold">
            Nu. {room.price.toLocaleString("en-IN")}{" "}
            <span className="text-base font-normal text-muted-foreground">/ month</span>
          </p>

          {room.description && (
            <>
              <Separator className="my-6" />
              <h2 className="text-base font-semibold">About this room</h2>
              <p className="mt-2 text-[15px] leading-7 whitespace-pre-line text-foreground/80">
                {room.description}
              </p>
            </>
          )}

          {amenities.length > 0 && (
            <>
              <Separator className="my-6" />
              <h2 className="text-base font-semibold">Amenities</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {amenities.map((amenity) => (
                  <Badge key={amenity} variant="secondary" className="h-auto rounded-full px-3 py-1">
                    {amenity}
                  </Badge>
                ))}
              </div>
            </>
          )}

          {room.latitude != null && room.longitude != null && (
            <>
              <Separator className="my-6" />
              <h2 className="text-base font-semibold">Location</h2>
              <div className="mt-3 overflow-hidden rounded-2xl border">
                <iframe
                  title="Room location"
                  src={`https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&q=${room.latitude},${room.longitude}&maptype=satellite&zoom=17`}
                  className="aspect-video w-full"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  allowFullScreen
                />
              </div>
              <a
                href={`https://www.google.com/maps?q=${room.latitude},${room.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(buttonVariants({ variant: "outline", size: "sm" }), "mt-3 rounded-full")}
              >
                Open in Google Maps
              </a>
            </>
          )}

          <div className="mt-8 flex items-center justify-between gap-4">
            <p className="text-xs text-muted-foreground">
              Posted {posted}
              {session?.user.id === room.user_id && (
                <> · {room.view_count} {room.view_count === 1 ? "view" : "views"} (only you can see this)</>
              )}
            </p>
            <ReportDialog roomId={room.id} />
          </div>
        </div>

        <Card className="rounded-3xl lg:sticky lg:top-20">
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Listed by</p>
              <p className="text-lg font-semibold">{room.vendor_name}</p>
            </div>
            <div className="space-y-2">
              {room.vendor_whatsapp && (
                <a
                  href={`https://wa.me/${withCountryCode(room.vendor_whatsapp)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(buttonVariants(), "h-10 w-full rounded-full")}
                >
                  <HugeiconsIcon icon={WhatsappIcon} />
                  WhatsApp {room.vendor_whatsapp}
                </a>
              )}
              {room.vendor_phone && (
                <a
                  href={`tel:+${withCountryCode(room.vendor_phone)}`}
                  className={cn(buttonVariants({ variant: "outline" }), "h-10 w-full rounded-full")}
                >
                  <HugeiconsIcon icon={CallIcon} />
                  Call {room.vendor_phone}
                </a>
              )}
            </div>
            <p className="text-xs leading-5 text-muted-foreground">
              Contact the owner directly — GetYourRoom doesn&apos;t handle payments or
              bookings.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
