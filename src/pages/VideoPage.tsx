import { useParams, Link, useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { useState, useEffect, useRef, useMemo } from 'react'
import { ThumbsUp, ThumbsDown, Share2, Bookmark, ChevronDown, ChevronUp, Eye, Clock, Send, MoreHorizontal, Subtitles, Captions } from 'lucide-react'
import { formatViews, formatTimeAgo, formatDurationUpload } from '../utils/format'
import { motion } from 'framer-motion'
import { getActiveCue, durationToSeconds, generateSubtitlePack, attachVTTTrack } from '../utils/subtitles'

export default function VideoPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { videos, comments, currentUser, toggleLike, toggleDislike, toggleSubscribe, isSubscribed, addComment, incrementView, users, settings, ensureVideoSubtitles } = useStore()
  const video = videos.find(v => v.id === id)
  const channelUser = users.find(u => u.id === video?.channelId)
  const [showDesc, setShowDesc] = useState(false)
  const [commentText, setCommentText] = useState("")
  const [ccEnabled, setCcEnabled] = useState(true)
  const [currentTime, setCurrentTime] = useState(0)
  const videoRef = useRef<HTMLVideoElement | null>(null)

  const videoComments = useMemo(() => comments.filter(c => c.videoId === id).sort((a,b) => +new Date(b.timestamp) - +new Date(a.timestamp)), [comments, id])
  const recommended = useMemo(() => videos.filter(v => v.id !== id && v.format !== 'shorts').slice(0,6), [videos, id])

  // increment view once per video id - guard with Set to survive StrictMode double-mount in dev
  const incrementedIds = useRef<Set<string>>(new Set())
  useEffect(() => {
    if (!id || !video) return
    if (incrementedIds.current.has(id)) return
    incrementedIds.current.add(id)
    const t = setTimeout(() => incrementView(id), 400)
    return () => clearTimeout(t)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, video?.id])

  // Ensure AI subtitles exist (client-side VTT auto-generation + save to Firestore via store)
  useEffect(() => {
    if (video && !video.subtitles) {
      ensureVideoSubtitles(video.id)
    }
  }, [video?.id, video?.subtitles, ensureVideoSubtitles])

  // Attach TextTrack when video loads / cc toggled
  useEffect(() => {
    if (!videoRef.current || !video) return
    const v = videoRef.current
    const pack = video.subtitles ?? generateSubtitlePack(video.title, video.description, durationToSeconds(video.duration))
    try {
      attachVTTTrack(v, pack.vtt)
      const track = v.textTracks[0] as any
      if (track) track.mode = ccEnabled ? 'showing' : 'hidden'
    } catch {}
  }, [video?.id, video?.subtitles, video?.title, video?.description, video?.duration, ccEnabled])

  // Update cue visibility on toggle
  useEffect(() => {
    if (!videoRef.current) return
    const t = videoRef.current.textTracks[0] as any
    if (t) t.mode = ccEnabled ? 'showing' : 'hidden'
  }, [ccEnabled])

  if (!video) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-20 px-6 text-center">
        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">?</div>
        <h2 className="text-xl font-bold">Video not found</h2>
        <p className="text-sm text-white/50 mt-2">It may have been archived or the ID is incorrect.</p>
        <Link to="/" className="mt-6 h-10 px-6 rounded-full bg-[#ff4d00] hover:bg-[#ff6a2b] flex items-center font-semibold text-sm">Back to Home</Link>
      </div>
    )
  }

  const isLiked = currentUser ? video.likedBy.includes(currentUser.id) : false
  const isDisliked = currentUser ? video.dislikedBy.includes(currentUser.id) : false
  const subscribed = isSubscribed(video.channelId)
  const isCommentsRestricted = settings.restrictComments && video.channelId !== currentUser?.id
  const subtitlePack = video.subtitles ?? generateSubtitlePack(video.title, video.description, durationToSeconds(video.duration))
  const activeCue = ccEnabled ? getActiveCue(subtitlePack.cues, currentTime) : null

  const handleLike = () => {
    if (!currentUser) return alert("Please sign in to like videos.")
    toggleLike(video.id)
  }
  const handleDislike = () => {
    if (!currentUser) return alert("Please sign in.")
    toggleDislike(video.id)
  }
  const handleSubscribe = () => {
    if (!currentUser) return alert("Please sign in to subscribe.")
    toggleSubscribe(video.channelId)
  }
  const handlePostComment = () => {
    if (!commentText.trim()) return
    if (!currentUser) return alert("Please sign in to comment.")
    if (isCommentsRestricted) return
    addComment(video.id, commentText)
    setCommentText("")
  }

  const handleEnded = () => {
    if (settings.autoplayNext && recommended[0]) {
      setTimeout(() => navigate(`/watch/${recommended[0].id}`), 900)
    }
  }

  return (
    <div className="flex-1 min-w-0">
      <div className="max-w-[1728px] mx-auto flex flex-col lg:flex-row">
        {/* main */}
        <div className="flex-1 min-w-0 px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
          {/* Player with Ambient Glow */}
          <div className="relative">
            {settings.ambientGlow && (
              <div className="absolute -inset-3 rounded-[20px] overflow-hidden pointer-events-none">
                <img src={video.thumbnail} alt="" className="w-full h-full object-cover scale-110 blur-[32px] opacity-30" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#06060a]/40 to-transparent" />
              </div>
            )}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="relative aspect-video w-full rounded-[16px] overflow-hidden bg-black border border-white/10 group"
            >
              <video
                ref={videoRef}
                key={video.videoUrl}
                src={video.videoUrl}
                controls
                playsInline
                poster={video.thumbnail}
                onEnded={handleEnded}
                onTimeUpdate={e => setCurrentTime((e.target as HTMLVideoElement).currentTime)}
                className="w-full h-full object-contain bg-black"
                onError={(e) => {
                  const el = e.target as HTMLVideoElement
                  if (el.src !== "https://commondatastorage.googleapis.com/gtb-videos-bucket/sample/BigBuckBunny.mp4") {
                    el.src = "https://commondatastorage.googleapis.com/gtb-videos-bucket/sample/BigBuckBunny.mp4"
                  }
                }}
              />
              {/* quality badge */}
              <div className="absolute top-3 left-3 px-2 py-1 rounded-full bg-black/70 backdrop-blur text-[11px] font-bold tracking-wide border border-white/10">
                {settings.defaultQuality === '4K' ? '4K • SIM' : settings.defaultQuality}
              </div>
              {/* CC strict toggle */}
              <button
                onClick={() => setCcEnabled(!ccEnabled)}
                title={ccEnabled ? 'Hide captions' : 'Show captions'}
                className={`absolute top-3 right-3 h-8 px-3 rounded-full backdrop-blur-md border text-xs font-bold flex items-center gap-1.5 transition-colors ${ccEnabled ? 'bg-[#ff4d00] border-[#ff4d00] text-white' : 'bg-black/60 border-white/20 text-white hover:bg-black/80'}`}
              >
                {ccEnabled ? <Subtitles className="w-3.5 h-3.5" /> : <Captions className="w-3.5 h-3.5 opacity-70" />}
                CC
              </button>
              {/* AI Subtitles overlay — bottom-center, font-medium white backdrop-blur-md, centered even on mobile fullscreen */}
              {activeCue && (
                <div className="absolute bottom-8 md:bottom-6 left-1/2 -translate-x-1/2 w-[88%] max-w-[560px] flex justify-center pointer-events-none">
                  <div className="px-3 py-2 rounded-xl bg-black/45 backdrop-blur-md border border-white/10 shadow-[0_4px_24px_rgba(0,0,0,0.45)] text-center">
                    <p className="text-white font-medium text-[13px] md:text-sm leading-snug line-clamp-2 drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">
                      {activeCue.text}
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
          {settings.autoplayNext && recommended[0] && (
            <div className="mt-2 text-xs text-white/40 flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Autoplay next: <span className="text-white/70 font-medium">{recommended[0].title.slice(0,40)}…</span>
            </div>
          )}

          {/* Title + meta */}
          <div className="mt-4">
            <h1 className="text-[18px] sm:text-[20px] font-bold leading-tight line-clamp-2">
              {video.title}
            </h1>

            <div className="mt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Link to={`/channel/${video.channelId}`} className="flex items-center gap-3 group">
                  <img src={video.channelAvatar} alt={video.channelName} className="w-10 h-10 rounded-full object-cover border border-white/10 group-hover:border-[#ff4d00]/30 transition-colors" />
                  <div className="text-left">
                    <div className="font-semibold text-sm leading-none flex items-center gap-1.5 group-hover:underline">
                      {video.channelName}
                      {channelUser?.verified && <span className="w-3.5 h-3.5 rounded-full bg-white text-black flex items-center justify-center text-[9px] font-bold">✓</span>}
                    </div>
                    <div className="text-xs text-white/50">{formatViews(channelUser?.subscribers ?? 0)} subscribers • {video.channelHandle}</div>
                  </div>
                </Link>
                <button
                  onClick={handleSubscribe}
                  className={`ml-2 h-9 px-5 rounded-full text-sm font-bold transition-colors ${subscribed ? 'bg-white/10 hover:bg-white/15 text-white border border-white/10' : 'bg-white text-black hover:bg-white/90'}`}
                >
                  {subscribed ? 'Subscribed' : 'Subscribe'}
                </button>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center rounded-full overflow-hidden border border-white/10 bg-[#1c1c26]">
                  <button onClick={handleLike} className={`flex items-center gap-2 h-9 px-4 hover:bg-white/10 transition-colors ${isLiked ? 'text-[#ff4d00]' : 'text-white'}`}>
                    <ThumbsUp className={`w-4 h-4 ${isLiked ? 'fill-[#ff4d00]' : ''}`} />
                    <span className="text-sm font-semibold">{formatViews(video.likes)}</span>
                  </button>
                  <div className="w-px h-6 bg-white/10" />
                  <button onClick={handleDislike} className={`h-9 px-3 hover:bg-white/10 transition-colors ${isDisliked ? 'text-[#ff4d00]' : ''}`}>
                    <ThumbsDown className={`w-4 h-4 ${isDisliked ? 'fill-[#ff4d00]' : ''}`} />
                  </button>
                </div>
                <button className="h-9 px-4 rounded-full bg-[#1c1c26] hover:bg-[#242430] border border-white/10 flex items-center gap-2 text-sm font-medium">
                  <Share2 className="w-4 h-4" /> Share
                </button>
                <button className="h-9 px-4 rounded-full bg-[#1c1c26] hover:bg-[#242430] border border-white/10 hidden sm:flex items-center gap-2 text-sm font-medium">
                  <Bookmark className="w-4 h-4" /> Save
                </button>
                <button className="w-9 h-9 rounded-full bg-[#1c1c26] hover:bg-[#242430] border border-white/10 flex items-center justify-center">
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Description box */}
          <div className="mt-4 rounded-xl bg-[#14141c] border border-white/5 overflow-hidden">
            <div className="px-4 py-3 flex items-center gap-3 text-sm">
              <span className="inline-flex items-center gap-1.5 font-semibold">
                <Eye className="w-4 h-4 text-white/60" /> {formatViews(video.views)} views
              </span>
              <span className="w-1 h-1 rounded-full bg-white/20" />
              <span className="flex items-center gap-1.5 text-white/70">
                <Clock className="w-4 h-4" /> {formatDurationUpload(video.uploadDate)} • {formatTimeAgo(video.uploadDate)}
              </span>
              <span className="hidden sm:inline-flex ml-auto gap-1.5">
                {video.tags?.slice(0,3).map(t => (
                  <span key={t} className="px-2 py-0.5 rounded-full bg-[#ff4d00]/15 text-[#ff8a00] text-xs font-bold">#{t}</span>
                ))}
              </span>
            </div>
            <div className={`px-4 pb-3 text-sm leading-relaxed whitespace-pre-wrap ${showDesc ? '' : 'line-clamp-2'}`} style={{ color: 'rgba(255,255,255,0.8)' }}>
              {video.description}
            </div>
            <button onClick={() => setShowDesc(!showDesc)} className="px-4 pb-3 flex items-center gap-1 text-sm font-semibold hover:underline">
              {showDesc ? <>Show less <ChevronUp className="w-4 h-4" /></> : <>Show more <ChevronDown className="w-4 h-4" /></>}
            </button>
          </div>

          {/* Comments */}
          <div className="mt-6">
            <h3 className="font-bold flex items-center gap-3">
              {videoComments.length} Comments
              <span className="text-xs font-normal text-white/50">Sorted by newest</span>
              {isCommentsRestricted && <span className="ml-auto text-xs px-2 py-1 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/20">Comments restricted</span>}
            </h3>

            {/* composer */}
            <div className="mt-4 flex gap-3">
              <img src={currentUser?.avatar || `https://i.pravatar.cc/150?u=guest`} alt="you" className="w-9 h-9 rounded-full object-cover shrink-0" />
              <div className="flex-1">
                <div className="relative">
                  <input
                    value={commentText}
                    onChange={e=>setCommentText(e.target.value)}
                    onKeyDown={e=>{ if(e.key==='Enter' && !e.shiftKey){ e.preventDefault(); handlePostComment() } }}
                    placeholder={isCommentsRestricted ? "Comments are disabled on this video" : currentUser ? "Add a comment…" : "Sign in to comment"}
                    disabled={!currentUser || isCommentsRestricted}
                    className="w-full h-11 pl-4 pr-12 rounded-full bg-[#14141c] border border-white/10 focus:border-[#ff4d00]/40 focus:outline-none text-sm placeholder:text-white/40 disabled:opacity-60"
                  />
                  <button
                    onClick={handlePostComment}
                    disabled={!commentText.trim() || !currentUser || isCommentsRestricted}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[#ff4d00] hover:bg-[#ff6a2b] disabled:bg-white/10 disabled:text-white/30 flex items-center justify-center transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
                {!currentUser && <div className="text-xs text-white/40 mt-2">You must be signed in — pick Elena or create an account from the header.</div>}
                {isCommentsRestricted && currentUser && <div className="text-xs text-amber-300/80 mt-2">Creator has restricted comments — only they can comment.</div>}
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {videoComments.length === 0 ? (
                <div className="py-10 text-center rounded-xl border border-dashed border-white/10 bg-[#14141c]/50">
                  <div className="text-sm font-medium">No comments yet</div>
                  <div className="text-xs text-white/50 mt-1">Be the first to share what you think.</div>
                </div>
              ) : videoComments.map(c => (
                <div key={c.id} className="flex gap-3 group">
                  <img src={c.avatar} alt={c.username} className="w-8 h-8 rounded-full object-cover shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="font-semibold text-sm">{c.username}</span>
                      <span className="text-xs text-white/40">{c.handle} • {formatTimeAgo(c.timestamp)}</span>
                    </div>
                    <div className="text-[14px] leading-relaxed text-white/90 mt-1 break-words">{c.text}</div>
                    <div className="flex items-center gap-3 mt-2">
                      <button className="flex items-center gap-1.5 text-xs text-white/50 hover:text-white">
                        <ThumbsUp className="w-3.5 h-3.5" /> {c.likes || ""}
                      </button>
                      <button className="text-xs text-white/50 hover:text-white">Reply</button>
                    </div>
                  </div>
                  <button className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/10 rounded-full h-fit">
                    <MoreHorizontal className="w-4 h-4 text-white/40" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recommended */}
        <div className="w-full lg:w-[400px] shrink-0 px-3 sm:px-4 lg:px-0 lg:pr-6 pb-10">
          <div className="lg:sticky lg:top-[72px] space-y-3">
            <h3 className="font-bold text-sm tracking-wide hidden lg:block">UP NEXT — RECOMMENDED</h3>
            {recommended.map(v => (
              <Link key={v.id} to={`/watch/${v.id}`} className="flex gap-2.5 group">
                <div className="relative w-[168px] aspect-video rounded-xl overflow-hidden bg-[#14141c] shrink-0 border border-white/5 group-hover:border-[#ff4d00]/30 transition-colors">
                  <img src={v.thumbnail} alt={v.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute bottom-1 right-1 px-1 py-0.5 rounded bg-black/80 text-[10px] font-medium">{v.duration}</div>
                </div>
                <div className="flex-1 min-w-0 py-0.5">
                  <div className="font-semibold text-[13px] leading-tight line-clamp-2 group-hover:text-[#ff8a00] transition-colors">{v.title}</div>
                  <div className="text-xs text-white/60 mt-1 line-clamp-1">{v.channelName}</div>
                  <div className="text-xs text-white/40 flex items-center gap-1 mt-0.5">
                    <span>{formatViews(v.views)} views</span>
                    <span>•</span>
                    <span>{formatTimeAgo(v.uploadDate)}</span>
                  </div>
                </div>
              </Link>
            ))}
            <div className="rounded-xl bg-[#14141c] border border-white/5 p-3 flex gap-3">
              <img src={video.channelAvatar} className="w-10 h-10 rounded-full object-cover" alt={video.channelName} />
              <div className="flex-1">
                <div className="text-sm font-semibold">More from {video.channelName}</div>
                <div className="text-xs text-white/50">{video.channelHandle} • {videos.filter(x=>x.channelId===video.channelId).length} videos</div>
                <Link to={`/channel/${video.channelId}`} className="mt-2 h-8 px-4 rounded-full bg-white text-black text-xs font-bold inline-flex items-center justify-center">Visit channel</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
