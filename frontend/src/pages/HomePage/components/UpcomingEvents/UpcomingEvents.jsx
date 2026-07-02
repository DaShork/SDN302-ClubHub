import { Link } from 'react-router-dom';
import { upcomingEvents } from '../../mockData.js';
import './UpcomingEvents.css';

export default function UpcomingEvents() {
  return (
    <section className="upcoming-events">
      <div className="upcoming-events__inner">
        <div className="upcoming-events__head">
          <div>
            <span className="upcoming-events__eyebrow">Upcoming Events</span>
            <h2 className="upcoming-events__title">Don't miss out</h2>
          </div>
          <Link to="/events" className="upcoming-events__view-all">
            See full calendar →
          </Link>
        </div>

        <div className="upcoming-events__grid">
          {upcomingEvents.map((event) => (
            <article key={event.id} className="upcoming-events__card">
              <div className="upcoming-events__card-top">
                <span className="upcoming-events__pill">Upcoming</span>
                <span className="upcoming-events__club">{event.club}</span>
              </div>
              <h3 className="upcoming-events__card-title">{event.title}</h3>
              <div className="upcoming-events__meta">
                <div className="upcoming-events__meta-row">
                  <span className="upcoming-events__meta-icon">📅</span>
                  <span>{event.date}</span>
                </div>
                <div className="upcoming-events__meta-row">
                  <span className="upcoming-events__meta-icon">📍</span>
                  <span>{event.location}</span>
                </div>
              </div>
              <Link to={`/events/${event.id}`} className="upcoming-events__btn">
                Register Now
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}