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
-- CLUBS - Sample clubs at FPT University
-- ============================================================================
-- Get category IDs for reference
DO $$
DECLARE
  cat_academic UUID;
  cat_tech UUID;
  cat_sports UUID;
  cat_arts UUID;
  cat_volunteer UUID;
  cat_culture UUID;
  cat_business UUID;
  cat_media UUID;
BEGIN
  SELECT id INTO cat_academic FROM public.categories WHERE name = 'Academic';
  SELECT id INTO cat_tech FROM public.categories WHERE name = 'Technology';
  SELECT id INTO cat_sports FROM public.categories WHERE name = 'Sports';
  SELECT id INTO cat_arts FROM public.categories WHERE name = 'Arts';
  SELECT id INTO cat_volunteer FROM public.categories WHERE name = 'Volunteer';
  SELECT id INTO cat_culture FROM public.categories WHERE name = 'Culture';
  SELECT id INTO cat_business FROM public.categories WHERE name = 'Business';
  SELECT id INTO cat_media FROM public.categories WHERE name = 'Media';

  -- Technology Clubs
  INSERT INTO public.clubs (category_id, name, description, logo_url, banner_url, contact_email, facebook_url, recruitment_status, founded_year, status) VALUES
    (cat_tech, 'FPT Software Club (FSC)', 'Câu lạc bộ chuyên về phần mềm và công nghệ, nơi sinh viên học hỏi và phát triển kỹ năng lập trình.', 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=200', 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=1200', 'fsc@fpt.edu.vn', 'https://facebook.com/fptsoftwareclub', true, 2018, 'active'),
    (cat_tech, 'AI & Data Science Club', 'Câu lạc bộ nghiên cứu về Trí tuệ Nhân tạo và Khoa học Dữ liệu, tổ chức các workshop và cuộc thi AI.', 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=200', 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1200', 'ai-ds.club@fpt.edu.vn', 'https://facebook.com/fptuaiclub', true, 2020, 'active'),
    (cat_tech, 'Cybersecurity Club', 'Câu lạc bộ về an ninh mạng, ethical hacking và bảo mật thông tin.', 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=200', 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1200', 'security.club@fpt.edu.vn', 'https://facebook.com/fptcybersec', false, 2021, 'active'),
    (cat_tech, 'Game Development Club', 'Câu lạc bộ phát triển game, nơi sinh viên học Unity, Unreal Engine và thiết kế game.', 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=200', 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=1200', 'gamedev.club@fpt.edu.vn', 'https://facebook.com/fptgamedev', true, 2019, 'active');

  -- Academic Clubs
  INSERT INTO public.clubs (category_id, name, description, logo_url, banner_url, contact_email, facebook_url, recruitment_status, founded_year, status) VALUES
    (cat_academic, 'English Speaking Club (ESC)', 'Câu lạc bộ giao tiếp tiếng Anh, nâng cao kỹ năng nói và phản xạ tiếng Anh cho sinh viên.', 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=200', 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=1200', 'esc@fpt.edu.vn', 'https://facebook.com/fptuesc', true, 2015, 'active'),
    (cat_academic, 'Math & Problem Solving Club', 'Câu lạc bộ toán học và giải bài toán, chuẩn bị cho các cuộc thi ACM-ICPC, GRE Math.', 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=200', 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=1200', 'math.club@fpt.edu.vn', 'https://facebook.com/fptmathclub', false, 2017, 'active');

  -- Arts Clubs
  INSERT INTO public.clubs (category_id, name, description, logo_url, banner_url, contact_email, facebook_url, recruitment_status, founded_year, status) VALUES
    (cat_arts, 'FPT Music Club', 'Câu lạc bộ âm nhạc, nơi sinh viên yêu âm nhạc gặp gỡ, biểu diễn và chia sẻ đam mê.', 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=200', 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=1200', 'music.club@fpt.edu.vn', 'https://facebook.com/fptmusicclub', true, 2016, 'active'),
    (cat_arts, 'FPT Dance Crew', 'Câu lạc bộ khiêu vũ với các team Urban, Hip-hop, Ballroom. Tham gia các cuộc thi trong và ngoài trường.', 'https://images.unsplash.com/photo-1547153760-18fc86324498?w=200', 'https://images.unsplash.com/photo-1547153760-18fc86324498?w=1200', 'dance.crew@fpt.edu.vn', 'https://facebook.com/fptdancecrew', true, 2017, 'active'),
    (cat_arts, 'Photography & Visual Arts Club', 'Câu lạc bộ nhiếp ảnh và nghệ thuật thị giác, khám phá nghệ thuật qua lens máy ảnh.', 'https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=200', 'https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=1200', 'photo.club@fpt.edu.vn', 'https://facebook.com/fptphoto', false, 2018, 'active');

  -- Sports Clubs
  INSERT INTO public.clubs (category_id, name, description, logo_url, banner_url, contact_email, facebook_url, recruitment_status, founded_year, status) VALUES
    (cat_sports, 'FPT Football Club', 'Câu lạc bộ bóng đá FPT, tham gia các giải đấu phong trào và giao lưu với các trường ĐH.', 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=200', 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1200', 'football.club@fpt.edu.vn', 'https://facebook.com/fptfootball', true, 2015, 'active'),
    (cat_sports, 'Badminton Club', 'Câu lạc bộ cầu lông, tổ chức thi đấu và training cho sinh viên FPT.', 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=200', 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=1200', 'badminton.club@fpt.edu.vn', 'https://facebook.com/fptbadminton', false, 2016, 'active');

  -- Volunteer & Culture Clubs
  INSERT INTO public.clubs (category_id, name, description, logo_url, banner_url, contact_email, facebook_url, recruitment_status, founded_year, status) VALUES
    (cat_volunteer, 'FPT Green Club', 'Câu lạc bộ tình nguyện, hoạt động vì cộng đồng và bảo vệ môi trường.', 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=200', 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=1200', 'green.club@fpt.edu.vn', 'https://facebook.com/fptgreenclub', true, 2016, 'active'),
    (cat_volunteer, 'F-Care Volunteer Team', 'Đội tình nguyện F-Care, hỗ trợ các hoạt động từ thiện và cộng đồng.', 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=200', 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=1200', 'fcare@fpt.edu.vn', 'https://facebook.com/fptfcare', true, 2019, 'active'),
    (cat_culture, 'FPT Culture & Heritage Club', 'Câu lạc bộ văn hóa và di sản, bảo tồn và phát huy văn hóa truyền thống Việt Nam.', 'https://images.unsplash.com/photo-1532375810709-75b1da00537c?w=200', 'https://images.unsplash.com/photo-1532375810709-75b1da00537c?w=1200', 'culture.club@fpt.edu.vn', 'https://facebook.com/fptculture', false, 2017, 'active');

  -- Business & Media Clubs
  INSERT INTO public.clubs (category_id, name, description, logo_url, banner_url, contact_email, facebook_url, recruitment_status, founded_year, status) VALUES
    (cat_business, 'FPT Entrepreneurship Club', 'Câu lạc bộ khởi nghiệp, kết nối sinh viên với startup ecosystem và investor.', 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=200', 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=1200', 'startup.club@fpt.edu.vn', 'https://facebook.com/fptstartup', true, 2018, 'active'),
    (cat_media, 'FPT Media & Communication Club', 'Câu lạc bộ truyền thông, sản xuất video, podcast và quản lý mạng xã hội.', 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=200', 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=1200', 'media.club@fpt.edu.vn', 'https://facebook.com/fptmedia', true, 2019, 'active');

END $$;

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
