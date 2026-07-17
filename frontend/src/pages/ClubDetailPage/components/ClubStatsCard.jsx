import { Card, Badge } from '@/components';
import { Users, Calendar, Sparkles } from 'lucide-react';

/**
 * Stats card showing key numbers about the club. Reads from props
 * (already-fetched data) — does NOT trigger its own queries, so it's
 * safe to render for anon users where some stats may be 0.
 */
export default function ClubStatsCard({ club, memberCount, eventCount }) {
  return (
    <Card>
      <div className="p-6">
        <h3 className="text-lg font-semibold text-primary-900 mb-4">At a Glance</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-accent-green/20 flex items-center justify-center shrink-0">
              <Users size={18} className="text-accent-green" />
            </div>
            <div>
              <p className="text-xs text-primary-700">Members</p>
              <p className="text-base font-semibold text-primary-900">
                {memberCount ?? 0}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-accent-blue/20 flex items-center justify-center shrink-0">
              <Calendar size={18} className="text-accent-blue" />
            </div>
            <div>
              <p className="text-xs text-primary-700">Events</p>
              <p className="text-base font-semibold text-primary-900">
                {eventCount ?? 0}
              </p>
            </div>
          </div>
          {club?.founded_year && (
            <div className="flex items-center gap-3 col-span-2">
              <div className="w-10 h-10 rounded-lg bg-primary-800/60 flex items-center justify-center shrink-0">
                <Sparkles size={18} className="text-primary-900" />
              </div>
              <div>
                <p className="text-xs text-primary-700">Founded</p>
                <p className="text-base font-semibold text-primary-900">
                  {club.founded_year}
                </p>
              </div>
            </div>
          )}
        </div>
        {club?.status && (
          <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
            <span className="text-sm text-primary-700">Status</span>
            <Badge variant={club.status === 'active' ? 'success' : 'warning'}>
              {club.status}
            </Badge>
          </div>
        )}
      </div>
    </Card>
  );
}
