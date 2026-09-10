import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  FileText,
  FlaskConical,
  Mail,
  ShieldCheck,
  Star,
  Target,
} from 'lucide-react'
import axios from 'axios'
import { AnimatePresence, motion } from 'framer-motion'
import { type FormEvent, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import illustrationBg from '@/assets/images/illustration_bg.png'
import { OtpInput } from '@/components/auth/OtpInput'
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

// Matches the backend's per-email resend cooldown (routes/auth.ts).
const RESEND_COOLDOWN_SECONDS = 60

export function LoginPage() {
  const navigate = useNavigate()
  const { requestLoginOtp, verifyLoginOtp, loggedOutReason, clearLoggedOutReason } = useAuth()
  const [step, setStep] = useState<'email' | 'code'>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [cooldown, setCooldown] = useState(0)

  // Surfaces once, right after being bounced here for a session that ended
  // server-side (e.g. logged out from another tab) — reuses the same alert
  // slot as a login error since only one applies at a time.
  useEffect(() => {
    if (loggedOutReason !== 'session_ended') return
    setError('You have been signed out. Please sign in again.')
    clearLoggedOutReason()
  }, [loggedOutReason, clearLoggedOutReason])

  useEffect(() => {
    if (cooldown <= 0) return
    const id = setInterval(() => setCooldown((s) => Math.max(0, s - 1)), 1000)
    return () => clearInterval(id)
  }, [cooldown])

  function describeError(err: unknown, fallback: string) {
    if (axios.isAxiosError(err)) {
      if (!err.response) return 'Unable to reach the server. Is the backend running?'
      // A 500 here means the OTP email itself failed to send server-side
      // (e.g. the mail provider rejected it) — the backend never leaks that
      // detail (just the generic "Internal server error"), so show a
      // message that's actually actionable instead of surfacing it raw.
      if (err.response.status >= 500) {
        return "We couldn't send the verification code right now. Please try again in a moment."
      }
      if (err.response.data?.error) return err.response.data.error as string
    }
    return fallback
  }

  async function handleSendCode(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)
    try {
      await requestLoginOtp(email)
      setStep('code')
      setCooldown(RESEND_COOLDOWN_SECONDS)
    } catch (err) {
      setError(describeError(err, 'Something went wrong. Please try again.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleResendCode() {
    if (cooldown > 0) return
    setError(null)
    try {
      await requestLoginOtp(email)
      setCooldown(RESEND_COOLDOWN_SECONDS)
    } catch (err) {
      setError(describeError(err, 'Could not resend the code. Please try again.'))
    }
  }

  async function handleVerifyCode(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)
    try {
      const user = await verifyLoginOtp(email, code)
      // Always lands on the role's dashboard, never wherever a route guard
      // happened to bounce the user from (e.g. a stale/expired exam URL) —
      // an in-progress exam is still reachable from there via "Resume".
      navigate(user.role === 'admin' ? '/admin' : '/app/dashboard', { replace: true })
    } catch (err) {
      setError(describeError(err, 'Something went wrong. Please try again.'))
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
            Alpha build — expect bugs. Found one? Screenshot it and notify admin.
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
            <Link to="/" className="inline-block">
              <Logo className="h-14" />
            </Link>

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
            <Link
              to="/"
              className="mb-4 inline-flex items-center gap-1.5 text-xs font-semibold text-[#3A2A1A]/60 transition-colors hover:text-[#7A2323]"
            >
              <ArrowLeft className="size-3.5" />
              Back to home
            </Link>

            <h2 className="font-display text-center text-2xl text-[#7A2323]">
              Welcome back!
            </h2>
            <p className="mt-1 text-center text-sm text-[#3A2A1A]/70">
              {step === 'email'
                ? 'Enter your email and we’ll send you a one-time code — no password needed.'
                : `Enter the 6-digit code we sent to ${email}.`}
            </p>

            {step === 'email' ? (
              <motion.form
                key="email-step"
                variants={staggerContainer}
                initial="hidden"
                animate="show"
                onSubmit={handleSendCode}
                className="mt-5 flex flex-col gap-4 sm:mt-8 sm:gap-5"
              >
                <motion.div variants={fadeUpItem}>
                  <label htmlFor="email" className="text-sm font-semibold text-[#7A2323]">
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
                  {isSubmitting ? 'Sending code…' : 'Send Code'}
                  <ArrowRight className="size-4" />
                </motion.button>
              </motion.form>
            ) : (
              <motion.form
                key="code-step"
                variants={staggerContainer}
                initial="hidden"
                animate="show"
                onSubmit={handleVerifyCode}
                className="mt-5 flex flex-col gap-4 sm:mt-8 sm:gap-5"
              >
                <motion.div variants={fadeUpItem}>
                  <label htmlFor="code" className="text-sm font-semibold text-[#7A2323]">
                    Verification code
                  </label>
                  <OtpInput id="code" value={code} onChange={setCode} className="mt-2" />
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setStep('email')
                        setCode('')
                        setError(null)
                      }}
                      className="font-semibold text-[#3A2A1A]/60 hover:text-[#7A2323]"
                    >
                      Change email
                    </button>
                    <button
                      type="button"
                      onClick={handleResendCode}
                      disabled={cooldown > 0}
                      className="font-semibold text-[#7A2323] hover:underline disabled:cursor-not-allowed disabled:text-[#3A2A1A]/40 disabled:no-underline"
                    >
                      {cooldown > 0 ? `Resend code (${cooldown}s)` : 'Resend code'}
                    </button>
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
                  disabled={isSubmitting || code.length !== 6}
                  className="flex items-center justify-center gap-2 rounded-full bg-[#7A2323] py-3 text-sm font-bold text-[#E0AC48] transition-colors hover:bg-[#7A2323]/90 disabled:opacity-60"
                >
                  {isSubmitting ? 'Verifying…' : 'Verify & Log In'}
                  <ArrowRight className="size-4" />
                </motion.button>
              </motion.form>
            )}

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
              <p className="text-[#3A2A1A]/60">
                No password to remember or leak — every sign-in is a fresh one-time code.
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}
