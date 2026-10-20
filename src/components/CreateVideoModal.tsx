import { useState, useRef } from 'react'
import { X, Upload, Link as LinkIcon, Sparkles, Info, Film } from 'lucide-react'
import { motion } from 'framer-motion'
import { useStore } from '../store/useStore'

export default function CreateVideoModal({ onClose, onCreated }: { onClose: () => void, onCreated?: (id: string) => void }) {
  const { addVideo, currentUser } = useStore()
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("Cinematography")
  const [videoUrlInput, setVideoUrlInput] = useState("")
  const [thumbnailInput, setThumbnailInput] = useState("")
  const [fileName, setFileName] = useState<string | null>(null)
  const [objectUrl, setObjectUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

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
    // auto-fill title if empty
    if (!title) setTitle(file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " "))
  }

  const handleSubmit = () => {
    if (!currentUser) { setError("Please sign in first."); return }
    if (!title.trim()) { setError("Title is required."); return }

    let finalVideoUrl = objectUrl || videoUrlInput.trim()
    if (!finalVideoUrl) {
      finalVideoUrl = "https://commondatastorage.googleapis.com/gtb-videos-bucket/sample/BigBuckBunny.mp4"
    } else {
      // basic validation, but allow blob: and http
      if (!finalVideoUrl.startsWith("blob:") && !/^https?:\/\/.+\..+/.test(finalVideoUrl)) {
        finalVideoUrl = "https://commondatastorage.googleapis.com/gtb-videos-bucket/sample/BigBuckBunny.mp4"
      }
    }
    let thumb = thumbnailInput.trim()
    if (!thumb) {
      // generate picsum placeholder seeded by title
      const seed = encodeURIComponent(title.slice(0,20) || Date.now().toString())
      thumb = `https://picsum.photos/seed/${seed}/640/360`
    }

    try {
      const id = addVideo({
        title: title.trim(),
        description: description.trim() || "No description added.",
        category,
        thumbnail: thumb,
        videoUrl: finalVideoUrl,
        duration: "05:42",
        tags: [category, "8K", "Xinemax Original"],
        channelAvatar: currentUser.avatar,
        channelHandle: currentUser.handle,
        channelId: currentUser.id,
        channelName: currentUser.username,
      })
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
          {/* Session alert */}
          <div className="rounded-xl bg-[#1c1c26] border border-white/10 p-3 flex gap-3">
            <Info className="w-4 h-4 text-[#ff8a00] shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed text-white/80">
              <span className="font-semibold text-white">Session preview notice:</span> Uploaded videos stay fully interactive in this sandbox session via LocalStorage + Object URLs. They'll survive reloads but not a full environment rebuild. Export your JSON from Studio if you need permanent retention.
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold tracking-wide text-white/70">VIDEO TITLE *</label>
            <input
              value={title}
              onChange={e=>setTitle(e.target.value)}
              placeholder="Iceland in 8K — My Cinematic Journey"
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
              rows={4}
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
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold tracking-wide text-white/70">THUMBNAIL URL (optional)</label>
              <input
                value={thumbnailInput}
                onChange={e=>setThumbnailInput(e.target.value)}
                placeholder="https://…/thumbnail.jpg or leave blank for auto"
                className="w-full h-11 px-4 rounded-xl bg-[#0a0a0f] border border-white/10 focus:border-[#ff4d00]/50 focus:outline-none text-sm"
              />
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-xs font-bold tracking-wide text-white/70 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-[#ff4d00]" /> VIDEO SOURCE — CHOOSE ONE
            </label>

            {/* File picker */}
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
                  <div className="w-full mt-2 rounded-lg overflow-hidden bg-black aspect-video">
                    <video src={objectUrl} controls className="w-full h-full object-contain" />
                  </div>
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
              Leave blank to auto-use a high-quality public loop (Big Buck Bunny 720p). Invalid URLs automatically fallback. For best results use direct <span className="text-white/80">.mp4</span> links — YouTube watch URLs won't play in the native player.
            </div>
          </div>

          {error && (
            <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-white/5 flex items-center justify-between gap-3 shrink-0 bg-[#14141c]">
          <button onClick={onClose} className="h-11 px-6 rounded-full border border-white/10 hover:bg-white/10 text-sm font-medium">
            Cancel
          </button>
          <button onClick={handleSubmit} className="flex-1 sm:flex-none h-11 px-8 rounded-full bg-[#ff4d00] hover:bg-[#ff6a2b] font-bold text-sm transition-colors">
            Publish to Xinemax
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
