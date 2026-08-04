export type BoardBackground = {
  id: string
  label: string
  className: string
}

// Exact literal gradients from the reference design's GRADIENTS map
// (Trello Desktop.dc.html), not the nearest Tailwind palette stop.
export const BOARD_BACKGROUNDS: BoardBackground[] = [
  { id: "neutral", label: "Neutro", className: "bg-[#f2f2f2]" },
  { id: "ocean", label: "Oceano", className: "bg-[linear-gradient(135deg,#0ea5e9,#2563eb,#4338ca)]" },
  { id: "sunset", label: "Tramonto", className: "bg-[linear-gradient(135deg,#fb923c,#ec4899,#9333ea)]" },
  { id: "forest", label: "Foresta", className: "bg-[linear-gradient(135deg,#10b981,#0d9488,#0e7490)]" },
  { id: "berry", label: "Bacca", className: "bg-[linear-gradient(135deg,#d946ef,#9333ea,#3730a3)]" },
  { id: "citrus", label: "Agrumi", className: "bg-[linear-gradient(135deg,#facc15,#f97316,#ef4444)]" },
  { id: "slate", label: "Ardesia", className: "bg-[linear-gradient(135deg,#475569,#1e293b,#000000)]" },
]

export const DEFAULT_BOARD_BACKGROUND_ID = "neutral"

export function getBoardBackground(id: string | null | undefined): BoardBackground {
  return BOARD_BACKGROUNDS.find((b) => b.id === id) ?? BOARD_BACKGROUNDS[0]
}
