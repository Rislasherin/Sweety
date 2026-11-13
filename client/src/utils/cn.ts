type ClassValue =
  string | number | boolean | undefined | null | { [key: string]: boolean | undefined | null }

export function cn(...classes: (ClassValue | ClassValue[])[]): string {
  const result: string[] = []

  for (const item of classes) {
    if (!item) continue

    if (Array.isArray(item)) {
      const nested = cn(...item)
      if (nested) result.push(nested)
    } else if (typeof item === 'object') {
      for (const [key, value] of Object.entries(item)) {
        if (value && key) {
          result.push(key)
        }
      }
    } else if (typeof item === 'string' || typeof item === 'number') {
      result.push(String(item))
    }
  }

  return result.join(' ').trim()
}
