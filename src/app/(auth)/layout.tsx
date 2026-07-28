import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth/session"

// No Proxy/Middleware on this deployment (Next 16's Proxy is Node.js-only,
// incompatible with Cloudflare Workers) — this is the sole guard for
// /login and /signup, mirroring what a proxy-level redirect would do.
export const dynamic = "force-dynamic"

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()
  if (session) redirect("/")

  return (
    <div className="flex min-h-svh items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-sm">{children}</div>
    </div>
  )
}
