import { supabase } from "./supabase";
import type { Room } from "./types";

export type RoomFilters = {
  district?: string;
  place?: string;
  roomType?: string;
  minPrice?: number;
  maxPrice?: number;
};

export const PAGE_SIZE = 15;

// Browse results exclude rented rooms and listings past their expiry date.
function browseQuery(filters: RoomFilters) {
  let query = supabase
    .from("rooms")
    .select("*", { count: "exact" })
    .eq("status", "available")
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
    .order("created_at", { ascending: false });

  if (filters.district) query = query.eq("district", filters.district);
  if (filters.place) query = query.eq("place", filters.place);
  if (filters.roomType) query = query.eq("room_type", filters.roomType);
  if (filters.minPrice !== undefined) query = query.gte("price", filters.minPrice);
  if (filters.maxPrice !== undefined) query = query.lte("price", filters.maxPrice);

  return query;
}

export async function fetchRooms(filters: RoomFilters = {}): Promise<Room[]> {
  const { data, error } = await browseQuery(filters);
  if (error) throw error;
  return data as Room[];
}

// One page of browse results plus the total count of filtered matches.
export async function fetchRoomsPage(
  filters: RoomFilters = {},
  page = 1
): Promise<{ rooms: Room[]; total: number }> {
  const from = (page - 1) * PAGE_SIZE;
  const { data, count, error } = await browseQuery(filters).range(from, from + PAGE_SIZE - 1);
  if (error) {
    // Requesting past the last page makes PostgREST 416; treat it as empty
    if (error.code === "PGRST103") return { rooms: [], total: 0 };
    throw error;
  }
  return { rooms: data as Room[], total: count ?? 0 };
}

// A vendor's own listings, including rented and expired ones.
export async function fetchRoomsByOwner(userId: string): Promise<Room[]> {
  const { data, error } = await supabase
    .from("rooms")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as Room[];
}

export async function fetchRoom(id: string): Promise<Room | null> {
  const { data } = await supabase
    .from("rooms")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return (data as Room) ?? null;
}
