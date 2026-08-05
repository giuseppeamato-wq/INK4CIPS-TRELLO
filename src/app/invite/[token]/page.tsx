import Link from "next/link"
import { getSession } from "@/lib/auth/session"
import { getInviteByToken } from "@/lib/queries/workspaces"
import { AcceptInviteButton } from "@/components/invite/accept-invite-button"

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  editor: "Editor",
  member: "Membro",
}

function InviteShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh items-center justify-center bg-[#e8e8e8] p-6">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 text-center shadow-[0_20px_60px_rgba(0,0,0,0.2)]">
        <img src="/logo.png" alt="INK4CIPS" className="mx-auto mb-5 h-16 w-16 rounded-2xl object-cover" />
        {children}
      </div>
    </div>
  )
}

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const [invite, session] = await Promise.all([getInviteByToken(token), getSession()])

  if (!invite) {
    return (
      <InviteShell>
        <h1 className="mb-2 font-heading text-xl font-bold text-foreground">Invito non valido</h1>
        <p className="text-sm text-muted-foreground">
          Questo link non corrisponde a nessun invito. Chiedi a chi te l&apos;ha mandato di generarne uno nuovo.
        </p>
      </InviteShell>
    )
  }

  if (invite.status !== "pending") {
    return (
      <InviteShell>
        <h1 className="mb-2 font-heading text-xl font-bold text-foreground">Invito non più valido</h1>
        <p className="mb-6 text-sm text-muted-foreground">
          Questo invito è già stato usato o revocato.
        </p>
        <Link href="/login" className="text-[13px] font-semibold text-foreground no-underline">
          Vai al login
        </Link>
      </InviteShell>
    )
  }

  const roleLabel = ROLE_LABELS[invite.role] ?? invite.role

  return (
    <InviteShell>
      <h1 className="mb-1.5 font-heading text-xl font-bold text-foreground">Sei stato invitato</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Unisciti al workspace <span className="font-semibold text-foreground">{invite.workspaceName}</span> come{" "}
        <span className="font-semibold text-foreground">{roleLabel}</span>.
      </p>

      {session ? (
        <AcceptInviteButton token={token} />
      ) : (
        <div className="flex flex-col gap-2.5">
          <Link
            href={`/signup?next=${encodeURIComponent(`/invite/${token}`)}`}
            className="flex h-12 w-full items-center justify-center rounded-[10px] bg-[#1a1a1a] text-[15px] font-semibold text-white no-underline"
          >
            Registrati e unisciti
          </Link>
          <Link
            href={`/login?next=${encodeURIComponent(`/invite/${token}`)}`}
            className="flex h-12 w-full items-center justify-center rounded-[10px] border border-[#e5e5e5] text-[15px] font-semibold text-foreground no-underline"
          >
            Hai già un account? Accedi
          </Link>
        </div>
      )}
    </InviteShell>
  )
}
