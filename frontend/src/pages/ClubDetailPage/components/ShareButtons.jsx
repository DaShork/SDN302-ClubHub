import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { toast } from '@/components';

/**
 * Share buttons for the club page. Two actions:
 *   1. Copy link  — uses navigator.clipboard.writeText with a fallback
 *   2. Share on Facebook — opens sharer.php in a new tab
 *
 * The share URL is `window.location.href` at render time (i.e. the
 * page the user is currently viewing), not derived from props. This
 * keeps the component dumb and works in dev / preview environments
 * that use the same URL the user already has.
 */
export default function ShareButtons({ size = 'md' }) {
  const [copied, setCopied] = useState(false);
  const url = typeof window !== 'undefined' ? window.location.href : '';
  const isSmall = size === 'sm';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast('Link copied to clipboard!', { variant: 'success' });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback for older browsers / insecure contexts
      try {
        const ta = document.createElement('textarea');
        ta.value = url;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        setCopied(true);
        toast('Link copied!', { variant: 'success' });
        setTimeout(() => setCopied(false), 2000);
      } catch (err2) {
        toast('Could not copy link', { variant: 'error' });
      }
    }
  };

  const handleFacebook = () => {
    const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
    window.open(shareUrl, '_blank', 'noopener,noreferrer,width=600,height=600');
  };

  const buttonClass = isSmall
    ? 'px-3 py-1.5 text-xs rounded-lg'
    : 'px-4 py-2 text-sm rounded-xl';

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={handleCopy}
        className={buttonClass}
        style={{
          background: 'rgba(255,255,255,0.08)',
          color: '#F4F1EA',
          border: '1px solid rgba(255,255,255,0.15)',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          fontWeight: 500,
          cursor: 'pointer',
          transition: 'background 0.2s ease',
        }}
        aria-label="Copy link to this club"
      >
        {copied ? <Check size={isSmall ? 12 : 14} /> : <Copy size={isSmall ? 12 : 14} />}
        {copied ? 'Copied' : 'Copy link'}
      </button>
      <button
        type="button"
        onClick={handleFacebook}
        className={buttonClass}
        style={{
          background: '#1877F2',
          color: '#ffffff',
          border: '1px solid #1877F2',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          fontWeight: 500,
          cursor: 'pointer',
        }}
        aria-label="Share on Facebook"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width={isSmall ? 12 : 14}
          height={isSmall ? 12 : 14}
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
        Share
      </button>
    </div>
  );
}
