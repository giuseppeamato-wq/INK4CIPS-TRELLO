"use client"

import { useState } from "react"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"
import { it } from "date-fns/locale"
import { createCommentAction } from "@/lib/actions/card-detail"
import type { CommentT } from "./types"

// Read-only activity feed, styled as the chat-bubble list from the design
// (avatar + gray bubble + relative timestamp). Submission lives in
// CardCommentComposer, which the modal renders in its own footer bar —
// matching the design's persistent bottom comment input exactly.
export function CardCommentsList({ comments }: { comments: CommentT[] }) {
  if (comments.length === 0) return null

  return (
    <div className="flex flex-col gap-3">
      {[...comments].reverse().map((comment) => (
        <div key={comment.id} className="flex gap-2.5">
          <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-secondary font-heading text-[10px] font-bold">
            {(comment.authorName ?? comment.authorEmail).slice(0, 1).toUpperCase()}
          </div>
          <div>
            <div className="inline-block rounded-[10px] bg-ink-soft px-3 py-2 text-[12.5px] text-foreground">
              {comment.body}
            </div>
            <div className="mt-1 text-[10.5px] text-ink-faint">
              {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true, locale: it })}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export function CardCommentComposer({
  cardId,
  onChange,
}: {
  cardId: string
  onChange: (append: CommentT) => void
}) {
  const [body, setBody] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function submit() {
    const trimmed = body.trim()
    if (!trimmed) return
    setIsSubmitting(true)
    try {
      const comment = await createCommentAction(cardId, trimmed)
      onChange(comment)
      setBody("")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Errore imprevisto")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex items-center gap-2 border-t border-[#f0f0f0] p-3 md:px-[18px]">
      <input
        value={body}
        onChange={(e) => setBody(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault()
            submit()
          }
        }}
        placeholder="Aggiungi un commento..."
        disabled={isSubmitting}
        className="h-10 flex-1 rounded-full border border-[#e5e5e5] bg-[#fafafa] px-3.5 text-[13px] text-foreground outline-none placeholder:text-ink-faint"
      />
      <button
        type="button"
        onClick={submit}
        disabled={isSubmitting}
        aria-label="Invia commento"
        className="flex size-[38px] shrink-0 items-center justify-center rounded-full bg-[#1a1a1a] disabled:opacity-50"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
          <path d="M4 20L20 12L4 4L4 10L14 12L4 14L4 20Z" fill="#fff" />
        </svg>
      </button>
    </div>
  )
}
