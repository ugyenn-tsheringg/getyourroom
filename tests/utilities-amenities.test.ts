import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  SnowIcon,
  Wifi01Icon,
  HeaterIcon,
  WashingMachineIcon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";
import {
  featureIcon,
  parseFeatures,
  serializeFeatures,
  furnishingLabel,
  UTILITIES,
  AMENITIES,
} from "@/lib/features";
import { fetchRoom } from "@/lib/rooms";
import type { Room } from "@/lib/types";

// ── Unit: the icon/label helpers (no network) ────────────────────────────────
describe("feature helpers", () => {
  it("gives each predefined item its own distinct icon", () => {
    expect(featureIcon("Air Conditioner")).toBe(SnowIcon);
    expect(featureIcon("Free Wi-Fi")).toBe(Wifi01Icon);
    expect(featureIcon("Geyser / Water Heater")).toBe(HeaterIcon);
    expect(featureIcon("Free Washing Machine")).toBe(WashingMachineIcon);
    // no two predefined items share an icon
    const icons = [...UTILITIES, ...AMENITIES].map((f) => f.icon);
    expect(new Set(icons).size).toBe(icons.length);
  });

  it("falls back to a generic tick for custom items", () => {
    expect(featureIcon("Rooftop garden")).toBe(Tick02Icon);
    expect(featureIcon("anything not in the list")).toBe(Tick02Icon);
  });

  it("round-trips selections through the stored string", () => {
    const selected = ["Free Wi-Fi", "Air Conditioner", "Rooftop garden"];
    const stored = serializeFeatures(selected);
    expect(parseFeatures(stored)).toEqual(selected);
    expect(serializeFeatures([])).toBeNull();
    expect(parseFeatures(null)).toEqual([]);
  });

  it("maps furnishing values to labels", () => {
    expect(furnishingLabel("unfurnished")).toBe("Unfurnished");
    expect(furnishingLabel("semi_furnished")).toBe("Semi-furnished");
    expect(furnishingLabel("fully_furnished")).toBe("Fully Furnished");
    expect(furnishingLabel(null)).toBeNull();
  });
});

// ── Integration: persistence round-trip against live Supabase ────────────────
const BASE_ROOM = {
  district: "Thimphu",
  place: "Babesa",
  room_type: "studio",
  price: 5555,
  images: [],
  vendor_name: "Vitest Utilities Vendor",
  vendor_phone: "17000002",
};

let vendor: SupabaseClient;
let vendorId: string;

beforeAll(async () => {
  vendor = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { data, error } = await vendor.auth.signInWithPassword({
    email: process.env.TEST_VENDOR_EMAIL!,
    password: process.env.TEST_VENDOR_PASSWORD!,
  });
  if (error) throw new Error("test vendor sign-in failed");
  vendorId = data.user!.id;
});

afterAll(async () => {
  await vendor.from("rooms").delete().eq("vendor_name", BASE_ROOM.vendor_name);
});

async function createRoom(overrides: Record<string, unknown>): Promise<Room> {
  const { data, error } = await vendor
    .from("rooms")
    .insert({ ...BASE_ROOM, user_id: vendorId, ...overrides })
    .select("*")
    .single();
  if (error) throw error;
  return data as Room;
}

describe("utilities, amenities, furnishing & landmark", () => {
  it("persists a rental listing's predefined + custom selections and reads them back", async () => {
    const utilities = ["Geyser / Water Heater", "Free Wi-Fi", "Solar backup"]; // last = custom
    const amenities = ["Air Conditioner", "24 Hours Security", "Kids play area"]; // last = custom
    const room = await createRoom({
      utilities: serializeFeatures(utilities),
      amenities: serializeFeatures(amenities),
      furnishing: "fully_furnished",
      landmark: "Norzin Lam",
    });

    const fetched = await fetchRoom(room.id);
    expect(parseFeatures(fetched!.utilities)).toEqual(utilities);
    expect(parseFeatures(fetched!.amenities)).toEqual(amenities);
    expect(fetched!.furnishing).toBe("fully_furnished");
    expect(furnishingLabel(fetched!.furnishing)).toBe("Fully Furnished");
    expect(fetched!.landmark).toBe("Norzin Lam");

    // The detail page shows utilities + amenities together; predefined ones
    // resolve to their own icon, the custom ones to the tick.
    const combined = [...parseFeatures(fetched!.utilities), ...parseFeatures(fetched!.amenities)];
    expect(featureIcon("Geyser / Water Heater")).not.toBe(Tick02Icon);
    expect(featureIcon("Solar backup")).toBe(Tick02Icon);
    expect(featureIcon("Kids play area")).toBe(Tick02Icon);
    expect(combined).toContain("Solar backup");
  });

  it("persists the same fields on an exchange listing", async () => {
    const room = await createRoom({
      listing_type: "exchange",
      exchange_want_district: "Paro",
      utilities: serializeFeatures(["Free Wi-Fi"]),
      amenities: serializeFeatures(["Swimming Pool", "My gym"]),
      furnishing: "semi_furnished",
      landmark: "Near the hospital",
    });

    const fetched = await fetchRoom(room.id);
    expect(fetched!.listing_type).toBe("exchange");
    expect(parseFeatures(fetched!.utilities)).toEqual(["Free Wi-Fi"]);
    expect(parseFeatures(fetched!.amenities)).toEqual(["Swimming Pool", "My gym"]);
    expect(furnishingLabel(fetched!.furnishing)).toBe("Semi-furnished");
    expect(fetched!.landmark).toBe("Near the hospital");
  });

  it("leaves the optional fields null when nothing is chosen", async () => {
    const room = await createRoom({
      utilities: serializeFeatures([]),
      amenities: serializeFeatures([]),
      furnishing: null,
      landmark: null,
    });

    const fetched = await fetchRoom(room.id);
    expect(fetched!.utilities).toBeNull();
    expect(fetched!.amenities).toBeNull();
    expect(fetched!.furnishing).toBeNull();
    expect(fetched!.landmark).toBeNull();
    expect(parseFeatures(fetched!.utilities)).toEqual([]);
  });

  it("rejects an invalid furnishing value at the database level", async () => {
    const { error } = await vendor
      .from("rooms")
      .insert({ ...BASE_ROOM, user_id: vendorId, furnishing: "kind-of-furnished" })
      .select();
    expect(error).not.toBeNull();
  });
});
