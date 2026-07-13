import { describe, expect, it } from "vitest";
import { checkImageSafe, isImageExplicit } from "@/lib/moderation";

describe("explicit-image policy (moderate threshold)", () => {
  it("rejects clearly explicit scores", () => {
    expect(isImageExplicit({ sexual_activity: 0.9 })).toBe(true);
    expect(isImageExplicit({ sexual_display: 0.7 })).toBe(true);
    expect(isImageExplicit({ erotica: 0.6 })).toBe(true);
  });

  it("allows safe and merely suggestive scores", () => {
    expect(isImageExplicit({})).toBe(false);
    expect(isImageExplicit({ sexual_activity: 0.05, erotica: 0.1 })).toBe(false);
    // Moderate policy: suggestive content is not blocked
    expect(isImageExplicit({ sexual_activity: 0.3, sexual_display: 0.45 })).toBe(false);
  });
});

describe("Sightengine integration", () => {
  it("accepts a normal room photo", async () => {
    const res = await fetch(
      "https://res.cloudinary.com/lxelhewt/image/upload/v1783762862/getyourroom/seed/ppk0vbkbq2fiajmqpuou.jpg"
    );
    const buffer = Buffer.from(await res.arrayBuffer());
    expect(await checkImageSafe(buffer, "image/jpeg")).toBe(true);
  });
});
