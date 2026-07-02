/**
 * Lightweight localStorage-based stores used for UI prototyping
 * before authentication + backend are wired in.
 *
 * Data shapes:
 *  memberships: { [userId]: Array<{ clubId, joinedAt, role: 'member' | 'leader' }> }
 *  registrations: { [userId]: Array<{ eventId, registeredAt, status: 'registered' | 'cancelled' | 'checked_in', qrCode }> }
 *  currentUserId: string (no auth yet, defaults to 'demo-user')
 */

const STORAGE_KEYS = {
  memberships: 'clubhub.memberships',
  registrations: 'clubhub.registrations',
  currentUserId: 'clubhub.currentUserId',
}

const DEFAULT_USER_ID = 'demo-user'

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function writeJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (err) {
    console.warn('Failed to persist store', key, err)
  }
}

// ---------- Membership store ----------
export const membershipStore = {
  getAll() {
    const all = readJSON(STORAGE_KEYS.memberships, {})
    return all[this._userId()] || []
  },

  isMember(clubId) {
    return this.getAll().some((m) => m.clubId === clubId)
  },

  join(clubId) {
    if (this.isMember(clubId)) return
    const all = readJSON(STORAGE_KEYS.memberships, {})
    const list = all[this._userId()] || []
    list.push({
      clubId,
      joinedAt: new Date().toISOString(),
      role: 'member',
    })
    all[this._userId()] = list
    writeJSON(STORAGE_KEYS.memberships, all)
    window.dispatchEvent(new CustomEvent('clubhub:membershipChanged'))
  },

  leave(clubId) {
    const all = readJSON(STORAGE_KEYS.memberships, {})
    const list = (all[this._userId()] || []).filter((m) => m.clubId !== clubId)
    all[this._userId()] = list
    writeJSON(STORAGE_KEYS.memberships, all)
    window.dispatchEvent(new CustomEvent('clubhub:membershipChanged'))
  },

  _userId() {
    return readJSON(STORAGE_KEYS.currentUserId, DEFAULT_USER_ID) || DEFAULT_USER_ID
  },
}

// ---------- Registration store ----------
export const registrationStore = {
  getAll() {
    const all = readJSON(STORAGE_KEYS.registrations, {})
    return all[this._userId()] || []
  },

  isRegistered(eventId) {
    const reg = this.getAll().find((r) => r.eventId === eventId)
    return reg?.status === 'registered' || reg?.status === 'checked_in'
  },

  register(eventId) {
    const all = readJSON(STORAGE_KEYS.registrations, {})
    const list = all[this._userId()] || []
    const existing = list.find((r) => r.eventId === eventId)
    if (existing) {
      if (existing.status === 'cancelled') {
        existing.status = 'registered'
        existing.registeredAt = new Date().toISOString()
      }
    } else {
      list.push({
        eventId,
        registeredAt: new Date().toISOString(),
        status: 'registered',
        qrCode: `CHB-${eventId}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      })
    }
    all[this._userId()] = list
    writeJSON(STORAGE_KEYS.registrations, all)
    window.dispatchEvent(new CustomEvent('clubhub:registrationChanged'))
  },

  cancel(eventId) {
    const all = readJSON(STORAGE_KEYS.registrations, {})
    const list = all[this._userId()] || []
    const reg = list.find((r) => r.eventId === eventId)
    if (reg) {
      reg.status = 'cancelled'
    }
    all[this._userId()] = list
    writeJSON(STORAGE_KEYS.registrations, all)
    window.dispatchEvent(new CustomEvent('clubhub:registrationChanged'))
  },

  checkIn(qrCode) {
    const all = readJSON(STORAGE_KEYS.registrations, {})
    const list = all[this._userId()] || []
    const reg = list.find((r) => r.qrCode === qrCode)
    if (!reg) return { ok: false, reason: 'not_registered' }
    if (reg.status === 'cancelled') return { ok: false, reason: 'cancelled' }
    if (reg.status === 'checked_in') return { ok: false, reason: 'already', reg }
    reg.status = 'checked_in'
    reg.checkedInAt = new Date().toISOString()
    all[this._userId()] = list
    writeJSON(STORAGE_KEYS.registrations, all)
    window.dispatchEvent(new CustomEvent('clubhub:registrationChanged'))
    return { ok: true, reg }
  },

  findByQrCode(qrCode) {
    const list = this.getAll()
    return list.find((r) => r.qrCode === qrCode) || null
  },

  _userId() {
    return readJSON(STORAGE_KEYS.currentUserId, DEFAULT_USER_ID) || DEFAULT_USER_ID
  },
}

// ---------- Hook helper ----------
import { useEffect, useState } from 'react'

export function useMembership() {
  const [tick, setTick] = useState(0)
  useEffect(() => {
    const refresh = () => setTick((t) => t + 1)
    window.addEventListener('clubhub:membershipChanged', refresh)
    return () => window.removeEventListener('clubhub:membershipChanged', refresh)
  }, [])
  return {
    memberships: membershipStore.getAll(),
    isMember: (clubId) => membershipStore.isMember(clubId),
    join: membershipStore.join.bind(membershipStore),
    leave: membershipStore.leave.bind(membershipStore),
    _tick: tick,
  }
}

export function useRegistration() {
  const [tick, setTick] = useState(0)
  useEffect(() => {
    const refresh = () => setTick((t) => t + 1)
    window.addEventListener('clubhub:registrationChanged', refresh)
    return () => window.removeEventListener('clubhub:registrationChanged', refresh)
  }, [])
  return {
    registrations: registrationStore.getAll(),
    isRegistered: (eventId) => registrationStore.isRegistered(eventId),
    register: registrationStore.register.bind(registrationStore),
    cancel: registrationStore.cancel.bind(registrationStore),
    _tick: tick,
  }
}
