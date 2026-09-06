import rawAtB51 from '@/data/seeds/at-b51-raw.json'
import rawRfbtB99 from '@/data/seeds/rfbt-b99-raw.json'
import type { QuizQuestion, QuizSet } from '@/types/quiz'

interface RawQuizQuestion extends Omit<QuizQuestion, 'correctChoiceId'> {
  correctChoiceId: string | null
}

function isAnswered(question: RawQuizQuestion): question is QuizQuestion {
  return question.correctChoiceId !== null
}

// Topic tags for the AT Preweek B51 set, assigned by reading each question's
// content against the CPALE Auditing Theory table of specifications.
const AT_B51_SECTIONS: Record<string, string> = {
  'at-b51-st01': 'Professional Responsibilities & Ethics',
  'at-b51-st02': 'Engagement Planning & Risk Assessment',
  'at-b51-st03': 'Engagement Planning & Risk Assessment',
  'at-b51-st04': 'Engagement Planning & Risk Assessment',
  'at-b51-st05': 'Professional Responsibilities & Ethics',
  'at-b51-st06': 'Audit Evidence & Procedures',
  'at-b51-st07': 'Professional Responsibilities & Ethics',
  'at-b51-st08': 'Professional Responsibilities & Ethics',
  'at-b51-st09': 'Completing the Audit & Reporting',
  'at-b51-st10': 'Audit Evidence & Procedures',
  'at-b51-st11': 'Professional Responsibilities & Ethics',
  'at-b51-st12': 'Audit Evidence & Procedures',
  'at-b51-st13': 'Engagement Planning & Risk Assessment',
  'at-b51-st14': 'Audit Evidence & Procedures',
  'at-b51-st15': 'Engagement Planning & Risk Assessment',
  'at-b51-st16': 'Engagement Planning & Risk Assessment',
  'at-b51-st17': 'Engagement Planning & Risk Assessment',
  'at-b51-st18': 'Audit Evidence & Procedures',
  'at-b51-st19': 'Audit Evidence & Procedures',
  'at-b51-st20': 'Engagement Planning & Risk Assessment',
  'at-b51-st21': 'Professional Responsibilities & Ethics',
  'at-b51-st22': 'Audit Evidence & Procedures',
  'at-b51-st23': 'Professional Responsibilities & Ethics',
  'at-b51-st24': 'Audit Evidence & Procedures',
  'at-b51-st25': 'Audit Evidence & Procedures',
  'at-b51-st26': 'Audit Evidence & Procedures',
  'at-b51-st27': 'Engagement Planning & Risk Assessment',
  'at-b51-st28': 'Audit Evidence & Procedures',
  'at-b51-st29': 'Engagement Planning & Risk Assessment',
  'at-b51-st30': 'Engagement Planning & Risk Assessment',
  'at-b51-st31': 'Audit Evidence & Procedures',
  'at-b51-st32': 'Engagement Planning & Risk Assessment',
  'at-b51-st33': 'Professional Responsibilities & Ethics',
  'at-b51-st34': 'Professional Responsibilities & Ethics',
  'at-b51-st35': 'Engagement Planning & Risk Assessment',
  'at-b51-st36': 'Completing the Audit & Reporting',
}

export const atB51Quiz: QuizQuestion[] = (rawAtB51 as RawQuizQuestion[])
  .filter(isAnswered)
  .map((q) => ({ ...q, section: AT_B51_SECTIONS[q.id] }))

// Topic tags for the RFBT B99 First Preboard set, assigned by reading each
// question's content against the CPALE RFBT table of specifications.
const RFBT_B99_SECTIONS: Record<string, string> = {
  'rfbt-b99-001': 'Obligations & Contracts',
  'rfbt-b99-002': 'Obligations & Contracts',
  'rfbt-b99-003': 'Obligations & Contracts',
  'rfbt-b99-004': 'Obligations & Contracts',
  'rfbt-b99-005': 'Obligations & Contracts',
  'rfbt-b99-006': 'Obligations & Contracts',
  'rfbt-b99-007': 'Obligations & Contracts',
  'rfbt-b99-008': 'Banking Laws (PDIC & Bank Deposits)',
  'rfbt-b99-009': 'Banking Laws (PDIC & Bank Deposits)',
  'rfbt-b99-010': 'Banking Laws (PDIC & Bank Deposits)',
  'rfbt-b99-011': 'Obligations & Contracts',
  'rfbt-b99-012': 'Obligations & Contracts',
  'rfbt-b99-013': 'Obligations & Contracts',
  'rfbt-b99-014': 'Obligations & Contracts',
  'rfbt-b99-015': 'Obligations & Contracts',
  'rfbt-b99-016': 'Obligations & Contracts',
  'rfbt-b99-017': 'Labor Law',
  'rfbt-b99-018': 'Labor Law',
  'rfbt-b99-019': 'Labor Law',
  'rfbt-b99-020': 'Labor Law',
  'rfbt-b99-021': 'Anti-Money Laundering Law (AMLA)',
  'rfbt-b99-022': 'Anti-Money Laundering Law (AMLA)',
  'rfbt-b99-023': 'Obligations & Contracts',
  'rfbt-b99-024': 'Obligations & Contracts',
  'rfbt-b99-025': 'Obligations & Contracts',
  'rfbt-b99-026': 'Obligations & Contracts',
  'rfbt-b99-027': 'Credit Transactions',
  'rfbt-b99-028': 'Credit Transactions',
  'rfbt-b99-029': 'Obligations & Contracts',
  'rfbt-b99-030': 'Obligations & Contracts',
  'rfbt-b99-031': 'Insolvency Law (FRIA)',
  'rfbt-b99-032': 'Insolvency Law (FRIA)',
  'rfbt-b99-033': 'Obligations & Contracts',
  'rfbt-b99-034': 'Property & Torts',
  'rfbt-b99-035': 'Banking Laws (PDIC & Bank Deposits)',
  'rfbt-b99-036': 'Property & Torts',
  'rfbt-b99-037': 'Property & Torts',
  'rfbt-b99-038': 'Property & Torts',
  'rfbt-b99-039': 'Property & Torts',
  'rfbt-b99-040': 'Obligations & Contracts',
  'rfbt-b99-041': 'Obligations & Contracts',
  'rfbt-b99-042': 'Obligations & Contracts',
  'rfbt-b99-043': 'Obligations & Contracts',
  'rfbt-b99-044': 'Obligations & Contracts',
  'rfbt-b99-045': 'Obligations & Contracts',
  'rfbt-b99-046': 'Property & Torts',
  'rfbt-b99-047': 'Property & Torts',
  'rfbt-b99-048': 'Property & Torts',
  'rfbt-b99-049': 'Obligations & Contracts',
  'rfbt-b99-050': 'Obligations & Contracts',
  'rfbt-b99-051': 'Obligations & Contracts',
  'rfbt-b99-052': 'Obligations & Contracts',
  'rfbt-b99-053': 'Obligations & Contracts',
  'rfbt-b99-054': 'Obligations & Contracts',
  'rfbt-b99-055': 'Obligations & Contracts',
  'rfbt-b99-056': 'Obligations & Contracts',
  'rfbt-b99-057': 'Obligations & Contracts',
  'rfbt-b99-058': 'Obligations & Contracts',
  'rfbt-b99-059': 'Obligations & Contracts',
  'rfbt-b99-060': 'Obligations & Contracts',
  'rfbt-b99-061': 'Credit Transactions',
  'rfbt-b99-062': 'Credit Transactions',
  'rfbt-b99-063': 'Obligations & Contracts',
  'rfbt-b99-064': 'Obligations & Contracts',
  'rfbt-b99-065': 'Obligations & Contracts',
  'rfbt-b99-066': 'Obligations & Contracts',
  'rfbt-b99-067': 'Obligations & Contracts',
  'rfbt-b99-068': 'Obligations & Contracts',
  'rfbt-b99-069': 'Obligations & Contracts',
  'rfbt-b99-070': 'Obligations & Contracts',
  'rfbt-b99-071': 'Banking Laws (PDIC & Bank Deposits)',
  'rfbt-b99-072': 'Anti-Money Laundering Law (AMLA)',
  'rfbt-b99-073': 'Anti-Money Laundering Law (AMLA)',
  'rfbt-b99-074': 'Anti-Money Laundering Law (AMLA)',
  'rfbt-b99-075': 'Anti-Money Laundering Law (AMLA)',
  'rfbt-b99-076': 'Anti-Money Laundering Law (AMLA)',
  'rfbt-b99-077': 'Anti-Money Laundering Law (AMLA)',
  'rfbt-b99-078': 'Labor Law',
  'rfbt-b99-079': 'Insolvency Law (FRIA)',
  'rfbt-b99-080': 'Insolvency Law (FRIA)',
}

export const rfbtB99Quiz: QuizQuestion[] = (rawRfbtB99 as RawQuizQuestion[])
  .filter(isAnswered)
  .map((q) => ({ ...q, section: RFBT_B99_SECTIONS[q.id] }))

export const quizSets: QuizSet[] = [
  {
    id: 'at-preweek-b51',
    title: 'AT Preweek B51',
    description: 'Auditing Theory — preweek review, batch 51',
    code: 'AT',
    questions: atB51Quiz,
  },
  {
    id: 'rfbt-first-preboard-b99',
    title: 'RFBT Final Exam (All Review Centers)',
    description: 'Regulatory Framework for Business Transactions — compiled final exam, multiple review centers',
    code: 'RFBT',
    questions: rfbtB99Quiz,
  },
]
