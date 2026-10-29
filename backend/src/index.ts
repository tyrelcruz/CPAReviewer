import 'dotenv/config'
import cors from 'cors'
import express, { type NextFunction, type Request, type Response } from 'express'

import { requireAdmin, requireAuth } from './middleware/auth.js'
import { adminRouter } from './routes/admin.js'
import { authRouter } from './routes/auth.js'
import { bankQuestionsRouter } from './routes/bankQuestions.js'
import { examsRouter } from './routes/exams.js'
import { flagsRouter } from './routes/flags.js'
import { quizSetsRouter } from './routes/quizSets.js'
import { trialRouter } from './routes/trial.js'

const app = express()
const port = Number(process.env.PORT ?? 8001)

app.use(cors())
app.use(express.json())

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.use('/api/auth', authRouter)
// Deliberately public: the logged-out trial exam. It returns at most 10
// questions, withholds most rationales, and rate-limits itself — see
// routes/trial.ts. Nothing else below this line is unauthenticated.
app.use('/api/trial', trialRouter)
app.use('/api/quiz-sets', requireAuth, quizSetsRouter)
app.use('/api/bank-questions', requireAuth, bankQuestionsRouter)
app.use('/api/exams', requireAuth, examsRouter)
app.use('/api/flags', requireAuth, flagsRouter)
app.use('/api/admin', requireAuth, requireAdmin, adminRouter)

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err)
  res.status(500).json({ error: 'Internal server error' })
})

app.listen(port, () => {
  console.log(`Backend listening on http://localhost:${port}`)
})
