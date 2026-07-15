import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, Button, Badge, Loading, toast, ConfirmModal } from '@/components';
import { joinRequestService } from '@/services/joinRequestService';
import { clubService } from '@/services/clubService';
import { useAuth } from '@/hooks/useAuth.jsx';
import { Users, Calendar, Check, X, Clock, ChevronRight, User, BookOpen, Mail, Phone } from 'lucide-react';
import './RequestsPage.css';

function formatDate(dateString) {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('vi-VN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export default function RequestsPage() {
  const { clubId } = useParams();
  const { profileId, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [clubRequests, setClubRequests] = useState([]);
  const [eventStats, setEventStats] = useState({});
  const [activeTab, setActiveTab] = useState('clubs');
  const [rejectModal, setRejectModal] = useState({ open: false, request: null, reason: '' });
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadData();
  }, [clubId, profileId]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load club join requests
      if (clubId) {
        const [pending, all] = await Promise.all([
          joinRequestService.getClubRequests(clubId, { status: 'pending' }),
          joinRequestService.getClubRequests(clubId)
        ]);
        setClubRequests(Array.isArray(pending) ? pending : []);
      }
    } catch (err) {
      console.error('Error loading requests:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveClubRequest = async (request) => {
    try {
      setProcessing(true);
      await joinRequestService.approveClubRequest(request.id);
      toast(`Đã duyệt yêu cầu của ${request.full_name}!`, { variant: 'success' });
      loadData();
    } catch (err) {
      console.error('Approve failed:', err);
      toast('Không thể duyệt yêu cầu', { variant: 'error' });
    } finally {
      setProcessing(false);
    }
  };

  const handleRejectClubRequest = async () => {
    if (!rejectModal.request) return;
    try {
      setProcessing(true);
      await joinRequestService.rejectClubRequest(rejectModal.request.id, rejectModal.reason);
      toast(`Đã từ chối yêu cầu`, { variant: 'info' });
      setRejectModal({ open: false, request: null, reason: '' });
      loadData();
    } catch (err) {
      console.error('Reject failed:', err);
      toast('Không thể từ chối yêu cầu', { variant: 'error' });
    } finally {
      setProcessing(false);
    }
  };

  const handleApproveEventRequest = async (request) => {
    try {
      setProcessing(true);
      await joinRequestService.approveEventRequest(request.id);
      toast(`Đã duyệt đăng ký của ${request.full_name}!`, { variant: 'success' });
      loadData();
    } catch (err) {
      console.error('Approve failed:', err);
      toast('Không thể duyệt yêu cầu', { variant: 'error' });
    } finally {
      setProcessing(false);
    }
  };

  const handleRejectEventRequest = async () => {
    if (!rejectModal.request) return;
    try {
      setProcessing(true);
      await joinRequestService.rejectEventRequest(rejectModal.request.id, rejectModal.reason);
      toast(`Đã từ chối đăng ký`, { variant: 'info' });
      setRejectModal({ open: false, request: null, reason: '' });
      loadData();
    } catch (err) {
      console.error('Reject failed:', err);
      toast('Không thể từ chối yêu cầu', { variant: 'error' });
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <Loading fullScreen />;

  const pendingCount = clubRequests.length;

  return (
    <div className="requests-page">
      <div className="requests-page__header">
        <div className="container">
          <div className="requests-page__header-content">
            <div>
              <h1 className="requests-page__title">Quản lý yêu cầu</h1>
              <p className="requests-page__subtitle">
                Duyệt yêu cầu tham gia CLB và đăng ký sự kiện
              </p>
            </div>
            {pendingCount > 0 && (
              <div className="requests-page__badge">
                <Badge variant="warning">{pendingCount} chờ duyệt</Badge>
              </div>
            )}
          </div>

          <div className="requests-page__tabs">
            <button
              className={`requests-page__tab ${activeTab === 'clubs' ? 'requests-page__tab--active' : ''}`}
              onClick={() => setActiveTab('clubs')}
            >
              <Users size={18} />
              Yêu cầu tham gia CLB
              {pendingCount > 0 && (
                <span className="requests-page__tab-count">{pendingCount}</span>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="requests-page__content">
        <div className="container">
          {activeTab === 'clubs' && (
            <ClubRequests
              requests={clubRequests}
              onApprove={handleApproveClubRequest}
              onReject={(req) => setRejectModal({ open: true, request: req, reason: '' })}
              processing={processing}
            />
          )}
        </div>
      </div>

      {/* Reject Modal */}
      <ConfirmModal
        open={rejectModal.open}
        title="Từ chối yêu cầu"
        description={
          <div className="reject-modal-content">
            <p>Bạn có chắc muốn từ chối yêu cầu từ <strong>{rejectModal.request?.full_name}</strong>?</p>
            <div className="reject-modal-field">
              <label>Lý do (tùy chọn):</label>
              <textarea
                value={rejectModal.reason}
                onChange={(e) => setRejectModal(prev => ({ ...prev, reason: e.target.value }))}
                placeholder="VD: Đã đủ thành viên, hồ sơ không phù hợp..."
                rows={3}
              />
            </div>
          </div>
        }
        confirmLabel="Từ chối"
        variant="danger"
        onCancel={() => setRejectModal({ open: false, request: null, reason: '' })}
        onConfirm={handleRejectClubRequest}
      />
    </div>
  );
}

function ClubRequests({ requests, onApprove, onReject, processing }) {
  const pending = requests.filter(r => r.status === 'pending');
  const processed = requests.filter(r => r.status !== 'pending');

  return (
    <div className="requests-section">
      {/* Pending Requests */}
      <div className="requests-section__header">
        <h2 className="requests-section__title">
          <Clock size={20} />
          Yêu cầu chờ duyệt ({pending.length})
        </h2>
      </div>

      {pending.length === 0 ? (
        <Card className="requests-empty">
          <div className="requests-empty__icon">🎉</div>
          <h3>Không có yêu cầu nào</h3>
          <p>Tất cả yêu cầu đã được xử lý</p>
        </Card>
      ) : (
        <div className="requests-list">
          {pending.map((request) => (
            <Card key={request.id} className="request-card request-card--pending">
              <div className="request-card__header">
                <div className="request-card__user">
                  <div className="request-card__avatar">
                    <User size={24} />
                  </div>
                  <div className="request-card__user-info">
                    <h3 className="request-card__name">{request.full_name}</h3>
                    <p className="request-card__meta">
                      <BookOpen size={14} />
                      {request.student_code}
                    </p>
                    <p className="request-card__meta">
                      <Mail size={14} />
                      {request.email}
                    </p>
                    {request.phone && (
                      <p className="request-card__meta">
                        <Phone size={14} />
                        {request.phone}
                      </p>
                    )}
                  </div>
                </div>
                <div className="request-card__time">
                  <Clock size={14} />
                  {formatDate(request.created_at)}
                </div>
              </div>

              {request.motivation && (
                <div className="request-card__motivation">
                  <h4>Lý do tham gia:</h4>
                  <p>{request.motivation}</p>
                </div>
              )}

              <div className="request-card__actions">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => onReject(request)}
                  disabled={processing}
                >
                  <X size={16} />
                  Từ chối
                </Button>
                <Button
                  className="request-card__approve"
                  size="sm"
                  onClick={() => onApprove(request)}
                  disabled={processing}
                >
                  <Check size={16} />
                  Duyệt
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Processed Requests */}
      {processed.length > 0 && (
        <>
          <div className="requests-section__header" style={{ marginTop: 48 }}>
            <h2 className="requests-section__title">
              <Check size={20} />
              Đã xử lý ({processed.length})
            </h2>
          </div>
          <div className="requests-list requests-list--processed">
            {processed.slice(0, 10).map((request) => (
              <Card key={request.id} className={`request-card request-card--${request.status}`}>
                <div className="request-card__header">
                  <div className="request-card__user">
                    <div className="request-card__avatar">
                      <User size={24} />
                    </div>
                    <div className="request-card__user-info">
                      <h3 className="request-card__name">{request.full_name}</h3>
                      <p className="request-card__meta">
                        <BookOpen size={14} />
                        {request.student_code}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={request.status === 'approved' ? 'success' : 'danger'}
                  >
                    {request.status === 'approved' ? 'Đã duyệt' : 'Đã từ chối'}
                  </Badge>
                </div>
                {request.rejection_reason && (
                  <div className="request-card__reason">
                    <strong>Lý do:</strong> {request.rejection_reason}
                  </div>
                )}
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
