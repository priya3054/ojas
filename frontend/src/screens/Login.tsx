import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, setToken } from '../lib/api'
import { AuthMascot } from '../components/AuthMascot'

const inputBase =
  'w-full rounded-[11px] border bg-[#F7FAFD] px-[14px] py-3 text-[14px] text-ink outline-none ' +
  'transition-colors placeholder:text-[#AEB8CC] focus:border-[#4F93D9] focus:bg-white'
const inputBorder = { borderColor: 'rgba(40,60,110,0.13)' }
const labelCls = 'text-[12.5px] font-semibold text-[#54648A]'

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.9 2.4 30.3 0 24 0 14.6 0 6.4 5.4 2.6 13.2l7.9 6.2C12.3 13.3 17.6 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.4c-.5 2.9-2.1 5.3-4.6 6.9l7.1 5.5c4.2-3.9 6.6-9.6 6.6-16.4z" />
      <path fill="#FBBC05" d="M10.5 28.6c-.5-1.4-.8-2.9-.8-4.6s.3-3.2.8-4.6l-7.9-6.2C.9 16.1 0 19.9 0 24s.9 7.9 2.6 11.2l7.9-6.6z" />
      <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.1-5.5c-2 1.4-4.6 2.2-8.8 2.2-6.4 0-11.7-3.8-13.5-9.4l-7.9 6.6C6.4 42.6 14.6 48 24 48z" />
    </svg>
  )
}

export function Login() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const isSignup = mode === 'signup'

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      if (isSignup) {
        await api.post('/auth/register', { email, password, name })
      }
      const form = new URLSearchParams({ username: email, password })
      const res = await api.post('/auth/login', form)
      setToken(res.data.access_token)
      navigate('/dashboard')
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Something went wrong. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center px-6 py-10"
      style={{ background: '#F1F6FC' }}
    >
      <div className="animate-rise w-full max-w-[388px]">
        {/* Logo block */}
        <div className="mb-2.5 flex flex-col items-center">
          <div className="mb-2">
            <AuthMascot size={46} />
          </div>
          <div className="font-display text-[26px] font-semibold tracking-[0.3px] text-ink">Ojas</div>
        </div>

        {/* Heading block */}
        <div className="mb-[26px] text-center">
          <h1 className="font-display text-[26px] leading-[1.2] text-ink">
            {isSignup ? 'Create your account' : 'Welcome back'}
          </h1>
          <p className="mt-1.5 text-[14px] text-[#6E7E9C]">
            {isSignup ? 'Start your calm wellness journey.' : 'Sign in to continue with Ojas.'}
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-[20px] border bg-white px-[26px] py-7"
          style={{ borderColor: 'rgba(40,60,110,0.07)', boxShadow: '0 10px 30px rgba(40,60,110,0.06)' }}
        >
          {/* Continue with Google */}
          <button
            type="button"
            onClick={() => setError('Google sign-in is being set up. Please use email for now.')}
            className="flex w-full items-center justify-center gap-2.5 rounded-xl border bg-white py-3 text-[14px] font-semibold text-[#3A4A6B] transition-colors hover:bg-[#F5F8FC]"
            style={{ borderColor: 'rgba(40,60,110,0.13)' }}
          >
            <GoogleIcon />
            Continue with Google
          </button>

          {/* Divider */}
          <div className="my-5 flex items-center gap-3">
            <span className="h-px flex-1" style={{ background: 'rgba(40,60,110,0.1)' }} />
            <span className="text-[12px] text-[#93A0BC]">or</span>
            <span className="h-px flex-1" style={{ background: 'rgba(40,60,110,0.1)' }} />
          </div>

          {/* Fields */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
            {isSignup && (
              <div className="flex flex-col gap-1.5">
                <label htmlFor="name" className={labelCls}>Full name</label>
                <input
                  id="name" className={inputBase} style={inputBorder} placeholder="Priya Sharma"
                  autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} required
                />
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className={labelCls}>Email</label>
              <input
                id="email" type="email" className={inputBase} style={inputBorder} placeholder="you@email.com"
                autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className={labelCls}>Password</label>
                {!isSignup && (
                  <button type="button" className="text-[12px] font-semibold text-[#2F6DB0]">
                    Forgot?
                  </button>
                )}
              </div>
              <input
                id="password" type="password" className={inputBase} style={inputBorder} placeholder="••••••••"
                autoComplete={isSignup ? 'new-password' : 'current-password'}
                value={password} onChange={(e) => setPassword(e.target.value)} required
              />
            </div>

            {error && <div className="text-[12.5px] text-caution">{error}</div>}

            <button
              type="submit"
              disabled={busy}
              className="mt-[10px] rounded-xl py-[13px] text-[15px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
              style={{ background: '#2F6DB0', boxShadow: '0 8px 18px rgba(47,109,176,0.26)' }}
            >
              {busy ? 'Please wait…' : isSignup ? 'Create account' : 'Sign in'}
            </button>

            {isSignup && (
              <p className="mt-1 text-center text-[11.5px] leading-snug text-[#93A0BC]">
                By continuing you agree to our <span className="font-semibold text-[#2F6DB0]">Terms</span> &{' '}
                <span className="font-semibold text-[#2F6DB0]">Privacy</span>. Ojas doesn't diagnose or replace
                professional care.
              </p>
            )}
          </form>
        </div>

        {/* Swap line */}
        <div className="mt-[22px] text-center text-[13.5px] text-[#6E7E9C]">
          {isSignup ? 'Already have an account? ' : 'New to Ojas? '}
          <button
            type="button"
            onClick={() => {
              setMode(isSignup ? 'signin' : 'signup')
              setError('')
            }}
            className="font-bold text-[#2F6DB0]"
          >
            {isSignup ? 'Sign in' : 'Create one'}
          </button>
        </div>
      </div>
    </div>
  )
}
