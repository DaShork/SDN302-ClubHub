import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Image as ImageIcon, X } from 'lucide-react'
import { galleryService } from '@/services/galleryService'
import { clubService } from '@/services/clubService'
import { resolveClubUuid, USE_MOCK_FALLBACK } from '@/services/supabase'
import { Loading, HeroSection } from '@/components'
import Badge from '@/components/StatusBadge/StatusBadge.jsx'
import './GalleryPage.css'

export default function GalleryPageContent() {
  const [searchParams] = useSearchParams()
  const clubIdFromUrl = searchParams.get('club')

  const [galleries, setGalleries] = useState([])
  const [clubs, setClubs] = useState([])
  const [loading, setLoading] = useState(true)
  // selectedClubRaw preserves the slug/UUID the user clicked so the
  // filter button highlight stays correct. resolvedClubId is what we
  // actually send to galleryService.getAll().
  const [selectedClubRaw, setSelectedClubRaw] = useState(clubIdFromUrl || null)
  const [resolvedClubId, setResolvedClubId] = useState(null)
  const [lightboxImage, setLightboxImage] = useState(null)

  // Resolve slug → UUID whenever the selection changes
  useEffect(() => {
    let cancelled = false
    async function resolve() {
      if (!selectedClubRaw) {
        setResolvedClubId(null)
        return
      }
      if (/^[0-9a-f-]{36}$/i.test(selectedClubRaw)) {
        setResolvedClubId(selectedClubRaw)
        return
      }
      const uuid = await resolveClubUuid(selectedClubRaw).catch(() => null)
      if (!cancelled) setResolvedClubId(uuid)
    }
    resolve()
    return () => { cancelled = true }
  }, [selectedClubRaw])

  const loadData = async () => {
    try {
      setLoading(true)
      const [galleryData, clubsData] = await Promise.all([
        galleryService.getAll({ clubId: resolvedClubId || undefined }),
        clubs.length === 0 ? clubService.getAll() : Promise.resolve(clubs),
      ])
      setGalleries(galleryData || [])
      if (clubs.length === 0) {
        setClubs(clubsData || [])
      }
    } catch (error) {
      console.error('Error loading gallery:', error)
    } finally {
      setLoading(false)
    }
  }

  // Reload when the resolved UUID changes (not when raw slug changes)
  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedClubId])

  // When mock fallback is on and DB is empty, surface a one-liner so the
  // user understands why the page is blank instead of assuming a bug.
  const showEmptyHint = useMemo(
    () => !loading && galleries.length === 0 && USE_MOCK_FALLBACK,
    [loading, galleries.length]
  )

  return (
    <div className="gallery-page">
      <HeroSection
        variant="gallery"
        eyebrow="ClubHub Memories"
        title="Club"
        titleGradient="Gallery"
        subtitle="Explore memories and moments from clubs across FPT University."
      />

      <section className="gallery-page__content">
        <div className="gallery-page__container">
          <div className="gallery-page__filters">
            <button
              type="button"
              className={`gallery-filter ${selectedClubRaw === null ? 'gallery-filter--active' : ''}`}
              onClick={() => setSelectedClubRaw(null)}
            >
              All Clubs
            </button>
            {clubs.map((club) => (
              <button
                key={club.id}
                type="button"
                className={`gallery-filter ${selectedClubRaw === club.id ? 'gallery-filter--active' : ''}`}
                onClick={() => setSelectedClubRaw(club.id)}
              >
                {club.name}
              </button>
            ))}
          </div>

          {loading ? (
            <Loading />
          ) : galleries.length === 0 ? (
            <div className="gallery-empty">
              <ImageIcon size={48} className="gallery-empty__icon" />
              <h3 className="gallery-empty__title">No images found</h3>
              <p className="gallery-empty__desc">
                {showEmptyHint
                  ? 'Mock fallback is enabled — upload images to Supabase Storage to see them here.'
                  : 'Check back later for gallery updates'}
              </p>
            </div>
          ) : (
            <>
              <p className="gallery-page__count">{galleries.length} images</p>
              <div className="gallery-grid">
                {galleries.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className="gallery-tile"
                    onClick={() => setLightboxImage(item)}
                  >
                    <img
                      src={item.image_url}
                      alt={item.caption || 'Gallery image'}
                      className="gallery-tile__img"
                    />
                    <div className="gallery-tile__overlay">
                      {item.clubs && (
                        <Badge variant="default" className="gallery-tile__badge">
                          {item.clubs.name}
                        </Badge>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {lightboxImage && (
        <div
          className="gallery-lightbox"
          onClick={() => setLightboxImage(null)}
        >
          <button
            type="button"
            className="gallery-lightbox__close"
            onClick={() => setLightboxImage(null)}
            aria-label="Close lightbox"
          >
            <X size={28} />
          </button>
          <div className="gallery-lightbox__inner" onClick={(e) => e.stopPropagation()}>
            <img
              src={lightboxImage.image_url}
              alt={lightboxImage.caption || 'Gallery image'}
              className="gallery-lightbox__img"
            />
            {lightboxImage.caption && (
              <p className="gallery-lightbox__caption">{lightboxImage.caption}</p>
            )}
            {lightboxImage.clubs && (
              <p className="gallery-lightbox__meta">{lightboxImage.clubs.name}</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}