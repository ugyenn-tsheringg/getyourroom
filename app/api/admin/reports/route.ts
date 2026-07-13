import { NextResponse } from "next/server";
import { rejectNonAdmin, serviceClient } from "@/lib/admin-server";

export async function GET(request: Request) {
  const rejection = await rejectNonAdmin(request);
  if (rejection) return rejection;

  const { data, error } = await serviceClient()
    .from("reports")
    .select("*, rooms(id, place, district, room_type, price)")
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ reports: data });
}

// Marks a report as resolved.
export async function PATCH(request: Request) {
  const rejection = await rejectNonAdmin(request);
  if (rejection) return rejection;

  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const { error } = await serviceClient()
    .from("reports")
    .update({ status: "resolved" })
    .eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
