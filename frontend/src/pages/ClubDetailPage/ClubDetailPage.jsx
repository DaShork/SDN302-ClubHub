import { useState, useEffect, useCallback } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { clubService } from '@/services/clubService';
import { eventService } from '@/services/eventService';
import { galleryService } from '@/services/galleryService';
import { membershipService } from '@/services/membershipService';
import { announcementService } from '@/services/announcementService';
import { joinRequestService } from '@/services/joinRequestService';
import { resolveClubUuid } from '@/services/supabase';
import { Card, Button, Loading, toast, ConfirmModal, JoinRequestModal } from '@/components';
import { useAuth } from '@/hooks/useAuth.jsx';

import ClubDetailHero from './components/ClubDetailHero.jsx';
import ClubStatsCard from './components/ClubStatsCard.jsx';
import LeaderInfoCard from './components/LeaderInfoCard.jsx';
import RelatedClubs from './components/RelatedClubs.jsx';
import ShareButtons from './components/ShareButtons.jsx';
import JoinLeaveCard from './components/JoinLeaveCard.jsx';

import './ClubDetailPage.css';

const defaultLogo = 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=200&h=200&fit=crop';
const TABS = ['about', 'events', 'gallery', 'members', 'announcements'];

function formatEventDate(dateString) {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function ClubDetailPageContent() {
  const { clubId: id } = useParams();
  const location = useLocation();
  const { profileId, isAuthenticated } = useAuth();

  const [club, setClub] = useState(null);
  const [events, setEvents] = useState([]);
  const [gallery, setGallery] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [membersList, setMembersList] = useState([]);
  const [leaderInfo, setLeaderInfo] = useState(null);
  const [relatedClubs, setRelatedClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [activeTab, setActiveTab] = useState('about');
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [membership, setMembership] = useState(null);
  const [joining, setJoining] = useState(false);
  const [joinRequest, setJoinRequest] = useState(null);
  const [showJoinModal, setShowJoinModal] = useState(false);

  const loadData = useCallback(async () => {
    /* 15s safety timeout. We wrap the *whole* function in finally
       below, so this guarantees setLoading(false) runs even if a
       sub-request hangs (defence-in-depth on top of the per-block
       try/catch). */
    const timeoutId = setTimeout(() => {
      console.warn('[ClubDetail] loadData timed out after 15s — forcing render');
      setLoadError((prev) => prev || 'Request timed out. Please try again.');
      setLoading(false);
    }, 15000);

    try {
      setLoading(true);
      setLoadError(null);

      /* Resolve UUID once, reuse it for every sub-query.
         resolveClubUuid() now applies a bounded .eq('status','active').limit(200)
         so we don't pull the entire clubs table. */
      const clubUuid = await resolveClubUuid(id);

      const clubData = await clubService.getById(id);
      setClub(clubData);
      if (!clubData) {
        console.warn('[ClubDetail] getById returned null — check slug/UUID:', id);
      }

      /* Sub-resources — each is wrapped in its own try/catch so one
         failure (e.g. RLS for anon) never blocks the others or the
         main club load. We run the sub-queries in parallel since they
         are independent — saves 3× roundtrip vs sequential. */

      const [eventsRes, galleryRes, announcementsRes, membersRes, leaderRes, relatedRes] =
        await Promise.allSettled([
          eventService.getByClub(id, 4).catch((err) => {
            console.warn('events for club unavailable:', err?.message || err);
            return [];
          }),
          galleryService.getByClub(id).catch((err) => {
            console.warn('gallery for club unavailable:', err?.message || err);
            return [];
          }),
          clubUuid
            ? announcementService.getAnnouncements(clubUuid).catch((err) => {
                console.warn('announcements for club unavailable:', err?.message || err);
                return [];
              })
            : Promise.resolve([]),
          clubUuid
            ? clubService.getMembers(clubUuid).catch((err) => {
                console.warn('members for club unavailable:', err?.message || err);
                return [];
              })
            : Promise.resolve([]),
          clubUuid
            ? clubService.getLeaderInfo(clubUuid).catch((err) => {
                console.warn('leader info unavailable:', err?.message || err);
                return null;
              })
            : Promise.resolve(null),
          clubData?.category_id
            ? clubService.getRelated({
                categoryId: clubData.category_id,
                excludeClubId: clubData.id,
                limit: 4,
              }).catch((err) => {
                console.warn('related clubs unavailable:', err?.message || err);
                return [];
              })
            : Promise.resolve([]),
        ]);

      setEvents(eventsRes.status === 'fulfilled' ? eventsRes.value || [] : []);
      setGallery(galleryRes.status === 'fulfilled' ? galleryRes.value || [] : []);
      setAnnouncements(
        (announcementsRes.status === 'fulfilled' ? announcementsRes.value || [] : []).filter(
          (a) => (a.audience || 'public') === 'public'
        )
      );
      setMembersList(membersRes.status === 'fulfilled' ? membersRes.value || [] : []);
      setLeaderInfo(leaderRes.status === 'fulfilled' ? leaderRes.value : null);
      setRelatedClubs(relatedRes.status === 'fulfilled' ? relatedRes.value || [] : []);

      if (profileId) {
        const mem = await membershipService.getMembership(profileId, id).catch(() => null);
        setMembership(mem);

        // Also check if user has a pending/rejected request
        const request = await joinRequestService.getUserClubRequest(profileId, id).catch(() => null);
        setJoinRequest(request);
      }
    } catch (error) {
      console.error('Error loading club:', error);
      setLoadError(error?.message || String(error));
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  }, [id, profileId]);

  /* Re-fetch when route (id), profile, or location changes.
     `location.key` changes on every navigation, so it covers back-forward
     navigation. We use a single effect (not two) to avoid double-fetches
     which used to race with each other and leave `loading=true` stuck. */
  useEffect(() => {
    if (!id) return;
    loadData();
  }, [id, profileId, location.key, loadData]);

  const isJoined = membership?.status === 'active';

  const handleJoinClick = () => {
    if (!profileId) {
      toast('Vui lòng đăng nhập để tham gia CLB', { variant: 'error' });
      return;
    }
    // Check if there's a pending request
    if (joinRequest?.status === 'pending') {
      toast('Bạn đã có yêu cầu đang chờ duyệt', { variant: 'warning' });
      return;
    }
    setShowJoinModal(true);
  };

  const handleSubmitJoinRequest = async (formData) => {
    try {
      await joinRequestService.submitClubRequest({
        clubId: id,
        profileId,
        ...formData
      });
      toast('Đã gửi yêu cầu tham gia CLB!', { variant: 'success' });
      // Refresh the request status
      const request = await joinRequestService.getUserClubRequest(profileId, id).catch(() => null);
      setJoinRequest(request);
      return true;
    } catch (err) {
      console.error('Submit join request failed:', err);
      toast('Không thể gửi yêu cầu', { variant: 'error' });
      throw err;
    }
  };

  const handleLeave = async () => {
    try {
      await membershipService.leaveClub(id, profileId);
      toast(`Đã rời ${club.name}`, { variant: 'info' });
      setConfirmLeave(false);
      loadData();
    } catch (err) {
      console.error('Leave club failed:', err);
      toast('Không thể rời CLB', { variant: 'error' });
    }
  };

  if (loading) {
    return <Loading fullScreen />;
  }

  if (!id) {
    return (
      <div className="container py-16 text-center">
        <h1 className="text-2xl font-bold text-primary-900 mb-4">Invalid club URL</h1>
        <Link to="/clubs">
          <Button>Back to Clubs</Button>
        </Link>
      </div>
    );
  }

  if (!club) {
    return (
      <div className="container py-16 text-center">
        <h1 className="text-2xl font-bold text-primary-900 mb-4">Club not found</h1>
        {loadError && (
          <p className="text-sm text-red-500 mb-4 max-w-xl mx-auto">
            {loadError}
          </p>
        )}
        <p className="text-sm text-primary-700 mb-6">
          The club you are looking for does not exist or is no longer active.
        </p>
        <Link to="/clubs">
          <Button>Back to Clubs</Button>
        </Link>
      </div>
    );
  }

  const members = membersList?.filter((m) => m.position !== 'President') || [];
  const president = membersList?.find((m) => m.position === 'President');

  return (
    <div className="min-h-screen">
      <ClubDetailHero club={club} shareSlot={<ShareButtons />} />

      {/* Tabs */}
      <section className="border-b border-white/5 sticky top-[80px] bg-primary-900/95 backdrop-blur-sm z-40">
        <div className="container">
          <div className="flex gap-4 md:gap-8 overflow-x-auto">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-2 text-sm font-medium capitalize transition-colors border-b-2 whitespace-nowrap ${activeTab === tab
                    ? 'text-accent-green border-accent-green'
                    : 'text-primary-700 border-transparent hover:text-primary-900'
                  }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Mobile share bar — visible only on small screens */}
      <div className="md:hidden container pt-4">
        <ShareButtons size="sm" />
      </div>

      {/* Content */}
      <section className="py-8">
        <div className="container">
          {/* About Tab */}
          {activeTab === 'about' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <div className="p-6">
                    <h2 className="text-xl font-semibold text-primary-900 mb-4">About</h2>
                    <p className="text-primary-800 leading-relaxed whitespace-pre-wrap">
                      {club.description || 'No description available for this club.'}
                    </p>
                  </div>
                </Card>

                {club.short_description && (
                  <Card>
                    <div className="p-6">
                      <h2 className="text-xl font-semibold text-primary-900 mb-4">Quick Pitch</h2>
                      <p className="text-primary-800 leading-relaxed">{club.short_description}</p>
                    </div>
                  </Card>
                )}

                {club.club_terms && club.club_terms.length > 0 && (
                  <Card>
                    <div className="p-6">
                      <h2 className="text-xl font-semibold text-primary-900 mb-4">Current Term</h2>
                      <p className="text-primary-800">
                        {club.club_terms[0].name} (
                        {new Date(club.club_terms[0].start_date).toLocaleDateString()} -{' '}
                        {club.club_terms[0].end_date
                          ? new Date(club.club_terms[0].end_date).toLocaleDateString()
                          : 'Present'}
                        )
                      </p>
                    </div>
                  </Card>
                )}
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                <ClubStatsCard
                  club={club}
                  memberCount={membersList?.length || 0}
                  eventCount={events?.length || 0}
                />

                <LeaderInfoCard leaderInfo={leaderInfo} />

                {club.recruitment_status && (
                  <JoinLeaveCard
                    isJoined={isJoined}
                    isAuthenticated={isAuthenticated}
                    joining={joining}
                    onJoin={handleJoinClick}
                    onLeave={() => setConfirmLeave(true)}
                    requestStatus={joinRequest?.status}
                    requestData={joinRequest}
                  />
                )}

                {club.contact_email && (
                  <Card>
                    <div className="p-6">
                      <h3 className="text-lg font-semibold text-primary-900 mb-4">Contact</h3>
                      <p className="text-primary-800 text-sm break-all">
                        <a
                          href={`mailto:${club.contact_email}`}
                          className="hover:text-accent-green"
                        >
                          {club.contact_email}
                        </a>
                      </p>
                      {club.facebook_url && (
                        <a
                          href={club.facebook_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-3 inline-flex items-center gap-2 text-accent-green hover:underline"
                        >
                          <svg
                            className="h-5 w-5"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                          </svg>
                          Facebook Page
                        </a>
                      )}
                    </div>
                  </Card>
                )}
              </div>
            </div>
          )}

          {/* Events Tab */}
          {activeTab === 'events' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-primary-900">Upcoming Events</h2>
                <Link to={`/events?club=${id}`}>
                  <Button variant="secondary" size="sm">View All</Button>
                </Link>
              </div>
              {events.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {events.map((event) => (
                    <Card key={event.id} className="p-4 hover:shadow-lg transition-shadow">
                      <h3 className="text-base font-semibold text-primary-900 mb-2 line-clamp-2">
                        {event.title}
                      </h3>
                      {event.location && (
                        <p className="text-sm text-primary-700 mb-1">📍 {event.location}</p>
                      )}
                      {event.start_time && (
                        <p className="text-xs text-primary-700 mb-3">
                          🗓 {formatEventDate(event.start_time)}
                        </p>
                      )}
                      <Link to={`/events/${event.id}`}>
                        <Button size="sm" variant="ghost" className="px-0">
                          View details →
                        </Button>
                      </Link>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="p-12 text-center">
                  <p className="text-primary-700">No upcoming events</p>
                </Card>
              )}
            </div>
          )}

          {/* Gallery Tab */}
          {activeTab === 'gallery' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-primary-900">Gallery</h2>
                <Link to={`/gallery?club=${id}`}>
                  <Button variant="secondary" size="sm">View All</Button>
                </Link>
              </div>
              {gallery.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {gallery.slice(0, 8).map((item) => (
                    <div
                      key={item.id}
                      className="aspect-square rounded-xl overflow-hidden bg-card"
                    >
                      <img
                        src={item.image_url}
                        alt={item.caption || 'Gallery image'}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <Card className="p-12 text-center">
                  <p className="text-primary-700">No gallery images</p>
                </Card>
              )}
            </div>
          )}

          {/* Members Tab */}
          {activeTab === 'members' && (
            <div className="space-y-6">
              {president && (
                <div>
                  <h3 className="text-lg font-semibold text-primary-900 mb-4">President</h3>
                  <Card className="max-w-md">
                    <div className="p-4 flex items-center gap-4">
                      <img
                        src={president.profiles?.avatar_url || defaultLogo}
                        alt={president.profiles?.full_name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      <div>
                        <p className="font-medium text-primary-900">
                          {president.profiles?.full_name}
                        </p>
                        <p className="text-sm text-primary-700">
                          {president.profiles?.email}
                        </p>
                      </div>
                    </div>
                  </Card>
                </div>
              )}

              <div>
                <h3 className="text-lg font-semibold text-primary-900 mb-4">
                  Members ({members.length})
                </h3>
                {members.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {members.slice(0, 12).map((member) => (
                      <Card key={member.id} className="p-4 text-center">
                        <img
                          src={member.profiles?.avatar_url || defaultLogo}
                          alt={member.profiles?.full_name}
                          className="w-16 h-16 rounded-full object-cover mx-auto mb-3"
                        />
                        <p className="font-medium text-primary-900 text-sm">
                          {member.profiles?.full_name}
                        </p>
                        <p className="text-xs text-primary-700">{member.position}</p>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card className="p-12 text-center">
                    <p className="text-primary-700">
                      Member list is only visible to club members.
                    </p>
                  </Card>
                )}
              </div>
            </div>
          )}

          {/* Announcements Tab */}
          {activeTab === 'announcements' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-primary-900">Announcements</h2>
                <Link to={`/announcements/${id}`}>
                  <Button variant="secondary" size="sm">View All</Button>
                </Link>
              </div>
              {announcements.length > 0 ? (
                <div className="space-y-4">
                  {announcements.map((ann) => (
                    <Card key={ann.id} className="p-5">
                      <div className="flex items-center gap-2 mb-3 flex-wrap">
                        {ann.is_pinned && (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-accent-green bg-accent-green/10 px-2 py-1 rounded-md">
                            Pinned
                          </span>
                        )}
                        <span className="inline-flex items-center text-xs font-medium text-primary-900 bg-primary-800/60 px-2 py-1 rounded-md">
                          Public
                        </span>
                        <span className="text-xs text-primary-700">
                          • {ann.created_at
                            ? new Date(ann.created_at).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              })
                            : ''}
                        </span>
                      </div>
                      <h3 className="text-base font-semibold text-primary-900 mb-2">
                        {ann.title}
                      </h3>
                      {ann.profiles?.full_name && (
                        <p className="text-xs text-primary-700 mb-2">
                          Published by{' '}
                          <span className="font-medium text-primary-800">
                            {ann.profiles.full_name}
                          </span>
                        </p>
                      )}
                      {ann.content && (
                        <p className="text-sm text-primary-800 leading-relaxed whitespace-pre-wrap">
                          {ann.content}
                        </p>
                      )}
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="p-12 text-center">
                  <p className="text-primary-700">No public announcements yet</p>
                </Card>
              )}
            </div>
          )}

          {/* Related clubs — shown on every tab */}
          <RelatedClubs clubs={relatedClubs} categoryName={club.categories?.name} />
        </div>
      </section>

      <ConfirmModal
        open={confirmLeave}
        title={`Leave ${club?.name}?`}
        description="You can re-join later if recruitment is still open."
        confirmLabel="Leave Club"
        variant="danger"
        onCancel={() => setConfirmLeave(false)}
        onConfirm={handleLeave}
      />

      <JoinRequestModal
        isOpen={showJoinModal}
        onClose={() => setShowJoinModal(false)}
        onSubmit={handleSubmitJoinRequest}
        type="club"
        title={club?.name}
        loading={joining}
      />
    </div>
  );
}
