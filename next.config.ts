import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Lets the dev server serve JS/HMR to devices on the local network (e.g.
  // testing on a phone) — Next.js otherwise blocks cross-origin dev requests
  // and only allows `localhost`, which silently breaks all client-side JS
  // (hydration never completes) while the initial HTML still renders fine.
  allowedDevOrigins: ["10.0.0.140"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "placehold.co",
      },
    ],
  },
};

export default nextConfig;
