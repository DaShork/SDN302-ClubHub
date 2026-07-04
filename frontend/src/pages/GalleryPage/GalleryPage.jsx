import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { galleryService } from '@/services/galleryService'
import { clubService } from '@/services/clubService'
import { Loading } from '@/components/Loading/Loading.jsx'
import Badge from '@/components/StatusBadge/StatusBadge.jsx'
import { Input } from '@/components/Input/Input.jsx'
import { Card } from '@/components/Card/Card.jsx'

export function GalleryPage() {
  const [searchParams] = useSearchParams()
  const clubIdFromUrl = searchParams.get('club')

  const [galleries, setGalleries] = useState([])
  const [clubs, setClubs] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedClub, setSelectedClub] = useState(clubIdFromUrl || null)
  const [lightboxImage, setLightboxImage] = useState(null)

  useEffect(() => {
    loadData()
  }, [selectedClub])

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

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="gradient-primary py-16 md:py-24">
        <div className="container">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-secondary-100 mb-4">
              Club Gallery
            </h1>
            <p className="text-lg text-secondary-200">
              Explore memories and moments from clubs across FPT University
            </p>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-12">
        <div className="container">
          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-8">
            <Badge
              variant={selectedClub === null ? 'default' : 'default'}
              className={`cursor-pointer transition-all px-4 py-2 ${
                selectedClub === null
                  ? 'bg-accent-green text-white'
                  : 'bg-primary-700 text-secondary-200 hover:bg-primary-600'
              }`}
              onClick={() => setSelectedClub(null)}
            >
              All Clubs
            </Badge>
            {clubs.map((club) => (
              <Badge
                key={club.id}
                variant="default"
                className={`cursor-pointer transition-all px-4 py-2 ${
                  selectedClub === club.id
                    ? 'bg-accent-green text-white'
                    : 'bg-primary-700 text-secondary-200 hover:bg-primary-600'
                }`}
                onClick={() => setSelectedClub(club.id)}
              >
                {club.name}
              </Badge>
            ))}
          </div>

          {/* Gallery Grid */}
          {loading ? (
            <Loading />
          ) : galleries.length === 0 ? (
            <div className="text-center py-16">
              <svg className="mx-auto h-16 w-16 text-secondary-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <h3 className="text-xl font-semibold text-secondary-100 mb-2">No images found</h3>
              <p className="text-secondary-300">Check back later for gallery updates</p>
            </div>
          ) : (
            <>
              <p className="text-secondary-300 mb-6">{galleries.length} images</p>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {galleries.map((item) => (
                  <div
                    key={item.id}
                    className="group relative aspect-square rounded-xl overflow-hidden bg-card cursor-pointer"
                    onClick={() => setLightboxImage(item)}
                  >
                    <img
                      src={item.image_url}
                      alt={item.caption || 'Gallery image'}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                      {item.clubs && (
                        <span className="text-white text-sm font-medium">
                          {item.clubs.name}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* Lightbox */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxImage(null)}
        >
          <button
            className="absolute top-4 right-4 text-white/80 hover:text-white p-2"
            onClick={() => setLightboxImage(null)}
          >
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="max-w-4xl max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <img
              src={lightboxImage.image_url}
              alt={lightboxImage.caption || 'Gallery image'}
              className="max-w-full max-h-[80vh] object-contain rounded-lg"
            />
            {lightboxImage.caption && (
              <p className="text-white text-center mt-4">{lightboxImage.caption}</p>
            )}
            {lightboxImage.clubs && (
              <p className="text-white/70 text-center mt-2 text-sm">
                {lightboxImage.clubs.name}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
