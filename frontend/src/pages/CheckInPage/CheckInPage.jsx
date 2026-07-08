import { useState } from 'react'
import { Link } from 'react-router-dom'
import { QrCode, Edit3, Camera, CheckCircle2, AlertTriangle, Lightbulb, History } from 'lucide-react'
import MainLayout from '@/layouts/MainLayout.jsx'
import { Card, Button, Badge, toast, HeroSection } from '@/components'
import { useRegistration, registrationStore } from '@/stores/userStore'
import './CheckInPage.css'

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

export default function CheckInPage() {
  return (
    <MainLayout>
      <CheckInPageContent />
    </MainLayout>
  )
}

function CheckInPageContent() {
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
    <div className="checkin-page">
      <HeroSection
        variant="checkin"
        eyebrow="Event Check-in"
        title="QR"
        titleGradient="Check-in"
        subtitle="Scan the QR code or enter the code from your registration to mark yourself present."
      />

      <section className="checkin-page__content">
        <div className="checkin-page__container">
          <div className="checkin-page__grid">
            <Card className="checkin-page__panel">
              <h2 className="checkin-page__panel-title">
                <QrCode size={20} className="checkin-page__panel-icon" />
                Scan QR Code
              </h2>

              <div className="checkin-page__viewport">
                <div className="checkin-page__viewport-inner" />
                <div className="checkin-page__viewport-corner checkin-page__viewport-corner--tl" />
                <div className="checkin-page__viewport-corner checkin-page__viewport-corner--tr" />
                <div className="checkin-page__viewport-corner checkin-page__viewport-corner--bl" />
                <div className="checkin-page__viewport-corner checkin-page__viewport-corner--br" />
                <div className="checkin-page__viewport-line" />
                <div className="checkin-page__viewport-content">
                  <Camera size={40} />
                  <span>Camera preview</span>
                </div>
              </div>
              <p className="checkin-page__viewport-note">
                Camera scanning UI · backend integration pending
              </p>
            </Card>

            <Card className="checkin-page__panel">
              <h2 className="checkin-page__panel-title">
                <Edit3 size={20} className="checkin-page__panel-icon" />
                Enter Code Manually
              </h2>
              <label className="checkin-page__label">
                Registration Code
              </label>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="CHB-EVT-1-XXXXXX"
                className="checkin-page__input"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCheckIn()
                }}
              />
              <div className="checkin-page__actions">
                <Button className="checkin-page__action-primary" onClick={() => handleCheckIn()}>
                  Check In
                </Button>
                <Button variant="secondary" onClick={handleLookup}>
                  Lookup
                </Button>
              </div>

              {result && (
                <div className="checkin-page__result">
                  <ResultBox result={result} />
                </div>
              )}
            </Card>
          </div>

          <div className="checkin-page__grid">
            <Card className="checkin-page__panel">
              <h3 className="checkin-page__panel-subtitle">
                <Lightbulb size={18} className="checkin-page__panel-icon" />
                Where do I find my code?
              </h3>
              <ul className="checkin-page__tips">
                <li className="checkin-page__tip"><span className="checkin-page__tip-dot" /> Open My Registrations from the navbar.</li>
                <li className="checkin-page__tip"><span className="checkin-page__tip-dot" /> Each registered event shows a QR code chip.</li>
                <li className="checkin-page__tip"><span className="checkin-page__tip-dot" /> Show the QR code at the door for scanning.</li>
              </ul>
              <Link to="/my-registrations" className="checkin-page__tip-link">
                <Button size="sm" variant="secondary">My Registrations</Button>
              </Link>
            </Card>

            <Card className="checkin-page__panel">
              <h3 className="checkin-page__panel-subtitle">
                <History size={18} className="checkin-page__panel-icon" />
                Recent Check-ins
              </h3>
              {recent.length === 0 ? (
                <p className="checkin-page__empty">No recent check-ins yet.</p>
              ) : (
                <ul className="checkin-page__recent">
                  {recent.map((r) => (
                    <li key={r.code + r.time} className="checkin-page__recent-row">
                      <span className="checkin-page__recent-code">{r.code}</span>
                      <span className="checkin-page__recent-time">
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
      <div className="checkin-result checkin-result--neutral">
        <div className="checkin-result__head">
          <p className="checkin-result__title">Found registration</p>
          <Badge variant={result.reg.status === 'checked_in' ? 'success' : result.reg.status === 'cancelled' ? 'danger' : 'info'}>
            {result.reg.status.replace('_', ' ')}
          </Badge>
        </div>
        <p className="checkin-result__code">{result.code}</p>
      </div>
    )
  }
  if (result.ok) {
    return (
      <div className="checkin-result checkin-result--success">
        <CheckCircle2 size={20} className="checkin-result__icon" />
        <div>
          <p className="checkin-result__title">Checked in successfully</p>
          <p className="checkin-result__code">{result.code}</p>
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
    <div className="checkin-result checkin-result--error">
      <AlertTriangle size={20} className="checkin-result__icon" />
      <div>
        <p className="checkin-result__title">{message}</p>
        <p className="checkin-result__code">{result.code}</p>
      </div>
    </div>
  )
}