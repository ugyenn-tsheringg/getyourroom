// Sightengine nudity check — server-side only.

export type NudityScores = {
  sexual_activity?: number;
  sexual_display?: number;
  erotica?: number;
};

const EXPLICIT_THRESHOLD = 0.5;

// Moderate policy: reject only clearly explicit images.
export function isImageExplicit(nudity: NudityScores): boolean {
  return (
    (nudity.sexual_activity ?? 0) > EXPLICIT_THRESHOLD ||
    (nudity.sexual_display ?? 0) > EXPLICIT_THRESHOLD ||
    (nudity.erotica ?? 0) > EXPLICIT_THRESHOLD
  );
}

// Fails closed: if the check can't be completed, the image is not accepted.
export async function checkImageSafe(buffer: Buffer, mimeType: string): Promise<boolean> {
  const form = new FormData();
  form.append("media", new Blob([new Uint8Array(buffer)], { type: mimeType }), "upload");
  form.append("models", "nudity-2.1");
  form.append("api_user", process.env.SIGHTENGINE_API_USER!);
  form.append("api_secret", process.env.SIGHTENGINE_API_SECRET!);

  const res = await fetch("https://api.sightengine.com/1.0/check.json", {
    method: "POST",
    body: form,
  });
  const json = await res.json();
  if (json.status !== "success") {
    throw new Error(`Moderation check failed: ${json.error?.message ?? res.status}`);
  }
  return !isImageExplicit(json.nudity ?? {});
}
