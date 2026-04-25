import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/wonder-bill-demo",
        destination: "/wonder-bill",
        permanent: false,
      },
      {
        source: "/demo",
        destination: "/wonder-bill",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
