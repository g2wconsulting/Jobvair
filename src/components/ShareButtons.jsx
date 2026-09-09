// Social sharing for a public job posting. Falls back gracefully: the
// native Web Share API sheet on devices that support it (mostly mobile),
// direct share-intent links for desktop, plus copy-link and email always
// available. No SDKs or app registrations needed for any of these — they're
// all plain share-intent URLs the platforms provide for free.
import { useState } from "react";
import { Share2, Link as LinkIcon, Mail } from "lucide-react";

const pillStyle = {
  display: "inline-flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 999,
  border: "1px solid var(--jv-color-border)", background: "var(--jv-color-surface)", color: "var(--jv-color-text)",
  fontSize: 12.5, fontWeight: 600, textDecoration: "none", cursor: "pointer", font: "inherit",
};

export default function ShareButtons({ url, title }) {
  const [copied, setCopied] = useState(false);
  const canNativeShare = typeof navigator !== "undefined" && typeof navigator.share === "function";

  const copyLink = () => {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const links = [
    { label: "LinkedIn", href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}` },
    { label: "X", href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}` },
    { label: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}` },
  ];

  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
      <span style={{ fontSize: 12.5, color: "var(--jv-color-muted)", fontWeight: 700 }}>Share:</span>
      {canNativeShare && (
        <button style={pillStyle} onClick={() => navigator.share({ title, url }).catch(() => {})}>
          <Share2 size={13} /> Share
        </button>
      )}
      {links.map(l => (
        <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer" style={pillStyle}>{l.label}</a>
      ))}
      <a href={`mailto:?subject=${encodedTitle}&body=${encodedUrl}`} style={pillStyle}><Mail size={13} /> Email</a>
      <button style={pillStyle} onClick={copyLink}><LinkIcon size={13} /> {copied ? "Copied!" : "Copy Link"}</button>
    </div>
  );
}
