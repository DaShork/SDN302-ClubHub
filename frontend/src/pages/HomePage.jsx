import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'

import { supabase } from '../services/supabase'

const UI = {
  primary900: '#06231D',
  primary800: '#0E4B43',
  primary700: '#16685D',
  primary600: '#223148',
  secondary100: '#F4F1EA',
  secondary200: '#E8E2D8',
  accentGreen: '#22C55E',
  accentBlue: '#3B82F6',
  danger: '#EF4444',
  warning: '#F59E0B',
}

export default function HomePage() {
  const [clubs, setClubs] = useState([])
  const [stats, setStats] = useState({
    clubs: 0,
    members: 0,
    events: 0,
    articles: 0,
  })

  useEffect(() => {
    let active = true

    const fetchHomeData = async () => {
      const { data: clubsData, error: clubsError } = await supabase
        .from('clubs')
        .select('id, name, description, status, category')
        .order('created_at', { ascending: false })
        .limit(6)

      if (!active) return
      if (clubsError) {
        console.error('Failed to load clubs', clubsError)
        return
      }

      const [{ count: clubsCount = 0 }, { count: membersCount = 0 }, { count: eventsCount = 0 }, { count: articlesCount = 0 }] = await Promise.all([
        supabase.from('clubs').select('*', { count: 'exact', head: true }),
        supabase.from('members').select('*', { count: 'exact', head: true }),
        supabase.from('events').select('*', { count: 'exact', head: true }),
        supabase.from('knowledge_articles').select('*', { count: 'exact', head: true }),
      ])

      if (!active) return

      setClubs(clubsData || [])
      setStats({
        clubs: clubsCount,
        members: membersCount,
        events: eventsCount,
        articles: articlesCount,
      })
    }

    fetchHomeData()

    return () => {
      active = false
    }
  }, [])

  const metrics = [
    { label: 'Clubs', value: stats.clubs },
    { label: 'Members', value: stats.members },
    { label: 'Active Events', value: stats.events },
    { label: 'Knowledge Articles', value: stats.articles },
  ]

  const featuredClubs = clubs.slice(0, 6)

  return (
    <div className="min-h-screen" style={{ background: UI.primary900, color: UI.secondary100 }}>
      <Navbar />

      <main className="mx-auto max-w-[1280px] px-4 md:px-6 lg:px-8">
        <HeroSection />

        <section className="py-10 md:py-14 lg:py-16">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
            {metrics.map((item) => (
              <MetricCard key={item.label} {...item} />
            ))}
          </div>
        </section>

        <section className="pb-14 md:pb-20 lg:pb-24">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-3xl font-bold md:text-4xl" style={{ color: UI.secondary100 }}>
                Featured Clubs
              </h2>
              <p className="mt-2 text-sm md:text-base" style={{ color: UI.secondary200 }}>
                Explore active student communities and start collaborating with campus clubs.
              </p>
            </div>

            <LinkButton
              href="#clubs"
              label="View all clubs"
              variant="secondary"
            />
          </div>

          <div
            id="clubs"
            className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3"
          >
            {featuredClubs.length === 0 ? (
              <EmptyState message="No clubs have been published yet." />
            ) : (
              featuredClubs.map((club) => (
                <ClubCard key={club.id} club={club} />
              ))
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

function Navbar() {
  return (
    <header
      className="sticky top-0 z-40 border-b"
      style={{
        background: 'rgba(6,35,29,0.95)',
        borderColor: 'rgba(255,255,255,0.08)',
        backdropFilter: 'blur(8px)',
      }}
    >
      <nav className="mx-auto flex h-20 max-w-[1280px] items-center justify-between px-4 md:px-6 lg:px-8">
        <BrandMark />

        <div className="hidden items-center gap-8 md:flex">
          <NavLink href="#clubs">Clubs</NavLink>
          <NavLink href="#events">Events</NavLink>
          <NavLink href="#knowledge">Knowledge Base</NavLink>
          <NavLink href="#ai">AI Assistant</NavLink>
          <NavLink href="#announcements">Announcements</NavLink>
        </div>

        <div className="flex items-center gap-3">
          <LinkButton href="#sign-in" label="Sign in" variant="secondary" />
          <LinkButton href="#sign-up" label="Get started" />
        </div>
      </nav>
    </header>
  )
}

function BrandMark() {
  return (
    <div className="flex items-center gap-3">
      <div
        className="flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold"
        style={{ background: UI.accentGreen, color: UI.primary900 }}
      >
        CH
      </div>
      <div className="leading-tight">
        <div className="text-base font-semibold" style={{ color: UI.secondary100 }}>
          ClubHub
        </div>
        <div className="text-xs font-medium" style={{ color: UI.secondary200 }}>
          FPT University
        </div>
      </div>
    </div>
  )
}

function NavLink({ href, children }) {
  return (
    <a
      href={href}
      className="text-sm font-medium transition-colors"
      style={{ color: UI.secondary200 }}
      onMouseEnter={(event) => (event.currentTarget.style.color = UI.accentGreen)}
      onMouseLeave={(event) => (event.currentTarget.style.color = UI.secondary200)}
    >
      {children}
    </a>
  )
}

function HeroSection() {
  return (
    <section className="grid gap-10 py-12 md:grid-cols-2 md:gap-12 md:py-16 lg:py-20">
      <div className="flex flex-col justify-center gap-5">
        <span
          className="inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold"
          style={{ background: 'rgba(34,197,94,0.12)', color: UI.accentGreen, border: '1px solid rgba(34,197,94,0.25)' }}
        >
          SDN302 MVP
        </span>

        <h1
          className="text-4xl font-bold leading-tight md:text-5xl lg:text-6xl"
          style={{ color: UI.secondary100 }}
        >
          ClubHub FPTU
        </h1>

        <p className="text-base md:text-lg" style={{ color: UI.secondary200 }}>
          Connect with clubs, events, knowledge, and AI-powered support across campus. Centralize club knowledge and improve communication for students and club leaders.
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <LinkButton href="#clubs" label="Explore clubs" />
          <LinkButton href="#ai" label="Ask AI" variant="secondary" />
        </div>
      </div>

      <div
        className="flex flex-col gap-4 rounded-2xl p-6"
        style={{
          background: UI.primary600,
          border: '1px solid rgba(255,255,255,0.05)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
        }}
      >
        <QuickStartCard
          title="Start Here"
          description="Sign up and join your first club."
          action="Get started"
          href="#sign-up"
        />
        <QuickStartCard
          title="Events"
          description="Discover upcoming campus activities."
          action="View events"
          href="#events"
        />
        <QuickStartCard
          title="Knowledge Base"
          description="Find docs and club resources."
          action="Browse articles"
          href="#knowledge"
        />
      </div>
    </section>
  )
}

function QuickStartCard({ title, description, action, href }) {
  return (
    <div
      className="flex items-center justify-between gap-4 rounded-xl p-4"
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.05)',
      }}
    >
      <div>
        <div className="text-sm font-semibold" style={{ color: UI.secondary100 }}>
          {title}
        </div>
        <div className="mt-1 text-xs" style={{ color: UI.secondary200 }}>
          {description}
        </div>
      </div>

      <LinkButton href={href} label={action} variant="secondary" />
    </div>
  )
}

function MetricCard({ label, value }) {
  return (
    <div
      className="rounded-2xl p-4 md:p-5"
      style={{
        background: UI.primary600,
        border: '1px solid rgba(255,255,255,0.05)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
      }}
    >
      <div className="text-2xl font-bold md:text-3xl" style={{ color: UI.secondary100 }}>
        {typeof value === 'number' ? value.toLocaleString() : '—'}
      </div>
      <div className="mt-1 text-xs md:text-sm" style={{ color: UI.secondary200 }}>
        {label}
      </div>
    </div>
  )
}

function ClubCard({ club }) {
  const statusStyles = {
    Active: { background: 'rgba(34,197,94,0.12)', color: UI.accentGreen, border: '1px solid rgba(34,197,94,0.25)' },
    Recruiting: { background: 'rgba(59,130,246,0.12)', color: UI.accentBlue, border: '1px solid rgba(59,130,246,0.25)' },
    Inactive: { background: 'rgba(245,158,11,0.12)', color: UI.warning, border: '1px solid rgba(245,158,11,0.25)' },
  }

  const status = statusStyles[club.status] || statusStyles['Active']

  return (
    <div
      className="flex flex-col gap-4 rounded-2xl p-5 transition-transform duration-300 hover:-translate-y-1"
      style={{
        background: UI.primary600,
        border: '1px solid rgba(255,255,255,0.05)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-base font-semibold" style={{ color: UI.secondary100 }}>
            {club.name}
          </div>
          <div className="text-xs" style={{ color: UI.secondary200 }}>
            {club.category || 'General'}
          </div>
        </div>

        <span
          className="whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold"
          style={status}
        >
          {club.status}
        </span>
      </div>

      <p className="line-clamp-3 text-sm leading-relaxed" style={{ color: UI.secondary200 }}>
        {club.description || 'This club has not added a description yet.'}
      </p>

      <div className="mt-auto pt-2">
        <LinkButton href={`#club/${club.id}`} label="View details" variant="secondary" />
      </div>
    </div>
  )
}

function EmptyState({ message }) {
  return (
    <div
      className="rounded-2xl p-6 text-center"
      style={{ background: UI.primary600, border: '1px solid rgba(255,255,255,0.05)' }}
    >
      <p className="text-sm" style={{ color: UI.secondary200 }}>{message}</p>
    </div>
  )
}

function LinkButton({ href, label, variant = 'primary' }) {
  const base =
    'inline-flex h-12 items-center justify-center rounded-xl px-4 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2'

  const styles = {
    primary: {
      background: `linear-gradient(90deg, ${UI.primary800}, ${UI.accentGreen})`,
      color: UI.primary900,
    },
    secondary: {
      background: 'transparent',
      border: `1px solid ${UI.accentGreen}`,
      color: UI.accentGreen,
    },
  }

  const focusRingColor = variant === 'primary' ? UI.accentGreen : UI.accentGreen

  return (
    <a
      href={href}
      className={base}
      style={{
        ...styles[variant],
        focusVisibleRingColor: focusRingColor,
      }}
    >
      {label}
    </a>
  )
}

function Footer() {
  return (
    <footer
      className="border-t"
      style={{ borderColor: 'rgba(255,255,255,0.08)', background: UI.primary900 }}
    >
      <div className="mx-auto flex flex-col gap-4 py-10 text-center md:flex-row md:items-center md:justify-between md:text-left">
        <BrandMark />

        <div className="text-xs" style={{ color: UI.secondary200 }}>
          © {new Date().getFullYear()} ClubHub FPTU. Built for SDN302.
        </div>

        <div className="flex flex-wrap justify-center gap-4 md:justify-end">
          <FooterLink href="#support">Support</FooterLink>
          <FooterLink href="#privacy">Privacy</FooterLink>
          <FooterLink href="#terms">Terms</FooterLink>
        </div>
      </div>
    </footer>
  )
}

function FooterLink({ href, children }) {
  return (
    <a
      href={href}
      className="text-xs font-medium transition-colors"
      style={{ color: UI.secondary200 }}
      onMouseEnter={(event) => (event.currentTarget.style.color = UI.accentGreen)}
      onMouseLeave={(event) => (event.currentTarget.style.color = UI.secondary200)}
    >
      {children}
    </a>
  )
}
