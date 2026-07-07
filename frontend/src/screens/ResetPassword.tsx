import { useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../lib/api'
import { AuthMascot } from '../components/AuthMascot'

export function ResetPassword() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const token = params.get('token') ?? ''
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [busy, setBusy] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await api.post('/auth/reset-password', { token, password })
      setDone(true)
      setTimeout(() => navigate('/login'), 2000)
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Could not reset your password.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-10" style={{ background: '#F1F6FC' }}>
      <div className="animate-rise w-full max-w-[388px]">
        <div className="mb-2.5 flex flex-col items-center">
          <div className="mb-2"><AuthMascot size={46} /></div>
          <div className="font-display text-[26px] font-semibold tracking-[0.3px] text-ink">Ojas</div>
        </div>
        <div className="mb-[26px] text-center">
          <h1 className="font-display text-[26px] leading-[1.2] text-ink">Choose a new password</h1>
        </div>
        <div
          className="rounded-[20px] border bg-white px-[26px] py-7"
          style={{ borderColor: 'rgba(40,60,110,0.07)', boxShadow: '0 10px 30px rgba(40,60,110,0.06)' }}
        >
          {!token ? (
            <p className="text-[13px] text-caution">This reset link is missing its token. Please use the link from your email.</p>
          ) : done ? (
            <p className="text-[13.5px] text-success">Password reset! Redirecting you to sign in…</p>
          ) : (
            <form onSubmit={submit} className="flex flex-col gap-3.5">
              <label className="text-[12.5px] font-semibold text-[#54648A]">New password</label>
              <input
                type="password"
                className="w-full rounded-[11px] border bg-[#F7FAFD] px-[14px] py-3 text-[14px] text-ink outline-none transition-colors placeholder:text-[#AEB8CC] focus:border-[#4F93D9] focus:bg-white"
                style={{ borderColor: 'rgba(40,60,110,0.13)' }}
                placeholder="At least 8 characters"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
              />
              {error && <div className="text-[12.5px] text-caution">{error}</div>}
              <button
                type="submit"
                disabled={busy}
                className="mt-[10px] rounded-xl py-[13px] text-[15px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                style={{ background: '#2F6DB0', boxShadow: '0 8px 18px rgba(47,109,176,0.26)' }}
              >
                {busy ? 'Please wait…' : 'Reset password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
