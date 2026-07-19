import { NextResponse } from "next/server";
import { serviceClient } from "@/lib/admin-server";
import { roomTypeLabel } from "@/lib/districts";
import type { Room } from "@/lib/types";

// Runs on a schedule (see vercel.json): for every saved search, find listings
// created since it was last notified and email the owner via Resend. The
// last_notified_at watermark guarantees each listing/search pair alerts once.

const SITE_URL = process.env.SITE_URL ?? "https://getyourroom.shop";

type SearchRow = {
  id: string;
  user_id: string;
  district: string | null;
  place: string | null;
  room_type: string | null;
  price_min: number | null;
  price_max: number | null;
  last_notified_at: string;
};

function alertHtml(rooms: Room[]): string {
  const items = rooms
    .map(
      (room) => `
        <li style="margin-bottom:12px">
          <a href="${SITE_URL}/rooms/${room.id}" style="color:#171717;font-weight:600">
            ${roomTypeLabel(room.room_type)} in ${room.place}, ${room.district}
          </a>
          — Nu. ${room.price.toLocaleString("en-IN")} / month
        </li>`
    )
    .join("");
  return `
    <div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#171717;max-width:520px">
      <h2 style="font-size:18px">New room${rooms.length > 1 ? "s" : ""} matching your saved search</h2>
      <ul style="padding-left:18px">${items}</ul>
      <p style="font-size:13px;color:#666">
        You're getting this because you saved a search on GetYourRoom.
        Manage your saved searches at <a href="${SITE_URL}/saved-searches" style="color:#171717">${SITE_URL}/saved-searches</a>.
      </p>
    </div>`;
}

export async function GET(request: Request) {
  if (request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: "RESEND_API_KEY is not configured" }, { status: 500 });
  }

  const service = serviceClient();
  const { data: searches, error } = await service.from("saved_searches").select("*");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let emailed = 0;
  const failures: string[] = [];

  for (const search of (searches ?? []) as SearchRow[]) {
    let query = service
      .from("rooms")
      .select("*")
      .eq("status", "available")
      .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
      .gt("created_at", search.last_notified_at)
      .order("created_at", { ascending: true });
    if (search.district) query = query.eq("district", search.district);
    if (search.place) query = query.eq("place", search.place);
    if (search.room_type) query = query.eq("room_type", search.room_type);
    if (search.price_min !== null) query = query.gte("price", search.price_min);
    if (search.price_max !== null) query = query.lte("price", search.price_max);

    const { data: matches } = await query;
    if (!matches?.length) continue;

    const { data: userData } = await service.auth.admin.getUserById(search.user_id);
    const email = userData?.user?.email;
    if (!email) continue;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "GetYourRoom Alerts <alerts@getyourroom.shop>",
        to: email,
        subject: `${matches.length} new room${matches.length > 1 ? "s" : ""} on GetYourRoom`,
        html: alertHtml(matches as Room[]),
      }),
    });

    if (!res.ok) {
      failures.push(`${search.id}: resend ${res.status}`);
      continue; // watermark untouched — retried next run
    }

    emailed++;
    await service
      .from("saved_searches")
      .update({ last_notified_at: matches[matches.length - 1].created_at })
      .eq("id", search.id);
  }

  return NextResponse.json({
    searches: searches?.length ?? 0,
    emailed,
    ...(failures.length ? { failures } : {}),
  });
}
