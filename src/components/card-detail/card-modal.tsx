"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Plus, Trash2, X } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  BottomSheet,
  BottomSheetContent,
} from "@/components/ui/bottom-sheet"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { useIsMobile } from "@/hooks/use-mobile"
import { LIST_KIND_INFO, type ListKind } from "@/lib/list-kinds"
import {
  getCardDetailAction,
  getCardPickersAction,
  updateCardDescriptionAction,
  updateCardDueDateAction,
  updateCardTitleAction,
  createChecklistAction,
} from "@/lib/actions/card-detail"
import { deleteCardAction } from "@/lib/actions/cards"
import { verifyCurrentPasswordAction } from "@/lib/actions/security"
import { keyBetween } from "@/lib/ordering/position"
import { CardChecklist } from "./card-checklist"
import { CardComments } from "./card-comments"
import { CardMembersPopover } from "./card-members-popover"
import { CardLabelsPopover } from "./card-labels-popover"
import { CardAttachments } from "./card-attachments"
import type { BoardMemberT, CardDetailT } from "./types"

export function CardModal({
  cardId,
  boardId,
  canEdit,
  cardKind,
  onOpenChange,
  onTitleChanged,
  onDeleted,
}: {
  cardId: string
  boardId: string
  canEdit: boolean
  cardKind?: ListKind | null
  onOpenChange: (open: boolean) => void
  onTitleChanged: (cardId: string, title: string) => void
  onDeleted: (cardId: string) => void
}) {
  const isMobile = useIsMobile()
  const [detail, setDetail] = useState<CardDetailT | null>(null)
  const [boardMembers, setBoardMembers] = useState<BoardMemberT[]>([])
  const [boardLabels, setBoardLabels] = useState<CardDetailT["labels"]>([])
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [loading, setLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false)
  const [deletePassword, setDeletePassword] = useState("")
  const [deleteError, setDeleteError] = useState(false)

  useEffect(() => {
    let cancelled = false
    // `key={cardId}` on the parent's <CardModal> remounts this component
    // (and resets `loading`'s initial `true`) whenever a different card
    // opens, so this effect only needs to flip it back to false when done.
    Promise.all([getCardDetailAction(cardId), getCardPickersAction(boardId)])
      .then(([cardDetail, pickers]) => {
        if (cancelled || !cardDetail) return
        setDetail(cardDetail)
        setTitle(cardDetail.card.title)
        setDescription(cardDetail.card.description ?? "")
        setBoardMembers(pickers.members)
        setBoardLabels(pickers.labels)
      })
      .catch((err) => {
        toast.error(err instanceof Error ? err.message : "Errore nel caricamento della card")
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [cardId, boardId])

  async function saveTitle() {
    const trimmed = title.trim()
    if (!canEdit || !detail || !trimmed || trimmed === detail.card.title) return
    try {
      await updateCardTitleAction(cardId, trimmed)
      onTitleChanged(cardId, trimmed)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Errore imprevisto")
    }
  }

  async function saveDescription() {
    if (!detail || description === (detail.card.description ?? "")) return
    try {
      await updateCardDescriptionAction(cardId, description)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Errore imprevisto")
    }
  }

  async function saveDueDate(value: string) {
    if (!detail) return
    const dueDate = value ? new Date(value) : null
    setDetail({ ...detail, card: { ...detail.card, dueDate } })
    try {
      await updateCardDueDateAction(cardId, dueDate)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Errore imprevisto")
    }
  }

  async function confirmDelete() {
    setDeleteError(false)
    setIsDeleting(true)
    try {
      const valid = await verifyCurrentPasswordAction(deletePassword)
      if (!valid) {
        setDeleteError(true)
        setIsDeleting(false)
        return
      }
      await deleteCardAction(cardId)
      onDeleted(cardId)
    } catch (err) {
      setIsDeleting(false)
      toast.error(err instanceof Error ? err.message : "Errore imprevisto")
    }
  }

  async function addChecklist() {
    if (!detail) return
    try {
      const lastKey = detail.checklists.length ? detail.checklists[detail.checklists.length - 1].sortKey : null
      const sortKey = keyBetween(lastKey, null)
      const checklist = await createChecklistAction(cardId, "Checklist", sortKey)
      setDetail({ ...detail, checklists: [...detail.checklists, { ...checklist, items: [] }] })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Errore imprevisto")
    }
  }

  const header = isMobile ? (
    <div className="mb-1 flex items-center justify-between">
      {cardKind ? (
        <span
          className={cn(
            "text-[11px] font-bold tracking-wide uppercase",
            LIST_KIND_INFO[cardKind].textClassName
          )}
        >
          {LIST_KIND_INFO[cardKind].name}
        </span>
      ) : (
        <span />
      )}
      <button
        onClick={() => onOpenChange(false)}
        aria-label="Chiudi"
        className="flex size-7 items-center justify-center rounded-full bg-muted"
      >
        <X className="size-3.5" />
      </button>
    </div>
  ) : null

  const body =
    loading || !detail ? (
      <div className="p-8 text-center text-sm text-muted-foreground">Caricamento...</div>
    ) : (
      <div className="flex flex-col gap-5">
        {header}
        {isMobile ? (
          <div className="flex items-start justify-between gap-2">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={saveTitle}
              readOnly={!canEdit}
              className="border-none px-0 font-heading text-lg font-extrabold shadow-none focus-visible:ring-0 read-only:cursor-default"
            />
            {canEdit && (
              <Button
                variant="ghost"
                size="icon-sm"
                className="shrink-0 text-muted-foreground hover:text-destructive"
                onClick={() => setIsConfirmingDelete(true)}
                disabled={isDeleting}
                aria-label="Elimina card"
              >
                <Trash2 className="size-4" />
              </Button>
            )}
          </div>
        ) : (
          <DialogHeader>
            {cardKind && (
              <span
                className={cn(
                  "text-[11px] font-bold tracking-wide uppercase",
                  LIST_KIND_INFO[cardKind].textClassName
                )}
              >
                {LIST_KIND_INFO[cardKind].name}
              </span>
            )}
            <div className="flex items-center gap-2 pr-6">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={saveTitle}
                readOnly={!canEdit}
                className="border-none px-0 text-base font-semibold shadow-none focus-visible:ring-0 read-only:cursor-default"
              />
              {canEdit && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={() => setIsConfirmingDelete(true)}
                  disabled={isDeleting}
                  aria-label="Elimina card"
                >
                  <Trash2 className="size-4" />
                </Button>
              )}
            </div>
            <DialogTitle className="sr-only">Dettaglio card</DialogTitle>
          </DialogHeader>
        )}

        {isConfirmingDelete && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3.5">
            <p className="mb-2.5 text-sm font-medium text-destructive">
              Inserisci la password del profilo per eliminare questa card.
            </p>
            <Input
              type="password"
              value={deletePassword}
              onChange={(e) => {
                setDeletePassword(e.target.value)
                setDeleteError(false)
              }}
              placeholder="Password"
              className="mb-2 bg-background"
              autoFocus
            />
            {deleteError && (
              <p className="mb-2 text-xs font-medium text-destructive">Password errata.</p>
            )}
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setIsConfirmingDelete(false)
                  setDeletePassword("")
                  setDeleteError(false)
                }}
              >
                Annulla
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={confirmDelete}
                disabled={isDeleting || !deletePassword}
              >
                Conferma eliminazione
              </Button>
            </div>
          </div>
        )}

            <div className="flex flex-col gap-2">
              <span className="text-xs font-medium text-muted-foreground">Membri</span>
              <CardMembersPopover
                cardId={cardId}
                members={detail.members}
                boardMembers={boardMembers}
                onChange={(members) => setDetail({ ...detail, members })}
              />
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-xs font-medium text-muted-foreground">Etichette</span>
              <CardLabelsPopover
                cardId={cardId}
                boardId={boardId}
                labels={detail.labels}
                boardLabels={boardLabels}
                onChange={(labels) => setDetail({ ...detail, labels })}
                onBoardLabelsChange={setBoardLabels}
              />
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-xs font-medium text-muted-foreground">Scadenza</span>
              <input
                type="date"
                className="h-8 w-fit rounded-lg border border-input bg-transparent px-2.5 text-sm"
                value={detail.card.dueDate ? new Date(detail.card.dueDate).toISOString().slice(0, 10) : ""}
                onChange={(e) => saveDueDate(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-xs font-medium text-muted-foreground">Descrizione</span>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onBlur={saveDescription}
                placeholder="Aggiungi una descrizione più dettagliata..."
                className="min-h-20 text-sm"
              />
            </div>

            <Separator />

            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Checklist</span>
                <Button size="sm" variant="ghost" onClick={addChecklist}>
                  <Plus className="size-3.5" />
                  Aggiungi
                </Button>
              </div>
              {detail.checklists.map((checklist) => (
                <CardChecklist
                  key={checklist.id}
                  checklist={checklist}
                  onChange={(updated) =>
                    setDetail({
                      ...detail,
                      checklists: detail.checklists.map((c) => (c.id === updated.id ? updated : c)),
                    })
                  }
                />
              ))}
            </div>

            <Separator />

            <div className="flex flex-col gap-2">
              <span className="text-xs font-medium text-muted-foreground">Allegati</span>
              <CardAttachments
                cardId={cardId}
                attachments={detail.attachments}
                onChange={(attachments) => setDetail({ ...detail, attachments })}
              />
            </div>

            <Separator />

            <div className="flex flex-col gap-2">
              <span className="text-xs font-medium text-muted-foreground">Attività</span>
              <CardComments
                cardId={cardId}
                comments={detail.comments}
                onChange={(comments) => setDetail({ ...detail, comments })}
              />
            </div>
          </div>
        )

  if (isMobile) {
    return (
      <BottomSheet open onOpenChange={onOpenChange}>
        <BottomSheetContent>{body}</BottomSheetContent>
      </BottomSheet>
    )
  }

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto sm:max-w-lg">
        {body}
      </DialogContent>
    </Dialog>
  )
}
