import { supabase } from "./supabase";
import type { Room } from "./types";

export type RoomFilters = {
  district?: string;
  place?: string;
  roomType?: string;
  minPrice?: number;
  maxPrice?: number;
};

// Browse results exclude rented rooms and listings past their expiry date.
export async function fetchRooms(filters: RoomFilters = {}): Promise<Room[]> {
  let query = supabase
    .from("rooms")
    .select("*")
    .eq("status", "available")
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
    .order("created_at", { ascending: false });

  if (filters.district) query = query.eq("district", filters.district);
  if (filters.place) query = query.eq("place", filters.place);
  if (filters.roomType) query = query.eq("room_type", filters.roomType);
  if (filters.minPrice !== undefined) query = query.gte("price", filters.minPrice);
  if (filters.maxPrice !== undefined) query = query.lte("price", filters.maxPrice);

  const { data, error } = await query;
  if (error) throw error;
  return data as Room[];
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
