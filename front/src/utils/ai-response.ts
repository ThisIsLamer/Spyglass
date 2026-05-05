import type { AnalysisEvent } from '@/api/analysis'

/**
 * Normalized AI check item ready for UI rendering.
 * `valid === null` means the check is not applicable for this scene
 * (for example, person is exiting, so security checks don't apply).
 */
export interface AiCheck {
  key: string
  label: string
  valid: boolean | null
  message: string
}

export interface AiVisitorCount {
  label: string
  count: number
  message: string
}

export type SceneDirection = 'entry' | 'exit' | 'unknown' | null

export type Lang = 'ru' | 'en'

interface RawCheck {
  key: string
  label?: Record<string, string>
  valid: boolean | null
  message?: Record<string, string>
}

interface RawVisitorCount {
  label?: Record<string, string>
  count: number
  message?: Record<string, string>
}

/** Pick a localized string from a `{ en, ru }` map, falling back to english. */
function pickLang (value: Record<string, string> | string | undefined | null, lang: Lang, fallback = ''): string {
  if (!value) {
    return fallback
  }
  if (typeof value === 'string') {
    return value
  }
  return value[lang] ?? value.en ?? fallback
}

export function getSceneDirection (response: Record<string, unknown> | null | undefined): SceneDirection {
  if (!response) {
    return null
  }
  const raw = response.scene_direction
  if (raw === 'entry' || raw === 'exit' || raw === 'unknown') {
    return raw
  }
  return null
}

export function isSceneNotApplicable (direction: SceneDirection): boolean {
  return direction === 'exit'
}

export function getChecks (response: Record<string, unknown> | null | undefined, lang: Lang): AiCheck[] {
  if (!response) {
    return []
  }
  const raw = response.checks as RawCheck[] | undefined
  if (!Array.isArray(raw)) {
    return []
  }

  return raw.map(c => ({
    key: c.key,
    label: pickLang(c.label, lang, c.key),
    valid: c.valid ?? null,
    message: pickLang(c.message, lang),
  }))
}

export function getVisitorCount (response: Record<string, unknown> | null | undefined, lang: Lang): AiVisitorCount | null {
  if (!response) {
    return null
  }
  const raw = response.visitor_count as RawVisitorCount | undefined
  if (!raw) {
    return null
  }

  return {
    label: pickLang(raw.label, lang, 'Visitors'),
    count: raw.count,
    message: pickLang(raw.message, lang),
  }
}

export function getSummary (response: Record<string, unknown> | null | undefined, lang: Lang): string | null {
  if (!response) {
    return null
  }
  const raw = response.summary as Record<string, string> | string | undefined
  if (!raw) {
    return null
  }
  const value = pickLang(raw, lang)
  return value || null
}

/**
 * Aggregate stats for a check group. Used for filtering in the events list.
 */
export interface EventCheckSummary {
  hasViolations: boolean
  allValid: boolean
  allNotApplicable: boolean
  direction: SceneDirection
}

export function summarizeEvent (event: AnalysisEvent): EventCheckSummary {
  const direction = getSceneDirection(event.aiResponse)
  const checks = getChecks(event.aiResponse, 'en')

  const nonNull = checks.filter(c => c.valid !== null)
  const hasViolations = nonNull.some(c => c.valid === false)
  const allValid = nonNull.length > 0 && nonNull.every(c => c.valid === true)
  const allNotApplicable = checks.length > 0 && checks.every(c => c.valid === null)

  return { hasViolations, allValid, allNotApplicable, direction }
}
