import 'dotenv/config'
import cors from 'cors'
import express from 'express'

import { quizSetsRouter } from './routes/quizSets.js'

const app = express()
const port = Number(process.env.PORT ?? 8001)

app.use(cors())
app.use(express.json())

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.use('/api/quiz-sets', quizSetsRouter)

app.listen(port, () => {
  console.log(`Backend listening on http://localhost:${port}`)
})
