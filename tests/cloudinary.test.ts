import { v2 as cloudinary } from "cloudinary";
import { afterAll, describe, expect, it } from "vitest";
import { uploadImage } from "@/lib/cloudinary";

// 1x1 transparent PNG
const TINY_PNG =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

let uploadedUrl: string | undefined;

describe("image upload to Cloudinary", () => {
  afterAll(async () => {
    if (!uploadedUrl) return;
    // URL ends in .../upload/v123/getyourroom/rooms/<id>.png
    const publicId = uploadedUrl.split("/upload/")[1].split("/").slice(1).join("/").replace(/\.\w+$/, "");
    await cloudinary.uploader.destroy(publicId);
  });

  it("uploads an image and returns a Cloudinary URL", async () => {
    uploadedUrl = await uploadImage(TINY_PNG);
    expect(uploadedUrl).toMatch(/^https:\/\/res\.cloudinary\.com\/.+/);
    expect(uploadedUrl).toContain("getyourroom/rooms");
  });
});
