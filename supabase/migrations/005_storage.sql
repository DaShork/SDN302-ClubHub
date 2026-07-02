-- ============================================================================
-- ClubHub Supabase Storage Setup
-- Version: 1.0 (MVP)
-- Storage buckets for avatars, club images, documents, etc.
-- ============================================================================
--
-- IMPORTANT: Run this in the Supabase Dashboard SQL Editor AFTER creating
-- the schema migrations. The storage.buckets table is managed by Supabase,
-- but you can insert default policies via SQL.
--
-- Note: It's recommended to create buckets via Dashboard > Storage > New Bucket
-- so you can visually configure public/private access. Buckets to create:
--   - avatars          (public)
--   - club-images      (public)
--   - gallery          (public)
--   - documents        (private)
--   - knowledge        (private)
--   - workshop-materials (private)
-- ============================================================================

-- Insert bucket records (idempotent)
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('avatars', 'avatars', true),
  ('club-images', 'club-images', true),
  ('gallery', 'gallery', true),
  ('documents', 'documents', false),
  ('knowledge', 'knowledge', false),
  ('workshop-materials', 'workshop-materials', false)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- STORAGE POLICIES
-- ============================================================================

-- avatars bucket: users can upload/update their own avatar
CREATE POLICY "Users can upload own avatar" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Anyone can view avatars" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users can update own avatar" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete own avatar" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- club-images bucket: public read, authenticated write
CREATE POLICY "Anyone can view club images" ON storage.objects
  FOR SELECT USING (bucket_id = 'club-images');

CREATE POLICY "Authenticated users can upload club images" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'club-images');

-- gallery bucket: public read, authenticated write
CREATE POLICY "Anyone can view gallery" ON storage.objects
  FOR SELECT USING (bucket_id = 'gallery');

CREATE POLICY "Authenticated users can upload gallery images" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'gallery');

-- documents bucket: members only
CREATE POLICY "Club members can view documents" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'documents');

CREATE POLICY "Club leaders can upload documents" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'documents');

-- knowledge bucket: members only
CREATE POLICY "Club members can view knowledge attachments" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'knowledge');

CREATE POLICY "Club leaders can upload knowledge files" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'knowledge');

-- workshop-materials bucket: members only
CREATE POLICY "Club members can view workshop materials" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'workshop-materials');

CREATE POLICY "Club leaders can upload workshop materials" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'workshop-materials');
