export type ListKind = "todo" | "in_progress" | "done"

export const LIST_KIND_ORDER: ListKind[] = ["todo", "in_progress", "done"]

export const LIST_KIND_INFO: Record<
  ListKind,
  { name: string; barClassName: string; textClassName: string }
> = {
  todo: { name: "Da Fare", barClassName: "bg-red-500", textClassName: "text-red-500" },
  in_progress: { name: "In Corso", barClassName: "bg-yellow-400", textClassName: "text-yellow-600" },
  done: { name: "Fatto", barClassName: "bg-green-500", textClassName: "text-green-500" },
}
