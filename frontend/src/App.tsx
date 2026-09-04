import { BrowserRouter, Route, Routes } from 'react-router-dom'

import { LandingPage } from '@/pages/LandingPage'
import { QuizApp } from '@/pages/QuizApp'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/app" element={<QuizApp />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
