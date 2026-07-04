import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, Button, Badge, toast } from '@/components'
import { useRegistration, registrationStore } from '@/stores/userStore'

const RECENT_KEY = 'clubhub.recentCheckIns'

function loadRecent() {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]')
  } catch {
    return []
  }
}

function saveRecent(list) {
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, 5)))
  } catch {}
}

export function CheckInPage() {
  const [code, setCode] = useState('')
  const [recent, setRecent] = useState(loadRecent)
  const [result, setResult] = useState(null)

  const handleCheckIn = (rawCode) => {
    const trimmed = (rawCode || code).trim().toUpperCase()
    if (!trimmed) {
      toast('Please enter or scan a QR code', { variant: 'error' })
      return
    }
    const res = registrationStore.checkIn(trimmed)
    setResult({ code: trimmed, ...res })

    if (res.ok) {
      toast('Checked in successfully!', { variant: 'success' })
      const newRecent = [{ code: trimmed, time: new Date().toISOString() }, ...recent.filter((r) => r.code !== trimmed)]
      setRecent(newRecent)
      saveRecent(newRecent)
    } else if (res.reason === 'already') {
      toast('Already checked in', { variant: 'info' })
    } else if (res.reason === 'cancelled') {
      toast('Registration was cancelled', { variant: 'error' })
    } else if (res.reason === 'not_registered') {
      toast('Code not recognised', { variant: 'error' })
    }
    setCode('')
  }

  const handleLookup = () => {
    const trimmed = code.trim().toUpperCase()
    if (!trimmed) return
    const reg = registrationStore.findByQrCode(trimmed)
    if (!reg) {
      toast('No registration found', { variant: 'error' })
      setResult({ code: trimmed, ok: false, reason: 'not_registered' })
      return
    }
    setResult({ code: trimmed, lookup: true, reg })
  }

  return (
    <div className="min-h-screen">
      <section className="gradient-primary py-12 md:py-16">
        <div className="container">
          <div className="max-w-2xl">
            <p className="text-accent-green text-sm font-semibold uppercase tracking-wider mb-2">
              Event Check-in
            </p>
            <h1 className="text-3xl md:text-4xl font-bold text-secondary-100 mb-2">
              QR Check-in
            </h1>
            <p className="text-lg text-secondary-200">
              Scan the QR code or enter the code from your registration to mark yourself present.
            </p>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="container max-w-3xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Scanner Panel */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-secondary-100 mb-4 flex items-center gap-2">
                <svg className="h-5 w-5 text-accent-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
                Scan QR Code
              </h2>

              {/* Camera viewport placeholder */}
              <div className="aspect-square rounded-2xl bg-primary-800 border-2 border-dashed border-white/10 flex items-center justify-center mb-4 relative overflow-hidden">
                <div className="absolute inset-6 border-2 border-accent-green/70 rounded-xl" />
                <div className="absolute top-6 left-6 w-6 h-6 border-t-2 border-l-2 border-accent-green rounded-tl" />
                <div className="absolute top-6 right-6 w-6 h-6 border-t-2 border-r-2 border-accent-green rounded-tr" />
                <div className="absolute bottom-6 left-6 w-6 h-6 border-b-2 border-l-2 border-accent-green rounded-bl" />
                <div className="absolute bottom-6 right-6 w-6 h-6 border-b-2 border-r-2 border-accent-green rounded-br" />
                <div className="absolute inset-x-6 h-0.5 bg-accent-green/60 animate-pulse" style={{ top: '50%' }} />
                <div className="text-secondary-300 text-sm flex flex-col items-center gap-2 z-10">
                  <svg className="h-10 w-10 text-secondary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Camera preview
                </div>
              </div>
              <p className="text-xs text-secondary-300 text-center">
                Camera scanning UI · backend integration pending
              </p>
            </Card>

            {/* Manual code panel */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-secondary-100 mb-4 flex items-center gap-2">
                <svg className="h-5 w-5 text-accent-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Enter Code Manually
              </h2>
              <label className="block text-sm font-medium text-secondary-300 mb-2">
                Registration Code
              </label>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="CHB-EVT-1-XXXXXX"
                className="w-full px-4 py-3 rounded-xl bg-primary-800 border border-white/10 text-secondary-100 placeholder:text-secondary-400 focus:outline-none focus:ring-2 focus:ring-accent-green font-mono"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCheckIn()
                }}
              />
              <div className="flex gap-2 mt-4">
                <Button className="flex-1" onClick={() => handleCheckIn()}>
                  Check In
                </Button>
                <Button variant="secondary" onClick={handleLookup}>
                  Lookup
                </Button>
              </div>

              {result && (
                <div className="mt-5">
                  <ResultBox result={result} />
                </div>
              )}
            </Card>
          </div>

          {/* Tips + Recent */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <Card className="p-6">
              <h3 className="text-base font-semibold text-secondary-100 mb-3">
                Where do I find my code?
              </h3>
              <ul className="text-sm text-secondary-300 space-y-2">
                <li className="flex gap-2">
                  <span className="text-accent-green">•</span>
                  Open My Registrations from the navbar.
                </li>
                <li className="flex gap-2">
                  <span className="text-accent-green">•</span>
                  Each registered event shows a QR code chip.
                </li>
                <li className="flex gap-2">
                  <span className="text-accent-green">•</span>
                  Show the QR code at the door for scanning.
                </li>
              </ul>
              <Link to="/my-registrations" className="inline-block mt-4">
                <Button size="sm" variant="secondary">My Registrations</Button>
              </Link>
            </Card>

            <Card className="p-6">
              <h3 className="text-base font-semibold text-secondary-100 mb-3">
                Recent Check-ins
              </h3>
              {recent.length === 0 ? (
                <p className="text-sm text-secondary-300">No recent check-ins yet.</p>
              ) : (
                <ul className="space-y-2">
                  {recent.map((r) => (
                    <li
                      key={r.code + r.time}
                      className="flex items-center justify-between text-sm bg-primary-800/60 rounded-lg px-3 py-2"
                    >
                      <span className="font-mono text-accent-green">{r.code}</span>
                      <span className="text-secondary-300 text-xs">
                        {new Date(r.time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        </div>
      </section>
    </div>
  )
}

function ResultBox({ result }) {
  if (result.lookup && result.reg) {
    return (
      <div className="rounded-xl border border-white/10 bg-primary-800/60 p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-semibold text-secondary-100">Found registration</p>
          <Badge variant={result.reg.status === 'checked_in' ? 'success' : result.reg.status === 'cancelled' ? 'danger' : 'info'}>
            {result.reg.status.replace('_', ' ')}
          </Badge>
        </div>
        <p className="text-xs text-secondary-300 font-mono break-all">{result.code}</p>
      </div>
    )
  }
  if (result.ok) {
    return (
      <div className="rounded-xl border border-accent-green/40 bg-accent-green/10 p-4 flex items-start gap-3">
        <svg className="h-5 w-5 text-accent-green shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div>
          <p className="text-sm font-semibold text-secondary-100">Checked in successfully</p>
          <p className="text-xs text-secondary-300 font-mono mt-0.5 break-all">{result.code}</p>
        </div>
      </div>
    )
  }
  const message = {
    not_registered: 'Code not recognised',
    cancelled: 'Registration was cancelled',
    already: 'Already checked in',
  }[result.reason] || 'Unable to check in'
  return (
    <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 flex items-start gap-3">
      <svg className="h-5 w-5 text-red-300 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
      <div>
        <p className="text-sm font-semibold text-secondary-100">{message}</p>
        <p className="text-xs text-secondary-300 font-mono mt-0.5 break-all">{result.code}</p>
      </div>
    </div>
  )
}
