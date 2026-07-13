// Server-only helpers for admin API routes.
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Returns null when the caller is the admin, otherwise an error response.
export async function rejectNonAdmin(request: Request): Promise<NextResponse | null> {
  const token = request.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }
  if (data.user.email?.toLowerCase() !== process.env.ADMIN_EMAIL!.toLowerCase()) {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }
  return null;
}

// Bypasses RLS — use only after rejectNonAdmin has passed.
export function serviceClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
