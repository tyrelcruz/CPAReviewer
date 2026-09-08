import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'

import { AdminRoute } from '@/components/auth/AdminRoute'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { LoadingScreen } from '@/components/LoadingScreen'
import { AuthProvider } from '@/context/AuthContext'
import { AdminDashboardPage } from '@/pages/AdminDashboardPage'
import { BankExamApp } from '@/pages/BankExamApp'
import { ChooseStrategyPage } from '@/pages/ChooseStrategyPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { ExamSetupPage } from '@/pages/ExamSetupPage'
import { LandingPage } from '@/pages/LandingPage'
import { LoginPage } from '@/pages/LoginPage'
import { MockExamsPage } from '@/pages/MockExamsPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { QuizApp } from '@/pages/QuizApp'
import { QuizDetailsPage } from '@/pages/QuizDetailsPage'
import { SignUpPage } from '@/pages/SignUpPage'
import { SubjectsPage } from '@/pages/SubjectsPage'

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
            <Route path="/subjects" element={<SubjectsPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignUpPage />} />
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminDashboardPage />
                </AdminRoute>
              }
            />
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
            <Route
              path="/app/choose-strategy/:subject"
              element={
                <ProtectedRoute>
                  <ChooseStrategyPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/choose-strategy/:quizSetId/details"
              element={
                <ProtectedRoute>
                  <QuizDetailsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/exam-setup"
              element={
                <ProtectedRoute>
                  <ExamSetupPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/exam/:sessionId"
              element={
                <ProtectedRoute>
                  <BankExamApp />
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
