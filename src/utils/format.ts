export function formatViews(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "K";
  return n.toLocaleString();
}

export function formatTimeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} minute${m>1?'s':''} ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hour${h>1?'s':''} ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d} day${d>1?'s':''} ago`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `${mo} month${mo>1?'s':''} ago`;
  const y = Math.floor(mo / 12);
  return `${y} year${y>1?'s':''} ago`;
}

export function formatDurationUpload(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch { return iso; }
}

export function safeVideoUrlFallback(url?: string): string {
  if (!url || url.trim().length < 8) return "https://commondatastorage.googleapis.com/gtb-videos-bucket/sample/BigBuckBunny.mp4";
  // simple check for valid extensions
  if (/\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(url.trim())) return url.trim();
  // if it's a blob: url, allow
  if (url.startsWith("blob:")) return url;
  // otherwise fallback
  return "https://commondatastorage.googleapis.com/gtb-videos-bucket/sample/BigBuckBunny.mp4";
}
