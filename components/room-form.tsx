"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon } from "@hugeicons/core-free-icons";
import { PhotoThumb, type PhotoStatus } from "@/components/photo-thumb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DISTRICTS, DISTRICTS_AND_PLACES, ROOM_TYPES } from "@/lib/districts";
import { supabase } from "@/lib/supabase";
import { useSession } from "@/lib/use-session";
import type { Room } from "@/lib/types";

const EXPIRY_DAYS = [30, 60, 90];

type Photo = {
  key: string;
  preview: string;
  status: PhotoStatus;
  url?: string;
};

// adminOverride: the admin editing someone else's listing — the update goes
// through the admin API route since RLS only allows owners to update directly.
export function RoomForm({ initial, adminOverride = false }: { initial?: Room; adminOverride?: boolean }) {
  const router = useRouter();
  const session = useSession();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [photos, setPhotos] = useState<Photo[]>(
    () =>
      (initial?.images ?? []).map((url) => ({
        key: url,
        preview: url,
        status: "existing" as const,
        url,
      }))
  );
  const [photoError, setPhotoError] = useState<string | null>(null);
  const photosRef = useRef<Photo[]>([]);
  photosRef.current = photos;
  const [roomType, setRoomType] = useState<string | null>(initial?.room_type ?? null);
  const [district, setDistrict] = useState<string | null>(initial?.district ?? null);
  const [place, setPlace] = useState<string | null>(initial?.place ?? null);
  const [price, setPrice] = useState(initial ? String(initial.price) : "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [amenities, setAmenities] = useState(initial?.amenities ?? "");
  const [vendorName, setVendorName] = useState(initial?.vendor_name ?? "");
  const [whatsapp, setWhatsapp] = useState(initial?.vendor_whatsapp ?? "");
  const [phone, setPhone] = useState(initial?.vendor_phone ?? "");
  const [expiry, setExpiry] = useState(initial?.expires_at ? "keep" : "none");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Release preview object URLs when the form unmounts
  useEffect(() => {
    return () => {
      photosRef.current.forEach((p) => {
        if (p.preview.startsWith("blob:")) URL.revokeObjectURL(p.preview);
      });
    };
  }, []);

  // New posts: prefill contact fields from the user's saved defaults
  useEffect(() => {
    if (!session || initial) return;
    supabase
      .from("profiles")
      .select("contact_name, contact_whatsapp, contact_phone")
      .eq("id", session.user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) return;
        setVendorName((v) => v || data.contact_name || "");
        setWhatsapp((v) => v || data.contact_whatsapp || "");
        setPhone((v) => v || data.contact_phone || "");
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user.id]);

  if (!session) return null;

  // Each photo is scanned (Sightengine) and uploaded to Cloudinary immediately
  // on selection, so publishing doesn't have to wait for it.
  function addFiles(list: FileList | null) {
    if (!list || !session) return;
    setPhotoError(null);
    for (const file of Array.from(list)) {
      const key = crypto.randomUUID();
      const preview = URL.createObjectURL(file);
      setPhotos((prev) => [...prev, { key, preview, status: "scanning" }]);

      const body = new FormData();
      body.append("file", file);
      fetch("/api/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}` },
        body,
      })
        .then(async (res) => {
          if (!res.ok) {
            const json = await res.json().catch(() => null);
            throw new Error(json?.error ?? "Upload failed. Please try again.");
          }
          const { url } = await res.json();
          setPhotos((prev) =>
            prev.map((p) => (p.key === key ? { ...p, status: "verified" as const, url } : p))
          );
        })
        .catch((err: Error) => {
          URL.revokeObjectURL(preview);
          setPhotos((prev) => prev.filter((p) => p.key !== key));
          setPhotoError(`"${file.name}": ${err.message}`);
        });
    }
  }

  function removePhoto(key: string) {
    setPhotos((prev) => {
      const photo = prev.find((p) => p.key === key);
      if (photo?.preview.startsWith("blob:")) URL.revokeObjectURL(photo.preview);
      return prev.filter((p) => p.key !== key);
    });
  }

  const scanning = photos.some((p) => p.status === "scanning");

  const expiryItems = [
    ...(initial?.expires_at
      ? [
          {
            value: "keep",
            label: `Keep current (${new Date(initial.expires_at).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })})`,
          },
        ]
      : []),
    { value: "none", label: "No expiry" },
    ...EXPIRY_DAYS.map((d) => ({ value: String(d), label: `Auto-hide after ${d} days` })),
  ];

  function resolveExpiresAt(): string | null {
    if (expiry === "keep") return initial?.expires_at ?? null;
    if (expiry === "none") return null;
    const date = new Date();
    date.setDate(date.getDate() + Number(expiry));
    return date.toISOString();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!session) return;

    if (!roomType || !district || !place || !price || !vendorName.trim()) {
      setError("Please fill in the room type, district, area, rent, and your name.");
      return;
    }
    if (!whatsapp.trim() && !phone.trim()) {
      setError("Add at least one way to contact you — WhatsApp or phone.");
      return;
    }

    if (scanning) {
      setError("Please wait for your photos to finish being checked.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const row = {
        district,
        place,
        room_type: roomType,
        price: Number(price),
        description: description.trim() || null,
        amenities: amenities.trim() || null,
        images: photos.map((p) => p.url).filter((u): u is string => Boolean(u)),
        vendor_name: vendorName.trim(),
        vendor_whatsapp: whatsapp.trim() || null,
        vendor_phone: phone.trim() || null,
        expires_at: resolveExpiresAt(),
      };

      let roomId: string;
      if (initial && adminOverride) {
        const res = await fetch("/api/admin/rooms", {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ id: initial.id, ...row }),
        });
        if (!res.ok) throw new Error("Couldn't save the changes.");
        roomId = initial.id;
      } else if (initial) {
        const { data, error: updateError } = await supabase
          .from("rooms")
          .update(row)
          .eq("id", initial.id)
          .select("id")
          .single();
        if (updateError) throw new Error(updateError.message);
        roomId = data.id;
      } else {
        const { data, error: insertError } = await supabase
          .from("rooms")
          .insert({ ...row, user_id: session.user.id })
          .select("id")
          .single();
        if (insertError) throw new Error(insertError.message);
        roomId = data.id;

        // The latest post's contact info becomes the default for next time.
        // Upsert so a missing profile row is created rather than silently skipped.
        await supabase.from("profiles").upsert({
          id: session.user.id,
          contact_name: row.vendor_name,
          contact_whatsapp: row.vendor_whatsapp,
          contact_phone: row.vendor_phone,
        });
      }
      router.push(`/rooms/${roomId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setSubmitting(false);
    }
  }

  const districtItems = DISTRICTS.map((d) => ({ value: d, label: d }));
  const placeItems = (district ? DISTRICTS_AND_PLACES[district] ?? [] : []).map((p) => ({
    value: p,
    label: p,
  }));
  const typeItems = ROOM_TYPES.map((t) => ({ value: t.value as string, label: t.label }));

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-10">
      <section className="space-y-3">
        <h2 className="text-sm font-semibold">Photos</h2>
        <p className="text-xs text-muted-foreground">
          Optional, but listings with photos get far more interest. Each photo is
          checked automatically right after you add it.
        </p>
        {photoError && <p className="text-sm text-destructive">{photoError}</p>}
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {photos.map((photo, i) => (
            <PhotoThumb
              key={photo.key}
              src={photo.preview}
              status={photo.status}
              label={`Photo ${i + 1}`}
              onRemove={() => removePhoto(photo.key)}
            />
          ))}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex aspect-square flex-col items-center justify-center gap-1 rounded-2xl border border-dashed text-xs text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
          >
            <HugeiconsIcon icon={Add01Icon} className="size-4" />
            Add
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold">Room details</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Room type</Label>
            <Select items={typeItems} value={roomType} onValueChange={setRoomType}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {typeItems.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="price">Rent (Nu. / month)</Label>
            <Input
              id="price"
              type="number"
              inputMode="numeric"
              min={1}
              placeholder="e.g. 12000"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>District</Label>
            <Select
              items={districtItems}
              value={district}
              onValueChange={(value) => {
                setDistrict(value);
                setPlace(null);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select district" />
              </SelectTrigger>
              <SelectContent>
                {districtItems.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Area</Label>
            <Select items={placeItems} value={place} onValueChange={setPlace} disabled={!district}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select area" />
              </SelectTrigger>
              <SelectContent>
                {placeItems.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            rows={5}
            placeholder="Floor, sunlight, water supply, nearby landmarks…"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="amenities">Amenities</Label>
          <Input
            id="amenities"
            placeholder="e.g. Wi-Fi, Parking, 24/7 Water"
            value={amenities}
            onChange={(e) => setAmenities(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">Separate with commas.</p>
        </div>
        <div className="space-y-2">
          <Label>Listing expiry</Label>
          <Select items={expiryItems} value={expiry} onValueChange={(v) => setExpiry(v as string)}>
            <SelectTrigger className="w-full sm:w-64">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {expiryItems.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Optional — the listing disappears from browse results after this.
          </p>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold">Contact</h2>
        <div className="space-y-2">
          <Label htmlFor="vendor-name">Your name</Label>
          <Input
            id="vendor-name"
            placeholder="e.g. Tashi Dorji"
            value={vendorName}
            onChange={(e) => setVendorName(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="whatsapp">WhatsApp</Label>
            <Input
              id="whatsapp"
              inputMode="tel"
              placeholder="e.g. 17123456"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              inputMode="tel"
              placeholder="e.g. 17123456"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
        </div>
      </section>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" disabled={submitting || scanning} className="h-11 w-full rounded-full">
        {scanning
          ? "Checking photos…"
          : submitting
            ? initial
              ? "Saving…"
              : "Publishing…"
            : initial
              ? "Save changes"
              : "Publish listing"}
      </Button>
    </form>
  );
}
