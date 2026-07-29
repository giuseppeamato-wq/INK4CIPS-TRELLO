export type BoardBackground = {
  id: string
  label: string
  className: string
}

export const BOARD_BACKGROUNDS: BoardBackground[] = [
  { id: "neutral", label: "Neutro", className: "bg-muted" },
  { id: "ocean", label: "Oceano", className: "bg-gradient-to-br from-sky-500 via-blue-600 to-indigo-700" },
  { id: "sunset", label: "Tramonto", className: "bg-gradient-to-br from-orange-400 via-pink-500 to-purple-600" },
  { id: "forest", label: "Foresta", className: "bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-700" },
  { id: "berry", label: "Bacca", className: "bg-gradient-to-br from-fuchsia-500 via-purple-600 to-indigo-800" },
  { id: "citrus", label: "Agrumi", className: "bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500" },
  { id: "slate", label: "Ardesia", className: "bg-gradient-to-br from-slate-600 via-slate-800 to-black" },
]

export const DEFAULT_BOARD_BACKGROUND_ID = "neutral"

export function getBoardBackground(id: string | null | undefined): BoardBackground {
  return BOARD_BACKGROUNDS.find((b) => b.id === id) ?? BOARD_BACKGROUNDS[0]
}
