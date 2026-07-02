-- ============================================================================
-- ClubHub Database Schema
-- Version: 1.0 (MVP)
-- Database: Supabase PostgreSQL
-- ============================================================================

-- Enable UUID generation (pgcrypto is built-in on Supabase)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. ROLES TABLE - System roles for RBAC
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 2. CATEGORIES TABLE - Club categories
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 3. PROFILES TABLE - Extended user information
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name VARCHAR(255),
    student_code VARCHAR(50) UNIQUE,
    email VARCHAR(255) UNIQUE NOT NULL,
    avatar_url TEXT,
    role_id UUID REFERENCES public.roles(id) ON DELETE SET NULL,
    faculty VARCHAR(100),
    major VARCHAR(100),
    phone VARCHAR(20),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 4. CLUBS TABLE - Club information
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.clubs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    logo_url TEXT,
    banner_url TEXT,
    contact_email VARCHAR(255),
    facebook_url TEXT,
    recruitment_status BOOLEAN DEFAULT FALSE,
    founded_year INTEGER,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 5. CLUB_TERMS TABLE - Executive board periods
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.club_terms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 6. MEMBERSHIPS TABLE - Members belong to clubs
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
    term_id UUID REFERENCES public.club_terms(id) ON DELETE SET NULL,
    position VARCHAR(100) DEFAULT 'Member',
    joined_at DATE DEFAULT CURRENT_DATE,
    left_at DATE,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 7. EVENTS TABLE - Club events
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    location VARCHAR(255),
    banner_url TEXT,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    max_participants INTEGER,
    qr_code TEXT,
    status VARCHAR(20) DEFAULT 'upcoming',
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 8. EVENT_REGISTRATIONS TABLE - User event registrations
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.event_registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'registered',
    UNIQUE(event_id, profile_id)
);

-- ============================================================================
-- 9. ATTENDANCE TABLE - Event check-in records
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    membership_id UUID NOT NULL REFERENCES public.memberships(id) ON DELETE CASCADE,
    check_in_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'present',
    UNIQUE(event_id, membership_id)
);

-- ============================================================================
-- 10. WORKSHOPS TABLE - Workshop information
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.workshops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    material_url TEXT,
    event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 11. KNOWLEDGE_ARTICLES TABLE - Knowledge repository
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.knowledge_articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    club_id UUID REFERENCES public.clubs(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    category VARCHAR(100),
    attachment_url TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 12. MEETING_MINUTES TABLE - Meeting notes
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.meeting_minutes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    meeting_date DATE NOT NULL,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 13. DOCUMENTS TABLE - Club documents
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    type VARCHAR(50),
    uploaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 14. ANNOUNCEMENTS TABLE - Public/Club announcements
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    club_id UUID REFERENCES public.clubs(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    audience VARCHAR(50) DEFAULT 'public',
    is_pinned BOOLEAN DEFAULT FALSE,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 15. GALLERIES TABLE - Club images
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.galleries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    caption TEXT,
    uploaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 16. PAYMENTS TABLE - Sandbox payment records
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    membership_id UUID NOT NULL REFERENCES public.memberships(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    payment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    payment_method VARCHAR(50) DEFAULT 'sandbox',
    transaction_code VARCHAR(100),
    status VARCHAR(20) DEFAULT 'completed',
    note TEXT
);

-- ============================================================================
-- 17. ALUMNI TABLE - Former members
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.alumni (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    graduation_year INTEGER,
    company VARCHAR(255),
    linkedin_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 18. NOTIFICATIONS TABLE - System notifications
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    type VARCHAR(50),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 19. CHAT_HISTORY TABLE - AI conversation history
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.chat_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    answer TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- INDEXES - Performance optimization
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role_id);
CREATE INDEX IF NOT EXISTS idx_profiles_student_code ON public.profiles(student_code);
CREATE INDEX IF NOT EXISTS idx_clubs_category ON public.clubs(category_id);
CREATE INDEX IF NOT EXISTS idx_clubs_status ON public.clubs(status);
CREATE INDEX IF NOT EXISTS idx_club_terms_club ON public.club_terms(club_id);
CREATE INDEX IF NOT EXISTS idx_memberships_profile ON public.memberships(profile_id);
CREATE INDEX IF NOT EXISTS idx_memberships_club ON public.memberships(club_id);
CREATE INDEX IF NOT EXISTS idx_memberships_term ON public.memberships(term_id);
CREATE INDEX IF NOT EXISTS idx_memberships_status ON public.memberships(status);
CREATE INDEX IF NOT EXISTS idx_events_club ON public.events(club_id);
CREATE INDEX IF NOT EXISTS idx_events_start_time ON public.events(start_time);
CREATE INDEX IF NOT EXISTS idx_events_status ON public.events(status);
CREATE INDEX IF NOT EXISTS idx_event_reg_event ON public.event_registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_event_reg_profile ON public.event_registrations(profile_id);
CREATE INDEX IF NOT EXISTS idx_attendance_event ON public.attendance(event_id);
CREATE INDEX IF NOT EXISTS idx_attendance_membership ON public.attendance(membership_id);
CREATE INDEX IF NOT EXISTS idx_workshops_club ON public.workshops(club_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_club ON public.knowledge_articles(club_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_category ON public.knowledge_articles(category);
CREATE INDEX IF NOT EXISTS idx_meeting_minutes_club ON public.meeting_minutes(club_id);
CREATE INDEX IF NOT EXISTS idx_documents_club ON public.documents(club_id);
CREATE INDEX IF NOT EXISTS idx_announcements_club ON public.announcements(club_id);
CREATE INDEX IF NOT EXISTS idx_announcements_audience ON public.announcements(audience);
CREATE INDEX IF NOT EXISTS idx_galleries_club ON public.galleries(club_id);
CREATE INDEX IF NOT EXISTS idx_payments_membership ON public.payments(membership_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_alumni_profile ON public.alumni(profile_id);
CREATE INDEX IF NOT EXISTS idx_notifications_profile ON public.notifications(profile_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_chat_history_profile ON public.chat_history(profile_id);
