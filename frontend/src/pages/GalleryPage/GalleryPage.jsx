import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Image as ImageIcon, X } from 'lucide-react'
import { galleryService } from '@/services/galleryService'
import { clubService } from '@/services/clubService'
import { Loading, HeroSection } from '@/components'
import Badge from '@/components/StatusBadge/StatusBadge.jsx'
import './GalleryPage.css'

export default function GalleryPageContent() {
  const [searchParams] = useSearchParams()
  const clubIdFromUrl = searchParams.get('club')

  const [galleries, setGalleries] = useState([])
  const [clubs, setClubs] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedClub, setSelectedClub] = useState(clubIdFromUrl || null)
  const [lightboxImage, setLightboxImage] = useState(null)

  const loadData = async () => {
    try {
      setLoading(true)
      const [galleryData, clubsData] = await Promise.all([
        galleryService.getAll({ clubId: selectedClub || undefined }),
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

  useEffect(() => {
    loadData()
  }, [selectedClub])

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
              className={`gallery-filter ${selectedClub === null ? 'gallery-filter--active' : ''}`}
              onClick={() => setSelectedClub(null)}
            >
              All Clubs
            </button>
            {clubs.map((club) => (
              <button
                key={club.id}
                type="button"
                className={`gallery-filter ${selectedClub === club.id ? 'gallery-filter--active' : ''}`}
                onClick={() => setSelectedClub(club.id)}
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
              <p className="gallery-empty__desc">Check back later for gallery updates</p>
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