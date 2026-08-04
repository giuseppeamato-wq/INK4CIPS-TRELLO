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
    <div className="flex min-h-svh items-center justify-center bg-[#e8e8e8] p-0 py-6 lg:p-6">
      <div className="flex w-full overflow-hidden bg-white lg:max-w-6xl lg:rounded-2xl lg:shadow-[0_20px_60px_rgba(0,0,0,0.2)]">
        {/* Desktop: branded panel, matches the design system's split-screen login exactly */}
        <div className="hidden flex-1 flex-col items-center justify-center gap-[18px] bg-[linear-gradient(135deg,#1a1a1a,#333333)] p-10 text-center lg:flex">
          <img src="/logo.png" alt="INK4CIPS" className="h-[82px] w-[88px] rounded-2xl object-cover" />
          <span className="font-heading text-[32px] font-extrabold tracking-[-0.02em] text-white">
            INK4CIPS
          </span>
          <p className="max-w-[320px] text-sm text-white/70">LA PEPPEFORMA</p>
          <p className="max-w-[320px] text-sm text-white/70">
            Organizza i tuoi progetti in workspace, board e card, tutto in un unico posto.
          </p>
        </div>
        <div className="flex flex-1 items-center justify-center p-0 lg:w-[460px] lg:flex-none lg:p-[60px]">
          <div className="w-full max-w-sm">{children}</div>
        </div>
      </div>
    </div>
  )
}
