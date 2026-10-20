// Client-side AI auto-subtitle simulation via TextTrack / timestamp parser
// Production-safe for Vercel: pure client, no server required.
// Generates WEBVTT and cue timeline from video title/description when no transcript exists,
// saves under video document (Firestore field `subtitles`) and renders with TextTrack API.

export interface SubtitleCue {
  start: number // seconds
  end: number
  text: string
}

export interface SubtitlePack {
  vtt: string
  cues: SubtitleCue[]
  generatedAt: string
  language: string
}

function formatVTTTime(sec: number): string {
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  const ms = Math.floor((sec % 1) * 1000)
  const mm = String(m).padStart(2, '0')
  const ss = String(s).padStart(2, '0')
  const mss = String(ms).padStart(3, '0')
  return `${mm}:${ss}.${mss}`
}

// Lightweight deterministic "transcription" — shards title into timed captions
export function generateSubtitlePack(title: string, description?: string, durationSec: number = 32): SubtitlePack {
  const source = (title + ' ' + (description?.slice(0, 220) || '')).trim()
  // Split into words, then chunk into 6-9 word lines (natural caption length)
  const words = source.replace(/\s+/g, ' ').split(' ').filter(Boolean)
  // If title very short, repeat with cinematic filler to fill timeline
  const filler = ['Cinematic', 'story', 'in', '8K', '—', 'every', 'frame', 'crafted', 'with', 'light', 'and', 'motion']
  let pool = [...words]
  while (pool.length < Math.ceil(durationSec / 3) * 7) {
    pool = pool.concat(filler)
  }
  const cues: SubtitleCue[] = []
  let cursor = 0
  let idx = 0
  const perCueSec = 2.8
  const gap = 0.2
  while (cursor < durationSec - 1 && idx < pool.length) {
    const chunkLen = 6 + (idx % 3) // 6,7,8 rotation
    const chunk = pool.slice(idx, idx + chunkLen).join(' ')
    idx += chunkLen
    const start = cursor
    const end = Math.min(cursor + perCueSec, durationSec)
    // Keep text under 90 chars for readability
    const text = chunk.length > 90 ? chunk.slice(0, 87) + '…' : chunk
    cues.push({ start, end, text })
    cursor = end + gap
  }
  // Ensure at least intro cue
  if (cues.length === 0) {
    cues.push({ start: 0, end: Math.min(3, durationSec), text: title.slice(0, 80) || 'Welcome to Xinemax' })
  }

  const vtt = buildVTT(cues)
  return {
    vtt,
    cues,
    generatedAt: new Date().toISOString(),
    language: 'en',
  }
}

export function buildVTT(cues: SubtitleCue[]): string {
  let out = 'WEBVTT\n\n'
  cues.forEach((c, i) => {
    out += `${i + 1}\n${formatVTTTime(c.start)} --> ${formatVTTTime(c.end)}\n${c.text}\n\n`
  })
  return out.trim() + '\n'
}

// Parse existing VTT back to cues (for TextTrack sync)
export function parseVTT(vtt: string): SubtitleCue[] {
  if (!vtt || !vtt.includes('-->')) return []
  const lines = vtt.split('\n')
  const cues: SubtitleCue[] = []
  let i = 0
  while (i < lines.length) {
    const line = lines[i].trim()
    if (line.includes('-->')) {
      const parts = line.split('-->')
      if (parts.length === 2) {
        const start = parseVTTTime(parts[0].trim())
        const end = parseVTTTime(parts[1].trim())
        const textLines: string[] = []
        i++
        while (i < lines.length && lines[i].trim() !== '') {
          textLines.push(lines[i].trim())
          i++
        }
        const text = textLines.join(' ').trim()
        if (!isNaN(start) && !isNaN(end) && text) cues.push({ start, end, text })
      }
    }
    i++
  }
  return cues
}

function parseVTTTime(s: string): number {
  // mm:ss.mmm or hh:mm:ss.mmm
  const parts = s.split(':')
  if (parts.length === 2) {
    const sec = parseFloat(parts[1])
    const min = parseInt(parts[0], 10)
    return min * 60 + sec
  }
  if (parts.length === 3) {
    const sec = parseFloat(parts[2])
    const min = parseInt(parts[1], 10)
    const hr = parseInt(parts[0], 10)
    return hr * 3600 + min * 60 + sec
  }
  return 0
}

// Duration helper: "00:32" or "11:42" → seconds
export function durationToSeconds(d: string): number {
  if (!d) return 30
  const parts = d.split(':').map(Number)
  if (parts.length === 2) return parts[0] * 60 + parts[1]
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]
  return 30
}

// Attach VTT to a <video> element via a data URI TextTrack (client-side, no network)
export function attachVTTTrack(video: HTMLVideoElement, vtt: string, label = 'English'): TextTrack | null {
  try {
    // Remove prior auto-generated tracks
    Array.from(video.textTracks).forEach(t => {
      // @ts-ignore — mode accessible
      if ((t as any)._xinemaxAuto) t.mode = 'disabled'
    })
    // Create Blob URL for VTT
    const blob = new Blob([vtt], { type: 'text/vtt' })
    const url = URL.createObjectURL(blob)
    // Remove old auto track elements
    Array.from(video.querySelectorAll('track[data-xinemax]')).forEach(el => el.remove())
    const trackEl = document.createElement('track')
    trackEl.kind = 'subtitles'
    trackEl.label = label
    trackEl.srclang = 'en'
    trackEl.src = url
    trackEl.default = true
    trackEl.setAttribute('data-xinemax', '1')
    video.appendChild(trackEl)
    // Try to enable
    const track = trackEl.track
    if (track) {
      track.mode = 'showing'
      ;(track as any)._xinemaxAuto = true
    }
    // Clean blob eventually
    trackEl.addEventListener('load', () => {
      // Keep URL alive while video needs it; revoked on removal
    })
    return track || null
  } catch {
    return null
  }
}

// Find current cue for a given time (for custom overlay fallback when TextTrack hidden)
export function getActiveCue(cues: SubtitleCue[], time: number): SubtitleCue | null {
  for (const c of cues) if (time >= c.start && time <= c.end) return c
  return null
}
