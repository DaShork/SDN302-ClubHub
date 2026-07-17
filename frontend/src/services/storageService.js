import { supabase } from './supabase';

/**
 * Storage Service
 * Unified file upload/delete across all Supabase storage buckets.
 */

const BUCKETS = {
  avatars: 'avatars',
  'club-images': 'club-images',
  gallery: 'gallery',
  documents: 'documents',
  knowledge: 'knowledge',
  'workshop-materials': 'workshop-materials',
};

/**
 * Upload a file to a storage bucket.
 * @param {string} bucket - Bucket name (key from BUCKETS)
 * @param {File} file - File object
 * @param {string} folderPath - Subfolder path (e.g. userId or clubId)
 * @returns {{ url: string|null, path: string|null, error: string|null }}
 */
export async function uploadFile(bucket, file, folderPath = '') {
  const bucketName = BUCKETS[bucket];
  if (!bucketName) {
    return { url: null, path: null, error: `Unknown bucket: ${bucket}` };
  }

  const ext = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;
  const fullPath = folderPath ? `${folderPath}/${fileName}` : fileName;

  const { data, error } = await supabase.storage
    .from(bucketName)
    .upload(fullPath, file, { cacheControl: '3600', upsert: false });

  if (error) {
    return { url: null, path: null, error: error.message };
  }

  const { data: urlData } = supabase.storage.from(bucketName).getPublicUrl(data.path);
  return { url: urlData?.publicUrl || null, path: data.path, error: null };
}

/**
 * Upload multiple files.
 */
export async function uploadFiles(bucket, files, folderPath = '') {
  return Promise.all(
    files.map(file => uploadFile(bucket, file, folderPath))
  );
}

/**
 * Delete a file from a bucket by its path.
 */
export async function deleteFile(bucket, path) {
  const bucketName = BUCKETS[bucket];
  if (!bucketName) return { error: `Unknown bucket: ${bucket}` };

  const { error } = await supabase.storage.from(bucketName).remove([path]);
  return { error };
}

/**
 * Get public URL for a stored file.
 */
export function getPublicUrl(bucket, path) {
  const bucketName = BUCKETS[bucket];
  if (!bucketName) return null;
  const { data } = supabase.storage.from(bucketName).getPublicUrl(path);
  return data?.publicUrl || null;
}

/**
 * List files in a bucket/folder path.
 */
export async function listFiles(bucket, folderPath = '') {
  const bucketName = BUCKETS[bucket];
  if (!bucketName) return { data: [], error: `Unknown bucket: ${bucket}` };

  const { data, error } = await supabase.storage
    .from(bucketName)
    .list(folderPath, { limit: 100, sortBy: { column: 'created_at', order: 'desc' } });

  return { data: data || [], error };
}
