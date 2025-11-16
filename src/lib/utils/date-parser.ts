/**
 * Natural language date parsing utilities
 * Parses phrases like "last week", "yesterday", "this month", "last 3 days"
 */

export interface DateRange {
  start: Date
  end: Date
  confidence: number
  description: string
}

export interface ParsedDate {
  date: Date
  confidence: number
  description: string
}

/**
 * Parse a natural language date query into a date range
 *
 * @param query Natural language date string
 * @param referenceDate Reference date (defaults to now)
 * @returns Parsed date range or null if unparseable
 */
export function parseNaturalDateRange(
  query: string,
  referenceDate: Date = new Date()
): DateRange | null {
  const q = query.toLowerCase().trim()

  // Try each parser in order
  const parsers = [
    parseRelativeDay,
    parseRelativeWeek,
    parseRelativeMonth,
    parseRelativeYear,
    parseLastNDays,
    parseLastNWeeks,
    parseLastNMonths,
    parseThisTimeUnit,
    parseToday,
  ]

  for (const parser of parsers) {
    const result = parser(q, referenceDate)
    if (result) return result
  }

  return null
}

/**
 * Parse a single date expression (not a range)
 *
 * @param query Natural language date string
 * @param referenceDate Reference date
 * @returns Parsed date or null
 */
export function parseNaturalDate(
  query: string,
  referenceDate: Date = new Date()
): ParsedDate | null {
  const range = parseNaturalDateRange(query, referenceDate)
  if (!range) return null

  return {
    date: range.start,
    confidence: range.confidence,
    description: range.description,
  }
}

/**
 * Parse "today", "now"
 */
function parseToday(query: string, referenceDate: Date): DateRange | null {
  if (!/(^|\s)(today|now)(\s|$)/.test(query)) return null

  const start = startOfDay(referenceDate)
  const end = endOfDay(referenceDate)

  return {
    start,
    end,
    confidence: 1.0,
    description: 'Today',
  }
}

/**
 * Parse "yesterday", "1 day ago"
 */
function parseRelativeDay(query: string, referenceDate: Date): DateRange | null {
  // Yesterday
  if (/(^|\s)(yesterday|yday)(\s|$)/.test(query)) {
    const date = addDays(referenceDate, -1)
    return {
      start: startOfDay(date),
      end: endOfDay(date),
      confidence: 1.0,
      description: 'Yesterday',
    }
  }

  // Tomorrow (less common for DAM but useful)
  if (/(^|\s)(tomorrow|tmrw?)(\s|$)/.test(query)) {
    const date = addDays(referenceDate, 1)
    return {
      start: startOfDay(date),
      end: endOfDay(date),
      confidence: 1.0,
      description: 'Tomorrow',
    }
  }

  return null
}

/**
 * Parse "last week", "this week", "next week"
 */
function parseRelativeWeek(query: string, referenceDate: Date): DateRange | null {
  // Last week
  if (/(^|\s)(last|prev(ious)?) week(\s|$)/.test(query)) {
    const weekStart = addDays(startOfWeek(referenceDate), -7)
    const weekEnd = addDays(weekStart, 6)

    return {
      start: startOfDay(weekStart),
      end: endOfDay(weekEnd),
      confidence: 1.0,
      description: 'Last week',
    }
  }

  // This week - covered by parseThisTimeUnit

  return null
}

/**
 * Parse "last month", "this month", "next month"
 */
function parseRelativeMonth(query: string, referenceDate: Date): DateRange | null {
  // Last month
  if (/(^|\s)(last|prev(ious)?) month(\s|$)/.test(query)) {
    const lastMonth = addMonths(referenceDate, -1)
    const start = startOfMonth(lastMonth)
    const end = endOfMonth(lastMonth)

    return {
      start,
      end,
      confidence: 1.0,
      description: 'Last month',
    }
  }

  return null
}

/**
 * Parse "last year", "this year"
 */
function parseRelativeYear(query: string, referenceDate: Date): DateRange | null {
  // Last year
  if (/(^|\s)(last|prev(ious)?) year(\s|$)/.test(query)) {
    const lastYear = addYears(referenceDate, -1)
    const start = startOfYear(lastYear)
    const end = endOfYear(lastYear)

    return {
      start,
      end,
      confidence: 1.0,
      description: 'Last year',
    }
  }

  // This year - covered by parseThisTimeUnit

  return null
}

/**
 * Parse "last N days", "past N days", "last N day"
 */
function parseLastNDays(query: string, referenceDate: Date): DateRange | null {
  const match = query.match(/(last|past|previous)\s+(\d+)\s+days?/)
  if (!match) return null

  const n = parseInt(match[2], 10)
  if (isNaN(n) || n <= 0) return null

  const end = endOfDay(referenceDate)
  const start = startOfDay(addDays(referenceDate, -n + 1))

  return {
    start,
    end,
    confidence: 0.95,
    description: `Last ${n} day${n === 1 ? '' : 's'}`,
  }
}

/**
 * Parse "last N weeks", "past N weeks"
 */
function parseLastNWeeks(query: string, referenceDate: Date): DateRange | null {
  const match = query.match(/(last|past|previous)\s+(\d+)\s+weeks?/)
  if (!match) return null

  const n = parseInt(match[2], 10)
  if (isNaN(n) || n <= 0) return null

  const end = endOfDay(referenceDate)
  const start = startOfDay(addDays(referenceDate, -n * 7 + 1))

  return {
    start,
    end,
    confidence: 0.95,
    description: `Last ${n} week${n === 1 ? '' : 's'}`,
  }
}

/**
 * Parse "last N months", "past N months"
 */
function parseLastNMonths(query: string, referenceDate: Date): DateRange | null {
  const match = query.match(/(last|past|previous)\s+(\d+)\s+months?/)
  if (!match) return null

  const n = parseInt(match[2], 10)
  if (isNaN(n) || n <= 0) return null

  const start = startOfMonth(addMonths(referenceDate, -n + 1))
  const end = endOfDay(referenceDate)

  return {
    start,
    end,
    confidence: 0.95,
    description: `Last ${n} month${n === 1 ? '' : 's'}`,
  }
}

/**
 * Parse "this week", "this month", "this year"
 */
function parseThisTimeUnit(query: string, referenceDate: Date): DateRange | null {
  // This week
  if (/(^|\s)this week(\s|$)/.test(query)) {
    const start = startOfWeek(referenceDate)
    const end = endOfWeek(referenceDate)

    return {
      start,
      end,
      confidence: 1.0,
      description: 'This week',
    }
  }

  // This month
  if (/(^|\s)this month(\s|$)/.test(query)) {
    const start = startOfMonth(referenceDate)
    const end = endOfMonth(referenceDate)

    return {
      start,
      end,
      confidence: 1.0,
      description: 'This month',
    }
  }

  // This year
  if (/(^|\s)this year(\s|$)/.test(query)) {
    const start = startOfYear(referenceDate)
    const end = endOfYear(referenceDate)

    return {
      start,
      end,
      confidence: 1.0,
      description: 'This year',
    }
  }

  return null
}

/**
 * Check if a date falls within a range
 */
export function isDateInRange(date: Date, range: DateRange): boolean {
  const time = date.getTime()
  return time >= range.start.getTime() && time <= range.end.getTime()
}

// Date utility functions

function startOfDay(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

function endOfDay(date: Date): Date {
  const d = new Date(date)
  d.setHours(23, 59, 59, 999)
  return d
}

function startOfWeek(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day // Sunday = 0
  d.setDate(diff)
  return startOfDay(d)
}

function endOfWeek(date: Date): Date {
  const d = startOfWeek(date)
  d.setDate(d.getDate() + 6)
  return endOfDay(d)
}

function startOfMonth(date: Date): Date {
  const d = new Date(date)
  d.setDate(1)
  return startOfDay(d)
}

function endOfMonth(date: Date): Date {
  const d = new Date(date)
  d.setMonth(d.getMonth() + 1)
  d.setDate(0)
  return endOfDay(d)
}

function startOfYear(date: Date): Date {
  const d = new Date(date)
  d.setMonth(0)
  d.setDate(1)
  return startOfDay(d)
}

function endOfYear(date: Date): Date {
  const d = new Date(date)
  d.setMonth(11)
  d.setDate(31)
  return endOfDay(d)
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

function addMonths(date: Date, months: number): Date {
  const d = new Date(date)
  d.setMonth(d.getMonth() + months)
  return d
}

function addYears(date: Date, years: number): Date {
  const d = new Date(date)
  d.setFullYear(d.getFullYear() + years)
  return d
}

/**
 * Format a date range for display
 */
export function formatDateRange(range: DateRange): string {
  if (range.description) return range.description

  const startStr = formatDate(range.start)
  const endStr = formatDate(range.end)

  if (startStr === endStr) return startStr
  return `${startStr} - ${endStr}`
}

/**
 * Format a single date for display
 */
function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

/**
 * Extract date-related tokens from a query
 * Returns the query with date tokens removed, plus the extracted date range
 */
export function extractDateFromQuery(
  query: string,
  referenceDate: Date = new Date()
): { cleanQuery: string; dateRange: DateRange | null } {
  const q = query.toLowerCase()

  // List of date patterns to try
  const datePatterns = [
    /\b(yesterday|yday)\b/,
    /\b(today|now)\b/,
    /\b(tomorrow|tmrw?)\b/,
    /\b(last|past|previous)\s+week\b/,
    /\bthis\s+week\b/,
    /\b(last|past|previous)\s+month\b/,
    /\bthis\s+month\b/,
    /\b(last|past|previous)\s+year\b/,
    /\bthis\s+year\b/,
    /\b(last|past|previous)\s+\d+\s+days?\b/,
    /\b(last|past|previous)\s+\d+\s+weeks?\b/,
    /\b(last|past|previous)\s+\d+\s+months?\b/,
  ]

  let dateRange: DateRange | null = null
  let cleanQuery = query

  for (const pattern of datePatterns) {
    const match = q.match(pattern)
    if (match) {
      dateRange = parseNaturalDateRange(match[0], referenceDate)
      if (dateRange) {
        // Remove the date portion from query
        cleanQuery = query.replace(new RegExp(pattern, 'i'), '').trim()
        break
      }
    }
  }

  // Clean up extra spaces
  cleanQuery = cleanQuery.replace(/\s+/g, ' ').trim()

  return { cleanQuery, dateRange }
}
