import { useRef, useState } from 'react';
import { uploadFile } from '../../services/storageService';
import { Button } from './Button';
import { Loader } from './Loader';

const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];

export function ImagePicker({
  bucket,
  folderPath = '',
  value,          // { url, path }
  onChange,
  label = 'Upload image',
  className = '',
}) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(value?.url || null);

  const handleFile = async (file) => {
    if (!file || !ACCEPTED_IMAGE_TYPES.includes(file)) return;
    setUploading(true);
    const result = await uploadFile(bucket, file, folderPath);
    setUploading(false);
    if (result.url) {
      setPreview(result.url);
      onChange?.(result);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    onChange?.(null);
  };

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      {label && (
        <span className="text-sm font-medium" style={{ color: 'rgba(244,241,234,0.7)' }}>{label}</span>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_IMAGE_TYPES.join(',')}
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      {preview ? (
        <div className="relative w-full max-w-xs">
          <img
            src={preview}
            alt="Preview"
            className="w-full h-40 object-cover rounded-xl border"
            style={{ borderColor: 'rgba(255,255,255,0.08)' }}
          />
          <div className="absolute top-2 right-2 flex gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-medium text-white transition-opacity hover:opacity-80"
              style={{ backgroundColor: 'rgba(6,35,29,0.8)' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button
              type="button"
              onClick={handleRemove}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white transition-opacity hover:opacity-80"
              style={{ backgroundColor: 'rgba(239,68,68,0.8)' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
            </button>
          </div>
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center rounded-xl" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
              <Loader size="md" />
            </div>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="w-full max-w-xs flex flex-col items-center justify-center gap-2 p-6 rounded-xl border-2 border-dashed transition-all hover:border-accent-green"
          style={{ borderColor: 'rgba(255,255,255,0.12)', color: 'rgba(244,241,234,0.4)' }}
        >
          {uploading ? <Loader size="sm" /> : (
            <>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
              <span className="text-sm">{label}</span>
            </>
          )}
        </button>
      )}
    </div>
  );
}
