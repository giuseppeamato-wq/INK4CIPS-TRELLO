import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const nextConfig: NextConfig = {
  typescript: {
    // `next build`'s own typecheck also scans custom-worker.ts (pulled in
    // transitively via worker-configuration.d.ts's DurableObjectNamespace
    // type), which imports the OpenNext-generated `.open-next/worker.js` —
    // a file that doesn't exist until *after* this very build step runs.
    // Real type safety is enforced separately via `npx tsc --noEmit`
    // (which works correctly once that file exists from any prior build).
    ignoreBuildErrors: true,
  },
};

initOpenNextCloudflareForDev();

export default nextConfig;
