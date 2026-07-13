"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { useSession } from "@/lib/use-session";

// Must match "Email OTP Length" in Supabase Auth settings
const OTP_LENGTH = 8;

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/post";
  const session = useSession();

  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session) router.replace(next);
  }, [session, next, router]);

  async function sendCode() {
    setBusy(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOtp({ email });
    setBusy(false);
    if (error) {
      setError(
        error.message && error.message !== "{}"
          ? error.message
          : "We couldn't send the code right now. Please try again in a few minutes."
      );
    } else {
      setStep("code");
      setCode("");
    }
  }

  async function verifyCode(token: string) {
    setBusy(true);
    setError(null);
    const { error } = await supabase.auth.verifyOtp({ email, token, type: "email" });
    setBusy(false);
    if (error) {
      setError("That code didn't work — check it and try again, or request a new one.");
      setCode("");
    }
    // On success the session updates and the effect above redirects
  }

  if (step === "code") {
    return (
      <div className="mx-auto w-full max-w-sm px-4 py-20 sm:px-6">
        <h1 className="text-2xl font-semibold tracking-tight">Enter your code</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          We sent an {OTP_LENGTH}-digit code to{" "}
          <span className="font-medium text-foreground">{email}</span>. It expires in
          an hour.
        </p>
        <p className="mt-2 text-sm leading-6">Please check your Spam folder if you don't see the code.</p>
        <form
          className="mt-6 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (code.length === OTP_LENGTH) verifyCode(code);
          }}
        >
          <InputOTP
            maxLength={OTP_LENGTH}
            value={code}
            onChange={setCode}
            onComplete={(value: string) => verifyCode(value)}
            disabled={busy}
            autoFocus
          >
            <InputOTPGroup className="w-full justify-center">
              {Array.from({ length: OTP_LENGTH }, (_, i) => (
                <InputOTPSlot key={i} index={i} className="size-10 text-base" />
              ))}
            </InputOTPGroup>
          </InputOTP>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button
            type="submit"
            disabled={busy || code.length < OTP_LENGTH}
            className="h-10 w-full rounded-full"
          >
            {busy ? "Checking…" : "Sign in"}
          </Button>
        </form>
        <div className="mt-4 flex items-center justify-between text-sm">
          <button
            type="button"
            className="text-muted-foreground transition-colors hover:text-foreground"
            onClick={() => {
              setStep("email");
              setError(null);
            }}
          >
            Use a different email
          </button>
          <button
            type="button"
            disabled={busy}
            className="text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
            onClick={sendCode}
          >
            Resend code
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-sm px-4 py-20 sm:px-6">
      <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        Enter your email and we&apos;ll send you a one-time sign-in code — new
        accounts are created automatically. Sign in to post rooms or save listings.
      </p>
      <form
        className="mt-6 space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          sendCode();
        }}
      >
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            required
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" disabled={busy} className="h-10 w-full rounded-full">
          {busy ? "Sending…" : "Send code"}
        </Button>
      </form>
    </div>
  );
}
