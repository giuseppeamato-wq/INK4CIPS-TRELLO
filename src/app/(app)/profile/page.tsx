import Link from "next/link"
import { redirect } from "next/navigation"
import { Bell, ChevronLeft, ChevronRight, HelpCircle } from "lucide-react"
import { getSession } from "@/lib/auth/session"
import { getProfileStats } from "@/lib/queries/profile"
import { getUnreadNotificationCount } from "@/lib/queries/notifications"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { LogoutButton } from "@/components/auth/logout-button"

export default async function ProfilePage() {
  const session = await getSession()
  if (!session) redirect("/login")

  const [stats, unreadCount] = await Promise.all([
    getProfileStats(session.user.id),
    getUnreadNotificationCount(session.user.id),
  ])

  const initials = (session.user.name ?? session.user.email ?? "?").slice(0, 1).toUpperCase()

  return (
    <div className="flex flex-1 flex-col">
      <div className="hidden items-center gap-3.5 px-9 pt-6 pb-2 md:flex">
        <Link
          href="/"
          aria-label="Torna al workspace"
          className="flex size-9 items-center justify-center rounded-[9px] bg-ink-soft"
        >
          <ChevronLeft className="size-4 text-foreground" />
        </Link>
        <span className="font-heading text-[19px] font-bold text-foreground">Profilo</span>
      </div>
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col p-5">
      <div className="mb-6 flex flex-col items-center gap-2.5 py-4">
        <Avatar size="lg" className="size-[88px]">
          {session.user.image && <AvatarImage src={session.user.image} alt={session.user.name} />}
          <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
        </Avatar>
        <div className="font-heading text-xl font-bold text-foreground">{session.user.name}</div>
        <div className="text-[13.5px] text-muted-foreground">{session.user.email}</div>
        <Link
          href="/profile/edit"
          className="mt-1.5 rounded-full border border-[#e5e5e5] px-[18px] py-[7px] text-[12.5px] font-semibold text-foreground"
        >
          Modifica profilo
        </Link>
      </div>

      <div className="mb-7 flex gap-3.5">
        <div className="flex-1 rounded-xl bg-ink-soft p-4 text-center">
          <div className="font-heading text-[22px] font-extrabold text-foreground">{stats.boardCount}</div>
          <div className="text-[11.5px] font-medium text-muted-foreground">Board</div>
        </div>
        <div className="flex-1 rounded-xl bg-ink-soft p-4 text-center">
          <div className="font-heading text-[22px] font-extrabold text-foreground">{stats.assignedCardCount}</div>
          <div className="text-[11.5px] font-medium text-muted-foreground">Task assegnate</div>
        </div>
        <div className="flex-1 rounded-xl bg-ink-soft p-4 text-center">
          <div className="font-heading text-[22px] font-extrabold text-foreground">{stats.teamCount}</div>
          <div className="text-[11.5px] font-medium text-muted-foreground">Team</div>
        </div>
      </div>

      <div className="mb-2 text-xs font-bold tracking-[0.04em] text-muted-foreground uppercase">
        Account
      </div>
      <div className="mb-7 flex flex-col overflow-hidden rounded-[14px] border border-border">
        <Link
          href="/profile/notifications"
          className="flex items-center justify-between border-b border-[#f2f2f2] px-4 py-3.5 text-[13.5px] font-medium text-foreground"
        >
          <span className="flex items-center gap-2.5">
            <Bell className="size-4 text-[#5a5a5a]" />
            Notifiche
            {unreadCount > 0 && (
              <span className="rounded-full bg-destructive px-1.5 py-0.5 text-[10px] font-bold text-white">
                {unreadCount}
              </span>
            )}
          </span>
          <ChevronRight className="size-3.5 text-[#c2c2c2]" />
        </Link>
        <Link
          href="/profile/help"
          className="flex items-center justify-between px-4 py-3.5 text-[13.5px] font-medium text-foreground"
        >
          <span className="flex items-center gap-2.5">
            <HelpCircle className="size-4 text-[#5a5a5a]" />
            Aiuto e supporto
          </span>
          <ChevronRight className="size-3.5 text-[#c2c2c2]" />
        </Link>
      </div>

      <LogoutButton />
      </div>
    </div>
  )
}
