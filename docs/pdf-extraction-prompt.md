# PDF → Question Bank JSON: extraction prompt

Reusable prompt for turning a PDF questionnaire (any course, not just CPA
subjects) into a JSON file the bank ingestion pipeline can absorb directly.

## What this feeds

The JSON this prompt produces is consumed by
[`backend/src/lib/bankIngest.ts`](../backend/src/lib/bankIngest.ts) via
[`backend/src/scripts/ingestBank.ts`](../backend/src/scripts/ingestBank.ts):

```
cd backend
npx tsx src/scripts/ingestBank.ts <path-to-your-file.json>
```

That script accepts either a bare JSON array of question records, or
`{ "meta": {...}, "questions": [...] }` — either works, the prompt below
outputs the bare array form. Every record is validated by `validate()` in
`bankIngest.ts` before it's written to `bank_questions` / `bank_choices` /
`bank_sources` / `tos_categories` — if a record fails validation it's silently
skipped and reported at the end, so matching the shape exactly matters more
than making it "look right."

Two things the ingester does automatically, so don't try to do them yourself:
- **Dedup across sources** happens on a normalized hash of `canonicalConcept`
  (lowercased, whitespace-collapsed) scoped to `tos.subject` — two questions
  from different PDFs that test the same concept merge into one
  `bank_questions` row with multiple `bank_sources` rows, rather than
  duplicating. This is why `canonicalConcept` matters even for a single-PDF
  extraction: get it wrong and a future batch won't merge against it correctly.
- **Topic code collisions** are auto-disambiguated (`A.1` → `A.1~1` if a
  different topic already claims `A.1` for that subject) — you don't need to
  pre-check the database for existing codes.

Note on the `tos` object in the schema below: the app's internal name for it
is a holdover from an earlier CPA-specific "table of specifications" feature,
but the field itself is just plain topic/difficulty metadata used for
filtering and practice-exam generation. Your source PDF does **not** need to
contain any formal blueprint, table of specifications, or exam standard for
you to fill this in — you derive it entirely by reading the questions
yourself. Nothing about it is CPA-specific.

Note on the `reviewNote` field the prompt asks the model to add on flagged
records: `bankIngest.ts`'s `validate()` doesn't reject unknown extra
properties, so a record carrying `reviewNote` still ingests fine — but the
field isn't one of the columns the ingester writes anywhere, so **it is not
stored in the database**. It only exists so you (the human) can grep the
saved JSON for `"reviewNote"` before running `ingestBank.ts`, decide whether
to hand-fix any of those records first, and then strip the field or leave it
(harmless either way, since it's simply dropped on ingestion).

## How to use this

1. Paste the prompt block below into a chat with the PDF(s) attached (Claude,
   ChatGPT, etc. — anything with PDF/vision input and a large enough context
   window for the whole document). You can attach more than one PDF at once
   (including duplicate/near-duplicate copies of the same material) — the
   prompt handles batching and dedup itself now, so you don't need to run
   them one at a time or pre-sort duplicates out.
2. Optionally tell it `SUBJECT_CODE` / `SOURCE_CENTER` / `BATCH` up front if
   you already know them (e.g. "SUBJECT_CODE: IS, SOURCE_CENTER: Unspecified,
   BATCH: PRELIM"). If you don't, the prompt now derives sensible defaults
   itself instead of asking you — it will not stop to interview you about
   scope, duplicates, or output format.
3. Save the model's JSON output to a file and run it through `ingestBank.ts`
   as above. Check the console output for `skipped` records — if any appear,
   read the reason and fix that record by hand rather than re-running the
   whole extraction.

For a very large batch (200+ questions across several PDFs), expect some
records to carry a `reviewNote` field (missing/ambiguous source answer keys,
OCR reconstruction, disagreement with a stated answer, etc.) — that's
expected behavior per FLAGGING FOR HUMAN REVIEW, not something to interrupt
the model over. After ingestion, grep the saved JSON for `"reviewNote"` and
review those specific records by hand rather than re-prompting.

If a single extraction pass produces a truncated or malformed JSON array
(common past a few hundred questions in one completion), split the PDF set
into two smaller batches and run the same prompt again for the rest — output
quality (rationale generation, canonical-concept consistency) also holds up
better in batches of roughly 100-150 questions than in one giant pass.

---

## The prompt

```
You are extracting a question bank from the attached PDF(s) — questionnaires,
pre-tests/post-tests, quizzes, whatever exam-style material is attached — and
converting them into a specific JSON schema for ingestion into a study-app
database. The source material may be about ANY subject or course —
accounting, law, medicine, engineering, a corporate training exam, whatever is
in the PDF. Do not assume CPA-specific content; classify strictly from what's
actually in the document.

=== DO NOT ASK CLARIFYING QUESTIONS — JUST PRODUCE THE OUTPUT ===
This is a one-shot, non-interactive task. Do not stop to ask about scope,
batching, duplicate handling, metadata values, or output format — resolve all
of that yourself using the defaults below and go straight to producing the
final JSON. The only acceptable reason to stop before outputting JSON is that
an attached file is not actually readable as a document at all (e.g. it's
corrupted or isn't a questionnaire/exam in the first place). Missing metadata,
messy OCR, missing answer keys, or multiple/duplicate files are NEVER reasons
to pause and ask — handle them with the rules below and keep going.
- **Multiple files attached:** process all of them together into ONE combined
  JSON array in this single response, in the order given. Don't ask whether
  to batch them or do them one at a time.
- **Duplicate questions, wherever they come from** — duplicate/near-duplicate
  files (`foo.pdf` / `foo (1).pdf`, overlapping content), the same question
  repeated in more than one section of one file, or a question that recurs
  verbatim inside a single compiled document: always merge down to ONE record
  per distinct question in your final output, never one record per
  occurrence. When copies differ slightly (one has cleaner OCR, one has an
  answer key the other lacks, one has a rationale and one doesn't), merge the
  best version of each field from whichever copy has it — don't ask which
  copy to prefer, and don't emit near-identical records side by side "to be
  safe." One distinct question in, one record out.
- **A single PDF containing multiple sections** (e.g. a Pre-Test AND a
  Post-Test, or several distinct topic tests back to back): extract all
  sections into the same output batch. Use the section heading itself to set
  each question's `source.examType` per-record (see EXAM_TYPE below) — don't
  ask whether to split sections into separate runs.
- **Output format:** always return the JSON directly as your response body
  (or write it to a single output file if your environment saves files by
  default) — never ask whether the user wants it printed vs. saved.

=== VARIABLES ===
Use whatever the user already told you. For anything not given, resolve it
yourself with the default rule below — never ask.

SUBJECT_CODE:  short code, max 16 chars, identifying the subject/course. If
               not given, derive one yourself from the course/subject name
               that appears in the PDF content or filename (e.g. an
               "Immunology & Serology" document → "IS"). Use the SAME code for
               every record in this batch, even across multiple files/sections.
SOURCE_CENTER: who produced this material. If not given or not identifiable,
               default to the literal string "Unspecified" — never invent a
               specific institution/review-center name, and never leave this
               blank (the field is required to be a non-empty string).
BATCH:         a label for this extraction run. If not given, derive one from
               whatever term/week/year/exam-period is mentioned in the PDF(s)
               or filename (e.g. "PRELIM", "Week1-2026"); if nothing at all is
               identifiable, use "Batch-1".
EXAM_TYPE:     per-record, not a single fixed value — set it from whichever
               section/test the specific question actually appears under in
               its source PDF (e.g. "Pre-Test", "Post-Test", "Quiz 1"). If a
               PDF has no such labeling at all, use a generic value like
               "Practice Set" for every question in it.

=== OUTPUT SCHEMA ===
Return ONLY a JSON array (no markdown fences, no commentary before/after) of
objects, each shaped EXACTLY like this:

{
  "id": "string, globally unique, e.g. \"<SUBJECT_CODE>-<BATCH>-Q001\"",
  "prompt": "string, the full question stem, verbatim from the PDF",
  "choices": [
    { "id": "A", "text": "string, choice text verbatim" },
    { "id": "B", "text": "string" },
    { "id": "C", "text": "string" },
    { "id": "D", "text": "string" }
  ],
  "correctChoiceId": "string, MUST exactly equal one of the choices[].id above",
  "rationale": "string, see RATIONALE RULES below — never empty",
  "source": {
    "center": "SOURCE_CENTER",
    "batch": "BATCH",
    "examType": "string — this question's own section/test label (see EXAM_TYPE above), NOT necessarily the same for every record in the batch"
  },
  "tos": {
    "subject": "SUBJECT_CODE",
    "topicCategory": "string, the broad topic/chapter this question belongs to — you invent this by reading the question, no external syllabus/blueprint needed",
    "subTopic": "string, the specific concept within that topic",
    "tosCode": "string, short code for this topic, e.g. \"A.1\", \"B.3\" — see TOPIC CLASSIFICATION RULES",
    "cognitiveLevel": "string, one of: Knowledge, Comprehension, Application, Analysis, Evaluation, Synthesis (Bloom's taxonomy — pick the single best fit)",
    "difficulty": "string, MUST be exactly one of: \"Easy\", \"Moderate\", \"Difficult\""
  },
  "canonicalConcept": "string, see CANONICAL CONCEPT RULES below",
  "reviewNote": "OPTIONAL string — see FLAGGING FOR HUMAN REVIEW below. Omit this key entirely on records that don't need review; never set it to null/empty."
}

=== HARD REQUIREMENTS (a record is rejected if any of these are violated) ===
- "choices" must have at least 2 entries; every choice needs a non-empty "id" and "text".
- "correctChoiceId" must match one of the choices' "id" values exactly (case-sensitive).
- "rationale" must never be an empty string, and must NEVER contain the phrase
  "not provided" in any casing — that literal phrase is treated by the
  ingester as a placeholder marker and will be silently overwritten later.
  If you don't have a rationale to extract, GENERATE one — see below — don't
  leave a stub.
- "difficulty" must be exactly "Easy", "Moderate", or "Difficult" (capitalized
  exactly like that) — not "easy", not "medium", not "hard".
- Every field listed in the schema above is required; do not omit any. The
  ONLY optional extra field allowed is "reviewNote" (see FLAGGING FOR HUMAN
  REVIEW below) — do not add any other extra top-level fields.

=== CHOICE IDS ===
Use "A", "B", "C", "D" (and "E" if the source has a 5th option), matching
letter-per-choice as printed. Preserve the original on-page order in the
array — don't reorder or alphabetize.

=== RATIONALE RULES ===
- If the PDF already states an explanation/answer key rationale, extract it
  faithfully (clean up OCR artifacts, don't alter the substance).
- If the PDF gives ONLY an answer key (just the correct letter, no
  explanation), WRITE a new rationale yourself:
  - State which choice is correct and why, grounded in the actual subject
    matter tested (cite the relevant rule/principle/formula/concept by name).
  - Briefly note why the most plausible distractor(s) are wrong, if that's
    useful for learning — don't pad with filler.
  - Keep it 1-4 sentences. Precise and confident, not hedged ("this is
    probably because...").
  - Never fabricate a citation (a specific section/page number/standard
    number) you aren't sure of from the source material — describe the
    principle in plain language instead of inventing a reference.
- The rationale text itself must always read like normal, confident study
  content — it's shown directly to students in the app. Never bake review
  caveats, uncertainty markers, or "answer key not given" notes into it;
  those go in "reviewNote" instead (see FLAGGING FOR HUMAN REVIEW below).

=== ALWAYS DEFER TO THE SOURCE'S STATED ANSWER ===
If the PDF/answer key states which choice is correct, use THAT as
"correctChoiceId" even if you believe a different choice is more accurate on
the actual subject matter. Never silently substitute your own judgment for
the source's stated answer — you are extracting this exam's key, not
re-grading it. If you have a genuine, well-supported objection to the
source's stated answer:
1. Still set "correctChoiceId" to what the source says is correct.
2. Write the rationale explaining the source's answer as if it's correct
   (don't undermine it in the visible rationale).
3. Add a "reviewNote" flagging your objection and what you'd argue is the
   more defensible answer, so a human can decide whether to correct it.
Only fall back to your own best-supported judgment (still flagged via
"reviewNote") when the source genuinely provides no answer key at all for
that item — see FLAGGING FOR HUMAN REVIEW below.

=== FLAGGING FOR HUMAN REVIEW (the "reviewNote" field) ===
Add a "reviewNote" string to a record whenever something about its extraction
needs a human's eyes before or after ingestion — this keeps the flag
machine-readable (greppable in the JSON) instead of buried in prose after the
JSON, and keeps it out of the student-facing "rationale" text. Add it for
things like:
- The source PDF gave no answer key for this item and you had to pick your
  own best-supported "correctChoiceId".
- You disagree with the source's stated answer (see ALWAYS DEFER above) —
  note your alternative and why.
- The stem, a choice, or the answer key was badly garbled by OCR and you had
  to reconstruct part of it — say what you reconstructed.
- You merged this record from more than one duplicate/overlapping source copy
  and had to pick between conflicting versions of a field.
Keep each "reviewNote" short (one or two sentences, plain description of the
concern — no need to re-explain the subject matter, that's what "rationale"
is for). Omit the field entirely — don't set it to an empty string or null —
on every record that doesn't need review; most records should have no
"reviewNote" at all. Never use "reviewNote" as a place to hedge on records
that are actually fine.

=== TOPIC CLASSIFICATION RULES ===
Assume the PDF is a plain questionnaire with NO table of specifications, exam
blueprint, or formal topic outline attached — you will not find one, and you
should not wait for or ask for one. Classify entirely from the question
content itself:
- If the PDF happens to have chapter titles or section headers, use those as
  topicCategory. Otherwise, read through all the questions first and group
  them yourself into a small number of sensible topics based on what they're
  actually testing (e.g. for a biology exam: "Cell Structure", "Genetics",
  "Human Physiology" — whatever fits the actual content, named in plain
  language for that subject).
- subTopic is the more specific concept within that topic (e.g. under "Cell
  Structure": "Organelle functions").
- tosCode format: "<TopicLetter>.<SubtopicNumber>", e.g. topic "Cell
  Structure" = "A", its 3rd subtopic = "A.3". This is just an internal
  grouping key, not a citation to any real standard — reuse the SAME tosCode
  for every question that shares that exact topicCategory + subTopic pair
  within this extraction batch. Consistency across your own output matters
  more than any specific numbering scheme.

=== CANONICAL CONCEPT RULES ===
This field is the actual dedup key across future extraction batches (its
normalized hash decides whether a new question merges into an existing bank
entry). Write it as ONE short, plain-language sentence naming the specific
concept/rule/fact being tested — independent of how this particular question
happens to phrase it. Two differently-worded questions that test the same
underlying concept MUST get the same canonicalConcept string (verbatim,
same words), so:
- Strip out numbers/scenario details specific to this one question's story
  problem; name the underlying principle instead.
  e.g. NOT "A car travels 120 km in 2 hours, find its average speed" —
  INSTEAD "Average speed calculation (distance over time)".
- Use consistent terminology across all questions in this batch for the same
  concept — don't call it "average speed calculation" in one record and
  "speed = distance/time formula" in another.
- Lowercase/whitespace differences don't matter (they're normalized away
  automatically), but wording differences do — keep the phrasing identical
  when the concept repeats.

=== GENERAL EXTRACTION RULES ===
- Ignore page headers/footers, page numbers, watermarks, and any "Name:
  ___ / Score: ___" exam-taking boilerplate.
- Fix obvious OCR artifacts (broken words, stray characters from scanned
  columns) but never change the actual tested content or numbers.
- If a question is a multi-part item sharing one scenario/passage, repeat the
  shared scenario text at the start of each sub-question's "prompt" so each
  record stands alone (the schema has no concept of a shared passage).
- If the PDF contains an image/diagram/table essential to answering the
  question, describe its relevant content in words inside "prompt" (e.g. "A
  table shows: ...") since this schema is text-only — never just write
  "(see figure above)" with no substance.
- Skip anything that isn't actually a question with answer choices
  (instructions pages, cover pages, appendices) — don't fabricate a record
  for it.
- If two questions anywhere in your input are exact or near-exact duplicates
  of each other, merge them into a single record (see "Duplicate questions,
  wherever they come from" above) — never emit the same question twice just
  because it appeared more than once in the source material.

=== SELF-CHECK BEFORE YOU RESPOND ===
Before returning the array, verify for every single record:
1. correctChoiceId is one of that record's own choices[].id.
2. rationale is non-empty and contains no variant of "not provided".
3. difficulty is exactly "Easy", "Moderate", or "Difficult".
4. tos.subject and source.center and source.batch are IDENTICAL across every
   record in this output (one subject/source/batch per run), even when the
   input was multiple files or multiple sections.
5. source.examType is set per-record from that question's own section — it's
   fine (expected) for this to differ between records in the same output.
6. id values are all unique within your output.
7. All attached files have been accounted for — nothing skipped for being
   "duplicate" without actually merging its content in, nothing left out
   because it seemed unclear (garbled OCR still gets a best-effort record, not
   an omission).
8. No question appears more than once — duplicates from separate files,
   repeated sections, or naturally recurring items are all merged to one
   record each.
9. "correctChoiceId" always matches what the source's own answer key states,
   for every record where the source actually gives one — never your own
   substituted judgment.
10. "reviewNote" is present only on records that genuinely need a human's
    attention (missing/ambiguous source answer key, disagreement with the
    source's stated answer, heavy OCR reconstruction, or a merge conflict
    between duplicate copies) and the "rationale" text on those records still
    reads clean, with no hedging or caveats baked in.
11. Output is a single valid JSON array — no trailing commas, no comments, no
    markdown code fences, no leading/trailing prose, and no clarifying
    questions before or after it.
```

---

## Notes for whoever runs this

- The `id` you invent only needs to be unique *within what you're ingesting
  this run* combined with what's already in the database — if you re-run the
  same batch later with the same ids, `ingestBank.ts` treats it as an update
  to the same rows (it's idempotent by design), not a duplicate.
- `source.center` also doubles as a rights signal downstream — per the
  comment at the top of `ingestBank.ts`, verbatim third-party competitor exam
  content was previously purged from this codebase for copyright reasons.
  Only run this against material you have the right to store (your own
  authored questions, material explicitly licensed for reuse, or a source
  your organization owns) — set `center` to something like `"Original"` for
  in-house content, and don't use this pipeline to launder a competitor's
  copyrighted exam bank into the database just because it's easy to extract.
- This prompt is intentionally subject-agnostic — the same prompt (with
  different `SUBJECT_CODE`/`BATCH`/`EXAM_TYPE` values) works for any course's
  question bank: a biology midterm, a corporate compliance quiz, a language
  proficiency test, whatever the PDF actually is. Only `cognitiveLevel`'s
  Bloom's-taxonomy labels and `difficulty`'s three-value enum are fixed by
  the schema; everything else about topic naming is free-form and invented by
  you from the question content, not sourced from any external standard.
