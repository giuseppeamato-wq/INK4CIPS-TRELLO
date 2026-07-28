"use client"

import { toast } from "sonner"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
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
    <div className="flex flex-wrap items-center gap-1.5">
      {members.map((m) => (
        <Avatar key={m.userId} className="size-7" title={m.name ?? m.email}>
          <AvatarFallback className="text-xs">{(m.name ?? m.email).slice(0, 1).toUpperCase()}</AvatarFallback>
        </Avatar>
      ))}
      <Popover>
        <PopoverTrigger
          render={
            <Button variant="outline" size="icon-sm" className="rounded-full">
              <Plus className="size-3.5" />
            </Button>
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
