import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { Button } from '@/components';
import './LeaderEmptyState.css';

/**
 * LeaderEmptyState — friendly placeholder shown when the current user holds the
 * CLUB_LEADER role but is not currently leading any club (e.g. they were
 * removed as president, or the role was granted speculatively).
 */
export default function LeaderEmptyState() {
  return (
    <div className="leader-empty-state">
      <div className="leader-empty-state__icon">
        <Compass size={42} />
      </div>
      <h2 className="leader-empty-state__title">
        You're not leading any club yet
      </h2>
      <p className="leader-empty-state__desc">
        Once a club's president status is assigned to you, it will appear here
        and you'll be able to manage its members, events and resources.
      </p>
      <div className="leader-empty-state__cta">
        <Link to="/clubs">
          <Button size="lg">Find a club</Button>
        </Link>
        <Link to="/my-clubs">
          <Button size="lg" variant="secondary">
            View my memberships
          </Button>
        </Link>
      </div>
    </div>
  );
}