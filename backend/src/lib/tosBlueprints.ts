/**
 * Official PRC tables of specifications, per subject: the per-topic item
 * allocation a `tos_simulator`-mode exam must follow, plus the rule that maps
 * an ingested bank question's own (topic_category, sub_topic) tagging onto one
 * of that table's rows.
 *
 * Lives here rather than inline in routes/exams.ts because there are now two
 * of them (RFBT, TAX) and TAX's mapping is substantial — the route just looks
 * up a blueprint by subject and treats every one the same way.
 */

export interface TosBlueprintRow {
  category: string
  /** Share of a full-length exam this topic takes, 0-1. */
  weightPct: number
  /**
   * Theory / problem item split exactly as the PRC table publishes it —
   * only for tables expressed in items (TAX); null for ones published as
   * bare percentages (RFBT), where there is no such split to report.
   */
  theory: number | null
  problem: number | null
}

export interface TosBlueprint {
  rows: TosBlueprintRow[]
  /**
   * Maps one bank question onto a blueprint row. Returning '' means the
   * blueprint deliberately doesn't cover that question, which excludes it
   * from tos_simulator selection for the subject.
   */
  resolveCategory(topicCategory: string, subTopic: string): string
}

type SubTopicRule = [pattern: RegExp, category: string]

function firstMatch(rules: SubTopicRule[], subTopic: string): string | null {
  for (const [pattern, category] of rules) {
    if (pattern.test(subTopic)) return category
  }
  return null
}

/* ------------------------------------------------------------------ RFBT */

/**
 * RFBT's table is keyed directly by the `sub_topic` values its ingested
 * questions use. Topics outside it (Obligations, Contracts, Sales, AMLA, …)
 * sit outside the PRC table and stay excluded from tos_simulator selection.
 */
const RFBT_CATEGORY_BY_SUBTOPIC: Record<string, string> = {
  Corporations: 'Revised Corp Code',
  Partnerships: 'Partnership',
  Cooperatives: 'Cooperatives',
  'Financial Rehabilitation and Insolvency Act': 'FRIA Act',
  'Labor Law': 'Labor and SSS Law',
  'Social Security Law': 'Labor and SSS Law',
  Insurance: 'Insurance',
}

const rfbtBlueprint: TosBlueprint = {
  rows: [
    { category: 'Revised Corp Code', weightPct: 0.57, theory: null, problem: null },
    { category: 'Partnership', weightPct: 0.12, theory: null, problem: null },
    { category: 'Cooperatives', weightPct: 0.1, theory: null, problem: null },
    { category: 'FRIA Act', weightPct: 0.1, theory: null, problem: null },
    { category: 'Labor and SSS Law', weightPct: 0.06, theory: null, problem: null },
    { category: 'Insurance', weightPct: 0.05, theory: null, problem: null },
  ],
  resolveCategory: (_topicCategory, subTopic) => RFBT_CATEGORY_BY_SUBTOPIC[subTopic] ?? '',
}

/* ------------------------------------------------------------------- TAX */

/**
 * The PRC "Tax PFDE" table: 50 theory + 20 problem = 70 items. Estate tax and
 * Donor's tax are published with a blank allocation, so they carry weight 0 —
 * they're still real rows (a student can draw from them via the per-topic
 * customization UI, and every transfer-tax question in the bank is classified
 * into one of them), they just don't appear in a default TOS-ratio exam.
 */
const TAX_TOS_ROWS: { category: string; theory: number; problem: number }[] = [
  { category: 'General Principles', theory: 12, problem: 0 },
  { category: 'Gross income', theory: 2, problem: 0 },
  { category: 'Allowable deductions', theory: 2, problem: 0 },
  { category: 'Taxation of individuals', theory: 4, problem: 3 },
  { category: 'Taxation of corporations', theory: 4, problem: 3 },
  { category: 'Capital gains tax', theory: 1, problem: 1 },
  { category: 'Preferential Taxation', theory: 8, problem: 2 },
  { category: 'Local Government Taxation', theory: 3, problem: 2 },
  { category: 'VAT-subjected Transactions', theory: 4, problem: 4 },
  { category: 'VAT-exempt Transactions', theory: 4, problem: 0 },
  { category: 'Input VAT', theory: 2, problem: 2 },
  { category: 'Other Percentage tax', theory: 4, problem: 3 },
  { category: 'Estate tax', theory: 0, problem: 0 },
  { category: "Donor's tax", theory: 0, problem: 0 },
]

const TAX_TOS_TOTAL = TAX_TOS_ROWS.reduce((sum, r) => sum + r.theory + r.problem, 0)

/**
 * TAX question tagging is far messier than RFBT's — 24 distinct
 * `topic_category` values across the ingested sources, most of them finer or
 * coarser than a TOS row (e.g. "Tax Remedies", "Transfer Taxes",
 * "Income Taxation - Individuals"). These map a whole topic_category onto one
 * row; the rest are disambiguated by sub_topic below.
 */
const TAX_CATEGORY_BY_TOPIC_CATEGORY: Record<string, string> = {
  // The TOS's "General Principles" row covers tax administration and the
  // taxpayer/government remedies that the bank tags as their own categories.
  'Principles of Taxation': 'General Principles',
  'Taxation Principles': 'General Principles',
  'General Principles of Taxation': 'General Principles',
  'Tax Administration': 'General Principles',
  'Tax Administration and Compliance': 'General Principles',
  'Tax Remedies': 'General Principles',
  'International Taxation': 'General Principles',

  'Local Taxation': 'Local Government Taxation',
  'Local Government Taxation': 'Local Government Taxation',

  'Preferential Taxation': 'Preferential Taxation',
  'Tax Incentives': 'Preferential Taxation',

  // "Other Percentage tax" is the table's only row for a business tax that
  // isn't VAT, so excise and documentary stamp tax land here too.
  'Percentage Tax': 'Other Percentage tax',
  'Percentage Taxes': 'Other Percentage tax',
  'Excise Tax': 'Other Percentage tax',
  'Documentary Stamp Tax': 'Other Percentage tax',
}

/** Income-tax topic_category -> the row its questions default to. */
const TAX_INCOME_DEFAULTS: Record<string, string> = {
  'Income Taxation': 'Taxation of individuals',
  'Income Taxation - Individuals': 'Taxation of individuals',
  'Income Taxation - Corporations': 'Taxation of corporations',
  // A taxable partnership is taxed as a corporation, and GPP entity-level
  // rules are taught alongside corporations.
  'Income Taxation - Partnerships': 'Taxation of corporations',
  'Income Taxation - Deductions': 'Allowable deductions',
}

/** Rows that cut across every income-tax category and so win over its default. */
const TAX_INCOME_CROSSCUT_RULES: SubTopicRule[] = [
  [/capital gain|wash sale|shares of stock|unlisted|through the stock exchange|installment method/i, 'Capital gains tax'],
  [/bmbe|barangay micro|special laws/i, 'Preferential Taxation'],
  [/deduction|deductible|expense|bad debts|taxes and licenses|r&d/i, 'Allowable deductions'],
]

/**
 * Only for the bank's untyped "Income Taxation" category, which mixes
 * individual, corporate and gross-income items under one label. Estates and
 * trusts intentionally fall through to the individuals default — they're
 * taxed like individuals.
 */
const TAX_GENERIC_INCOME_RULES: SubTopicRule[] = [
  [/gross income|exclusion|constructive receipt|cancellation of indebtedness|fringe benefit|de minimis|compensation income|passive income|final withholding|dividend|interest income/i, 'Gross income'],
  [/corporat|mcit|joint venture|proprietary educational|accounting method|worthless securities|tax benefit rule|partnership/i, 'Taxation of corporations'],
]

const TAX_TRANSFER_TOPIC_CATEGORIES = new Set(['Transfer Taxes', "Estate and Donor's Tax"])

const TAX_TRANSFER_RULES: SubTopicRule[] = [
  [/capital gains tax/i, 'Capital gains tax'],
  [/donor|donation|gift|donee|inter vivos|renunciation|condonation|insufficient consideration/i, "Donor's tax"],
]

/**
 * Applies to both VAT-tagged and generically "Business Taxes"-tagged items.
 * "special laws" here is the senior-citizen / PWD / BMBE style statutory
 * exemption, not the income-tax incentive regimes that phrase means under an
 * income-tax category.
 */
const TAX_VAT_RULES: SubTopicRule[] = [
  [/input (?:tax|vat)/i, 'Input VAT'],
  [/exempt|zero[- ]rated|senior citizen|solo parent|pwd|residential unit|medical services|special laws/i, 'VAT-exempt Transactions'],
]

/**
 * Only for the bank's untyped "Business Taxes" category, which mixes VAT with
 * the non-VAT business taxes — an item tagged "Value-Added Tax" that mentions
 * insurance premiums is VAT on non-life insurance, not the premium tax.
 */
const TAX_OTHER_BUSINESS_TAX_RULES: SubTopicRule[] = [
  [/percentage tax|gross receipts tax|franchise tax|amusement|common carrier|stock transaction|overseas communication|insurance premium|excise|documentary stamp/i, 'Other Percentage tax'],
]

/**
 * Every TAX question resolves to a row — unlike RFBT, nothing is left
 * unclassified, so the whole 400+ item TAX bank is reachable through the TOS
 * topics rather than only the slice the blueprint happens to name.
 */
function resolveTaxCategory(topicCategory: string, subTopic: string): string {
  const direct = TAX_CATEGORY_BY_TOPIC_CATEGORY[topicCategory]
  if (direct) return direct

  const incomeDefault = TAX_INCOME_DEFAULTS[topicCategory]
  if (incomeDefault) {
    const crosscut = firstMatch(TAX_INCOME_CROSSCUT_RULES, subTopic)
    if (crosscut) return crosscut
    if (topicCategory === 'Income Taxation') {
      return firstMatch(TAX_GENERIC_INCOME_RULES, subTopic) ?? incomeDefault
    }
    return incomeDefault
  }

  if (TAX_TRANSFER_TOPIC_CATEGORIES.has(topicCategory)) {
    return firstMatch(TAX_TRANSFER_RULES, subTopic) ?? 'Estate tax'
  }

  if (topicCategory === 'Value-Added Tax') {
    return firstMatch(TAX_VAT_RULES, subTopic) ?? 'VAT-subjected Transactions'
  }
  if (topicCategory === 'Business Taxes') {
    return (
      firstMatch(TAX_VAT_RULES, subTopic) ??
      firstMatch(TAX_OTHER_BUSINESS_TAX_RULES, subTopic) ??
      'VAT-subjected Transactions'
    )
  }

  // A topic_category no ingest has produced yet. Parking it in General
  // Principles keeps the "every question is reachable" guarantee above true;
  // the warning is how a new category gets noticed and classified properly.
  warnUnmappedTaxCategory(topicCategory)
  return 'General Principles'
}

const warnedTaxCategories = new Set<string>()

function warnUnmappedTaxCategory(topicCategory: string): void {
  if (warnedTaxCategories.has(topicCategory)) return
  warnedTaxCategories.add(topicCategory)
  console.warn(
    `tosBlueprints: TAX topic_category "${topicCategory}" has no TOS mapping — defaulting its questions to "General Principles".`,
  )
}

const taxBlueprint: TosBlueprint = {
  rows: TAX_TOS_ROWS.map((row) => ({
    category: row.category,
    weightPct: (row.theory + row.problem) / TAX_TOS_TOTAL,
    theory: row.theory,
    problem: row.problem,
  })),
  resolveCategory: resolveTaxCategory,
}

/* ------------------------------------------------------------------- API */

const TOS_BLUEPRINTS: Record<string, TosBlueprint> = {
  RFBT: rfbtBlueprint,
  TAX: taxBlueprint,
}

/** undefined for a subject with no PRC table yet — the caller falls back to a
 * plain difficulty-balanced draw instead of TOS-ratio selection. */
export function getTosBlueprint(subject: string): TosBlueprint | undefined {
  return TOS_BLUEPRINTS[subject]
}

export function tosCategoryWeights(blueprint: TosBlueprint): Record<string, number> {
  return Object.fromEntries(blueprint.rows.map((row) => [row.category, row.weightPct]))
}
