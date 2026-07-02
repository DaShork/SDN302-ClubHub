import { Link } from 'react-router-dom';
import './CategorySection.css';

const categories = [
  { name: 'Academic', icon: '📚' },
  { name: 'Technology', icon: '💻' },
  { name: 'Sports', icon: '⚽' },
  { name: 'Arts', icon: '🎨' },
  { name: 'Volunteer', icon: '🤝' },
  { name: 'Culture', icon: '🌏' },
  { name: 'Business', icon: '💼' },
  { name: 'Media', icon: '🎬' },
];

export default function CategorySection() {
  return (
    <section className="categories">
      <div className="categories__inner">
        <div className="categories__head">
          <span className="categories__eyebrow">Browse by Category</span>
          <h2 className="categories__title">Find your community</h2>
          <p className="categories__lead">
            Eight categories covering every passion — from tech to culture, sports to business.
          </p>
        </div>

        <div className="categories__grid">
          {categories.map((cat) => (
            <Link
              key={cat.name}
              to={`/clubs?category=${cat.name}`}
              className="categories__item"
            >
              <div className="categories__icon">{cat.icon}</div>
              <span className="categories__name">{cat.name}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}