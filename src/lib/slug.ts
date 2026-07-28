export function slugify(name: string) {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")

  const suffix = crypto.randomUUID().slice(0, 6)
  return `${base || "workspace"}-${suffix}`
}
