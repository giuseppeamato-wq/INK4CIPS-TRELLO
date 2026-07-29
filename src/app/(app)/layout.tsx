import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth/session"
import { LogoutButton } from "@/components/auth/logout-button"

// Every page under (app) reads a live session + live D1 data on every
// request — never statically prerenderable, and getCloudflareContext()'s
// sync mode throws during static generation if Next.js tries anyway.
export const dynamic = "force-dynamic"

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()

  if (!session) {
    redirect("/login")
  }

  return (
    <div className="flex min-h-svh flex-col">
      <header className="flex h-14 shrink-0 items-center justify-between border-b px-4">
        <span className="truncate font-heading text-sm font-semibold">
          INK4CIPS
        </span>
        <div className="flex items-center gap-3">
          <span className="hidden truncate text-sm text-muted-foreground sm:inline">
            {session.user.email}
          </span>
          <LogoutButton />
        </div>
      </header>
      <main className="flex min-h-0 flex-1 flex-col">{children}</main>
    </div>
  )
}
