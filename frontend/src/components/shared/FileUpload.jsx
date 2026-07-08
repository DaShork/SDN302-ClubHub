import { useRef, useState } from 'react';
import { uploadFile, deleteFile } from '../../services/storageService';
import { Loader } from './Loader';
import { Button } from './Button';

export function FileUpload({
  bucket,
  folderPath = '',
  accept,
  multiple = false,
  onUpload,        // (results: { url, path, error }[]) => void
  onError,
  label = 'Choose file or drag & drop',
  className = '',
}) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState([]);

  const processFiles = async (files) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    const fileList = Array.from(files);
    const toUpload = multiple ? fileList : [fileList[0]];
    const uploaded = await Promise.all(
      toUpload.map((f) => uploadFile(bucket, f, folderPath))
    );
    setResults(uploaded);
    setUploading(false);
    onUpload?.(uploaded);
    if (uploaded.some((r) => r.error)) {
      onError?.(uploaded.filter((r) => r.error).map((r) => r.error));
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    processFiles(e.dataTransfer.files);
  };

  const handleChange = (e) => processFiles(e.target.files);

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      <div
        className={`relative flex flex-col items-center justify-center p-8 rounded-xl border-2 border-dashed cursor-pointer transition-all ${
          dragging ? 'border-accent-green' : ''
        }`}
        style={{
          borderColor: dragging ? '#22C55E' : 'rgba(255,255,255,0.12)',
          backgroundColor: dragging ? 'rgba(34,197,94,0.05)' : 'transparent',
        }}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => !uploading && inputRef.current?.click()}
        role="button"
        tabIndex={0}
        aria-label={label}
        onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          className="hidden"
          onChange={handleChange}
        />
        {uploading ? (
          <Loader size="md" />
        ) : (
          <>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(244,241,234,0.4)" strokeWidth="1.5" className="mb-3">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
            </svg>
            <p className="text-sm text-center" style={{ color: 'rgba(244,241,234,0.5)' }}>{label}</p>
            {accept && <p className="text-xs mt-1" style={{ color: 'rgba(244,241,234,0.3)' }}>{accept}</p>}
          </>
        )}
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className="flex flex-col gap-2">
          {results.map((r, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-2 rounded-xl border" style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.06)' }}>
              {r.error ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
              )}
              <span className="text-xs truncate flex-1" style={{ color: r.error ? '#EF4444' : 'rgba(244,241,234,0.6)' }}>
                {r.error || 'Uploaded'}
              </span>
              {r.url && (
                <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-xs text-accent-blue hover:underline shrink-0">
                  View
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
