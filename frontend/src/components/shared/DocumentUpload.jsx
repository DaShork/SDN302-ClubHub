import { useRef, useState } from 'react';
import { uploadFile } from '../../services/storageService';
import { Loader } from './Loader';

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const ACCEPTED_DOC_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

export function DocumentUpload({
  bucket,
  folderPath = '',
  value,
  onChange,
  label = 'Upload document',
  className = '',
}) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState(value || null);
  const [error, setError] = useState(null);

  const handleFile = async (selected) => {
    if (!selected) return;
    if (!ACCEPTED_DOC_TYPES.includes(selected.type)) {
      setError('Unsupported file type. Please upload PDF, DOCX, or XLSX.');
      return;
    }
    setError(null);
    setUploading(true);
    const result = await uploadFile(bucket, selected, folderPath);
    setUploading(false);
    if (result.url) {
      const fileData = {
        url: result.url,
        path: result.path,
        name: selected.name,
        size: selected.size,
      };
      setFile(fileData);
      onChange?.(fileData);
    } else {
      setError(result.error || 'Upload failed');
    }
  };

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {label && (
        <span className="text-sm font-medium" style={{ color: 'rgba(244,241,234,0.7)' }}>{label}</span>
      )}
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.doc,.docx,.xls,.xlsx"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      {file ? (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl border" style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.08)' }}>
          <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: 'rgba(59,130,246,0.1)' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="1.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-secondary-100 truncate">{file.name}</p>
            <p className="text-xs" style={{ color: 'rgba(244,241,234,0.4)' }}>{formatBytes(file.size)}</p>
          </div>
          <div className="flex gap-2 shrink-0">
            {file.url && (
              <a href={file.url} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-primary-600" style={{ color: '#3B82F6' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
              </a>
            )}
            <button
              type="button"
              onClick={() => { setFile(null); onChange?.(null); inputRef.current?.click(); }}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-primary-600 text-secondary-200"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-dashed transition-all hover:border-accent-green w-full"
          style={{ borderColor: 'rgba(255,255,255,0.12)' }}
        >
          {uploading ? (
            <Loader size="sm" />
          ) : (
            <>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(244,241,234,0.4)" strokeWidth="1.5"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
              <span className="text-sm" style={{ color: 'rgba(244,241,234,0.5)' }}>{label}</span>
            </>
          )}
        </button>
      )}

      {error && (
        <p className="text-xs" style={{ color: '#EF4444' }}>{error}</p>
      )}
    </div>
  );
}
