import { roomTypeLabel } from "./districts";
import type { RoomFilters } from "./rooms";
import { supabase } from "./supabase";

export type SavedSearch = {
  id: string;
  district: string | null;
  place: string | null;
  room_type: string | null;
  price_min: number | null;
  price_max: number | null;
  created_at: string;
};

export async function saveSearch(filters: RoomFilters, userId: string): Promise<void> {
  const { error } = await supabase.from("saved_searches").insert({
    user_id: userId,
    district: filters.district ?? null,
    place: filters.place ?? null,
    room_type: filters.roomType ?? null,
    price_min: filters.minPrice ?? null,
    price_max: filters.maxPrice ?? null,
  });
  if (error) throw error;
}

export async function fetchSavedSearches(): Promise<SavedSearch[]> {
  const { data, error } = await supabase
    .from("saved_searches")
    .select("id, district, place, room_type, price_min, price_max, created_at")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as SavedSearch[];
}

export async function deleteSavedSearch(id: string): Promise<void> {
  const { error } = await supabase.from("saved_searches").delete().eq("id", id);
  if (error) throw error;
}

// Human-readable summary of a search's criteria, e.g. "Thimphu · 1 BHK · Nu. 5,000–15,000"
export function describeSearch(s: Omit<SavedSearch, "id" | "created_at">): string {
  const parts: string[] = [];
  if (s.district) parts.push(s.place ? `${s.place}, ${s.district}` : s.district);
  if (s.room_type) parts.push(roomTypeLabel(s.room_type));
  if (s.price_min !== null && s.price_max !== null)
    parts.push(`Nu. ${s.price_min.toLocaleString("en-IN")}–${s.price_max.toLocaleString("en-IN")}`);
  else if (s.price_min !== null) parts.push(`from Nu. ${s.price_min.toLocaleString("en-IN")}`);
  else if (s.price_max !== null) parts.push(`up to Nu. ${s.price_max.toLocaleString("en-IN")}`);
  return parts.length ? parts.join(" · ") : "All new listings";
}
