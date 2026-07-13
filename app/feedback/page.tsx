"use client";

import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { StarIcon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { cn } from "@/lib/utils";

const CATEGORIES = [
  { value: "bug", label: "Bug" },
  { value: "feature", label: "Feature idea" },
  { value: "general", label: "General feedback" },
];

export default function FeedbackPage() {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [website, setWebsite] = useState(""); // honeypot — real users never see it
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) {
      setError("Please choose a star rating.");
      return;
    }
    if (!message.trim()) {
      setError("Please write a short message.");
      return;
    }

    // Bots that fill the hidden field get a fake success and nothing is saved
    if (website.trim()) {
      setSent(true);
      return;
    }

    setSending(true);
    setError(null);
    const { error } = await supabase.from("feedback").insert({
      rating,
      name: name.trim() || null,
      email: email.trim() || null,
      message: message.trim(),
      category,
    });
    setSending(false);
    if (error) setError("Couldn't send your feedback. Please try again.");
    else setSent(true);
  }

  if (sent) {
    return (
      <div className="mx-auto w-full max-w-md px-4 py-24 text-center sm:px-6">
        <h1 className="text-2xl font-semibold tracking-tight">Thank you!</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Your feedback helps make GetYourRoom better for everyone in Bhutan.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-md px-4 py-12 sm:px-6">
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Feedback</h1>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        How has your experience been? Ratings and suggestions go straight to the
        person building this site.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <div className="space-y-2">
          <Label>Your rating</Label>
          <div className="flex gap-1" onMouseLeave={() => setHovered(0)}>
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                aria-label={`${star} star${star > 1 ? "s" : ""}`}
                onClick={() => setRating(star)}
                onMouseEnter={() => setHovered(star)}
                className="p-0.5"
              >
                <HugeiconsIcon
                  icon={StarIcon}
                  strokeWidth={1.5}
                  className={cn(
                    "size-7 transition-colors",
                    (hovered || rating) >= star
                      ? "fill-foreground text-foreground"
                      : "text-muted-foreground/40"
                  )}
                />
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="fb-message">Any feedback or feature suggestions?</Label>
          <Textarea
            id="fb-message"
            rows={4}
            required
            placeholder="What's working well? What's missing?"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Category (optional)</Label>
          <Select items={CATEGORIES} value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-full sm:w-56">
              <SelectValue placeholder="Choose a category" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="fb-name">Name (optional)</Label>
            <Input id="fb-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fb-email">Email (optional)</Label>
            <Input
              id="fb-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>

        <div className="absolute -left-[9999px] top-auto" aria-hidden="true">
          <label htmlFor="fb-website">Website</label>
          <input
            id="fb-website"
            name="website"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button type="submit" disabled={sending} className="h-10 w-full rounded-full">
          {sending ? "Sending…" : "Send feedback"}
        </Button>
      </form>
    </div>
  );
}
