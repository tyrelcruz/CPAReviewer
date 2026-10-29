/**
 * Synthetic subject codes that stand in for a full-length exam spanning every
 * currently-ingested subject of a board exam, rather than one real
 * `bank_questions.subject`/`tos_categories.subject` value — resolved to the
 * underlying subject list wherever pool selection or history filtering would
 * otherwise query by a single subject. "MTAP" mirrors the review-center name
 * already used for this style of full-subject mock in the ingested RMT kb
 * source material (see examType values in the kb JSON).
 */
export const COMPREHENSIVE_SUBJECTS: Record<string, string[]> = {
  MTAP: ['IS', 'BB'],
}

/** The real subject codes a requested subject draws from — itself, unless it's
 * a comprehensive code standing for several. */
export function resolveSubjectFilter(subject: string): string[] {
  return COMPREHENSIVE_SUBJECTS[subject] ?? [subject]
}
