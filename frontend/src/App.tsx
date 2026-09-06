import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'

import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { LoadingScreen } from '@/components/LoadingScreen'
import { AuthProvider } from '@/context/AuthContext'
import { DashboardPage } from '@/pages/DashboardPage'
import { LandingPage } from '@/pages/LandingPage'
import { LoginPage } from '@/pages/LoginPage'
import { MockExamsPage } from '@/pages/MockExamsPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { QuizApp } from '@/pages/QuizApp'
import { SignUpPage } from '@/pages/SignUpPage'

function App() {
  const [isBooting, setIsBooting] = useState(true)

  return (
    <>
      <AnimatePresence>
        {isBooting && (
          <motion.div
            key="loading-screen"
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="fixed inset-0 z-50"
          >
            <LoadingScreen onDone={() => setIsBooting(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignUpPage />} />
            <Route
              path="/app/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
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
    </>
  )
}

export default App
