// next.config.ts

import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  output: "standalone",
  allowedDevOrigins: ["*.trycloudflare.com"], // Used with tunnels needed for verifying icons on mobile devices (PWA)
};

export default withNextIntl(nextConfig);
