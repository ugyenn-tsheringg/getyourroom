"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { StarIcon } from "@hugeicons/core-free-icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { roomTypeLabel } from "@/lib/districts";
import { supabase } from "@/lib/supabase";
import { isRoomUnavailable, type Report, type Room } from "@/lib/types";
import { useSession } from "@/lib/use-session";

type ReportRow = Report & {
  rooms: { id: string; place: string; district: string; room_type: string; price: number } | null;
};

type FeedbackData = {
  summary: { count: number; average: number };
  items: {
    id: string;
    rating: number;
    name: string | null;
    email: string | null;
    message: string;
    category: string | null;
    created_at: string;
  }[];
};

const CATEGORY_LABELS: Record<string, string> = {
  bug: "Bug",
  feature: "Feature idea",
  general: "General feedback",
};

export default function AdminPage() {
  const router = useRouter();
  const session = useSession();
  const [reports, setReports] = useState<ReportRow[] | null>(null);
  const [listings, setListings] = useState<Room[] | null>(null);
  const [feedback, setFeedback] = useState<FeedbackData | null>(null);
  const [view, setView] = useState<"open" | "resolved">("open");
  const [deleting, setDeleting] = useState<ReportRow | null>(null);
  const [deletingRoom, setDeletingRoom] = useState<Room | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session === null) router.replace("/login?next=/admin");
  }, [session, router]);

  useEffect(() => {
    if (!session) return;
    fetch("/api/admin/reports", {
      headers: { Authorization: `Bearer ${session.access_token}` },
    }).then(async (res) => {
      if (res.status === 403) {
        router.replace("/");
        return;
      }
      if (!res.ok) {
        setError("Couldn't load reports.");
        return;
      }
      const json = await res.json();
      setReports(json.reports);

      const fbRes = await fetch("/api/admin/feedback", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (fbRes.ok) setFeedback(await fbRes.json());

      // Rooms are publicly readable; this includes rented/expired ones
      const { data: rooms } = await supabase
        .from("rooms")
        .select("*")
        .order("created_at", { ascending: false });
      setListings((rooms as Room[]) ?? []);
    });
  }, [session, router]);

  if (!session || reports === null) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="mt-6 h-24 rounded-3xl" />
      </div>
    );
  }

  async function dismiss(report: ReportRow) {
    const res = await fetch("/api/admin/reports", {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${session!.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id: report.id }),
    });
    if (!res.ok) setError("Couldn't dismiss the report.");
    else
      setReports((prev) =>
        prev!.map((r) => (r.id === report.id ? { ...r, status: "resolved" } : r))
      );
  }

  async function deleteRoom(roomId: string) {
    setBusy(true);
    const res = await fetch("/api/admin/rooms", {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${session!.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id: roomId }),
    });
    setBusy(false);
    if (!res.ok) {
      setError("Couldn't delete the listing.");
      return;
    }
    // Reports for the room are removed by the FK cascade
    setReports((prev) => prev && prev.filter((r) => r.rooms?.id !== roomId));
    setListings((prev) => prev && prev.filter((r) => r.id !== roomId));
  }

  async function confirmDeleteListing() {
    if (deleting?.rooms) await deleteRoom(deleting.rooms.id);
    setDeleting(null);
  }

  async function confirmDeleteRoom() {
    if (deletingRoom) await deleteRoom(deletingRoom.id);
    setDeletingRoom(null);
  }

  const visible = reports.filter((r) => r.status === view);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Reports</h1>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        Listings flagged by visitors. Dismiss a report or remove the listing.
      </p>

      <div className="mt-6 flex gap-1.5">
        {(["open", "resolved"] as const).map((v) => (
          <Button
            key={v}
            variant={view === v ? "secondary" : "ghost"}
            size="sm"
            className="rounded-full capitalize"
            onClick={() => setView(v)}
          >
            {v}
          </Button>
        ))}
      </div>

      {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

      <div className="mt-6 space-y-4">
        {visible.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            No {view} reports.
          </p>
        ) : (
          visible.map((report) => (
            <div key={report.id} className="rounded-3xl p-5 ring-1 ring-foreground/8">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm leading-6">{report.reason}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Reported{" "}
                    {new Date(report.created_at).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                    {report.rooms && (
                      <>
                        {" · "}
                        <Link href={`/rooms/${report.rooms.id}`} className="underline underline-offset-2 hover:text-foreground">
                          {roomTypeLabel(report.rooms.room_type)} in {report.rooms.place},{" "}
                          {report.rooms.district} — Nu. {report.rooms.price.toLocaleString("en-IN")}
                        </Link>
                      </>
                    )}
                  </p>
                </div>
                {report.status === "resolved" && <Badge variant="outline">Resolved</Badge>}
              </div>
              {report.status === "open" && (
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" className="rounded-full" onClick={() => dismiss(report)}>
                    Dismiss
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-full text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => setDeleting(report)}
                  >
                    Delete listing
                  </Button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <section className="mt-14">
        <h2 className="text-xl font-semibold tracking-tight">Listings</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Every listing on the site, including rented and expired ones. You can edit or
          remove any of them.
        </p>
        <div className="mt-6 space-y-3">
          {listings === null ? (
            <Skeleton className="h-20 rounded-3xl" />
          ) : (
            listings.map((room) => (
              <div
                key={room.id}
                className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-3xl px-5 py-4 ring-1 ring-foreground/8"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Link href={`/rooms/${room.id}`} className="truncate font-medium hover:underline">
                      {roomTypeLabel(room.room_type)} in {room.place}
                    </Link>
                    {room.status === "rented" ? (
                      <Badge variant="outline">Rented</Badge>
                    ) : isRoomUnavailable(room) ? (
                      <Badge variant="outline" className="text-muted-foreground">Expired</Badge>
                    ) : null}
                  </div>
                  <p className="mt-0.5 truncate text-sm text-muted-foreground">
                    {room.district} · Nu. {room.price.toLocaleString("en-IN")} / month · by{" "}
                    {room.vendor_name}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/rooms/${room.id}/edit`}
                    className="text-sm text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                  >
                    Edit
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-full text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => setDeletingRoom(room)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="mt-14">
        <h2 className="text-xl font-semibold tracking-tight">Feedback</h2>
        {feedback === null ? (
          <Skeleton className="mt-4 h-16 rounded-3xl" />
        ) : (
          <>
            <p className="mt-2 text-sm text-muted-foreground">
              {feedback.summary.count === 0 ? (
                "No ratings yet."
              ) : (
                <>
                  <span className="font-semibold text-foreground">
                    {feedback.summary.average}
                  </span>{" "}
                  average from {feedback.summary.count}{" "}
                  {feedback.summary.count === 1 ? "rating" : "ratings"}
                </>
              )}
            </p>
            <div className="mt-6 space-y-4">
              {feedback.items.map((item) => (
                <div key={item.id} className="rounded-3xl p-5 ring-1 ring-foreground/8">
                  <div className="flex items-center gap-2">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <HugeiconsIcon
                          key={star}
                          icon={StarIcon}
                          strokeWidth={1.5}
                          className={
                            "size-4 " +
                            (item.rating >= star
                              ? "fill-foreground text-foreground"
                              : "text-muted-foreground/40")
                          }
                        />
                      ))}
                    </div>
                    {item.category && (
                      <Badge variant="secondary" className="rounded-full">
                        {CATEGORY_LABELS[item.category] ?? item.category}
                      </Badge>
                    )}
                  </div>
                  <p className="mt-3 text-sm leading-6">{item.message}</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {[item.name, item.email].filter(Boolean).join(" · ") || "Anonymous"}
                    {" · "}
                    {new Date(item.created_at).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      <Dialog open={deletingRoom !== null} onOpenChange={(open) => !open && setDeletingRoom(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this listing?</DialogTitle>
            <DialogDescription>
              {deletingRoom &&
                `${roomTypeLabel(deletingRoom.room_type)} in ${deletingRoom.place} by ${deletingRoom.vendor_name} will be removed permanently, along with any reports on it.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" className="rounded-full" onClick={() => setDeletingRoom(null)}>
              Cancel
            </Button>
            <Button
              className="rounded-full bg-destructive text-white hover:bg-destructive/90"
              disabled={busy}
              onClick={confirmDeleteRoom}
            >
              {busy ? "Deleting…" : "Delete listing"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleting !== null} onOpenChange={(open) => !open && setDeleting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete the reported listing?</DialogTitle>
            <DialogDescription>
              {deleting?.rooms &&
                `${roomTypeLabel(deleting.rooms.room_type)} in ${deleting.rooms.place} will be removed permanently, along with its reports.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" className="rounded-full" onClick={() => setDeleting(null)}>
              Cancel
            </Button>
            <Button
              className="rounded-full bg-destructive text-white hover:bg-destructive/90"
              disabled={busy}
              onClick={confirmDeleteListing}
            >
              {busy ? "Deleting…" : "Delete listing"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
