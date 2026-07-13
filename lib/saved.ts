import { supabase } from "./supabase";
import type { Room } from "./types";

export async function fetchSavedRoomIds(): Promise<Set<string>> {
  const { data, error } = await supabase.from("saved_listings").select("room_id");
  if (error) throw error;
  return new Set(data.map((row) => row.room_id));
}

export async function fetchSavedRooms(): Promise<Room[]> {
  const { data, error } = await supabase
    .from("saved_listings")
    .select("created_at, rooms(*)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data.map((row) => row.rooms as unknown as Room).filter(Boolean);
}

export async function saveRoom(roomId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from("saved_listings")
    .insert({ room_id: roomId, user_id: userId });
  if (error && error.code !== "23505") throw error; // ignore duplicate saves
}

export async function unsaveRoom(roomId: string): Promise<void> {
  const { error } = await supabase.from("saved_listings").delete().eq("room_id", roomId);
  if (error) throw error;
}
