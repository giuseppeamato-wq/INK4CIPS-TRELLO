import Link from "next/link"
import { redirect } from "next/navigation"
import { ChevronRight, Settings } from "lucide-react"
import { getSession } from "@/lib/auth/session"
import { getUserWorkspaces } from "@/lib/queries/workspaces"
import { getProfileStats } from "@/lib/queries/profile"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { LogoutButton } from "@/components/auth/logout-button"

export default async function ProfilePage() {
  const session = await getSession()
  if (!session) redirect("/login")

  const [workspaces, stats] = await Promise.all([
    getUserWorkspaces(session.user.id),
    getProfileStats(session.user.id),
  ])

  const initials = (session.user.name ?? session.user.email ?? "?").slice(0, 1).toUpperCase()

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col p-5">
      <div className="mb-6 flex flex-col items-center gap-2.5 py-4">
        <Avatar size="lg" className="size-[76px]">
          {session.user.image && <AvatarImage src={session.user.image} alt={session.user.name} />}
          <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
        </Avatar>
        <div className="font-heading text-lg font-bold">{session.user.name}</div>
        <div className="text-sm text-muted-foreground">{session.user.email}</div>
        <Link
          href="/profile/edit"
          className="mt-1.5 rounded-full border px-4 py-1.5 text-xs font-semibold"
        >
          Modifica profilo
        </Link>
      </div>

      <div className="mb-6 flex gap-2.5">
        <div className="flex-1 rounded-xl bg-muted p-3.5 text-center">
          <div className="font-heading text-lg font-extrabold">{stats.boardCount}</div>
          <div className="text-[11px] text-muted-foreground">Board</div>
        </div>
        <div className="flex-1 rounded-xl bg-muted p-3.5 text-center">
          <div className="font-heading text-lg font-extrabold">{stats.assignedCardCount}</div>
          <div className="text-[11px] text-muted-foreground">Task assegnate</div>
        </div>
        <div className="flex-1 rounded-xl bg-muted p-3.5 text-center">
          <div className="font-heading text-lg font-extrabold">{stats.teamCount}</div>
          <div className="text-[11px] text-muted-foreground">Team</div>
        </div>
      </div>

      <div className="mb-2 text-xs font-bold tracking-wide text-muted-foreground uppercase">
        Account
      </div>
      <div className="mb-6 flex flex-col overflow-hidden rounded-2xl border">
        {workspaces.length > 0 && (
          <Link
            href={`/w/${workspaces[0].slug}/settings`}
            className="flex items-center justify-between px-3.5 py-3 text-sm font-medium"
          >
            <span className="flex items-center gap-2.5">
              <Settings className="size-4 text-muted-foreground" />
              Impostazioni
            </span>
            <ChevronRight className="size-3.5 text-muted-foreground" />
          </Link>
        )}
      </div>

      <LogoutButton />
    </div>
  )
}
