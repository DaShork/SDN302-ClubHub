import { useState, useEffect, useCallback } from 'react';
import {
  Settings, Globe, Megaphone, Sparkles, Mail, Save,
  RefreshCw, AlertTriangle, Info, CheckCircle2, Clock, Power,
} from 'lucide-react';
import { Card, Button, Input, toast } from '@/components';
import {
  getAllSettings, updateSettings,
  SETTINGS_SCHEMA, SETTINGS_CATEGORIES, groupByCategory,
  decodeValue, encodeValue,
} from '@/services/adminSettingsService';
import './AdminSettingsPage.css';

const CATEGORY_ICONS = {
  general: Globe,
  recruitment: Megaphone,
  features: Sparkles,
  email: Mail,
};

function SettingField({ row, value, onChange }) {
  const meta = row.meta || SETTINGS_SCHEMA[row.key] || {};
  const label = meta.label || row.key;
  const description = row.description;
  const danger = meta.danger;

  if (meta.type === 'boolean') {
    return (
      <div className={`admin-settings__field ${danger ? 'admin-settings__field--danger' : ''}`}>
        <label className="admin-settings__toggle">
          <input
            type="checkbox"
            checked={!!value}
            onChange={(e) => onChange(e.target.checked)}
          />
          <span className="admin-settings__toggle-track">
            <span className="admin-settings__toggle-thumb" />
          </span>
          <div className="admin-settings__toggle-text">
            <span className="admin-settings__toggle-label">{label}</span>
            {description && <span className="admin-settings__toggle-hint">{description}</span>}
          </div>
        </label>
        {danger && value && (
          <div className="admin-settings__danger-warning">
            <AlertTriangle size={12} /> Hành động này sẽ ảnh hưởng đến toàn bộ người dùng.
          </div>
        )}
      </div>
    );
  }

  if (meta.type === 'textarea') {
    return (
      <div className="admin-settings__field">
        <label className="admin-settings__field-label">{label}</label>
        <textarea
          className="admin-settings__textarea"
          rows={3}
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
        />
        {description && <span className="admin-settings__field-hint">{description}</span>}
      </div>
    );
  }

  return (
    <div className="admin-settings__field">
      <label className="admin-settings__field-label">{label}</label>
      <Input
        type={meta.type || 'text'}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
      />
      {description && <span className="admin-settings__field-hint">{description}</span>}
      <span className="admin-settings__field-key">key: <code>{row.key}</code></span>
    </div>
  );
}

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState('general');
  const [grouped, setGrouped] = useState({});
  const [edited, setEdited] = useState({});   // key -> value (decoded JS)
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await getAllSettings();
      const decoded = rows.map((r) => ({ ...r, _decoded: decodeValue(r.value) }));
      setGrouped(groupByCategory(decoded));
      setLastUpdated(new Date().toISOString());
    } catch (err) {
      console.error('load settings failed', err);
      toast('Không thể tải cấu hình: ' + (err.message || ''), { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  function getValue(row) {
    if (Object.prototype.hasOwnProperty.call(edited, row.key)) {
      return edited[row.key];
    }
    return row._decoded;
  }

  function setValue(key, value) {
    setEdited((e) => ({ ...e, [key]: value }));
  }

  const currentRows = grouped[activeTab] || [];
  const dirtyCount = currentRows.filter((r) =>
    Object.prototype.hasOwnProperty.call(edited, r.key)
  ).length;
  const isDirty = dirtyCount > 0;

  async function handleSave() {
    if (!isDirty) return;
    setSaving(true);
    try {
      const patches = currentRows
        .filter((r) => Object.prototype.hasOwnProperty.call(edited, r.key))
        .map((r) => ({
          key: r.key,
          value: encodeValue(edited[r.key]),
        }));
      await updateSettings(patches);
      toast(`Đã lưu ${patches.length} cài đặt`);
      // Clear edits for the saved rows
      setEdited((e) => {
        const next = { ...e };
        patches.forEach((p) => delete next[p.key]);
        return next;
      });
      loadAll();
    } catch (err) {
      toast('Lỗi khi lưu: ' + (err.message || ''), { variant: 'error' });
    } finally {
      setSaving(false);
    }
  }

  function handleDiscard() {
    setEdited({});
  }

  if (loading) {
    return (
      <div className="admin-settings">
        <div className="admin-settings__loading">
          <div className="admin-settings__spinner" />
          <p>Đang tải cấu hình...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-settings">
      <div className="admin-settings__container">
        <div className="admin-settings__header">
          <div>
            <h1 className="admin-settings__title">Cấu hình hệ thống</h1>
            <p className="admin-settings__subtitle">
              Quản lý các thiết lập nền tảng — chỉ Admin mới có quyền thay đổi.
            </p>
          </div>
          <div className="admin-settings__header-actions">
            <Button variant="ghost" onClick={loadAll}>
              <RefreshCw size={16} /> Tải lại
            </Button>
            <Button variant="ghost" onClick={handleDiscard} disabled={!isDirty || saving}>
              Hủy thay đổi
            </Button>
            <Button onClick={handleSave} disabled={!isDirty || saving}>
              <Save size={16} /> {saving ? 'Đang lưu...' : `Lưu ${isDirty ? `(${dirtyCount})` : ''}`}
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="admin-settings__tabs">
          {SETTINGS_CATEGORIES.map((cat) => {
            const Icon = CATEGORY_ICONS[cat.id] || Settings;
            const rows = grouped[cat.id] || [];
            const editedCount = rows.filter((r) => Object.prototype.hasOwnProperty.call(edited, r.key)).length;
            const isActive = activeTab === cat.id;
            return (
              <button
                key={cat.id}
                className={`admin-settings__tab ${isActive ? 'admin-settings__tab--active' : ''}`}
                onClick={() => setActiveTab(cat.id)}
              >
                <Icon size={18} />
                <div className="admin-settings__tab-text">
                  <span className="admin-settings__tab-label">{cat.label}</span>
                  <span className="admin-settings__tab-desc">{cat.description}</span>
                </div>
                {editedCount > 0 && (
                  <span className="admin-settings__tab-badge">{editedCount}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Active tab content */}
        <Card className="admin-settings__panel">
          <div className="admin-settings__panel-header">
            <h2 className="admin-settings__panel-title">
              {(() => {
                const cat = SETTINGS_CATEGORIES.find((c) => c.id === activeTab);
                const Icon = CATEGORY_ICONS[activeTab] || Settings;
                return (
                  <>
                    <Icon size={18} /> {cat?.label}
                  </>
                );
              })()}
            </h2>
            {lastUpdated && (
              <span className="admin-settings__panel-meta">
                <Clock size={12} /> Tải lúc {new Date(lastUpdated).toLocaleTimeString('vi-VN')}
              </span>
            )}
          </div>

          {currentRows.length === 0 ? (
            <div className="admin-settings__empty">
              <Info size={16} /> Chưa có cài đặt nào trong mục này.
            </div>
          ) : (
            <div className="admin-settings__grid">
              {currentRows.map((row) => (
                <SettingField
                  key={row.key}
                  row={row}
                  value={getValue(row)}
                  onChange={(v) => setValue(row.key, v)}
                />
              ))}
            </div>
          )}

          {isDirty && (
            <div className="admin-settings__dirty-banner">
              <AlertTriangle size={16} />
              <span>
                Có <strong>{dirtyCount}</strong> thay đổi chưa lưu trong mục này.
              </span>
            </div>
          )}
        </Card>

        {/* Maintenance / danger summary */}
        {activeTab === 'features' && (
          <Card className="admin-settings__danger-card">
            <div className="admin-settings__danger-card-header">
              <Power size={18} />
              <h3>Các thao tác cần cẩn thận</h3>
            </div>
            <ul className="admin-settings__danger-list">
              <li><AlertTriangle size={14} /> <strong>Tắt AI Assistant</strong> sẽ ảnh hưởng mọi user đang chat.</li>
              <li><AlertTriangle size={14} /> <strong>Tắt Payment</strong> sẽ chặn Club Leader không ghi nhận phí được.</li>
              <li><AlertTriangle size={14} /> <strong>Đóng đăng ký</strong> sẽ chặn hoàn toàn tài khoản mới.</li>
              <li><AlertTriangle size={14} /> <strong>Bảo trì</strong> hiển thị thông báo và chặn truy cập (cần thêm middleware phía client).</li>
            </ul>
          </Card>
        )}

        {activeTab === 'email' && (
          <Card className="admin-settings__preview">
            <div className="admin-settings__preview-header">
              <CheckCircle2 size={18} />
              <h3>Xem trước email chào</h3>
            </div>
            <div className="admin-settings__preview-body">
              <div>
                <strong>From:</strong>{' '}
                {getValue(currentRows.find((r) => r.key === 'email.from_address')) || '—'}
              </div>
              <div>
                <strong>Subject:</strong>{' '}
                {getValue(currentRows.find((r) => r.key === 'email.welcome_subject')) || '—'}
              </div>
              <div className="admin-settings__preview-message">
                {getValue(currentRows.find((r) => r.key === 'email.welcome_body')) || '—'}
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}