import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Cloudinary does the resizing/optimization via URL transforms, so Next
    // never downloads + re-processes the original (which timed out on large files).
    loader: "custom",
    loaderFile: "./lib/cloudinary-loader.ts",
  },
};

export default nextConfig;
