import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  experimental: {
    // 맛집 사진 업로드(최대 10MB × 5장)가 proxy 본문 버퍼 한도(기본 10MB)에 잘리지 않도록
    proxyClientMaxBodySize: "55mb",
  },
  images: {
    remotePatterns: [
      // Google 프로필 이미지
      new URL("https://lh3.googleusercontent.com/**"),
      // Supabase Storage 공개 버킷
      ...(process.env.SUPABASE_URL
        ? [new URL(`${process.env.SUPABASE_URL}/storage/v1/object/public/**`)]
        : []),
      ...(process.env.SUPABASE_STORAGE_URL
        ? [new URL(`${process.env.SUPABASE_STORAGE_URL.replace(/\/$/, "")}/**`)]
        : []),
    ],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
