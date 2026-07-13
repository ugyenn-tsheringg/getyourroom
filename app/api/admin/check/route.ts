import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Tells the UI whether the signed-in user is the admin. Always 200 —
// data access is enforced separately by the other /api/admin routes.
export async function GET(request: Request) {
  const token = request.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ isAdmin: false });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { data } = await supabase.auth.getUser(token);
  const isAdmin =
    data.user?.email?.toLowerCase() === process.env.ADMIN_EMAIL!.toLowerCase();
  return NextResponse.json({ isAdmin });
}
