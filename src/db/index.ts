import { drizzle } from "drizzle-orm/d1"
import { getEnv } from "@/lib/cf/context"
import * as schema from "./schema"

// Accepts an explicit env for call sites outside the Next.js request scope
// (e.g. custom-worker.ts intercepting WebSocket upgrades before Next.js ever
// sees the request, where getCloudflareContext() isn't available).
export function getDb(env?: CloudflareEnv) {
  return drizzle((env ?? getEnv()).DB, { schema })
}
