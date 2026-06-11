/**
 * composables/useDateFormat.ts
 *
 * Provides a shared, reactive date-format preference (American vs European).
 * Preference is persisted to localStorage under the key 'date-format'.
 *
 * American: MM/DD/YYYY  →  e.g. "Jun 10, 2026" / "Tuesday, Jun 10"
 * European: DD/MM/YYYY  →  e.g. "10 Jun 2026"  / "Tuesday, 10 Jun"
 */

export type DateFormatOption = 'american' | 'european'

const STORAGE_KEY = 'date-format'

// Module-level singleton so all consumers share the same reactive ref.
const dateFormat = ref<DateFormatOption>('american')

function loadFromStorage() {
  if (import.meta.client) {
    const stored = localStorage.getItem(STORAGE_KEY) as DateFormatOption | null
    if (stored === 'american' || stored === 'european') {
      dateFormat.value = stored
    }
  }
}

export function useDateFormat() {
  function setFormat(fmt: DateFormatOption) {
    dateFormat.value = fmt
    if (import.meta.client) {
      localStorage.setItem(STORAGE_KEY, fmt)
    }
  }

  /**
   * Formats a date string (ISO or YYYY-MM-DD) as a full date label.
   * Used for date group headers in the Time Entries page and workspace cards.
   *
   * @param dateStr  ISO string or YYYY-MM-DD string
   * @param options.short  If true, returns compact form (e.g. "Jun 10" / "10 Jun")
   *                       instead of the full label with weekday
   */
  function formatDate(dateStr: string, options?: { short?: boolean }): string {
    const date = new Date(dateStr)

    // "Today" shortcut for time-entries page group headers
    if (!options?.short) {
      const today = new Date()
      if (date.toDateString() === today.toDateString()) return 'Today'
    }

    if (dateFormat.value === 'european') {
      if (options?.short) {
        // "10 Jun"
        return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
      }
      // "Tuesday, 10 Jun 2026"
      return date.toLocaleDateString('en-GB', {
        weekday: 'long',
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      })
    }

    // American (default)
    if (options?.short) {
      // "Jun 10"
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }
    // "Tuesday, Jun 10, 2026"
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  /**
   * Compact format for workspace cards: "Jun 10, 2026" vs "10 Jun 2026"
   */
  function formatDateShort(dateStr: string | null | undefined): string {
    if (!dateStr) return '—'
    const date = new Date(dateStr)
    if (dateFormat.value === 'european') {
      return date.toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' })
    }
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  /** Example date string used for live preview in Settings. */
  const previewDate = new Date(2026, 5, 10) // June 10, 2026

  const previewFormatted = computed(() => {
    if (dateFormat.value === 'european') {
      // DD/MM/YYYY
      return previewDate.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
    }
    // MM/DD/YYYY
    return previewDate.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric'
    })
  })

  return {
    dateFormat: readonly(dateFormat),
    setFormat,
    formatDate,
    formatDateShort,
    previewFormatted
  }
}

// Initialise once on client load
if (import.meta.client) {
  loadFromStorage()
}
