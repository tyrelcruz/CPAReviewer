import { BrowserRouter, Route, Routes } from 'react-router-dom'

import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { AuthProvider } from '@/context/AuthContext'
import { LandingPage } from '@/pages/LandingPage'
import { LoginPage } from '@/pages/LoginPage'
import { MockExamsPage } from '@/pages/MockExamsPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { QuizApp } from '@/pages/QuizApp'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/app"
            element={
              <ProtectedRoute>
                <MockExamsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/practice/:quizSetId?"
            element={
              <ProtectedRoute>
                <QuizApp />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
