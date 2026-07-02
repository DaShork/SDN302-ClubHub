import { Link } from 'react-router-dom';
import './AISection.css';

export default function AISection() {
  return (
    <section className="ai-section">
      <div className="ai-section__inner">
        <div className="ai-section__copy">
          <span className="ai-section__eyebrow">🤖 AI Assistant</span>
          <h2 className="ai-section__title">
            Ask anything about<br />
            FPTU's clubs.
          </h2>
          <p className="ai-section__lead">
            Our AI Assistant helps you find clubs, learn about events, and search
            the knowledge base — instantly.
          </p>

          <ul className="ai-section__bullets">
            <li><span>✓</span> Find clubs by interest or schedule</li>
            <li><span>✓</span> Get answers from the knowledge base</li>
            <li><span>✓</span> 24/7 availability for students</li>
          </ul>

          <Link to="/ai" className="ai-section__btn">
            Try AI Assistant →
          </Link>
        </div>

        <div className="ai-section__chat">
          <div className="ai-section__chat-header">
            <span className="ai-section__chat-dot" />
            <span>ClubHub AI</span>
            <span className="ai-section__chat-status">Online</span>
          </div>

          <div className="ai-section__chat-body">
            <div className="ai-section__msg ai-section__msg--user">
              What clubs meet on Wednesday evenings?
            </div>
            <div className="ai-section__msg ai-section__msg--bot">
              I found 3 clubs with Wednesday meetings:
              <ul>
                <li><strong>FPTU AI Club</strong> — 6:30 PM, Building A2</li>
                <li><strong>Debate Society</strong> — 7:00 PM, Hall B1</li>
                <li><strong>Music Band</strong> — 7:30 PM, Studio C</li>
              </ul>
              Want me to register you for any of these?
            </div>
            <div className="ai-section__msg ai-section__msg--user">
              Tell me more about the AI Club.
            </div>
            <div className="ai-section__chat-typing">
              <span /><span /><span />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}