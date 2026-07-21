"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon } from "@hugeicons/core-free-icons";
import { Combobox } from "@/components/combobox";
import { LocationPicker, type LatLng } from "@/components/location-picker";
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
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { DISTRICTS, DISTRICTS_AND_PLACES, ROOM_TYPES } from "@/lib/districts";
import { supabase } from "@/lib/supabase";
import { useSession } from "@/lib/use-session";
import type { ListingType, Room } from "@/lib/types";
import { cn } from "@/lib/utils";

const EXPIRY_DAYS = [30, 60, 90];

const PHOTO_SLOTS = [
  { key: "bedroom", label: "Bedroom", required: true },
  { key: "kitchen", label: "Kitchen", required: true },
  { key: "bathroom", label: "Bathroom", required: true },
  { key: "hall", label: "Hall", required: false },
  { key: "extra", label: "One more photo", required: false },
] as const;

type SlotKey = (typeof PHOTO_SLOTS)[number]["key"];
type SlotState = { status: "empty" | PhotoStatus; preview?: string; url?: string };

// Fields checked on submit, in top-to-bottom visual order (used to scroll to
// the first invalid one).
const FIELD_ORDER = [
  "bedroom",
  "kitchen",
  "bathroom",
  "roomType",
  "price",
  "district",
  "place",
  "wantDistrict",
  "vendorName",
  "contact",
] as const;

// adminOverride: the admin editing someone else's listing — the update goes
// through the admin API route since RLS only allows owners to update directly.
export function RoomForm({ initial, adminOverride = false }: { initial?: Room; adminOverride?: boolean }) {
  const router = useRouter();
  const session = useSession();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Five fixed, labeled photo slots. Existing images (edit mode) map to the
  // slots by position.
  const [slots, setSlots] = useState<Record<SlotKey, SlotState>>(() => {
    const init = {} as Record<SlotKey, SlotState>;
    PHOTO_SLOTS.forEach((slot, i) => {
      const url = initial?.images?.[i];
      init[slot.key] = url ? { status: "existing", preview: url, url } : { status: "empty" };
    });
    return init;
  });
  const slotsRef = useRef(slots);
  slotsRef.current = slots;
  const pendingSlot = useRef<SlotKey | null>(null);

  // Per-field validation messages, shown after a submit attempt.
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fieldRefs = useRef<Record<string, HTMLElement | null>>({});
  const registerField = (key: string) => (el: HTMLElement | null) => {
    fieldRefs.current[key] = el;
  };
  const clearError = (key: string) =>
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
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
  const [listingType, setListingType] = useState<ListingType>(initial?.listing_type ?? "rental");
  const [wantDistrict, setWantDistrict] = useState<string | null>(initial?.exchange_want_district ?? null);
  const [wantPlace, setWantPlace] = useState<string | null>(initial?.exchange_want_place ?? null);
  const [wantRoomTypes, setWantRoomTypes] = useState<string[]>(initial?.exchange_want_room_types ?? []);
  const [budgetMin, setBudgetMin] = useState(
    initial?.exchange_budget_min != null ? String(initial.exchange_budget_min) : ""
  );
  const [budgetMax, setBudgetMax] = useState(
    initial?.exchange_budget_max != null ? String(initial.exchange_budget_max) : ""
  );
  const [location, setLocation] = useState<LatLng | null>(
    initial?.latitude != null && initial?.longitude != null
      ? { lat: initial.latitude, lng: initial.longitude }
      : null
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Release preview object URLs when the form unmounts
  useEffect(() => {
    return () => {
      Object.values(slotsRef.current).forEach((s) => {
        if (s.preview?.startsWith("blob:")) URL.revokeObjectURL(s.preview);
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
  // on selection, so publishing doesn't have to wait for it. One photo per slot.
  function uploadToSlot(key: SlotKey, file: File) {
    if (!session) return;
    clearError(key);
    const preview = URL.createObjectURL(file);
    setSlots((prev) => ({ ...prev, [key]: { status: "scanning", preview } }));

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
        setSlots((prev) => ({ ...prev, [key]: { status: "verified", preview, url } }));
      })
      .catch((err: Error) => {
        URL.revokeObjectURL(preview);
        setSlots((prev) => ({ ...prev, [key]: { status: "empty" } }));
        setErrors((prev) => ({ ...prev, [key]: err.message }));
      });
  }

  function removeSlot(key: SlotKey) {
    setSlots((prev) => {
      const s = prev[key];
      if (s.preview?.startsWith("blob:")) URL.revokeObjectURL(s.preview);
      return { ...prev, [key]: { status: "empty" } };
    });
  }

  const scanning = PHOTO_SLOTS.some((s) => slots[s.key].status === "scanning");

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
    if (!session || scanning) return;

    const found: Record<string, string> = {};
    if (!slots.bedroom.url) found.bedroom = "A bedroom photo is required.";
    if (!slots.kitchen.url) found.kitchen = "A kitchen photo is required.";
    if (!slots.bathroom.url) found.bathroom = "A bathroom photo is required.";
    if (!roomType) found.roomType = "Choose a room type.";
    if (!price) found.price = "Enter the monthly rent.";
    if (!district) found.district = "Choose a district.";
    if (!place) found.place = "Choose an area.";
    if (listingType === "exchange" && !wantDistrict)
      found.wantDistrict = "Choose the district you want to move to.";
    if (!vendorName.trim()) found.vendorName = "Enter your name.";
    if (!whatsapp.trim() && !phone.trim())
      found.contact = "Add at least one way to reach you — WhatsApp or phone.";

    if (Object.keys(found).length > 0) {
      setErrors(found);
      const firstKey = FIELD_ORDER.find((k) => found[k]);
      const el = firstKey ? fieldRefs.current[firstKey] : null;
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        window.setTimeout(() => {
          el.querySelector<HTMLElement>("input, button, textarea")?.focus({ preventScroll: true });
        }, 300);
      }
      return;
    }

    setSubmitting(true);
    setErrors({});
    setError(null);

    try {
      const row = {
        district,
        place,
        room_type: roomType,
        price: Number(price),
        description: description.trim() || null,
        amenities: amenities.trim() || null,
        images: PHOTO_SLOTS.map((s) => slots[s.key].url).filter((u): u is string => Boolean(u)),
        vendor_name: vendorName.trim(),
        vendor_whatsapp: whatsapp.trim() || null,
        vendor_phone: phone.trim() || null,
        expires_at: resolveExpiresAt(),
        latitude: location?.lat ?? null,
        longitude: location?.lng ?? null,
        listing_type: listingType,
        exchange_want_district: listingType === "exchange" ? wantDistrict : null,
        exchange_want_place: listingType === "exchange" ? wantPlace : null,
        exchange_want_room_types: listingType === "exchange" ? wantRoomTypes : [],
        exchange_budget_min:
          listingType === "exchange" && budgetMin ? Number(budgetMin) : null,
        exchange_budget_max:
          listingType === "exchange" && budgetMax ? Number(budgetMax) : null,
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

  const isExchange = listingType === "exchange";
  const wantPlaceItems = (wantDistrict ? DISTRICTS_AND_PLACES[wantDistrict] ?? [] : []).map(
    (p) => ({ value: p, label: p })
  );

  const photosField = (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {PHOTO_SLOTS.map((slot) => {
          const s = slots[slot.key];
          const err = errors[slot.key];
          return (
            <div key={slot.key} ref={registerField(slot.key)} className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium">
                  {slot.label}
                  {slot.required && <span className="text-destructive"> *</span>}
                </span>
                {!slot.required && (
                  <span className="text-[11px] text-muted-foreground">Optional</span>
                )}
              </div>
              {s.status !== "empty" ? (
                <PhotoThumb
                  src={s.preview ?? ""}
                  status={s.status}
                  label={slot.label}
                  onRemove={() => removeSlot(slot.key)}
                />
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    pendingSlot.current = slot.key;
                    fileInputRef.current?.click();
                  }}
                  className={cn(
                    "flex aspect-square w-full flex-col items-center justify-center gap-1 rounded-2xl border border-dashed text-xs text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground",
                    err && "border-destructive text-destructive hover:border-destructive"
                  )}
                >
                  <HugeiconsIcon icon={Add01Icon} className="size-4" />
                  Add
                </button>
              )}
              {err && <p className="text-xs text-destructive">{err}</p>}
            </div>
          );
        })}
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          const key = pendingSlot.current;
          if (file && key) uploadToSlot(key, file);
          e.target.value = "";
          pendingSlot.current = null;
        }}
      />
    </>
  );

  const roomDetailsFields = (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div ref={registerField("roomType")} className="space-y-2">
          <Label>Room type</Label>
          <Select
            items={typeItems}
            value={roomType}
            onValueChange={(v) => {
              setRoomType(v);
              clearError("roomType");
            }}
          >
            <SelectTrigger className={cn("w-full", errors.roomType && "border-destructive")}>
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
          {errors.roomType && <p className="text-xs text-destructive">{errors.roomType}</p>}
        </div>
        <div ref={registerField("price")} className="space-y-2">
          <Label htmlFor="price">
            {isExchange ? "Current rent (Nu. / month)" : "Rent (Nu. / month)"}
          </Label>
          <Input
            id="price"
            type="number"
            inputMode="numeric"
            min={1}
            placeholder="e.g. 12000"
            value={price}
            aria-invalid={!!errors.price}
            onChange={(e) => {
              setPrice(e.target.value);
              clearError("price");
            }}
          />
          {errors.price ? (
            <p className="text-xs text-destructive">{errors.price}</p>
          ) : (
            isExchange && (
              <p className="text-xs text-muted-foreground">
                What you pay now — helps the other person judge a fair trade.
              </p>
            )
          )}
        </div>
        <div ref={registerField("district")} className="space-y-2">
          <Label>District</Label>
          <Combobox
            className={cn("w-full", errors.district && "border-destructive")}
            placeholder="Select district"
            searchPlaceholder="Search districts…"
            items={districtItems}
            value={district ?? ""}
            onChange={(value) => {
              setDistrict(value || null);
              setPlace(null);
              clearError("district");
            }}
          />
          {errors.district && <p className="text-xs text-destructive">{errors.district}</p>}
        </div>
        <div ref={registerField("place")} className="space-y-2">
          <Label>Area</Label>
          <Combobox
            className={cn("w-full", errors.place && "border-destructive")}
            placeholder="Select area"
            searchPlaceholder="Search areas…"
            items={placeItems}
            value={place ?? ""}
            onChange={(value) => {
              setPlace(value || null);
              clearError("place");
            }}
            disabled={!district}
          />
          {errors.place && <p className="text-xs text-destructive">{errors.place}</p>}
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
    </>
  );

  const contactFields = (
    <>
      <div ref={registerField("vendorName")} className="space-y-2">
        <Label htmlFor="vendor-name">Your name</Label>
        <Input
          id="vendor-name"
          placeholder="e.g. Tashi Dorji"
          value={vendorName}
          aria-invalid={!!errors.vendorName}
          onChange={(e) => {
            setVendorName(e.target.value);
            clearError("vendorName");
          }}
        />
        {errors.vendorName && <p className="text-xs text-destructive">{errors.vendorName}</p>}
      </div>
      <div ref={registerField("contact")} className="space-y-2">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="whatsapp">WhatsApp</Label>
            <Input
              id="whatsapp"
              inputMode="tel"
              placeholder="e.g. 17123456"
              value={whatsapp}
              aria-invalid={!!errors.contact}
              onChange={(e) => {
                setWhatsapp(e.target.value);
                clearError("contact");
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              inputMode="tel"
              placeholder="e.g. 17123456"
              value={phone}
              aria-invalid={!!errors.contact}
              onChange={(e) => {
                setPhone(e.target.value);
                clearError("contact");
              }}
            />
          </div>
        </div>
        {errors.contact && <p className="text-xs text-destructive">{errors.contact}</p>}
      </div>
    </>
  );

  const lookingForFields = (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div ref={registerField("wantDistrict")} className="space-y-2">
          <Label>District</Label>
          <Combobox
            className={cn("w-full", errors.wantDistrict && "border-destructive")}
            placeholder="Select district"
            searchPlaceholder="Search districts…"
            items={districtItems}
            value={wantDistrict ?? ""}
            onChange={(value) => {
              setWantDistrict(value || null);
              setWantPlace(null);
              clearError("wantDistrict");
            }}
          />
          {errors.wantDistrict ? (
            <p className="text-xs text-destructive">{errors.wantDistrict}</p>
          ) : (
            <p className="text-xs text-muted-foreground">Required — where you want to move.</p>
          )}
        </div>
        <div className="space-y-2">
          <Label>Area</Label>
          <Combobox
            className="w-full"
            placeholder="Any area"
            searchPlaceholder="Search areas…"
            items={wantPlaceItems}
            value={wantPlace ?? ""}
            onChange={(value) => setWantPlace(value || null)}
            disabled={!wantDistrict}
          />
          <p className="text-xs text-muted-foreground">Optional.</p>
        </div>
      </div>
      <div className="space-y-2">
        <Label>Room type</Label>
        <ToggleGroup
          multiple
          value={wantRoomTypes}
          onValueChange={(value) => setWantRoomTypes(value)}
          variant="outline"
          className="flex-wrap"
        >
          {typeItems.map((item) => (
            <ToggleGroupItem
              key={item.value}
              value={item.value}
              className="h-9 rounded-full px-4 text-sm aria-pressed:bg-primary aria-pressed:text-primary-foreground aria-pressed:hover:bg-primary"
            >
              {item.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <p className="text-xs text-muted-foreground">
          Optional — pick any that work, or leave blank for any type.
        </p>
      </div>
      <div className="space-y-2">
        <Label>Budget for the new room (Nu. / month)</Label>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            inputMode="numeric"
            min={0}
            placeholder="Min"
            value={budgetMin}
            onChange={(e) => setBudgetMin(e.target.value)}
            className="w-full sm:w-32"
          />
          <span className="text-muted-foreground">–</span>
          <Input
            type="number"
            inputMode="numeric"
            min={0}
            placeholder="Max"
            value={budgetMax}
            onChange={(e) => setBudgetMax(e.target.value)}
            className="w-full sm:w-32"
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Optional — what you&apos;re willing to pay if the new room costs more.
        </p>
      </div>
    </>
  );

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-10">
      <section className="space-y-3">
        <h2 className="text-sm font-semibold">What are you posting?</h2>
        <ToggleGroup
          value={[listingType]}
          onValueChange={(value) => {
            const next = value[value.length - 1] as ListingType | undefined;
            if (next) setListingType(next);
          }}
          variant="outline"
          spacing={0}
          className="w-full"
        >
          <ToggleGroupItem
            value="rental"
            className="h-11 flex-1 text-sm aria-pressed:bg-primary aria-pressed:text-primary-foreground aria-pressed:hover:bg-primary"
          >
            Renting out a room
          </ToggleGroupItem>
          <ToggleGroupItem
            value="exchange"
            className="h-11 flex-1 text-sm aria-pressed:bg-primary aria-pressed:text-primary-foreground aria-pressed:hover:bg-primary"
          >
            Looking to exchange
          </ToggleGroupItem>
        </ToggleGroup>
        <p className="text-xs text-muted-foreground">
          {isExchange
            ? "Describe the room you have now and the kind of room you'd want in return."
            : "Post a room you want to rent out to someone."}
        </p>
      </section>

      {isExchange ? (
        <>
          <section className="space-y-6">
            <div className="space-y-1">
              <h2 className="text-base font-semibold">What you have now</h2>
              <p className="text-xs text-muted-foreground">
                The room you&apos;re offering, and where it is.
              </p>
            </div>
            <div className="space-y-3">
              <h3 className="text-sm font-medium">Photos</h3>
              <p className="text-xs text-muted-foreground">
                Add up to 5 photos. Bedroom, kitchen, and bathroom are required. Each
                photo is checked automatically right after you add it.
              </p>
              {photosField}
            </div>
            <div className="space-y-4">{roomDetailsFields}</div>
            <div className="space-y-3">
              <h3 className="text-sm font-medium">Where your current room is</h3>
              <p className="text-xs text-muted-foreground">
                Optional — pin it so people can see the location on a map.
              </p>
              <LocationPicker value={location} onChange={setLocation} />
            </div>
          </section>

          <section className="space-y-4">
            <div className="space-y-1">
              <h2 className="text-base font-semibold">What you&apos;re looking for</h2>
              <p className="text-xs text-muted-foreground">
                The kind of room you&apos;d want in return.
              </p>
            </div>
            {lookingForFields}
          </section>
        </>
      ) : (
        <>
          <section className="space-y-3">
            <h2 className="text-sm font-semibold">Photos</h2>
            <p className="text-xs text-muted-foreground">
              Add up to 5 photos. Bedroom, kitchen, and bathroom are required. Each
              photo is checked automatically right after you add it.
            </p>
            {photosField}
          </section>

          <section className="space-y-4">
            <h2 className="text-sm font-semibold">Room details</h2>
            {roomDetailsFields}
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-semibold">Location</h2>
            <p className="text-xs text-muted-foreground">
              Optional — pin where the room is so renters can see it on a map.
            </p>
            <LocationPicker value={location} onChange={setLocation} />
          </section>
        </>
      )}

      <section className="space-y-4">
        <h2 className="text-sm font-semibold">Contact</h2>
        {contactFields}
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
