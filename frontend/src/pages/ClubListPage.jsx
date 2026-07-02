import { useState, useEffect } from 'react'
import { clubService } from '@/services/clubService'
import { ClubGrid } from '@/components/cards/ClubCard'
import { SearchBar, FilterPanel } from '@/components/shared'
import { Loading } from '@/components/ui/loading'
import { useDebounce } from '@/hooks/useDebounce'

export function ClubListPage() {
  const [clubs, setClubs] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState(null)
  const debouncedSearch = useDebounce(search, 400)

  useEffect(() => {
    loadData()
  }, [selectedCategory, debouncedSearch])

  const loadData = async () => {
    try {
      setLoading(true)
      const [clubsData, categoriesData] = await Promise.all([
        clubService.getAll({
          categoryId: selectedCategory,
          search: debouncedSearch || undefined,
        }),
        categories.length === 0 ? clubService.getCategories() : Promise.resolve(categories),
      ])
      setClubs(clubsData || [])
      if (categories.length === 0) {
        setCategories(categoriesData || [])
      }
    } catch (error) {
      console.error('Error loading clubs:', error)
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
              Discover Your Community
            </h1>
            <p className="text-lg text-secondary-200 mb-8">
              Explore FPT University's diverse club ecosystem and find your perfect match
            </p>
            <div className="max-w-md mx-auto">
              <SearchBar
                placeholder="Search clubs..."
                value={search}
                onChange={setSearch}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-12">
        <div className="container">
          {/* Filters */}
          <div className="mb-8">
            <FilterPanel
              categories={categories}
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
            />
          </div>

          {/* Results */}
          {loading ? (
            <Loading />
          ) : clubs.length === 0 ? (
            <div className="text-center py-16">
              <svg className="mx-auto h-16 w-16 text-secondary-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-xl font-semibold text-secondary-100 mb-2">No clubs found</h3>
              <p className="text-secondary-300">Try adjusting your search or filters</p>
            </div>
          ) : (
            <>
              <p className="text-secondary-300 mb-6">{clubs.length} clubs found</p>
              <ClubGrid clubs={clubs} />
            </>
          )}
        </div>
      </section>
    </div>
  )
}
