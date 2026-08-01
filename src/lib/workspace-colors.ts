const WORKSPACE_COLORS = [
  "#1a1a1a",
  "#2563eb",
  "#ec4899",
  "#64748b",
  "#0ea5e9",
  "#f97316",
  "#9333ea",
  "#0d9488",
]

export function colorForWorkspace(id: string): string {
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) | 0
  }
  return WORKSPACE_COLORS[Math.abs(hash) % WORKSPACE_COLORS.length]
}
