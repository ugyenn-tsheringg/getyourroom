import { randomUUID } from "crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { fetchRoom, fetchRooms, fetchRoomsPage, PAGE_SIZE } from "@/lib/rooms";
import { supabase } from "@/lib/supabase";

const TEST_ROOM = {
  district: "Thimphu",
  place: "Changzamtog",
  room_type: "studio",
  price: 5555,
  description: "Test listing created by vitest",
  amenities: "Wi-Fi",
  images: [],
  vendor_name: "Vitest Vendor",
  vendor_whatsapp: null,
  vendor_phone: "17000000",
};

describe("posting a room", () => {
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
    if (error) throw new Error(`Test vendor sign-in failed: ${error.message}`);
    vendorId = data.user.id;
  });

  afterAll(async () => {
    await vendor.from("rooms").delete().eq("vendor_name", TEST_ROOM.vendor_name);
  });

  it("rejects an insert without auth (RLS)", async () => {
    const { data, error } = await supabase
      .from("rooms")
      .insert({ ...TEST_ROOM, user_id: randomUUID() })
      .select();
    expect(error).not.toBeNull();
    expect(data).toBeNull();
  });

  it("accepts an insert from a signed-in vendor and shows it publicly", async () => {
    const { data, error } = await vendor
      .from("rooms")
      .insert({ ...TEST_ROOM, user_id: vendorId })
      .select("id")
      .single();
    expect(error).toBeNull();
    expect(data!.id).toBeTruthy();

    // The new listing is publicly visible without auth
    const room = await fetchRoom(data!.id);
    expect(room).not.toBeNull();
    expect(room!.vendor_name).toBe(TEST_ROOM.vendor_name);
    expect(room!.price).toBe(TEST_ROOM.price);

    // The owner can delete their own listing
    const { error: deleteError } = await vendor.from("rooms").delete().eq("id", data!.id);
    expect(deleteError).toBeNull();
    expect(await fetchRoom(data!.id)).toBeNull();
  });

  it("blocks deleting someone else's listing", async () => {
    const rooms = await fetchRooms();
    const someoneElses = rooms.find((r) => r.vendor_name !== TEST_ROOM.vendor_name);
    expect(someoneElses).toBeDefined();

    // Anon delete silently affects 0 rows under RLS — the row must survive
    await supabase.from("rooms").delete().eq("id", someoneElses!.id);
    expect(await fetchRoom(someoneElses!.id)).not.toBeNull();
  });
});

describe("filtering rooms", () => {
  it("filters by district", async () => {
    const rooms = await fetchRooms({ district: "Thimphu" });
    expect(rooms.length).toBeGreaterThan(0);
    expect(rooms.every((r) => r.district === "Thimphu")).toBe(true);
  });

  it("filters by place", async () => {
    const rooms = await fetchRooms({ district: "Thimphu", place: "Motithang" });
    expect(rooms.length).toBeGreaterThan(0);
    expect(rooms.every((r) => r.place === "Motithang")).toBe(true);
  });

  it("filters by room type", async () => {
    const rooms = await fetchRooms({ roomType: "1bhk" });
    expect(rooms.length).toBeGreaterThan(0);
    expect(rooms.every((r) => r.room_type === "1bhk")).toBe(true);
  });

  it("filters by price range", async () => {
    const rooms = await fetchRooms({ minPrice: 10000, maxPrice: 15000 });
    expect(rooms.length).toBeGreaterThan(0);
    expect(rooms.every((r) => r.price >= 10000 && r.price <= 15000)).toBe(true);
  });

  it("combines filters", async () => {
    const rooms = await fetchRooms({ district: "Thimphu", roomType: "studio" });
    expect(rooms.every((r) => r.district === "Thimphu" && r.room_type === "studio")).toBe(true);
  });
});

describe("pagination", () => {
  it("splits unfiltered results into full pages with a correct total", async () => {
    const all = await fetchRooms();
    expect(all.length).toBeGreaterThan(20); // needs the mock listings seeded

    const page1 = await fetchRoomsPage({}, 1);
    expect(page1.total).toBe(all.length);
    expect(page1.rooms.length).toBe(Math.min(PAGE_SIZE, all.length));

    const page2 = await fetchRoomsPage({}, 2);
    expect(page2.total).toBe(all.length);

    // No overlap, and ordering matches the unpaginated list
    const ids1 = page1.rooms.map((r) => r.id);
    const ids2 = page2.rooms.map((r) => r.id);
    expect(ids1.some((id) => ids2.includes(id))).toBe(false);
    expect([...ids1, ...ids2]).toEqual(all.slice(0, ids1.length + ids2.length).map((r) => r.id));
  });

  it("bases page count on filtered results, not the total", async () => {
    const filtered = await fetchRooms({ district: "Thimphu" });
    const page1 = await fetchRoomsPage({ district: "Thimphu" }, 1);
    expect(page1.total).toBe(filtered.length);
    expect(page1.rooms.every((r) => r.district === "Thimphu")).toBe(true);
  });

  it("returns an empty page past the end", async () => {
    const { rooms } = await fetchRoomsPage({ district: "Thimphu" }, 99);
    expect(rooms).toEqual([]);
  });
});

describe("viewing a room", () => {
  it("returns full details for an existing room", async () => {
    const [first] = await fetchRooms();
    expect(first).toBeDefined();

    const room = await fetchRoom(first.id);
    expect(room).not.toBeNull();
    expect(room!.district).toBeTruthy();
    expect(room!.place).toBeTruthy();
    expect(room!.price).toBeGreaterThan(0);
    expect(room!.vendor_name).toBeTruthy();
    expect(Array.isArray(room!.images)).toBe(true);
  });

  it("returns null for an unknown id", async () => {
    expect(await fetchRoom(randomUUID())).toBeNull();
  });

  it("increments the view count via the RPC, even anonymously", async () => {
    const [first] = await fetchRooms();
    const before = (await fetchRoom(first.id))!.view_count;

    const { error } = await supabase.rpc("increment_room_view", { room: first.id });
    expect(error).toBeNull();

    const after = (await fetchRoom(first.id))!.view_count;
    expect(after).toBe(before + 1);
  });
});
