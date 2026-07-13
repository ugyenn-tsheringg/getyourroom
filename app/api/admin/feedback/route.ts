import { NextResponse } from "next/server";
import { rejectNonAdmin, serviceClient } from "@/lib/admin-server";

export async function GET(request: Request) {
  const rejection = await rejectNonAdmin(request);
  if (rejection) return rejection;

  const { data, error } = await serviceClient()
    .from("feedback")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const count = data.length;
  const average = count
    ? Math.round((data.reduce((sum, f) => sum + f.rating, 0) / count) * 10) / 10
    : 0;

  return NextResponse.json({ summary: { count, average }, items: data });
}
