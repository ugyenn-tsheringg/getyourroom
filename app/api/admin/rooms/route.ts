import { NextResponse } from "next/server";
import { rejectNonAdmin, serviceClient } from "@/lib/admin-server";

const EDITABLE_FIELDS = [
  "district",
  "place",
  "room_type",
  "price",
  "description",
  "amenities",
  "utilities",
  "furnishing",
  "landmark",
  "images",
  "vendor_name",
  "vendor_whatsapp",
  "vendor_phone",
  "expires_at",
  "status",
  "latitude",
  "longitude",
  "listing_type",
  "exchange_want_district",
  "exchange_want_place",
  "exchange_want_room_types",
  "exchange_budget_min",
  "exchange_budget_max",
] as const;

// Admin edit of any listing.
export async function PATCH(request: Request) {
  const rejection = await rejectNonAdmin(request);
  if (rejection) return rejection;

  const { id, ...fields } = await request.json();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const row = Object.fromEntries(
    Object.entries(fields).filter(([key]) =>
      (EDITABLE_FIELDS as readonly string[]).includes(key)
    )
  );

  const { error } = await serviceClient().from("rooms").update(row).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// Deletes a listing (its reports cascade).
export async function DELETE(request: Request) {
  const rejection = await rejectNonAdmin(request);
  if (rejection) return rejection;

  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const { error } = await serviceClient().from("rooms").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
