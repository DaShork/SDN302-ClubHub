-- ============================================================================
-- ClubHub Seed Data
-- Version: 1.0 (MVP)
-- Default roles, categories, and sample data for MVP testing
-- ============================================================================

-- ============================================================================
-- ROLES - Six official roles per requirements
-- ============================================================================
INSERT INTO public.roles (name, description) VALUES
  ('Student', 'Regular FPT University student. Can browse public info and use AI Assistant.'),
  ('Club Member', 'Member of at least one club. Has access to internal resources.'),
  ('Club Leader', 'Manages club operations: members, events, workshops, knowledge, announcements.'),
  ('Mentor', 'Supervises assigned clubs. Can view reports and provide recommendations.'),
  ('Manager', 'IC-PDP staff. Manages clubs, categories, mentors, and publishes announcements.'),
  ('Administrator', 'Full system access. Manages users, roles, settings, and audit logs.')
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- CATEGORIES - Club categories
-- ============================================================================
INSERT INTO public.categories (name, description) VALUES
  ('Academic', 'Clubs focused on academic subjects and study groups.'),
  ('Technology', 'Clubs focused on programming, AI, and tech innovation.'),
  ('Sports', 'Sports clubs and athletic activities.'),
  ('Arts', 'Creative arts, music, dance, and performance clubs.'),
  ('Volunteer', 'Community service and charity clubs.'),
  ('Culture', 'Cultural exchange and traditional arts clubs.'),
  ('Business', 'Entrepreneurship, finance, and business clubs.'),
  ('Media', 'Photography, video production, and journalism clubs.')
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- SAMPLE PAYMENT METHODS REFERENCE (for reference only, no table needed)
-- ============================================================================
-- Supported payment methods (used in payments.payment_method):
--   - 'sandbox' (default, MVP only)
--   - 'bank_transfer'
--   - 'cash'
-- ============================================================================

-- ============================================================================
-- SAMPLE STATUS ENUMS (for reference only, stored as VARCHAR)
-- ============================================================================
-- club.status: 'active', 'archived'
-- event.status: 'upcoming', 'ongoing', 'finished', 'cancelled'
-- membership.status: 'active', 'inactive', 'left'
-- attendance.status: 'present', 'absent', 'late'
-- payment.status: 'pending', 'completed', 'failed', 'refunded'
-- profile.status: 'active', 'inactive', 'banned'
-- announcement.audience: 'public', 'members', 'leaders'
-- knowledge.category: 'general', 'meeting', 'event_reflection', 'document', 'guide'
-- document.type: 'pdf', 'docx', 'xlsx', 'image', 'other'
-- notification.type: 'event', 'announcement', 'payment', 'membership', 'system'
