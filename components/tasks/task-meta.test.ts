import { describe, expect, it } from 'vitest'
import { formatDueDate, isOverdue, toDateInputValue } from './task-meta'

const now = new Date('2026-10-22T15:00:00Z')

describe('isOverdue', () => {
  it('is true for an open task due before today', () => {
    expect(isOverdue('2026-10-21T00:00:00.000Z', 'TODO', now)).toBe(true)
    expect(isOverdue('2026-10-21T00:00:00.000Z', 'IN_PROGRESS', now)).toBe(true)
  })

  it('is false for a task due today or later', () => {
    expect(isOverdue('2026-10-22T00:00:00.000Z', 'TODO', now)).toBe(false)
    expect(isOverdue('2026-11-01T00:00:00.000Z', 'TODO', now)).toBe(false)
  })

  it('is false for done tasks and tasks without a due date', () => {
    expect(isOverdue('2026-10-01T00:00:00.000Z', 'DONE', now)).toBe(false)
    expect(isOverdue(null, 'TODO', now)).toBe(false)
  })
})

describe('date formatting', () => {
  it('formats the calendar date in UTC', () => {
    expect(formatDueDate('2026-10-25T00:00:00.000Z')).toBe('Oct 25, 2026')
  })

  it('converts to a date input value', () => {
    expect(toDateInputValue('2026-10-25T00:00:00.000Z')).toBe('2026-10-25')
    expect(toDateInputValue(null)).toBe('')
  })
})
