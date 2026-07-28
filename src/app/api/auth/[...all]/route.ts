import { toNextJsHandler } from "better-auth/next-js"
import { getAuth } from "@/lib/auth"

// getAuth() must be called lazily, inside the request handler, not at
// module-evaluation time — calling it eagerly (e.g. via
// `toNextJsHandler(getAuth())` at the top level) runs it before the
// OpenNext Cloudflare dev context is ready, breaking getCloudflareContext().
export async function GET(request: Request) {
  return toNextJsHandler(getAuth()).GET(request)
}

export async function POST(request: Request) {
  return toNextJsHandler(getAuth()).POST(request)
}
