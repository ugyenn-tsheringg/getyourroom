// Custom next/image loader. For Cloudinary delivery URLs it injects sizing +
// quality + format transformations into the URL so Cloudinary does the
// resizing/optimization and serves an already-small image — instead of Next
// downloading the full-size original and re-processing it with sharp (which
// times out on large files). Non-Cloudinary URLs (e.g. /logo.svg) pass through
// untouched.
const UPLOAD_MARKER = "/image/upload/";

export default function cloudinaryLoader({
  src,
  width,
  quality,
}: {
  src: string;
  width: number;
  quality?: number;
}): string {
  if (!src.includes("res.cloudinary.com") || !src.includes(UPLOAD_MARKER)) {
    return src;
  }
  const [base, rest] = src.split(UPLOAD_MARKER);
  // f_auto: best format for the browser; c_limit: never upscale past the
  // original; q_auto (or the requested quality); w_<width>: responsive size.
  const transforms = ["f_auto", "c_limit", `w_${width}`, `q_${quality ?? "auto"}`].join(",");
  return `${base}${UPLOAD_MARKER}${transforms}/${rest}`;
}
