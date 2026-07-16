import { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, Clock, Calendar, MapPin, Users, Loader2, BadgeCheck } from 'lucide-react';
import { Card, Button, toast } from '@/components';
import { useAuth } from '@/hooks/useAuth.jsx';
import { getManagerPendingItems, processApproval, APPROVAL_STATUS_CONFIG } from '@/services/approvalService';
import './ManagerReviewPage.css';

export default function ManagerReviewPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  async function loadItems() {
    setLoading(true);
    try {
      const data = await getManagerPendingItems();
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

  return (
    <div className="manager-review">
      <div className="manager-review__header">
        <div>
          <h1 className="manager-review__title">Phe duyet su kien</h1>
          <p className="manager-review__subtitle">
            Phe duyet cuoi cung de hien thi su kien/workshop len cong khai.
          </p>
        </div>
        <Button variant="secondary" onClick={loadItems}>
          <Clock size={16} /> Tai lai
        </Button>
      </div>

      {loading ? (
        <Card>
          <div className="manager-review__loading">
            <Loader2 size={32} className="manager-review__spin" />
            <p>Dang tai danh sach...</p>
          </div>
        </Card>
      ) : items.length === 0 ? (
        <Card>
          <div className="manager-review__empty">
            <BadgeCheck size={48} />
            <h3>Khong con gi can phe duyet!</h3>
            <p>Tat ca cac su kien da duoc xu ly.</p>
          </div>
        </Card>
      ) : (
        <div className="manager-review__list">
          {items.map(item => (
            <Card key={`${item._type}-${item.id}`} className="manager-review__card">
              <div className="manager-review__card-top">
                <div className="manager-review__card-meta">
                  <span className={`manager-review__type-badge manager-review__type-badge--${item._type}`}>
                    {item._type === 'event' ? 'Su kien' : 'Workshop'}
                  </span>
                  <span className="manager-review__club-name">{item.clubs?.name}</span>
                </div>
                <span className="manager-review__date">
                  {new Date(item.created_at).toLocaleDateString('vi-VN')}
                </span>
              </div>

              <h3 className="manager-review__card-title">{item.title}</h3>
              <p className="manager-review__card-desc">{item.description}</p>

              {item._type === 'event' && (
                <div className="manager-review__card-details">
                  {item.start_time && (
                    <div className="manager-review__detail">
                      <Calendar size={14} />
                      {new Date(item.start_time).toLocaleString('vi-VN')}
                      {item.end_time && ` - ${new Date(item.end_time).toLocaleString('vi-VN')}`}
                    </div>
                  )}
                  {item.location && (
                    <div className="manager-review__detail">
                      <MapPin size={14} /> {item.location}
                    </div>
                  )}
                  {item.max_participants && (
                    <div className="manager-review__detail">
                      <Users size={14} /> {item.max_participants} nguoi
                    </div>
                  )}
                </div>
              )}

              <div className="manager-review__mentor-stamp">
                <BadgeCheck size={14} />
                <span>Da duoc Mentor phe duyet</span>
              </div>

              <div className="manager-review__card-footer">
                <div className="manager-review__author">
                  <div className="manager-review__author-avatar">
                    {item.profiles?.full_name?.charAt(0) || 'L'}
                  </div>
                  <div className="manager-review__author-info">
                    <span>Leader tao:</span>
                    <strong>{item.profiles?.full_name || 'Khong ro'}</strong>
                  </div>
                </div>

                <div className="manager-review__actions">
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
                      <Loader2 size={14} className="manager-review__spin" />
                    ) : (
                      <CheckCircle2 size={14} />
                    )}
                    Phe duyet cuoi cung
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {rejectModal && (
        <div className="manager-review__modal-backdrop" onClick={() => setRejectModal(null)}>
          <div className="manager-review__modal" onClick={e => e.stopPropagation()}>
            <h3 className="manager-review__modal-title">
              <XCircle size={20} /> Tu choi "{rejectModal.title}"
            </h3>
            <p className="manager-review__modal-desc">
              Vui long nhap ly do tu choi (khong bat buoc).
            </p>
            <textarea
              className="manager-review__modal-textarea"
              placeholder="Ly do tu choi..."
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              rows={4}
            />
            <div className="manager-review__modal-actions">
              <Button variant="secondary" onClick={() => { setRejectModal(null); setRejectReason(''); }}>
                Huy
              </Button>
              <Button
                variant="danger"
                onClick={handleReject}
                disabled={processing === rejectModal.id}
              >
                {processing === rejectModal.id ? (
                  <Loader2 size={14} className="manager-review__spin" />
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
