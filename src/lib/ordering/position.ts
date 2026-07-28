import { generateKeyBetween, generateNKeysBetween } from "fractional-indexing"

export function keyBetween(before: string | null, after: string | null) {
  return generateKeyBetween(before, after)
}

export function firstKey() {
  return generateKeyBetween(null, null)
}

export function nKeysBetween(before: string | null, after: string | null, n: number) {
  return generateNKeysBetween(before, after, n)
}
