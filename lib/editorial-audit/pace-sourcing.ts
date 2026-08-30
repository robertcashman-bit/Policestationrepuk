/**
 * PACE editorial sourcing — flags bare "PACE" in substantive copy (>200 chars)
 * without a statutory or Code cite.
 */

/** Acceptable cite patterns for PACE references. */
const PACE_CITE_PATTERN =
  /\b(?:Code [A-H]|s\.\d|section \d|Act 1984|PACE 1984|Police and Criminal Evidence Act 1984|PACE Codes?(?:\s+of Practice|\s+[A-H])?|PACE\b[^.]{0,48}\bCodes of Practice)\b/i;

export function hasPaceStatutoryCite(text: string): boolean {
  return PACE_CITE_PATTERN.test(text);
}

/** True when text should raise a PACE sourcing review finding. */
export function paceSourcingViolation(text: string): boolean {
  return /\bPACE\b/i.test(text) && !hasPaceStatutoryCite(text) && text.length > 200;
}

/** Common legacy phrases — used in regression tests. */
export const LEGACY_PACE_SOURCING_SNIPPETS: { id: string; text: string }[] = [
  {
    id: 'legacy:role-summary',
    text: 'A police station representative advises clients in police custody or at voluntary interviews, reviews disclosure, takes instructions, advises on interview strategy, and attends interviews — under the supervision of a criminal defence firm and within PACE rules.',
  },
  {
    id: 'legacy:role-section',
    text: 'PACE and professional boundaries\nReps must apply PACE when advising clients — not improvise from general criminal law knowledge alone. That includes custody rights, appropriate adults for juveniles and vulnerable adults, interpreter needs, and medical assessments where relevant. Reps do not instruct clients to lie or obstruct investigation.',
  },
  {
    id: 'legacy:exam-summary',
    text: 'Effective PSRAS preparation combines spaced PACE revision, timed MCQ practice, weekly CIT scenarios, and firm feedback on workbook attendances. Mock exams under time pressure reveal gaps better than passive reading. Use firm mock assessments alongside timed practice sets in the final month before assessment.',
  },
  {
    id: 'legacy:portfolio-bullets',
    text: 'What to document well\nType of attendance (custody, voluntary, telephone)\nSupervisor involvement and debrief\nPACE issues encountered (even if resolved)\nInterview advice given and outcome\nReflection on what you would do differently',
  },
];
