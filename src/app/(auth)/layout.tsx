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
    <div className="flex min-h-svh items-center justify-center bg-background sm:bg-muted/30 sm:p-4 lg:bg-muted/30 lg:p-6">
      <div className="flex w-full max-w-sm overflow-hidden lg:max-w-4xl lg:rounded-2xl lg:shadow-2xl lg:shadow-black/10">
        {/* Desktop: branded panel, mirrors the design system's split-screen login */}
        <div className="hidden w-[45%] shrink-0 flex-col items-center justify-center gap-4 bg-gradient-to-br from-neutral-900 to-neutral-700 p-10 text-center lg:flex">
          <img src="/logo.png" alt="INK4CIPS" className="size-20 rounded-2xl" />
          <span className="font-heading text-3xl font-extrabold tracking-tight text-white">
            INK4CIPS
          </span>
          <p className="text-sm text-white/70">LA PEPPEFORMA</p>
          <p className="max-w-xs text-sm text-white/70">
            Organizza i tuoi progetti in workspace, board e card, tutto in un unico posto.
          </p>
        </div>
        <div className="flex flex-1 items-center justify-center bg-background p-0 lg:p-10">
          <div className="w-full max-w-sm">{children}</div>
        </div>
      </div>
    </div>
  )
}
