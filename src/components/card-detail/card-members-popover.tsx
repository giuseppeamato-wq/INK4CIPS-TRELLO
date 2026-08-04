"use client"

import { toast } from "sonner"
import { Plus } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  PopoverHeader,
  PopoverTitle,
} from "@/components/ui/popover"
import { toggleCardMemberAction } from "@/lib/actions/card-detail"
import type { BoardMemberT, CardMemberT } from "./types"

export function CardMembersPopover({
  cardId,
  members,
  boardMembers,
  onChange,
}: {
  cardId: string
  members: CardMemberT[]
  boardMembers: BoardMemberT[]
  onChange: (members: CardMemberT[]) => void
}) {
  async function toggle(bm: BoardMemberT) {
    const isAssigned = members.some((m) => m.userId === bm.userId)
    onChange(
      isAssigned
        ? members.filter((m) => m.userId !== bm.userId)
        : [...members, { userId: bm.userId, name: bm.name, email: bm.email, image: bm.image }]
    )
    try {
      await toggleCardMemberAction(cardId, bm.userId)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Errore imprevisto")
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {members.map((m) => (
        <div
          key={m.userId}
          className="flex items-center gap-1.5 rounded-full bg-ink-soft py-1 pr-2.5 pl-1"
        >
          <Avatar className="size-[22px]" title={m.name ?? m.email}>
            <AvatarFallback className="text-[10px]">{(m.name ?? m.email).slice(0, 1).toUpperCase()}</AvatarFallback>
          </Avatar>
          <span className="text-xs font-semibold text-foreground">{m.name ?? m.email}</span>
          <button
            type="button"
            onClick={() => toggle({ userId: m.userId, role: "", name: m.name, email: m.email, image: m.image })}
            aria-label={`Rimuovi ${m.name ?? m.email}`}
            className="flex size-4 items-center justify-center rounded-full bg-[#e5e5e5] text-foreground"
          >
            <svg width="8" height="8" viewBox="0 0 24 24" fill="none">
              <path d="M5 5L19 19M19 5L5 19" stroke="#5a5a5a" strokeWidth="3" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      ))}
      <Popover>
        <PopoverTrigger
          render={
            <button
              type="button"
              aria-label="Aggiungi membro"
              className="flex size-7 items-center justify-center rounded-full border-[1.5px] border-dashed border-[#c2c2c2] text-ink-faint"
            >
              <Plus className="size-3.5" />
            </button>
          }
        />
        <PopoverContent align="start">
          <PopoverHeader>
            <PopoverTitle>Membri</PopoverTitle>
          </PopoverHeader>
          <div className="flex flex-col gap-1">
            {boardMembers.map((bm) => (
              <label
                key={bm.userId}
                className="flex cursor-pointer items-center gap-2 rounded-md px-1.5 py-1 hover:bg-muted"
              >
                <Checkbox
                  checked={members.some((m) => m.userId === bm.userId)}
                  onCheckedChange={() => toggle(bm)}
                />
                <Avatar className="size-6">
                  <AvatarFallback className="text-xs">{(bm.name ?? bm.email).slice(0, 1).toUpperCase()}</AvatarFallback>
                </Avatar>
                <span className="text-sm">{bm.name ?? bm.email}</span>
              </label>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
