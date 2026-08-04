"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  BottomSheet,
  BottomSheetContent,
} from "@/components/ui/bottom-sheet"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
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
import { CardCommentComposer, CardCommentsList } from "./card-comments"
import { CardMembersPopover } from "./card-members-popover"
import { CardLabelsPopover } from "./card-labels-popover"
import { CardAttachments } from "./card-attachments"
import type { BoardMemberT, CardDetailT } from "./types"

type MoveListOption = { id: string; name: string; kind: ListKind | null }

export function CardModal({
  cardId,
  boardId,
  canEdit,
  cardKind,
  lists,
  onOpenChange,
  onTitleChanged,
  onDeleted,
  onCardMoved,
  onCardReorder,
}: {
  cardId: string
  boardId: string
  canEdit: boolean
  cardKind?: ListKind | null
  lists?: MoveListOption[]
  onOpenChange: (open: boolean) => void
  onTitleChanged: (cardId: string, title: string) => void
  onDeleted: (cardId: string) => void
  onCardMoved?: (cardId: string, targetListId: string) => void
  onCardReorder?: (cardId: string, direction: "up" | "down") => void
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
  const [showMovePicker, setShowMovePicker] = useState(false)

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

  if (loading || !detail) {
    return isMobile ? (
      <BottomSheet open onOpenChange={onOpenChange}>
        <BottomSheetContent>
          <div className="p-8 text-center text-sm text-ink-faint">Caricamento...</div>
        </BottomSheetContent>
      </BottomSheet>
    ) : (
      <Dialog open onOpenChange={onOpenChange}>
        <DialogContent
          showCloseButton={false}
          className="w-full max-w-[640px] rounded-2xl border-none p-0 shadow-none ring-0"
        >
          <DialogTitle className="sr-only">Caricamento card</DialogTitle>
          <div className="p-8 text-center text-sm text-ink-faint">Caricamento...</div>
        </DialogContent>
      </Dialog>
    )
  }

  const kindLabel = cardKind && (
    <span className={cn("text-[11px] font-bold tracking-[0.04em] uppercase", LIST_KIND_INFO[cardKind].textClassName)}>
      {LIST_KIND_INFO[cardKind].name}
    </span>
  )

  const KIND_DOT_COLOR: Record<ListKind, string> = { todo: "#ef4444", in_progress: "#eab308", done: "#22c55e" }
  const moveOptions = (lists ?? []).filter((l) => l.id !== detail.card.listId)

  const movePicker = showMovePicker && (
    <div
      onClick={() => setShowMovePicker(false)}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/35"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-[260px] rounded-2xl bg-white p-4 shadow-[0_12px_30px_rgba(0,0,0,0.2)]"
      >
        {onCardReorder && (
          <>
            <div className="mb-1 font-heading text-sm font-bold text-foreground">Riordina</div>
            <button
              type="button"
              onClick={() => {
                onCardReorder(cardId, "up")
                setShowMovePicker(false)
              }}
              className="flex w-full items-center gap-2 rounded-[9px] px-2 py-2.5 text-left"
            >
              <ArrowUp className="size-4 text-muted-foreground" />
              <span className="text-[13.5px] font-semibold text-foreground">Sposta su</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onCardReorder(cardId, "down")
                setShowMovePicker(false)
              }}
              className="flex w-full items-center gap-2 rounded-[9px] px-2 py-2.5 text-left"
            >
              <ArrowDown className="size-4 text-muted-foreground" />
              <span className="text-[13.5px] font-semibold text-foreground">Sposta giù</span>
            </button>
            <div className="my-2 border-t border-[#f0f0f0]" />
          </>
        )}
        <div className="mb-2.5 font-heading text-sm font-bold text-foreground">Sposta in un&apos;altra lista</div>
        {moveOptions.length === 0 ? (
          <p className="px-2 py-1.5 text-[13px] text-muted-foreground">Nessun&apos;altra lista disponibile.</p>
        ) : (
          moveOptions.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => {
                onCardMoved?.(cardId, opt.id)
                setShowMovePicker(false)
              }}
              className="flex w-full items-center gap-2 rounded-[9px] px-2 py-2.5 text-left"
            >
              <span
                className="size-2 shrink-0 rounded-full"
                style={{ background: opt.kind ? KIND_DOT_COLOR[opt.kind] : "#a3a3a3" }}
              />
              <span className="text-[13.5px] font-semibold text-foreground">{opt.name}</span>
            </button>
          ))
        )}
      </div>
    </div>
  )

  const moveButton = (onCardMoved || onCardReorder) && (
    <button
      type="button"
      onClick={() => setShowMovePicker(true)}
      aria-label="Sposta card"
      className="flex size-7 items-center justify-center rounded-full bg-[#f2f2f2]"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <path
          d="M4 7H20M8 3L4 7L8 11M20 17H4M16 13L20 17L16 21"
          stroke="#5a5a5a"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  )

  const titleRow = (
    <div className="mb-3.5 flex items-start justify-between gap-2">
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={saveTitle}
        readOnly={!canEdit}
        className="h-auto flex-1 border-none px-0 font-heading text-[21px] font-extrabold text-foreground shadow-none focus-visible:ring-0 read-only:cursor-default"
      />
      {canEdit && (
        <button
          type="button"
          onClick={() => setIsConfirmingDelete(true)}
          disabled={isDeleting}
          aria-label="Elimina card"
          className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-[#f2f2f2] text-[#5a5a5a]"
        >
          <Trash2 className="size-3.5" />
        </button>
      )}
    </div>
  )

  const deleteBlock = isConfirmingDelete ? (
    <div className="mb-4 rounded-xl border border-[#f3d4d4] bg-[#fef2f2] p-3.5">
      <p className="mb-2.5 text-[13px] font-semibold text-[#991b1b]">
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
        className="mb-2 h-10 rounded-[9px] border-[#f3d4d4] bg-white"
        autoFocus
      />
      {deleteError && <p className="mb-2 text-xs font-semibold text-destructive">Password errata.</p>}
      <div className="flex gap-2.5">
        <Button
          variant="outline"
          className="flex-1 rounded-[9px] border-[#f3d4d4] bg-white"
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
          className="flex-1 rounded-[9px] bg-destructive text-white hover:bg-destructive/90"
          onClick={confirmDelete}
          disabled={isDeleting || !deletePassword}
        >
          Conferma eliminazione
        </Button>
      </div>
    </div>
  ) : null

  const body = (
    <div className="flex flex-col">
      {titleRow}
      {deleteBlock}

      <div className="mb-4 flex flex-wrap gap-1.5">
        <CardLabelsPopover
          cardId={cardId}
          boardId={boardId}
          labels={detail.labels}
          boardLabels={boardLabels}
          onChange={(labels) => setDetail({ ...detail, labels })}
          onBoardLabelsChange={setBoardLabels}
        />
      </div>

      <div className="mb-4.5 flex items-center gap-1.5">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="shrink-0">
          <rect x="3" y="5" width="18" height="16" rx="3" stroke="#8a8a8a" strokeWidth="1.8" />
          <path d="M3 9H21M8 3V6M16 3V6" stroke="#8a8a8a" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
        <span className="text-[12.5px] font-medium text-[#5a5a5a]">Scadenza:</span>
        <input
          type="date"
          className="h-6 rounded-md border-none bg-transparent px-1 text-[12.5px] font-medium text-[#5a5a5a] outline-none"
          value={detail.card.dueDate ? new Date(detail.card.dueDate).toISOString().slice(0, 10) : ""}
          onChange={(e) => saveDueDate(e.target.value)}
        />
      </div>

      <div className="mb-4.5 flex flex-col gap-2">
        <span className="text-xs font-bold tracking-[0.04em] text-foreground uppercase">Assegnatari</span>
        <CardMembersPopover
          cardId={cardId}
          members={detail.members}
          boardMembers={boardMembers}
          onChange={(members) => setDetail({ ...detail, members })}
        />
      </div>

      <div className="mb-5 flex flex-col gap-1.5">
        <span className="text-xs font-bold tracking-[0.04em] text-foreground uppercase">Descrizione</span>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onBlur={saveDescription}
          placeholder="Aggiungi una descrizione più dettagliata..."
          className="min-h-20 resize-none border-none bg-transparent px-0 text-[13.5px] leading-[1.55] text-[#5a5a5a] shadow-none focus-visible:ring-0"
        />
      </div>

      <div className="mb-5 flex flex-col gap-4 border-t border-[#f0f0f0] pt-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold tracking-[0.04em] text-foreground uppercase">Checklist</span>
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

      <div className="mb-5 flex flex-col gap-2 border-t border-[#f0f0f0] pt-4">
        <span className="text-xs font-bold tracking-[0.04em] text-foreground uppercase">Allegati</span>
        <CardAttachments
          cardId={cardId}
          attachments={detail.attachments}
          onChange={(attachments) => setDetail({ ...detail, attachments })}
        />
      </div>

      <div className="flex flex-col gap-2.5 border-t border-[#f0f0f0] pt-4">
        <span className="text-xs font-bold tracking-[0.04em] text-foreground uppercase">Attività</span>
        <CardCommentsList comments={detail.comments} />
      </div>
    </div>
  )

  if (isMobile) {
    return (
      <BottomSheet open onOpenChange={onOpenChange}>
        <BottomSheetContent>
          <div className="mb-1 flex items-center justify-between">
            {kindLabel ?? <span />}
            <div className="flex gap-2">
              {moveButton}
              <button
                onClick={() => onOpenChange(false)}
                aria-label="Chiudi"
                className="flex size-7 items-center justify-center rounded-full bg-[#f2f2f2]"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                  <path d="M5 5L19 19M19 5L5 19" stroke="#5a5a5a" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          </div>
          {body}
        </BottomSheetContent>
        <CardCommentComposer
          cardId={cardId}
          onChange={(comment) => setDetail({ ...detail, comments: [...detail.comments, comment] })}
        />
        {movePicker}
      </BottomSheet>
    )
  }

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="flex max-h-[84%] w-full max-w-[640px] flex-col gap-0 overflow-hidden rounded-2xl border-none p-0 shadow-[0_20px_60px_rgba(0,0,0,0.25)] ring-0"
      >
        <DialogTitle className="sr-only">Dettaglio card</DialogTitle>
        <div className="flex items-center justify-between px-6 pt-[18px] pb-3">
          {kindLabel ?? <span />}
          <button
            onClick={() => onOpenChange(false)}
            aria-label="Chiudi"
            className="flex size-7 items-center justify-center rounded-full bg-[#f2f2f2]"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
              <path d="M5 5L19 19M19 5L5 19" stroke="#5a5a5a" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 pb-6">{body}</div>
        <CardCommentComposer
          cardId={cardId}
          onChange={(comment) => setDetail({ ...detail, comments: [...detail.comments, comment] })}
        />
      </DialogContent>
    </Dialog>
  )
}
