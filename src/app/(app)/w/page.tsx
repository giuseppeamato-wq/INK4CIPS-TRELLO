import { redirect } from "next/navigation"
import Link from "next/link"
import { Plus } from "lucide-react"
import { getSession } from "@/lib/auth/session"
import { getUserWorkspacesWithBoardCount } from "@/lib/queries/workspaces"
import { colorForWorkspace } from "@/lib/workspace-colors"
import { CreateWorkspaceDialog } from "@/components/workspace/create-workspace-dialog"
import { EditWorkspaceSheet } from "@/components/workspace/edit-workspace-sheet"
import { Button } from "@/components/ui/button"

export default async function ChooseWorkspacePage() {
  const session = await getSession()
  if (!session) redirect("/login")

  const workspaces = await getUserWorkspacesWithBoardCount(session.user.id)

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-1 p-5">
      <h1 className="font-heading text-xl font-extrabold">Scegli un workspace</h1>
      <p className="mb-5 text-sm text-muted-foreground">
        Seleziona lo spazio in cui vuoi lavorare.
      </p>

      <div className="flex flex-col gap-3">
        {workspaces.map((ws) => (
          <div
            key={ws.id}
            className="flex items-center gap-3.5 rounded-2xl border p-3.5"
          >
            <Link href={`/w/${ws.slug}`} className="flex min-w-0 flex-1 items-center gap-3.5">
              {ws.coverPath ? (
                <div
                  className="size-11 shrink-0 rounded-xl bg-cover bg-center"
                  style={{ backgroundImage: `url('/api/workspaces/${ws.id}/cover')` }}
                />
              ) : (
                <div
                  className="flex size-11 shrink-0 items-center justify-center rounded-xl font-heading text-base font-bold text-white"
                  style={{ backgroundColor: colorForWorkspace(ws.id) }}
                >
                  {ws.name.slice(0, 1).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <div className="truncate font-heading text-sm font-bold">{ws.name}</div>
                <div className="text-xs text-muted-foreground">
                  {ws.boardCount} board
                </div>
              </div>
            </Link>
            {(ws.role === "owner" || ws.role === "admin") && (
              <EditWorkspaceSheet
                workspace={ws}
                trigger={
                  <button
                    type="button"
                    className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted"
                    aria-label={`Modifica ${ws.name}`}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M4 20H8.5L19 9.5C19.8 8.7 19.8 7.4 19 6.6L17.4 5C16.6 4.2 15.3 4.2 14.5 5L4 15.5V20Z"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                }
              />
            )}
          </div>
        ))}

        <CreateWorkspaceDialog
          trigger={
            <Button
              variant="outline"
              className="mt-1 h-[70px] justify-start gap-3.5 rounded-2xl border-dashed px-3.5 text-muted-foreground"
            >
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-muted">
                <Plus className="size-4.5" />
              </div>
              Crea nuovo workspace
            </Button>
          }
        />
      </div>
    </div>
  )
}
