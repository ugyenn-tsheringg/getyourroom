import { createClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";

// Uses admin generate_link to mint a real OTP without sending an email,
// so runs don't consume the built-in mailer's hourly quota.
describe("email OTP sign-in", () => {
  it("rejects a wrong code", async () => {
    const client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { error } = await client.auth.verifyOtp({
      email: process.env.TEST_VENDOR_EMAIL!,
      token: "000000",
      type: "email",
    });
    expect(error).not.toBeNull();
  });

  it("signs in with a valid code", async () => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const res = await fetch(`${url}/auth/v1/admin/generate_link`, {
      method: "POST",
      headers: {
        apikey: process.env.SUPABASE_SECRET_KEY!,
        Authorization: `Bearer ${process.env.SUPABASE_SECRET_KEY!}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ type: "magiclink", email: process.env.TEST_VENDOR_EMAIL! }),
    });
    const link = await res.json();
    expect(link.email_otp).toBeTruthy();

    const client = createClient(url, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    const { data, error } = await client.auth.verifyOtp({
      email: process.env.TEST_VENDOR_EMAIL!,
      token: link.email_otp,
      type: "email",
    });
    expect(error).toBeNull();
    expect(data.user?.email).toBe(process.env.TEST_VENDOR_EMAIL!);
    expect(data.session?.access_token).toBeTruthy();
  });
});
