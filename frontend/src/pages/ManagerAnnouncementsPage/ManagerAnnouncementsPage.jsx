import { useEffect, useState } from 'react';
import { Megaphone, Pin, Plus, X, RefreshCw, Edit2, Trash2 } from 'lucide-react';
import { Card, Button, toast, ConfirmModal } from '@/components';
import { announcementService } from '@/services/announcementService';
import { useAuth } from '@/hooks/useAuth.jsx';
import './ManagerAnnouncementsPage.css';

/* Manager's own notice-board page.
 *
 * Like the public /announcements page, but:
 *   - Filters to audience='internal' (Manager-only comms) so cross-portal
 *     leader/member/public noise is hidden.
 *   - Always publishes platform-wide notices (club_id = NULL).
 *   - Rendered inside DashboardLayout (no top hero, no PublicLayout chrome).
 *   - Uses admin-style CRUD with confirmation modals.
 */
export default function ManagerAnnouncementsPage() {
  const { profileId, profile } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [search, setSearch] = useState('');

  async function load() {
    setLoading(true);
    try {
      const data = await announcementService
        .getAnnouncements(null)
        .catch(() => []);
      const parsed = data
        .filter((a) => a.audience === 'internal')
        .map((a) => ({
          id: a.id,
          title: a.title,
          content: a.content || '',
          author: a.profiles?.full_name || '—',
          date: a.created_at ? a.created_at.slice(0, 10) : '',
          pinned: a.is_pinned || false,
          audience: a.audience,
        }));
      setItems(parsed);
    } catch (err) {
      console.error('Failed to load manager announcements:', err);
      toast('Không thể tải thông báo', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleSave(form) {
    try {
      const payload = {
        club_id: null,
        title: form.title,
        content: form.content,
        audience: 'internal',
        is_pinned: form.pinned,
        created_by: profileId || null,
      };
      if (editing) {
        await announcementService.updateAnnouncement(editing.id, payload);
      } else {
        await announcementService.createAnnouncement(payload);
      }
      setIsModalOpen(false);
      setEditing(null);
      load();
      toast(editing ? 'Đã cập nhật thông báo' : 'Đã đăng thông báo', { variant: 'success' });
    } catch (err) {
      console.warn('Save announcement failed:', err);
      toast('Lưu thông báo thất bại', { variant: 'error' });
    }
  }

  async function handleTogglePin(item) {
    try {
      await announcementService.updateAnnouncement(item.id, { is_pinned: !item.pinned });
      load();
    } catch (err) {
      toast('Không thể ghim', { variant: 'error' });
    }
  }

  async function handleDelete() {
    if (!deletingId) return;
    try {
      await announcementService.deleteAnnouncement(deletingId);
      setDeletingId(null);
      load();
      toast('Đã xoá thông báo', { variant: 'success' });
    } catch (err) {
      toast('Xoá thất bại', { variant: 'error' });
    }
  }

  const filtered = items
    .filter((a) =>
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.content.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));

  return (
    <div className="manager-announcements">
      <div className="manager-announcements__header">
        <div>
          <h1 className="manager-announcements__title">Quản lý thông báo</h1>
          <p className="manager-announcements__subtitle">
            Thông báo nội bộ dành cho IC-PDP — chỉ Manager thấy được.
          </p>
        </div>
        <div className="manager-announcements__header-actions">
          <Button variant="secondary" onClick={load}>
            <RefreshCw size={16} /> Tải lại
          </Button>
          <Button onClick={() => { setEditing(null); setIsModalOpen(true); }}>
            <Plus size={16} /> Đăng thông báo
          </Button>
        </div>
      </div>

      <Card>
        <div className="manager-announcements__toolbar">
          <div className="manager-announcements__search">
            <span className="manager-announcements__search-icon">🔍</span>
            <input
              type="text"
              placeholder="Tìm theo tiêu đề hoặc nội dung…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="manager-announcements__search-input"
            />
          </div>
        </div>

        <div className="manager-announcements__list">
          {loading ? (
            <div className="manager-announcements__loading">
              <div className="manager-announcements__spinner" />
              <span>Đang tải thông báo…</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="manager-announcements__empty">
              Chưa có thông báo nội bộ nào.
            </div>
          ) : (
            filtered.map((item) => (
              <article
                key={item.id}
                className={`manager-announcements__item ${item.pinned ? 'manager-announcements__item--pinned' : ''}`}
              >
                <div className="manager-announcements__item-head">
                  <div className="manager-announcements__chips">
                    <span className="manager-announcements__chip manager-announcements__chip--internal">
                      <Megaphone size={11} /> Internal
                    </span>
                    <span className="manager-announcements__date">• {item.date}</span>
                    {item.pinned && (
                      <span className="manager-announcements__pin-tag">
                        <Pin size={11} /> Pinned
                      </span>
                    )}
                  </div>
                  <h3 className="manager-announcements__item-title">{item.title}</h3>
                  <p className="manager-announcements__item-author">
                    Đăng bởi <strong>{item.author}</strong>
                  </p>
                </div>
                <p className="manager-announcements__item-content">{item.content}</p>
                <div className="manager-announcements__item-footer">
                  <button
                    type="button"
                    className="manager-announcements__action"
                    onClick={() => handleTogglePin(item)}
                  >
                    {item.pinned ? 'Bỏ ghim' : 'Ghim lên đầu'}
                  </button>
                  <span className="manager-announcements__divider">|</span>
                  <button
                    type="button"
                    className="manager-announcements__action"
                    onClick={() => { setEditing(item); setIsModalOpen(true); }}
                  >
                    <Edit2 size={13} /> Chỉnh sửa
                  </button>
                  <span className="manager-announcements__divider">|</span>
                  <button
                    type="button"
                    className="manager-announcements__action manager-announcements__action--danger"
                    onClick={() => setDeletingId(item.id)}
                  >
                    <Trash2 size={13} /> Xoá
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
      </Card>

      <AnnouncementFormModal
        open={isModalOpen}
        editing={editing}
        onClose={() => { setIsModalOpen(false); setEditing(null); }}
        onSave={handleSave}
      />

      <ConfirmModal
        open={Boolean(deletingId)}
        title="Xoá thông báo?"
        message="Thông báo này sẽ bị xoá vĩnh viễn. Hành động này không thể hoàn tác."
        confirmLabel="Xoá"
        cancelLabel="Huỷ"
        danger
        onCancel={() => setDeletingId(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}

function AnnouncementFormModal({ open, editing, onClose, onSave }) {
  const [form, setForm] = useState({ title: '', content: '', pinned: false });

  useEffect(() => {
    if (editing) {
      setForm({
        title: editing.title,
        content: editing.content,
        pinned: editing.pinned,
      });
    } else {
      setForm({ title: '', content: '', pinned: false });
    }
  }, [editing, open]);

  if (!open) return null;

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.title.trim()) {
      toast('Vui lòng nhập tiêu đề', { variant: 'error' });
      return;
    }
    onSave(form);
  }

  return (
    <div className="manager-announcements__modal-overlay" onClick={onClose}>
      <div className="manager-announcements__modal" onClick={(e) => e.stopPropagation()}>
        <div className="manager-announcements__modal-header">
          <h3>{editing ? 'Chỉnh sửa thông báo' : 'Đăng thông báo mới'}</h3>
          <button className="manager-announcements__modal-close" onClick={onClose} aria-label="Đóng">
            <X size={18} />
          </button>
        </div>
        <form className="manager-announcements__modal-body" onSubmit={handleSubmit}>
          <label className="manager-announcements__field">
            <span>Tiêu đề *</span>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Nhập tiêu đề…"
              autoFocus
            />
          </label>
          <label className="manager-announcements__field">
            <span>Nội dung</span>
            <textarea
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              rows={6}
              placeholder="Nhập nội dung thông báo…"
            />
          </label>
          <label className="manager-announcements__field manager-announcements__field--toggle">
            <input
              type="checkbox"
              checked={form.pinned}
              onChange={(e) => setForm({ ...form, pinned: e.target.checked })}
            />
            <span>Ghim lên đầu</span>
          </label>
          <div className="manager-announcements__modal-footer">
            <Button variant="secondary" type="button" onClick={onClose}>Huỷ</Button>
            <Button type="submit">{editing ? 'Cập nhật' : 'Đăng'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
