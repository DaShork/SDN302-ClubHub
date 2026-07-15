import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { clubService } from '@/services/clubService';
import './CategorySection.css';

// Built-in category icons (DB stores only the `name` column). When the
// backend adds an `icon` column we can read it from the service instead.
const CATEGORY_ICONS = {
  Academic: '📚',
  Technology: '💻',
  Sports: '⚽',
  Arts: '🎨',
  Volunteer: '🤝',
  Culture: '🌏',
  Business: '💼',
  Media: '🎬',
};

export default function CategorySection() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await clubService.getCategories();
        if (!cancelled) {
          // Normalise: service returns array of {name, count}; map icon.
          const list = (data || []).map((c) => ({
            name: c.name,
            count: c.count,
            icon: CATEGORY_ICONS[c.name] || '✨',
          }));
          setCategories(list);
        }
      } catch (err) {
        if (!cancelled) console.warn('[CategorySection] load error:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  return (
    <section className="categories">
      <div className="categories__inner">
        <div className="categories__head">
          <span className="categories__eyebrow">Browse by Category</span>
          <h2 className="categories__title">Find your community</h2>
          <p className="categories__lead">
            {loading
              ? 'Đang tải danh mục...'
              : categories.length === 0
                ? 'Chưa có danh mục nào — hãy quay lại sau.'
                : `${categories.length} danh mục — tìm cộng đồng phù hợp với bạn.`}
          </p>
        </div>

        {loading ? (
          <div className="categories__loading">
            <Loader2 size={24} className="spin" />
          </div>
        ) : (
          <div className="categories__grid">
            {categories.map((cat) => (
              <Link
                key={cat.name}
                to={`/clubs?category=${encodeURIComponent(cat.name)}`}
                className="categories__item"
              >
                <div className="categories__icon">{cat.icon}</div>
                <span className="categories__name">{cat.name}</span>
                {typeof cat.count === 'number' && (
                  <span className="categories__count">{cat.count} CLB</span>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}