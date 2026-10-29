# Guest Trial Exam — Design

**Date:** 2026-10-29
**Status:** Approved, implementing

## Intent

Let a visitor experience the exam-taking product without an account: pick a
subject from the landing-page navbar, answer 10 real bank questions, see how
they did, and hit a signup wall at the moment the explanations become valuable.

Success = a stranger can reach a real question within two clicks of the landing
page, and finishes the attempt with a concrete reason to create an account.

Non-goals: guest progress history, guest flagging, resuming a guest attempt
across devices, abuse-proof trial enforcement.

## Decisions (confirmed with the user)

| Decision | Choice |
|---|---|
| Results gate | Score + per-question right/wrong visible; 2 of the 10 rationales unlocked, the rest behind signup |
| Retry limit | One free exam per browser (localStorage flag) |
| Picker scope | Subject only (IS, BB, MTAP) — no difficulty/type wizard |

## Constraints discovered in the codebase

- `Quiz` reveals each explanation **inline during the exam** (`components/quiz/Quiz.tsx`
  "View explanation"), not just at the results screen. Gating only the results
  screen would leak every rationale. The lock must be server-side.
- `exam_sessions.user_id` is `NOT NULL` with an FK to `users`, so a guest
  attempt cannot be persisted there. The trial is therefore **stateless
  server-side** — no schema change.
- Every `/api/*` route except `/api/auth` is behind `requireAuth`. `/api/trial`
  is the first public data route, so it carries its own abuse controls.
- Answer keys already ship to the client for authed exams by documented policy
  (`routes/exams.ts`, `fetchSessionQuestions` doc comment). The trial follows
  the same policy for `correctChoiceId` — only `rationale` is withheld.
- `useAuth()` returns `user === null` outside a session and every quiz
  component already does `user?.id ?? ''`, so the exam UI renders for a guest.

## Backend

New `backend/src/routes/trial.ts`, mounted **without** `requireAuth`:

```ts
app.use('/api/trial', trialRouter)
```

### `GET /api/trial/subjects`

Returns the allowlisted trial subjects and their pool sizes:

```json
{ "subjects": [{ "code": "IS", "available": 412 }, ...] }
```

### `POST /api/trial/exam`

Body: `{ "subject": "IS" }`. Any client-supplied count is ignored — the server
always returns exactly `TRIAL_QUESTION_COUNT` (10) MCQ questions, randomly
drawn, with variant groups collapsed so two phrasings of one concept can't both
appear.

Response shape matches `GeneratedExamSession` minus the session id:

```json
{ "subject": "IS", "questions": [ /* BankQuestion[] */ ] }
```

Questions at index >= `TRIAL_UNLOCKED_EXPLANATIONS` (2) are returned with
`rationale: ''` and `explanationLocked: true`. The locked text never leaves the
server. `Quiz` reshuffles the order per attempt, so the two readable ones land
anywhere in the ten — the UI copy says "two explanations", not "the first two".

Errors: 400 for an unknown subject, 404 when the subject's pool is empty,
429 when rate limited.

### Abuse controls

- Subject allowlist (no arbitrary `subject` string reaching a query).
- Hard server-side cap of 10 items.
- In-memory per-IP limiter: 20 exams per hour, swept lazily. CLAUDE.md §6 flags
  the absence of rate limiting; a public endpoint should not ship without at
  least this. Sized to stop bulk scraping (200 questions/hour per IP) rather
  than to ration honest visitors — a review centre or school can share one
  NATed IP. It is per-process and resets on restart: adequate for a single
  container, to be replaced with a shared store if this is ever scaled out.

### Shared code

`COMPREHENSIVE_SUBJECTS` (MTAP = IS + BB) moves from `routes/exams.ts` to
`backend/src/lib/subjects.ts` alongside a `resolveSubjectFilter(subject)`
helper, now that two routers need it.

## Frontend

### Routes (public, in `App.tsx`)

- `/try` → `TrialStartPage` — landing `Navbar` + three subject cards with live
  pool counts + "Start free 10-question exam".
- `/try/exam/:subject` → `TrialExamPage` — fetches the 10 questions and renders
  the existing `Quiz`.

### Navbar

`NAV_LINKS` in `components/landing/Navbar.tsx` gains `{ label: 'Try Free', to:
'/try' }` with a gold `FREE` badge, rendered in both the desktop and mobile
lists.

### Changes to existing components

- `types/quiz.ts` — `QuizQuestion` gains `explanationLocked?: boolean`.
- `Quiz` gains `trialMode?: boolean`:
  - hides the flag-question button (that endpoint is auth-only and would 401),
  - renders a lock card with a signup CTA in place of a locked rationale.
- `QuizResults` gains `trialMode?: boolean`:
  - skips `recordExamAttempt` (guests have `userId === ''`),
  - locks rationales in the review list,
  - replaces "Retake / Back to dashboard" with **Create free account** / **Log in**.

### One trial per browser

`lib/trialAttempt.ts`, localStorage key `cpa-reviewer:trial-used`, value
`{ subject, score, total, completedAt }`. Written when the attempt completes.
On a later visit, `/try` shows the previous score plus a signup CTA instead of
the start button, and `/try/exam/:subject` redirects to `/try`.

`TrialExamPage` also refuses to run a second attempt, so a bookmarked
`/try/exam/IS` can't skip the picker's check, and guards its fetch with a ref
because React StrictMode would otherwise draw two exams per mount in dev.

This is a conversion nudge, not an entitlement check — clearing storage or
using a private window bypasses it, by design. Nothing of value sits behind it
(the locked rationales are withheld server-side regardless).

## Error handling

- Pool empty / unknown subject → the picker disables that card with "Coming soon".
- `POST /api/trial/exam` failure → inline retry message on `/try/exam/:subject`,
  with a link back to the picker. No raw error bodies surfaced (CLAUDE.md §5).
- Rate limited → "You've started a few exams already. Create a free account to
  keep going." plus the signup CTA.

## Testing

- `npx tsc -b --noEmit` and `npx oxlint` clean in both packages.
- Real round trip against the running backend + MySQL container:
  - `POST /api/trial/exam` with **no** `Authorization` header returns 10 questions;
  - questions 3–10 have `rationale: ""` and `explanationLocked: true` in the raw
    JSON (verified on the response body, not the UI);
  - `GET /api/exams` with no header still returns 401;
  - an unknown subject returns 400; the 6th rapid request returns 429.
- Browser drive at 375px and 1440px over `/try` and `/try/exam/IS`, asserting
  `document.documentElement.scrollWidth === clientWidth` at both widths
  (CLAUDE.md §4).

## Verification record (2026-10-29)

`npx tsc -b --noEmit` and `npx oxlint` clean in both packages (14 pre-existing
oxlint warnings, none in new or touched files).

API, against the running backend + MySQL container, with no `Authorization`
header: `GET /api/trial/subjects` 200; `POST /api/trial/exam {"subject":"IS"}`
200 with 10 unique questions, 2 carrying a rationale and 8 with `rationale: ""`
and `explanationLocked: true`; unknown subject 400; missing subject 400; the
21st exam in an hour 429. `/api/exams`, `/api/bank-questions`, `/api/flags`,
`/api/quiz-sets` and `/api/admin/overview` all still 401 without a token.

Browser (Playwright, real Chrome) at 375x812 and 1440x900, 34 assertions
passing at both widths: navbar entry point, picker with live pool counts,
`scrollWidth === clientWidth` on every screen, flag button absent, exactly 2 of
10 explanations readable, results banner and signup CTAs present, "Retake Exam"
absent, attempt written to `cpa-reviewer:trial-used`, no exam-history keys
written for a guest, and a used trial redirecting `/try/exam/IS` back to `/try`
with all three cards disabled.

Two defects were found and fixed during that drive: the picker used
`animate="visible"` where `lib/motion.ts` names the variant `show` (the whole
page rendered at opacity 0 while still passing DOM assertions), and the
StrictMode fetch guard initially cancelled its own in-flight response.
