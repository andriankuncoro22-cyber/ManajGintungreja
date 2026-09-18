import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  }, serverExternalPackages: ['docxtemplater', 'pizzip'],
};

export default nextConfig;