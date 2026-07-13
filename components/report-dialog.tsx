"use client";

import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Flag02Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabase";

const REASONS = [
  "Scam or fake listing",
  "No longer available",
  "Inappropriate content",
  "Other",
];

export function ReportDialog({ roomId }: { roomId: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<string | null>(null);
  const [details, setDetails] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reasonItems = REASONS.map((r) => ({ value: r, label: r }));

  async function handleSubmit() {
    if (!reason) {
      setError("Please choose a reason.");
      return;
    }
    setSending(true);
    setError(null);
    const text = details.trim() ? `${reason} — ${details.trim()}` : reason;
    const { error } = await supabase.from("reports").insert({ room_id: roomId, reason: text });
    setSending(false);
    if (error) setError("Couldn't send the report. Please try again.");
    else setSent(true);
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setReason(null);
      setDetails("");
      setSent(false);
      setError(null);
    }
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="rounded-full text-muted-foreground"
        onClick={() => setOpen(true)}
      >
        <HugeiconsIcon icon={Flag02Icon} />
        Report this listing
      </Button>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent>
        {sent ? (
          <>
            <DialogHeader>
              <DialogTitle>Thanks for the report</DialogTitle>
              <DialogDescription>
                We&apos;ll take a look at this listing shortly.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button className="rounded-full" onClick={() => handleOpenChange(false)}>
                Done
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Report this listing</DialogTitle>
              <DialogDescription>
                Tell us what&apos;s wrong — reports go straight to the site admin and aren&apos;t
                shown publicly.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Reason</Label>
                <Select items={reasonItems} value={reason} onValueChange={setReason}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choose a reason" />
                  </SelectTrigger>
                  <SelectContent>
                    {reasonItems.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="report-details">Details (optional)</Label>
                <Textarea
                  id="report-details"
                  rows={3}
                  placeholder="Anything that helps us review it"
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
            <DialogFooter>
              <Button variant="outline" className="rounded-full" onClick={() => handleOpenChange(false)}>
                Cancel
              </Button>
              <Button className="rounded-full" disabled={sending} onClick={handleSubmit}>
                {sending ? "Sending…" : "Send report"}
              </Button>
            </DialogFooter>
          </>
        )}
        </DialogContent>
      </Dialog>
    </>
  );
}
