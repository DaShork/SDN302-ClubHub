import { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, Clock, ChevronRight, Calendar, MapPin, Users, Loader2, AlertCircle } from 'lucide-react';
import { Card, Button, toast } from '@/components';
import { useAuth } from '@/hooks/useAuth.jsx';
import { getMentorPendingItems, processApproval, APPROVAL_STATUS_CONFIG } from '@/services/approvalService';
import './MentorReviewPage.css';

export default function MentorReviewPage() {
  const { can } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null); // item id being processed
  const [rejectModal, setRejectModal] = useState(null); // item id to reject
  const [rejectReason, setRejectReason] = useState('');

  async function loadItems() {
    setLoading(true);
    try {
      const data = await getMentorPendingItems();
      setItems(data);
    } catch (err) {
      console.error('Failed to load pending items:', err);
      toast('Khong the tai danh sach cho phe duyet', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadItems();
  }, []);

  async function handleApprove(item) {
    setProcessing(item.id);
    try {
      await processApproval({ itemType: item._type, itemId: item.id, action: 'approve' });
      toast(`"${item.title}" da duyet thanh cong!`, { variant: 'success' });
      setItems(prev => prev.filter(i => i.id !== item.id));
    } catch (err) {
      toast(err.message || 'Loi khi duyet', { variant: 'error' });
    } finally {
      setProcessing(null);
    }
  }

  async function handleReject() {
    if (!rejectModal) return;
    setProcessing(rejectModal.id);
    try {
      await processApproval({
        itemType: rejectModal._type,
        itemId: rejectModal.id,
        action: 'reject',
        comment: rejectReason,
      });
      toast(`"${rejectModal.title}" da bi tu choi.`, { variant: 'info' });
      setItems(prev => prev.filter(i => i.id !== rejectModal.id));
      setRejectModal(null);
      setRejectReason('');
    } catch (err) {
      toast(err.message || 'Loi khi tu choi', { variant: 'error' });
    } finally {
      setProcessing(null);
    }
  }

  const pendingCount = items.length;

  return (
    <div className="mentor-review">
      <div className="mentor-review__header">
        <div>
          <h1 className="mentor-review__title">Phe duyet su kien</h1>
          <p className="mentor-review__subtitle">
            Xem va phe duyet cac su kien/workshop tu leader gui len.
          </p>
        </div>
        <Button variant="secondary" onClick={loadItems}>
          <Clock size={16} /> Tai lai
        </Button>
      </div>

      {loading ? (
        <Card>
          <div className="mentor-review__loading">
            <Loader2 size={32} className="mentor-review__spin" />
            <p>Dang tai danh sach...</p>
          </div>
        </Card>
      ) : items.length === 0 ? (
        <Card>
          <div className="mentor-review__empty">
            <CheckCircle2 size={48} />
            <h3>Khong co gi cho phe duyet!</h3>
            <p>Tat ca cac su kien da duoc xu ly.</p>
          </div>
        </Card>
      ) : (
        <div className="mentor-review__list">
          {items.map(item => (
            <Card key={`${item._type}-${item.id}`} className="mentor-review__card">
              <div className="mentor-review__card-top">
                <div className="mentor-review__card-meta">
                  <span className={`mentor-review__type-badge mentor-review__type-badge--${item._type}`}>
                    {item._type === 'event' ? 'Su kien' : 'Workshop'}
                  </span>
                  <span className="mentor-review__club-name">{item.clubs?.name}</span>
                </div>
                <span className="mentor-review__date">
                  {new Date(item.created_at).toLocaleDateString('vi-VN')}
                </span>
              </div>

              <h3 className="mentor-review__card-title">{item.title}</h3>
              <p className="mentor-review__card-desc">{item.description}</p>

              {item._type === 'event' && (
                <div className="mentor-review__card-details">
                  {item.start_time && (
                    <div className="mentor-review__detail">
                      <Calendar size={14} />
                      {new Date(item.start_time).toLocaleString('vi-VN')}
                      {item.end_time && ` - ${new Date(item.end_time).toLocaleString('vi-VN')}`}
                    </div>
                  )}
                  {item.location && (
                    <div className="mentor-review__detail">
                      <MapPin size={14} /> {item.location}
                    </div>
                  )}
                  {item.max_participants && (
                    <div className="mentor-review__detail">
                      <Users size={14} /> {item.max_participants} nguoi
                    </div>
                  )}
                </div>
              )}

              <div className="mentor-review__card-footer">
                <div className="mentor-review__author">
                  <div className="mentor-review__author-avatar">
                    {item.profiles?.full_name?.charAt(0) || 'L'}
                  </div>
                  <div className="mentor-review__author-info">
                    <span>Leader:</span>
                    <strong>{item.profiles?.full_name || 'Khong ro'}</strong>
                  </div>
                </div>

                <div className="mentor-review__actions">
                  <Button
                    variant="danger"
                    onClick={() => setRejectModal(item)}
                    disabled={processing === item.id}
                  >
                    <XCircle size={14} /> Tu choi
                  </Button>
                  <Button
                    onClick={() => handleApprove(item)}
                    disabled={processing === item.id}
                  >
                    {processing === item.id ? (
                      <Loader2 size={14} className="mentor-review__spin" />
                    ) : (
                      <CheckCircle2 size={14} />
                    )}
                    Phe duyet
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <div className="mentor-review__modal-backdrop" onClick={() => setRejectModal(null)}>
          <div className="mentor-review__modal" onClick={e => e.stopPropagation()}>
            <h3 className="mentor-review__modal-title">
              <XCircle size={20} /> Tu choi "{rejectModal.title}"
            </h3>
            <p className="mentor-review__modal-desc">
              Vui long nhap ly do tu choi (khong bat buoc).
            </p>
            <textarea
              className="mentor-review__modal-textarea"
              placeholder="Ly do tu choi (vidu: Thong tin chua day du, lich trinh chong lan voi su kien khac...)"
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              rows={4}
            />
            <div className="mentor-review__modal-actions">
              <Button variant="secondary" onClick={() => { setRejectModal(null); setRejectReason(''); }}>
                Huy
              </Button>
              <Button
                variant="danger"
                onClick={handleReject}
                disabled={processing === rejectModal.id}
              >
                {processing === rejectModal.id ? (
                  <Loader2 size={14} className="mentor-review__spin" />
                ) : (
                  <XCircle size={14} />
                )}
                Xac nhan tu choi
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
