export type RoomType = "studio" | "1bhk" | "2bhk";

export type Room = {
  id: string;
  district: string;
  place: string;
  room_type: RoomType;
  price: number;
  description: string | null;
  amenities: string | null;
  images: string[];
  vendor_name: string;
  vendor_whatsapp: string | null;
  vendor_phone: string | null;
  user_id: string;
  status: "available" | "rented";
  expires_at: string | null;
  view_count: number;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
};

export type Report = {
  id: string;
  room_id: string;
  reason: string;
  status: "open" | "resolved";
  created_at: string;
};

export function isRoomUnavailable(room: Room): boolean {
  return (
    room.status !== "available" ||
    (room.expires_at !== null && new Date(room.expires_at) < new Date())
  );
}
