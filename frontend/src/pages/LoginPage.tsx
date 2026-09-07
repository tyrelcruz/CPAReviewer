import {
  ArrowRight,
  BarChart3,
  Eye,
  EyeOff,
  FileText,
  FlaskConical,
  Lock,
  Mail,
  ShieldCheck,
  Star,
  Target,
} from 'lucide-react'
import axios from 'axios'
import { AnimatePresence, motion } from 'framer-motion'
import { type FormEvent, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

import illustrationBg from '@/assets/images/illustration_bg.png'
import { Logo } from '@/components/landing/Logo'
import { useAuth } from '@/context/AuthContext'
import { fadeUpItem, listItem, listStagger, staggerContainer } from '@/lib/motion'

const BOOKS = [
  { label: 'FAR', width: '9rem', bg: '#E7D9B8', color: '#3A2A1A' },
  { label: 'AUD', width: '8rem', bg: '#3A5A40', color: '#F3ECDC' },
  { label: 'REG', width: '9.5rem', bg: '#E0AC48', color: '#3A2A1A' },
  { label: 'BAR', width: '7.5rem', bg: '#5C1A1A', color: '#F3ECDC' },
]

const FEATURES = [
  { icon: Target, label: 'High-yield practice' },
  { icon: FileText, label: 'Active recall flashcards' },
  { icon: BarChart3, label: 'Performance insights' },
  { icon: Star, label: 'Built for CPA success' },
]

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const redirectTo =
    (location.state as { from?: { pathname: string } } | null)?.from?.pathname ??
    '/app/dashboard'

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)
    try {
      await login(email, password)
      navigate(redirectTo, { replace: true })
    } catch (err) {
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 401) {
          setError('Invalid email or password.')
        } else if (err.response) {
          setError('Something went wrong. Please try again.')
        } else {
          setError('Unable to reach the server. Is the backend running?')
        }
      } else {
        setError('Something went wrong. Please try again.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-[#F3ECDC] p-2 sm:p-4 lg:p-8">
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="grid w-full max-w-6xl overflow-hidden rounded-3xl shadow-2xl lg:grid-cols-2"
      >
        <div className="flex items-center justify-center gap-2 bg-[#E0AC48]/20 px-4 py-1.5 text-center text-xs font-medium text-[#8a5a12] lg:col-span-2">
          <FlaskConical className="size-3.5 shrink-0" />
          <span>
            Alpha build — expect bugs. Found one? Screenshot it and notify Vanessa.
          </span>
        </div>

        <motion.div
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.45, delay: 0.1, ease: 'easeOut' }}
          className="relative hidden flex-col justify-between bg-[#F3ECDC] bg-cover bg-center p-10 lg:flex"
          style={{ backgroundImage: `url(${illustrationBg})` }}
        >
          <div className="absolute inset-0 bg-[#F3ECDC]/25" />

          <div className="relative">
            <Logo className="h-14" />

            <div className="mt-3 flex items-center gap-3 text-[#3A5A40]">
              <span className="h-px w-10 bg-[#7A2323]/40" />
              <span className="font-baybayin text-lg" aria-hidden="true">
                pasa
              </span>
              <span className="h-px w-10 bg-[#7A2323]/40" />
            </div>

            <h1 className="font-display mt-8 text-4xl leading-[1.1] uppercase">
              <span className="text-[#7A2323]">Pass smarter.</span>
              <br />
              <span className="text-[#3A5A40]">Not harder.</span>
            </h1>
            <p className="font-reading mt-4 max-w-sm text-[#3A2A1A]/80">
              Your all-in-one CPA review partner. Study smarter, track your progress, and pass
              with confidence.
            </p>
          </div>

          <motion.div
            variants={listStagger}
            initial="hidden"
            animate="show"
            className="relative flex flex-col items-start gap-1"
          >
            {BOOKS.map((book) => (
              <motion.div
                key={book.label}
                variants={listItem}
                className="flex h-8 items-center rounded-r-sm rounded-l-md pl-3 text-xs font-bold shadow-sm"
                style={{ width: book.width, background: book.bg, color: book.color }}
              >
                {book.label}
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            variants={listStagger}
            initial="hidden"
            animate="show"
            className="relative -mx-10 -mb-10 mt-8 flex flex-wrap items-center justify-around gap-x-6 gap-y-2 bg-[#5C1A1A] px-10 py-5 text-[#F3ECDC]"
          >
            {FEATURES.map((feature) => (
              <motion.div
                key={feature.label}
                variants={listItem}
                className="flex items-center gap-2 text-xs font-medium"
              >
                <feature.icon className="size-4 text-[#E0AC48]" />
                {feature.label}
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.45, delay: 0.15, ease: 'easeOut' }}
          className="flex flex-col justify-between bg-[#F3ECDC] p-6 sm:p-10 lg:p-12"
        >
          <div>
            <div className="flex items-center gap-3 text-[#3A5A40]">
              <span className="h-px flex-1 bg-[#7A2323]/30" />
              <span className="font-baybayin text-lg" aria-hidden="true">
                pasa
              </span>
              <span className="h-px flex-1 bg-[#7A2323]/30" />
            </div>
            <h2 className="font-display mt-3 text-center text-2xl text-[#7A2323] sm:mt-4">
              Welcome back!
            </h2>
            <p className="mt-1 text-center text-sm text-[#3A2A1A]/70">
              Log in to continue your CPA review journey.
            </p>

            <motion.form
              variants={staggerContainer}
              initial="hidden"
              animate="show"
              onSubmit={handleSubmit}
              className="mt-5 flex flex-col gap-4 sm:mt-8 sm:gap-5"
            >
              <motion.div variants={fadeUpItem}>
                <label
                  htmlFor="email"
                  className="text-sm font-semibold text-[#7A2323]"
                >
                  Email address
                </label>
                <div className="mt-1.5 flex items-center gap-2 rounded-xl border border-[#3A2A1A]/15 bg-white px-3.5 py-2.5">
                  <Mail className="size-4 shrink-0 text-[#3A2A1A]/50" />
                  <input
                    id="email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full bg-transparent text-sm text-[#3A2A1A] outline-none placeholder:text-[#3A2A1A]/40"
                  />
                </div>
              </motion.div>

              <motion.div variants={fadeUpItem}>
                <label
                  htmlFor="password"
                  className="text-sm font-semibold text-[#7A2323]"
                >
                  Password
                </label>
                <div className="mt-1.5 flex items-center gap-2 rounded-xl border border-[#3A2A1A]/15 bg-white px-3.5 py-2.5">
                  <Lock className="size-4 shrink-0 text-[#3A2A1A]/50" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full bg-transparent text-sm text-[#3A2A1A] outline-none placeholder:text-[#3A2A1A]/40"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="shrink-0 text-[#3A2A1A]/50 hover:text-[#3A2A1A]"
                  >
                    {showPassword ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </div>
                <div className="mt-2 text-right">
                  <Link
                    to="#"
                    className="text-xs font-semibold text-[#7A2323] hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
              </motion.div>

              <AnimatePresence>
                {error && (
                  <motion.p
                    role="alert"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto', x: [0, -6, 6, -4, 4, 0] }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.35, ease: 'easeOut' }}
                    className="text-sm font-medium text-[#7A2323]"
                  >
                    {error}
                  </motion.p>
                )}
              </AnimatePresence>

              <motion.button
                variants={fadeUpItem}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isSubmitting}
                className="flex items-center justify-center gap-2 rounded-full bg-[#7A2323] py-3 text-sm font-bold text-[#E0AC48] transition-colors hover:bg-[#7A2323]/90 disabled:opacity-60"
              >
                {isSubmitting ? 'Logging in…' : 'Log In'}
                <ArrowRight className="size-4" />
              </motion.button>
            </motion.form>

            <p className="mt-4 text-center text-sm text-[#3A2A1A]/70 sm:mt-6">
              Don&rsquo;t have an account?{' '}
              <Link to="/signup" className="font-semibold text-[#7A2323] hover:underline">
                Sign up
              </Link>
            </p>
          </div>

          <div className="mt-5 flex items-start gap-2.5 border-t border-[#3A2A1A]/10 pt-4 text-xs sm:mt-8 sm:pt-5">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#3A5A40]" />
            <div>
              <p className="font-semibold text-[#3A2A1A]">Your data is secure with us.</p>
              <p className="text-[#3A2A1A]/60">We never share your personal information.</p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}
