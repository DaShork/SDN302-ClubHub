import { Card, Button } from '@/components';
import { Clock, CheckCircle, XCircle } from 'lucide-react';

/**
 * Recruitment / membership card with approval workflow.
 * Shows states based on join request status:
 *   - Already a member → "Leave Club" button
 *   - Request pending  → "Request Pending" status
 *   - Request rejected → "Request Rejected" status (can re-apply)
 *   - Recruiting open  → "Join Club" / "Login to Join" button
 */
export default function JoinLeaveCard({
  isJoined,
  isAuthenticated,
  joining,
  onJoin,
  onLeave,
  requestStatus = null, // null | 'pending' | 'approved' | 'rejected'
  requestData = null
}) {
  const getStatusDisplay = () => {
    if (isJoined) return null;
    
    if (requestStatus === 'pending') {
      return {
        icon: <Clock size={18} />,
        text: 'Yêu cầu đang chờ duyệt',
        subtext: 'Leader sẽ xem xét và thông báo cho bạn',
        variant: 'warning'
      };
    }
    
    if (requestStatus === 'rejected') {
      return {
        icon: <XCircle size={18} />,
        text: 'Yêu cầu bị từ chối',
        subtext: requestData?.rejection_reason || 'Bạn có thể gửi lại yêu cầu',
        variant: 'error'
      };
    }
    
    return null;
  };

  const statusDisplay = getStatusDisplay();

  return (
    <Card className="club-detail-join-card">
      <div className="p-6 text-center">
        <h3 className="text-lg font-semibold text-primary-900 mb-2">
          {isJoined ? "You're a member!" : "We're Recruiting!"}
        </h3>
        <p className="text-sm text-primary-800 mb-4">
          {isJoined
            ? 'Manage membership from My Clubs'
            : 'Join us and be part of something great'}
        </p>

        {isJoined ? (
          <Button
            variant="destructive"
            className="w-full"
            onClick={onLeave}
          >
            Leave Club
          </Button>
        ) : statusDisplay ? (
          <div className={`join-status join-status--${statusDisplay.variant}`}>
            <span className="join-status__icon">{statusDisplay.icon}</span>
            <span className="join-status__text">{statusDisplay.text}</span>
            <span className="join-status__subtext">{statusDisplay.subtext}</span>
            {requestStatus === 'rejected' && (
              <Button
                className="w-full mt-3"
                onClick={onJoin}
                size="sm"
              >
                Gửi lại yêu cầu
              </Button>
            )}
          </div>
        ) : (
          <Button
            className="w-full"
            onClick={onJoin}
            disabled={joining || !isAuthenticated}
          >
            {joining ? 'Đang gửi...' : isAuthenticated ? 'Đăng ký tham gia' : 'Đăng nhập để tham gia'}
          </Button>
        )}
      </div>
    </Card>
  );
}
