import { Link } from 'react-router-dom';
import './KnowledgeSection.css';

const articles = [
  {
    id: '1',
    title: 'How to start a club at FPTU',
    excerpt: 'Step-by-step guide from idea to official recognition.',
    category: 'Guide',
    readTime: '5 min',
    color: '#DCFCE7',
  },
  {
    id: '2',
    title: 'Event planning checklist',
    excerpt: 'Everything you need to organize a successful student event.',
    category: 'Template',
    readTime: '8 min',
    color: '#DBEAFE',
  },
  {
    id: '3',
    title: 'Recruiting & onboarding members',
    excerpt: 'Best practices to grow your club and keep members engaged.',
    category: 'Best Practice',
    readTime: '6 min',
    color: '#FEF3C7',
  },
  {
    id: '4',
    title: 'Fundraising on campus',
    excerpt: 'Practical strategies for student-led fundraising.',
    category: 'Resource',
    readTime: '7 min',
    color: '#FCE7F3',
  },
];

export default function KnowledgeSection() {
  return (
    <section className="knowledge">
      <div className="knowledge__inner">
        <div className="knowledge__head">
          <div>
            <span className="knowledge__eyebrow">📚 Knowledge Base</span>
            <h2 className="knowledge__title">Learn from the community</h2>
            <p className="knowledge__lead">
              Guides, templates and best practices — written by FPTU club leaders for FPTU students.
            </p>
          </div>
          <Link to="/knowledge" className="knowledge__view-all">
            Browse all →
          </Link>
        </div>

        <div className="knowledge__grid">
          {articles.map((a) => (
            <article key={a.id} className="knowledge__card">
              <div
                className="knowledge__card-thumb"
                style={{ background: a.color }}
              >
                <span className="knowledge__card-thumb-icon">📄</span>
              </div>
              <div className="knowledge__card-body">
                <div className="knowledge__card-tags">
                  <span className="knowledge__card-tag">{a.category}</span>
                  <span className="knowledge__card-time">{a.readTime}</span>
                </div>
                <h3 className="knowledge__card-title">{a.title}</h3>
                <p className="knowledge__card-excerpt">{a.excerpt}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}