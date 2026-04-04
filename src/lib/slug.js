import { nanoid } from 'nanoid'

export function generateSlug(length = 8) {
  return nanoid(length)
}

export function isValidSlug(slug) {
  return /^[a-zA-Z0-9_-]{3,50}$/.test(slug)
}
