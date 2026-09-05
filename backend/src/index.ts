import 'dotenv/config'
import cors from 'cors'
import express, { type NextFunction, type Request, type Response } from 'express'

import { requireAuth } from './middleware/auth.js'
import { authRouter } from './routes/auth.js'
import { quizSetsRouter } from './routes/quizSets.js'

const app = express()
const port = Number(process.env.PORT ?? 8001)

app.use(cors())
app.use(express.json())

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.use('/api/auth', authRouter)
app.use('/api/quiz-sets', requireAuth, quizSetsRouter)

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err)
  res.status(500).json({ error: 'Internal server error' })
})

app.listen(port, () => {
  console.log(`Backend listening on http://localhost:${port}`)
})
