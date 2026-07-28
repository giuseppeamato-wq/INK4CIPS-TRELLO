import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth/session"
import { getUserWorkspaces } from "@/lib/queries/workspaces"
import { CreateWorkspaceDialog } from "@/components/workspace/create-workspace-dialog"

export default async function AppHomePage() {
  const session = await getSession()
  if (!session) redirect("/login")

  const workspaces = await getUserWorkspaces(session.user.id)

  if (workspaces.length > 0) {
    redirect(`/w/${workspaces[0].slug}`)
  }

  return (
    <div className="flex flex-col items-center justify-center gap-4 p-16 text-center">
      <h1 className="font-heading text-xl font-semibold">
        Benvenuto in INK4CIPS-TRELLO
      </h1>
      <p className="text-muted-foreground">
        Non fai ancora parte di nessun workspace. Creane uno per iniziare a
        gestire i tuoi progetti con i colleghi.
      </p>
      <CreateWorkspaceDialog />
    </div>
  )
}
