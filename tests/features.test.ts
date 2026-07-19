import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { fetchRoom, fetchRooms, fetchRoomsByOwner } from "@/lib/rooms";
import { supabase } from "@/lib/supabase";
import { isRoomUnavailable, type Room } from "@/lib/types";

const BASE_ROOM = {
  district: "Trongsa",
  place: "Trongsa Town",
  room_type: "studio",
  price: 4444,
  images: [],
  vendor_name: "Vitest Features Vendor",
  vendor_phone: "17000001",
};

function makeClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

let vendor: SupabaseClient;
let other: SupabaseClient; // a second signed-in, non-admin account
let service: SupabaseClient; // secret-key client, as used by the admin API routes
let vendorId: string;

beforeAll(async () => {
  if (!process.env.SUPABASE_SECRET_KEY) {
    throw new Error("SUPABASE_SECRET_KEY missing from .env.local — needed for admin tests");
  }
  service = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  vendor = makeClient();
  other = makeClient();
  const [v, o] = await Promise.all([
    vendor.auth.signInWithPassword({
      email: process.env.TEST_VENDOR_EMAIL!,
      password: process.env.TEST_VENDOR_PASSWORD!,
    }),
    other.auth.signInWithPassword({
      email: process.env.TEST_ADMIN_EMAIL!,
      password: process.env.TEST_ADMIN_PASSWORD!,
    }),
  ]);
  if (v.error || o.error) throw new Error("test account sign-in failed");
  vendorId = v.data.user!.id;
});

afterAll(async () => {
  await vendor.from("rooms").delete().eq("vendor_name", BASE_ROOM.vendor_name);
});

async function createRoom(overrides: Record<string, unknown> = {}): Promise<Room> {
  const { data, error } = await vendor
    .from("rooms")
    .insert({ ...BASE_ROOM, user_id: vendorId, ...overrides })
    .select("*")
    .single();
  if (error) throw error;
  return data as Room;
}

describe("rented rooms", () => {
  it("are hidden from browse but visible to the owner and by direct link", async () => {
    const room = await createRoom({ status: "rented" });

    const browse = await fetchRooms({ district: BASE_ROOM.district });
    expect(browse.some((r) => r.id === room.id)).toBe(false);

    const mine = await fetchRoomsByOwner(vendorId);
    expect(mine.some((r) => r.id === room.id)).toBe(true);

    const direct = await fetchRoom(room.id);
    expect(direct).not.toBeNull();
    expect(isRoomUnavailable(direct!)).toBe(true);

    await vendor.from("rooms").delete().eq("id", room.id);
  });

  it("cannot have their status changed by another user (RLS)", async () => {
    const room = await createRoom();
    const { data } = await supabase
      .from("rooms")
      .update({ status: "rented" })
      .eq("id", room.id)
      .select();
    expect(data).toEqual([]); // anon update affects no rows
    expect((await fetchRoom(room.id))!.status).toBe("available");
    await vendor.from("rooms").delete().eq("id", room.id);
  });
});

describe("listing expiry", () => {
  it("hides expired listings from browse but keeps them for the owner", async () => {
    const past = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
    const room = await createRoom({ expires_at: past });

    const browse = await fetchRooms({ district: BASE_ROOM.district });
    expect(browse.some((r) => r.id === room.id)).toBe(false);

    const mine = await fetchRoomsByOwner(vendorId);
    expect(mine.some((r) => r.id === room.id)).toBe(true);
    expect(isRoomUnavailable(room)).toBe(true);

    await vendor.from("rooms").delete().eq("id", room.id);
  });

  it("keeps listings with a future or missing expiry visible", async () => {
    const future = new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString();
    const room = await createRoom({ expires_at: future });
    const browse = await fetchRooms({ district: BASE_ROOM.district });
    expect(browse.some((r) => r.id === room.id)).toBe(true);
    expect(isRoomUnavailable(room)).toBe(false);
    await vendor.from("rooms").delete().eq("id", room.id);
  });
});

describe("reports", () => {
  it("can be filed anonymously but read/resolved only via the secret key", async () => {
    const room = await createRoom();

    const { error: insertError } = await supabase
      .from("reports")
      .insert({ room_id: room.id, reason: "Scam or fake listing — vitest" });
    expect(insertError).toBeNull();

    // No signed-in account can read reports through the public API anymore
    const { data: anonRows } = await supabase.from("reports").select("*").eq("room_id", room.id);
    expect(anonRows).toEqual([]);
    const { data: vendorRows } = await vendor.from("reports").select("*").eq("room_id", room.id);
    expect(vendorRows).toEqual([]);
    const { data: otherRows } = await other.from("reports").select("*").eq("room_id", room.id);
    expect(otherRows).toEqual([]);

    // The service client (used by /api/admin after the ADMIN_EMAIL check) can
    const { data: rows } = await service.from("reports").select("*").eq("room_id", room.id);
    expect(rows!.length).toBe(1);
    expect(rows![0].status).toBe("open");

    const { data: resolved } = await service
      .from("reports")
      .update({ status: "resolved" })
      .eq("id", rows![0].id)
      .select()
      .single();
    expect(resolved!.status).toBe("resolved");

    await vendor.from("rooms").delete().eq("id", room.id);
  });

  it("blocks room deletion for other signed-in users but allows it via the secret key", async () => {
    const room = await createRoom();
    await supabase.from("reports").insert({ room_id: room.id, reason: "Inappropriate content" });

    // Another signed-in user (not the owner) can't delete it
    await other.from("rooms").delete().eq("id", room.id);
    expect(await fetchRoom(room.id)).not.toBeNull();

    // The service client can, and the room's reports cascade away
    const { error } = await service.from("rooms").delete().eq("id", room.id);
    expect(error).toBeNull();
    expect(await fetchRoom(room.id)).toBeNull();

    const { data: leftover } = await service.from("reports").select("*").eq("room_id", room.id);
    expect(leftover).toEqual([]);
  });
});

describe("room location", () => {
  it("stores and returns optional coordinates", async () => {
    const room = await createRoom({ latitude: 27.4712, longitude: 89.6339 });
    const fetched = await fetchRoom(room.id);
    expect(fetched!.latitude).toBeCloseTo(27.4712);
    expect(fetched!.longitude).toBeCloseTo(89.6339);

    const bare = await createRoom();
    expect((await fetchRoom(bare.id))!.latitude).toBeNull();

    await vendor.from("rooms").delete().in("id", [room.id, bare.id]);
  });
});

describe("profile contact defaults", () => {
  it("stores and returns the user's own contact defaults", async () => {
    const contact = {
      contact_name: "Vitest Vendor",
      contact_whatsapp: "17000002",
      contact_phone: "17000003",
    };
    const { error } = await vendor.from("profiles").update(contact).eq("id", vendorId);
    expect(error).toBeNull();

    const { data } = await vendor
      .from("profiles")
      .select("contact_name, contact_whatsapp, contact_phone")
      .eq("id", vendorId)
      .single();
    expect(data).toEqual(contact);
  });

  it("cannot be read or changed by another user", async () => {
    const { data: readOther } = await other.from("profiles").select("*").eq("id", vendorId);
    expect(readOther).toEqual([]);

    const { data: updated } = await other
      .from("profiles")
      .update({ contact_name: "someone else" })
      .eq("id", vendorId)
      .select();
    expect(updated).toEqual([]);

    const { data } = await vendor
      .from("profiles")
      .select("contact_name")
      .eq("id", vendorId)
      .single();
    expect(data!.contact_name).toBe("Vitest Vendor");
  });
});

describe("saved searches", () => {
  it("are private per user and deletable", async () => {
    const { data: created, error } = await vendor
      .from("saved_searches")
      .insert({ user_id: vendorId, district: "Trongsa", room_type: "studio", price_max: 9000 })
      .select()
      .single();
    expect(error).toBeNull();
    expect(created!.last_notified_at).toBeTruthy();

    const { data: mine } = await vendor.from("saved_searches").select("*").eq("id", created!.id);
    expect(mine!.length).toBe(1);

    // Invisible to other users and to anonymous clients
    const { data: theirs } = await other.from("saved_searches").select("*").eq("id", created!.id);
    expect(theirs).toEqual([]);
    const { data: anonRows } = await supabase.from("saved_searches").select("*");
    expect(anonRows).toEqual([]);

    // Anonymous users can't create one
    const { error: anonInsert } = await supabase
      .from("saved_searches")
      .insert({ user_id: vendorId, district: "Paro" });
    expect(anonInsert).not.toBeNull();

    const { error: delError } = await vendor.from("saved_searches").delete().eq("id", created!.id);
    expect(delError).toBeNull();
    const { data: after } = await vendor.from("saved_searches").select("*").eq("id", created!.id);
    expect(after).toEqual([]);
  });
});

describe("feedback", () => {
  const MARKER = "vitest feedback entry";

  afterAll(async () => {
    await service.from("feedback").delete().like("message", `%${MARKER}%`);
  });

  it("accepts anonymous submissions with and without optional fields", async () => {
    const { error: fullError } = await supabase.from("feedback").insert({
      rating: 5,
      name: "Vitest",
      email: "vitest@example.com",
      message: `Full ${MARKER}`,
      category: "feature",
    });
    expect(fullError).toBeNull();

    const { error: minimalError } = await supabase
      .from("feedback")
      .insert({ rating: 2, message: `Minimal ${MARKER}` });
    expect(minimalError).toBeNull();
  });

  it("rejects invalid ratings and categories", async () => {
    const { error: badRating } = await supabase
      .from("feedback")
      .insert({ rating: 0, message: `Bad rating ${MARKER}` });
    expect(badRating).not.toBeNull();

    const { error: badCategory } = await supabase
      .from("feedback")
      .insert({ rating: 3, message: `Bad category ${MARKER}`, category: "spam" });
    expect(badCategory).not.toBeNull();
  });

  it("is unreadable through the public API but readable via the secret key", async () => {
    const { data: anonRows } = await supabase.from("feedback").select("*");
    expect(anonRows).toEqual([]);
    const { data: userRows } = await vendor.from("feedback").select("*");
    expect(userRows).toEqual([]);

    const { data: rows } = await service
      .from("feedback")
      .select("rating, message")
      .like("message", `%${MARKER}%`);
    expect(rows!.length).toBe(2);
  });
});

describe("saved listings", () => {
  it("are private to each user and removable", async () => {
    // Use a room this test owns so reruns never collide with leftover saves
    const seed = await createRoom();
    await vendor.from("saved_listings").delete().eq("room_id", seed.id);

    const { error: saveError } = await vendor
      .from("saved_listings")
      .insert({ room_id: seed.id, user_id: vendorId });
    expect(saveError).toBeNull();

    const { data: mine } = await vendor
      .from("saved_listings")
      .select("room_id, rooms(*)")
      .eq("room_id", seed.id);
    expect(mine!.length).toBe(1);
    expect((mine![0].rooms as unknown as Room).id).toBe(seed.id);

    // Another user can't see this save
    const { data: theirs } = await other
      .from("saved_listings")
      .select("*")
      .eq("room_id", seed.id);
    expect(theirs).toEqual([]);

    // Signed-out users can't save at all
    const { error: anonError } = await supabase
      .from("saved_listings")
      .insert({ room_id: seed.id, user_id: vendorId });
    expect(anonError).not.toBeNull();

    const { error: unsaveError } = await vendor
      .from("saved_listings")
      .delete()
      .eq("room_id", seed.id);
    expect(unsaveError).toBeNull();
    const { data: after } = await vendor
      .from("saved_listings")
      .select("*")
      .eq("room_id", seed.id);
    expect(after).toEqual([]);
  });
});
