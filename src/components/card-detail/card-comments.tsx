"use client"

import { useState } from "react"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"
import { it } from "date-fns/locale"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { createCommentAction } from "@/lib/actions/card-detail"
import type { CommentT } from "./types"

export function CardComments({
  cardId,
  comments,
  onChange,
}: {
  cardId: string
  comments: CommentT[]
  onChange: (comments: CommentT[]) => void
}) {
  const [body, setBody] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function submit() {
    const trimmed = body.trim()
    if (!trimmed) return
    setIsSubmitting(true)
    try {
      const comment = await createCommentAction(cardId, trimmed)
      onChange([...comments, comment])
      setBody("")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Errore imprevisto")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Scrivi un commento..."
          className="min-h-16 resize-none text-sm"
        />
        <Button size="sm" className="self-start" onClick={submit} disabled={isSubmitting}>
          Commenta
        </Button>
      </div>
      <div className="flex flex-col gap-3">
        {[...comments].reverse().map((comment) => (
          <div key={comment.id} className="flex gap-2">
            <Avatar className="size-7">
              <AvatarFallback className="text-xs">
                {(comment.authorName ?? comment.authorEmail).slice(0, 1).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-baseline gap-2">
                <span className="text-sm font-medium">{comment.authorName ?? comment.authorEmail}</span>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true, locale: it })}
                </span>
              </div>
              <p className="text-sm whitespace-pre-wrap">{comment.body}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
