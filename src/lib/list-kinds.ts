export type ListKind = "todo" | "in_progress" | "done"

export const LIST_KIND_ORDER: ListKind[] = ["todo", "in_progress", "done"]

// Colors are the literal hex values from the reference design's KIND_INFO /
// column-dot markup (Trello Desktop.dc.html) — red-500/yellow-400/green-500
// happen to equal #ef4444/#facc15/#22c55e exactly, so those utilities are
// used where they match; the "in progress" text tone (#eab308) does not
// correspond to a default Tailwind step, so it's spelled out literally.
export const LIST_KIND_INFO: Record<
  ListKind,
  { name: string; barClassName: string; textClassName: string }
> = {
  todo: { name: "Da Fare", barClassName: "bg-red-500", textClassName: "text-red-500" },
  in_progress: { name: "In Corso", barClassName: "bg-yellow-400", textClassName: "text-[#eab308]" },
  done: { name: "Fatto", barClassName: "bg-green-500", textClassName: "text-green-500" },
}
