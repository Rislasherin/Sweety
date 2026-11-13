export function formatDate(dateInput: string | Date): string {
  try {
    const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput
    if (Number.isNaN(d.getTime())) return 'Invalid date'
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return 'Invalid date'
  }
}

export function formatTime(dateInput: string | Date): string {
  try {
    const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput
    if (Number.isNaN(d.getTime())) return ''
    return d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return ''
  }
}

export function formatDateTime(dateInput: string | Date): string {
  const dateStr = formatDate(dateInput)
  const timeStr = formatTime(dateInput)
  return timeStr ? `${dateStr} at ${timeStr}` : dateStr
}

export function getTodayIsoString(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
