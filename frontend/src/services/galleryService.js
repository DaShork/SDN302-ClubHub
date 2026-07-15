import { supabase } from './supabase'
import { mockData } from './mockData'
import { RequestTimeoutError } from './supabase'

/* DELETE_MOCK_FALLBACK: when backend is stable, drop the mockData
   import + this helper + every withFallback wrapper in this file. */
const USE_MOCK_FALLBACK = true

function withTimeout(promise, label) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => {
      reject(new RequestTimeoutError(`${label} timed out`))
    }, 8000)
    promise.then(
      (v) => { clearTimeout(t); resolve(v) },
      (e) => {
        clearTimeout(t)
        if (
          e?.name === 'AbortError' ||
          e?.message?.includes('aborted') ||
          e?.message?.includes('Failed to fetch') ||
          e?.message?.includes('NetworkError') ||
          e?.message?.includes('ERR_INTERNET_DISCONNECTED')
        ) {
          reject(new RequestTimeoutError(e.message || `${label} network error`))
          return
        }
        reject(e)
      }
    )
  })
}

async function withFallback(label, fallbackFn) {
  // Fast path: skip the Supabase call while the backend is unstable.
  if (USE_MOCK_FALLBACK) {
    return fallbackFn();
  }
  try {
    return await label();
  } catch (err) {
    const isNetErr =
      err instanceof RequestTimeoutError ||
      err?.name === 'AbortError' ||
      err?.message?.includes('Failed to fetch') ||
      err?.message?.includes('NetworkError') ||
      err?.message?.includes('aborted') ||
      err?.message?.includes('ERR_INTERNET_DISCONNECTED')
    if (!isNetErr) throw err
    // eslint-disable-next-line no-console
    console.warn('[gallery.fallback] backend unreachable — using mock:', err?.message || err)
    return fallbackFn()
  }
}

export const galleryService = {
  async getAll({ clubId, limit = 20, offset = 0 } = {}) {
    let query = supabase
      .from('galleries')
      .select(`
        *,
        clubs (id, name, logo_url)
      `)
      .order('uploaded_at', { ascending: false })

    if (clubId) {
      query = query.eq('club_id', clubId)
    }

    const { data, error } = await query.range(offset, offset + limit - 1)

    if (error) throw error
    return data
  },

  async getByClub(clubId) {
    return withFallback(
      () =>
        withTimeout(
          supabase
            .from('galleries')
            .select(`
              *,
              clubs (id, name)
            `)
            .eq('club_id', clubId)
            .order('uploaded_at', { ascending: false }),
          'gallery.getByClub'
        ).then(({ data, error }) => {
          if (error) throw error
          return data
        }),
      () => mockData.getGalleryByClub(clubId)
    )
  },

  async getFeatured(limit = 8) {
    const { data, error } = await supabase
      .from('galleries')
      .select(`
        *,
        clubs (id, name, logo_url)
      `)
      .order('uploaded_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data
  },
}