import { useState, useRef, useEffect, useCallback } from 'react'
import { X, Upload, Link as LinkIcon, Sparkles, Info, Film, Smartphone, MonitorPlay, Image as ImageIcon, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { useStore } from '../store/useStore'
import type { VideoFormat } from '../types'

export default function CreateVideoModal({ onClose, onCreated }: { onClose: () => void, onCreated?: (id: string) => void }) {
  const { addVideo, currentUser } = useStore()
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("Cinematography")
  const [format, setFormat] = useState<VideoFormat>('long')
  const [videoUrlInput, setVideoUrlInput] = useState("")
  const [thumbnailInput, setThumbnailInput] = useState("")
  const [fileName, setFileName] = useState<string | null>(null)
  const [objectUrl, setObjectUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [autoThumbnail, setAutoThumbnail] = useState<string | null>(null)
  const [isGeneratingThumb, setIsGeneratingThumb] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const isShorts = format === 'shorts'

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('video/')) {
      setError("Please select a valid video file (mp4, webm, mov).")
      return
    }
    setError(null)
    if (objectUrl) URL.revokeObjectURL(objectUrl)
    const url = URL.createObjectURL(file)
    setObjectUrl(url)
    setFileName(file.name)
    if (!title) setTitle(file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " "))
    // reset auto thumb to trigger regeneration
    setAutoThumbnail(null)
  }

  // Auto-Generate Thumbnail via canvas at 1s mark
  const generateThumbnail = useCallback((src: string) => {
    if (!src || thumbnailInput.trim()) return
    setIsGeneratingThumb(true)
    setAutoThumbnail(null)

    const video = document.createElement('video')
    video.crossOrigin = 'anonymous'
    video.muted = true
    // @ts-ignore
    video.playsInline = true
    video.preload = 'metadata'
    video.src = src

    let cancelled = false
    let timeoutId: number | undefined

    const cleanup = () => {
      try { video.pause() } catch {}
      video.removeAttribute('src')
      try { video.load() } catch {}
    }

    const onSeeked = () => {
      if (cancelled) return
      // strict nullish checking
      const canvas = canvasRef.current
      if (!canvas) {
        setIsGeneratingThumb(false)
        return
      }
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        setIsGeneratingThumb(false)
        return
      }
      const vw = video.videoWidth ?? 0
      const vh = video.videoHeight ?? 0
      if (!vw || !vh) {
        setIsGeneratingThumb(false)
        return
      }
      // limit canvas size for performance
      const maxW = 640
      const scale = Math.min(1, maxW / vw)
      canvas.width = Math.round(vw * scale)
      canvas.height = Math.round(vh * scale)
      try {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        const dataUrl = canvas.toDataURL('image/jpeg', 0.82)
        if (!cancelled && dataUrl && dataUrl.length > 100 && dataUrl !== 'data:,') {
          setAutoThumbnail(dataUrl)
        }
      } catch (err) {
        // CORS tainted or iframe restriction — fallback silently
        console.warn('Canvas thumbnail tainted, fallback to placeholder', err)
        setAutoThumbnail(null)
      } finally {
        setIsGeneratingThumb(false)
        cleanup()
        if (timeoutId) window.clearTimeout(timeoutId)
      }
    }

    const onLoadedMetadata = () => {
      try {
        // seek to 1s or 10% duration, whichever smaller and safe
        const dur = video.duration
        const target = Number.isFinite(dur) && dur > 1 ? Math.min(1, dur * 0.1 + 0.2) : 0.5
        video.currentTime = target
      } catch {
        setIsGeneratingThumb(false)
      }
    }

    const onError = () => {
      if (!cancelled) setIsGeneratingThumb(false)
      cleanup()
      if (timeoutId) window.clearTimeout(timeoutId)
    }

    video.addEventListener('loadedmetadata', onLoadedMetadata, { once: true })
    video.addEventListener('seeked', onSeeked, { once: true })
    video.addEventListener('error', onError, { once: true })

    // safety timeout for sandbox iframe restrictions
    timeoutId = window.setTimeout(() => {
      if (!cancelled) {
        setIsGeneratingThumb(false)
        cleanup()
      }
    }, 6000)

    return () => {
      cancelled = true
      if (timeoutId) window.clearTimeout(timeoutId)
      video.removeEventListener('loadedmetadata', onLoadedMetadata)
      video.removeEventListener('seeked', onSeeked)
      video.removeEventListener('error', onError)
      cleanup()
    }
  }, [thumbnailInput])

  // Trigger generation when source changes and no manual thumbnail
  useEffect(() => {
    const src = objectUrl || videoUrlInput.trim()
    if (!src) return
    if (thumbnailInput.trim()) {
      setAutoThumbnail(null)
      setIsGeneratingThumb(false)
      return
    }
    // only for valid URLs or blob
    const isBlob = src.startsWith('blob:')
    const isHttp = /^https?:\/\/.+\..+/.test(src)
    if (!isBlob && !isHttp) return
    const cleanup = generateThumbnail(src)
    return cleanup
  }, [objectUrl, videoUrlInput, thumbnailInput, generateThumbnail])

  const handleSubmit = () => {
    if (!currentUser) { setError("Please sign in first."); return }
    if (!title.trim()) { setError("Title is required."); return }

    let finalVideoUrl = objectUrl || videoUrlInput.trim()
    if (!finalVideoUrl) {
      finalVideoUrl = "https://commondatastorage.googleapis.com/gtb-videos-bucket/sample/BigBuckBunny.mp4"
    } else {
      if (!finalVideoUrl.startsWith("blob:") && !/^https?:\/\/.+\..+/.test(finalVideoUrl)) {
        finalVideoUrl = "https://commondatastorage.googleapis.com/gtb-videos-bucket/sample/BigBuckBunny.mp4"
      }
    }
    // Thumbnail priority: manual URL > auto canvas > fallback
    let thumb = thumbnailInput.trim()
    if (!thumb && autoThumbnail) {
      thumb = autoThumbnail
    }
    if (!thumb) {
      const seed = encodeURIComponent(title.slice(0,20) || Date.now().toString())
      // vertical placeholder for shorts
      if (isShorts) {
        thumb = `https://picsum.photos/seed/${seed}-short/360/640`
      } else {
        thumb = `https://picsum.photos/seed/${seed}/640/360`
      }
    }

    try {
      const id = addVideo({
        title: title.trim(),
        description: description.trim() || "No description added.",
        category,
        thumbnail: thumb,
        videoUrl: finalVideoUrl,
        duration: isShorts ? "00:28" : "05:42",
        tags: isShorts ? ["Shorts", "Vertical", category] : [category, "8K", "Xinemax Original"],
        channelAvatar: currentUser.avatar,
        channelHandle: currentUser.handle,
        channelId: currentUser.id,
        channelName: currentUser.username,
        format: isShorts ? 'shorts' : 'long',
      } as any)
      onCreated?.(id)
    } catch (e: any) {
      setError(e.message || "Failed to create video")
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.96, y: 16, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.96, y: 16, opacity: 0 }}
        transition={{ type: "spring", damping: 26, stiffness: 320 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-[640px] my-8 rounded-[20px] bg-[#14141c] border border-white/10 overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="h-1 w-full bg-gradient-to-r from-[#ff4d00] to-[#ff8a00] shrink-0" />
        <div className="px-6 py-5 flex items-center justify-between border-b border-white/5 shrink-0">
          <div>
            <div className="flex items-center gap-2 text-[11px] tracking-widest font-bold text-[#ff4d00]">
              <Film className="w-3.5 h-3.5" /> CREATE VIDEO
            </div>
            <h2 className="text-[18px] font-black tracking-tight mt-1">Upload to Xinemax</h2>
            <p className="text-xs text-white/50">Share your cinematic story in 8K — sandbox-ready in seconds.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto p-6 space-y-5 scrollbar-thin">
          <div className="rounded-xl bg-[#1c1c26] border border-white/10 p-3 flex gap-3">
            <Info className="w-4 h-4 text-[#ff8a00] shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed text-white/80">
              <span className="font-semibold text-white">Session preview notice:</span> Uploaded videos stay fully interactive in this sandbox session via LocalStorage + Object URLs. They'll survive reloads but not a full environment rebuild. Export your JSON from Studio if you need permanent retention.
            </div>
          </div>

          {/* DUAL-FORMAT TOGGLE */}
          <div className="space-y-2">
            <label className="text-xs font-bold tracking-wide text-white/70 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-[#ff4d00]" /> VIDEO FORMAT
            </label>
            <div className="grid grid-cols-2 gap-3 p-1 rounded-xl bg-[#0a0a0f] border border-white/10">
              <button
                type="button"
                onClick={() => setFormat('long')}
                className={`h-12 rounded-lg flex items-center justify-center gap-2 text-sm font-bold transition-all ${!isShorts ? 'bg-white text-black shadow' : 'bg-transparent text-white/60 hover:text-white hover:bg-white/5'}`}
              >
                <MonitorPlay className="w-4 h-4" /> Long-Form
                <span className="hidden sm:inline text-[10px] tracking-wide font-normal opacity-60">16:9</span>
              </button>
              <button
                type="button"
                onClick={() => setFormat('shorts')}
                className={`h-12 rounded-lg flex items-center justify-center gap-2 text-sm font-bold transition-all ${isShorts ? 'bg-[#ff4d00] text-white shadow' : 'bg-transparent text-white/60 hover:text-white hover:bg-white/5'}`}
              >
                <Smartphone className="w-4 h-4" /> Short Video
                <span className="hidden sm:inline text-[10px] tracking-wide font-normal opacity-80">9:16</span>
              </button>
            </div>
            <div className={`text-[11px] px-3 py-2 rounded-lg border flex items-center gap-2 ${isShorts ? 'bg-[#ff4d00]/10 border-[#ff4d00]/20 text-[#ff8a00]' : 'bg-white/5 border-white/10 text-white/50'}`}>
              {isShorts ? (
                <>
                  <Smartphone className="w-3.5 h-3.5" /> Shorts will appear in the vertical Shorts feed (snap-scroll, PS5 glow). Vertical 9:16 preview enforced.
                </>
              ) : (
                <>
                  <MonitorPlay className="w-3.5 h-3.5" /> Long-form appears on Home feed in cinematic 16:9.
                </>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold tracking-wide text-white/70">VIDEO TITLE *</label>
            <input
              value={title}
              onChange={e=>setTitle(e.target.value)}
              placeholder={isShorts ? "My 15s vertical moment #shorts" : "Iceland in 8K — My Cinematic Journey"}
              maxLength={100}
              className="w-full h-11 px-4 rounded-xl bg-[#0a0a0f] border border-white/10 focus:border-[#ff4d00]/50 focus:outline-none text-sm"
            />
            <div className="text-[11px] text-white/30 text-right">{title.length}/100</div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold tracking-wide text-white/70">DESCRIPTION</label>
            <textarea
              value={description}
              onChange={e=>setDescription(e.target.value)}
              placeholder="Tell the story behind the shot — gear, location, color grade…"
              rows={3}
              className="w-full px-4 py-3 rounded-xl bg-[#0a0a0f] border border-white/10 focus:border-[#ff4d00]/50 focus:outline-none text-sm resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold tracking-wide text-white/70">CATEGORY TAG</label>
              <select
                value={category}
                onChange={e=>setCategory(e.target.value)}
                className="w-full h-11 px-4 rounded-xl bg-[#0a0a0f] border border-white/10 focus:border-[#ff4d00]/50 focus:outline-none text-sm"
              >
                <option>Cinematography</option>
                <option>Technology</option>
                <option>Nature</option>
                <option>Drone</option>
                <option>8K</option>
                <option>Shorts</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold tracking-wide text-white/70 flex items-center gap-1.5">
                <ImageIcon className="w-3 h-3" /> THUMBNAIL URL (optional)
                <span className="text-[10px] font-normal text-white/30">— auto if blank</span>
              </label>
              <input
                value={thumbnailInput}
                onChange={e=>setThumbnailInput(e.target.value)}
                placeholder={isShorts ? "Leave blank → auto 9:16 canvas capture" : "Leave blank → auto canvas snapshot at 1s"}
                className="w-full h-11 px-4 rounded-xl bg-[#0a0a0f] border border-white/10 focus:border-[#ff4d00]/50 focus:outline-none text-sm"
              />
            </div>
          </div>

          {/* Auto thumbnail preview */}
          {(autoThumbnail || isGeneratingThumb || thumbnailInput) && (
            <div className="rounded-xl overflow-hidden border border-white/10 bg-[#0a0a0f] p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold tracking-wide text-white/60 flex items-center gap-1.5">
                  {isGeneratingThumb ? <Loader2 className="w-3.5 h-3.5 animate-spin text-[#ff4d00]" /> : <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />}
                  {thumbnailInput ? 'Manual thumbnail' : isGeneratingThumb ? 'Generating auto thumbnail…' : 'Auto-generated thumbnail (canvas @ 1s)'}
                </span>
                {autoThumbnail && !thumbnailInput && <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">canvas.toDataURL</span>}
              </div>
              <div className={`mx-auto overflow-hidden rounded-lg bg-black relative ${isShorts ? 'aspect-[9/16] max-w-[180px]' : 'aspect-video'}`}>
                {thumbnailInput ? (
                  <img src={thumbnailInput} alt="Thumbnail preview" className="w-full h-full object-cover" onError={(e)=> (e.target as HTMLImageElement).style.display='none'} />
                ) : autoThumbnail ? (
                  <img src={autoThumbnail} alt="Auto thumbnail" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white/30 text-xs">
                    {isGeneratingThumb ? 'Capturing frame…' : 'No thumbnail yet'}
                  </div>
                )}
              </div>
              {!thumbnailInput && autoThumbnail && (
                <div className="text-[11px] text-white/40 mt-2 text-center">Captured via hidden &lt;canvas&gt; at 1s — will be saved as JPEG DataURL</div>
              )}
            </div>
          )}

          <div className="space-y-3">
            <label className="text-xs font-bold tracking-wide text-white/70 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-[#ff4d00]" /> VIDEO SOURCE — CHOOSE ONE
            </label>

            <div
              onClick={() => fileRef.current?.click()}
              className="group relative rounded-xl border-2 border-dashed border-white/10 hover:border-[#ff4d00]/40 bg-[#0a0a0f] p-6 cursor-pointer transition-colors"
            >
              <input ref={fileRef} type="file" accept="video/*" onChange={handleFile} className="hidden" />
              <div className="flex flex-col items-center text-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[#ff4d00]/15 flex items-center justify-center group-hover:bg-[#ff4d00]/25 transition-colors">
                  <Upload className="w-6 h-6 text-[#ff4d00]" />
                </div>
                <div>
                  <div className="font-semibold text-sm">{fileName ? `Selected: ${fileName}` : "Click to pick a local video"}</div>
                  <div className="text-xs text-white/50 mt-1">Converts to Object URL for instant local playback (no CORS issues)</div>
                </div>
                {objectUrl && (
                  <div className={`mt-2 rounded-lg overflow-hidden bg-black mx-auto ${isShorts ? 'aspect-[9/16] max-w-[200px] w-full' : 'aspect-video w-full'}`}>
                    <video src={objectUrl} controls playsInline className="w-full h-full object-contain" />
                  </div>
                )}
                {objectUrl && isShorts && (
                  <div className="text-[11px] text-[#ff8a00] bg-[#ff4d00]/10 border border-[#ff4d00]/20 px-3 py-1 rounded-full">Vertical 9:16 preview enforced for Shorts</div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 py-1">
              <div className="h-px flex-1 bg-white/10" />
              <span className="text-[11px] tracking-widest font-bold text-white/30">OR PASTE EXTERNAL URL</span>
              <div className="h-px flex-1 bg-white/10" />
            </div>

            <div className="relative">
              <LinkIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                value={videoUrlInput}
                onChange={e=>setVideoUrlInput(e.target.value)}
                placeholder="https://commondatastorage.googleapis.com/.../video.mp4"
                className="w-full h-11 pl-10 pr-4 rounded-xl bg-[#0a0a0f] border border-white/10 focus:border-[#ff4d00]/50 focus:outline-none text-sm"
              />
            </div>
            <div className="text-[11px] leading-relaxed text-white/40 bg-[#0a0a0f] rounded-lg p-3 border border-white/5">
              Leave blank to auto-use a high-quality public loop (Big Buck Bunny 720p). Invalid URLs automatically fallback. For Shorts, use vertical video for best 9:16 result — landscape will be center-cropped.
            </div>
          </div>

          {error && (
            <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          {/* Hidden canvas for auto thumbnail */}
          <canvas ref={canvasRef} className="hidden" aria-hidden />
        </div>

        <div className="p-6 border-t border-white/5 flex items-center justify-between gap-3 shrink-0 bg-[#14141c]">
          <button onClick={onClose} className="h-11 px-6 rounded-full border border-white/10 hover:bg-white/10 text-sm font-medium">
            Cancel
          </button>
          <button onClick={handleSubmit} className={`flex-1 sm:flex-none h-11 px-8 rounded-full font-bold text-sm transition-colors flex items-center justify-center gap-2 ${isShorts ? 'bg-[#ff4d00] hover:bg-[#ff6a2b] text-white' : 'bg-[#ff4d00] hover:bg-[#ff6a2b] text-white'}`}>
            {isShorts ? <Smartphone className="w-4 h-4" /> : <Film className="w-4 h-4" />}
            {isShorts ? 'Publish Short' : 'Publish to Xinemax'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
