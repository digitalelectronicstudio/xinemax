import { useEffect, useRef, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ThumbsUp, ThumbsDown, MessageCircle, Share2, X, Send, Bell, BellOff, Eye, Sparkles, Subtitles, Captions } from 'lucide-react'
import { useStore } from '../store/useStore'
import { formatViews, formatTimeAgo } from '../utils/format'
import { getActiveCue, durationToSeconds, generateSubtitlePack, attachVTTTrack } from '../utils/subtitles'

// Reactive window size hook — reliable CSS media query + resize listener (no tearing)
function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < breakpoint : false
  )
  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${breakpoint - 1}px)`)
    const onChange = (e: any) => setIsMobile(!!e.matches)
    setIsMobile(mql.matches)
    // media query listener (reliable CSS)
    try {
      mql.addEventListener('change', onChange)
    } catch {
      // @ts-ignore legacy
      mql.addListener(onChange)
    }
    const onResize = () => setIsMobile(window.innerWidth < breakpoint)
    window.addEventListener('resize', onResize)
    return () => {
      try {
        mql.removeEventListener('change', onChange)
      } catch {
        // @ts-ignore legacy
        mql.removeListener(onChange)
      }
      window.removeEventListener('resize', onResize)
    }
  }, [breakpoint])
  return isMobile
}

export default function ShortsPage() {
  const { videos, comments, currentUser, toggleLike, toggleDislike, toggleSubscribe, isSubscribed, addComment, setToast, incrementView, ensureVideoSubtitles } = useStore()
  const shorts = useMemo(() => videos.filter(v => v.format === 'shorts'), [videos])

  const [activeId, setActiveId] = useState<string | null>(shorts[0]?.id ?? null)
  const [showComments, setShowComments] = useState<string | null>(null)
  const [commentText, setCommentText] = useState("")
  const [ccEnabled, setCcEnabled] = useState(true)
  const [currentTimes, setCurrentTimes] = useState<Record<string, number>>({})
  const containerRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({})
  const isMobile = useIsMobile(768)

  // Ensure subtitles exist for all shorts (client-side VTT auto-generation + Firestore save)
  useEffect(() => {
    shorts.forEach(v => {
      if (!v.subtitles) ensureVideoSubtitles(v.id)
    })
  }, [shorts, ensureVideoSubtitles])

  // IntersectionObserver to track active short
  useEffect(() => {
    if (!shorts.length) return
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute('data-id')
            if (id) setActiveId(id)
          }
        })
      },
      { threshold: 0.6, root: containerRef.current }
    )
    Object.values(itemRefs.current).forEach(el => {
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [shorts])

  // Sync activeId when shorts change (handle hydration from Firestore causing order shift)
  useEffect(() => {
    if (!activeId && shorts[0]) setActiveId(shorts[0].id)
    if (activeId && !shorts.find(s => s.id === activeId) && shorts[0]) setActiveId(shorts[0].id)
  }, [shorts, activeId])

  const viewedRef = useRef<Set<string>>(new Set())
  useEffect(() => {
    if (activeId && !viewedRef.current.has(activeId)) {
      viewedRef.current.add(activeId)
      const t = setTimeout(() => incrementView(activeId), 600)
      return () => clearTimeout(t)
    }
  }, [activeId, incrementView])

  // Pause/play videos based on active
  useEffect(() => {
    Object.entries(videoRefs.current).forEach(([id, v]) => {
      if (!v) return
      if (id === activeId) {
        // Attach VTT track for AI subtitles (client-side TextTrack)
        const vid = shorts.find(s => s.id === id)
        if (vid?.subtitles?.vtt) {
          try { attachVTTTrack(v, vid.subtitles.vtt) } catch {}
        } else if (vid && !vid.subtitles) {
          const pack = generateSubtitlePack(vid.title, vid.description, durationToSeconds(vid.duration))
          try { attachVTTTrack(v, pack.vtt) } catch {}
        }
        v.play().catch(() => {})
      } else {
        v.pause()
      }
    })
  }, [activeId, shorts])

  const activeVideo = shorts.find(v => v.id === activeId) ?? shorts[0]

  const handleLike = (id: string) => {
    if (!currentUser) {
      setToast('Sign in to like Shorts')
      setTimeout(() => setToast(null), 2000)
      return
    }
    toggleLike(id)
  }
  const handleDislike = (id: string) => {
    if (!currentUser) {
      setToast('Sign in to react')
      setTimeout(() => setToast(null), 2000)
      return
    }
    toggleDislike(id)
  }
  const handleSubscribe = (channelId: string, name: string) => {
    if (!currentUser) {
      setToast('Sign in to subscribe')
      setTimeout(() => setToast(null), 2000)
      return
    }
    const wasSub = isSubscribed(channelId)
    toggleSubscribe(channelId)
    setToast(wasSub ? `Unsubscribed from ${name}` : `Subscribed to ${name}!`)
    setTimeout(() => setToast(null), 2000)
  }
  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href).catch(()=>{})
    setToast('Link copied — share your Shorts!')
    setTimeout(() => setToast(null), 2000)
  }
  const handlePostComment = (videoId: string) => {
    if (!commentText.trim() || !currentUser) return
    addComment(videoId, commentText)
    setCommentText("")
  }

  if (shorts.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-20 px-6 text-center">
        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 text-2xl">▶</div>
        <h2 className="text-xl font-black">No Shorts yet</h2>
        <p className="text-sm text-white/50 mt-2 max-w-md">Be the first to upload a vertical 9:16 Short — it will appear here in immersive snap-scroll.</p>
        <Link to="/" className="mt-6 h-10 px-6 rounded-full bg-[#ff4d00] hover:bg-[#ff6a2b] inline-flex items-center font-bold text-sm">Browse Home</Link>
      </div>
    )
  }

  return (
    <div className="flex-1 relative flex overflow-hidden h-[calc(100dvh-56px)] md:h-[calc(100vh-56px)] bg-[#06060a]">
      {/* PS5 BACKGROUND GLOW — cross-fade 500ms blurred; visible on desktop as atmospheric backdrop, on mobile remains behind full-screen video */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[#06060a]" />
        <AnimatePresence mode="wait">
          {activeVideo && (
            <motion.div
              key={activeVideo.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="absolute inset-0"
            >
              <img
                src={activeVideo.thumbnail}
                alt=""
                className="w-full h-full object-cover scale-110 blur-[32px] opacity-40 md:opacity-40 opacity-25"
                onError={(e)=> (e.target as HTMLImageElement).style.display='none'}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#06060a] via-[#06060a]/60 to-[#06060a]/20" />
              <div className="absolute inset-0 bg-[#ff4d00]/10 mix-blend-soft-light" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Vertical snap scroll container */}
      <div
        ref={containerRef}
        className="flex-1 relative z-10 overflow-y-auto snap-y snap-mandatory scroll-smooth scrollbar-hide flex flex-col items-center"
        style={{ scrollbarWidth: 'none' }}
      >
        {shorts.map((v) => {
          const isActive = activeId === v.id
          const liked = currentUser ? v.likedBy.includes(currentUser.id) : false
          const disliked = currentUser ? v.dislikedBy.includes(currentUser.id) : false
          const subscribed = isSubscribed(v.channelId)
          const shortComments = comments.filter(c => c.videoId === v.id)
          const pack = v.subtitles ?? generateSubtitlePack(v.title, v.description, durationToSeconds(v.duration))
          const t = currentTimes[v.id] ?? 0
          const activeCue = ccEnabled ? getActiveCue(pack.cues, t) : null

          return (
            <div
              key={v.id}
              data-id={v.id}
              ref={el => itemRefs.current[v.id] = el}
              className="snap-start w-full flex justify-center items-stretch md:items-center shrink-0 p-0 md:py-6 min-h-[calc(100dvh-56px)] md:min-h-[calc(100vh-56px)]"
            >
              {/* Responsive frame: mobile edge-to-edge full-screen, desktop centered 9:16 max-w-md with blurred glow surrounding */}
              <div className="relative w-full flex justify-center bg-black overflow-hidden h-[calc(100dvh-56px)] rounded-none border-0 mx-0 md:h-auto md:aspect-[9/16] md:max-w-[360px] md:max-h-[calc(100vh-100px)] md:rounded-[20px] md:border md:border-white/10 md:shadow-[0_16px_48px_rgba(0,0,0,0.6)] md:mx-3">
                <video
                  ref={el => videoRefs.current[v.id] = el}
                  className="shorts-video w-full h-full object-cover"
                  src={v.videoUrl}
                  poster={v.thumbnail}
                  loop
                  playsInline
                  controls={isMobile ? false : true}
                  // Use custom controls on mobile for immersive feel, native on desktop
                  onTimeUpdate={e => {
                    const ct = (e.target as HTMLVideoElement).currentTime
                    setCurrentTimes(prev => prev[v.id] === ct ? prev : { ...prev, [v.id]: ct })
                  }}
                  onError={(e)=> {
                    const el = e.target as HTMLVideoElement
                    if (el.src !== "https://commondatastorage.googleapis.com/gtb-videos-bucket/sample/BigBuckBunny.mp4") {
                      el.src = "https://commondatastorage.googleapis.com/gtb-videos-bucket/sample/BigBuckBunny.mp4"
                    }
                  }}
                />
                {/* Top gradient + channel info — translucent overlay */}
                <div className="absolute inset-x-0 top-0 p-3 md:p-3 bg-gradient-to-b from-black/60 to-transparent pointer-events-none">
                  <div className="flex items-center gap-2">
                    <Link to={`/channel/${v.channelId}`} className="flex items-center gap-2 pointer-events-auto">
                      <img src={v.channelAvatar} alt={v.channelName} className="w-8 h-8 rounded-full object-cover border border-white/20" />
                      <div className="leading-none">
                        <div className="text-sm font-bold text-white flex items-center gap-1">{v.channelName}<span className="w-3 h-3 rounded-full bg-white text-black flex items-center justify-center text-[8px]">✓</span></div>
                        <div className="text-xs text-white/70">{v.channelHandle}</div>
                      </div>
                    </Link>
                    <button
                      onClick={() => handleSubscribe(v.channelId, v.channelName)}
                      className={`ml-auto h-7 px-3 rounded-full text-xs font-black flex items-center gap-1 pointer-events-auto ${subscribed ? 'bg-white/15 text-white border border-white/20 backdrop-blur' : 'bg-white text-black'}`}
                    >
                      {subscribed ? <><BellOff className="w-3 h-3" /> Subscribed</> : <><Bell className="w-3 h-3" /> Subscribe</>}
                    </button>
                  </div>
                </div>

                {/* AI Subtitles overlay — bottom-center, font-medium white backdrop-blur-md, strictly centered even on mobile fullscreen */}
                {activeCue && (
                  <div className="absolute bottom-[88px] md:bottom-20 left-1/2 -translate-x-1/2 w-[86%] max-w-[520px] flex justify-center pointer-events-none z-10 px-2">
                    <div className="px-3 py-2 rounded-xl bg-black/45 backdrop-blur-md border border-white/10 shadow-[0_4px_24px_rgba(0,0,0,0.45)] text-center">
                      <p className="text-white font-medium text-[13px] md:text-sm leading-snug line-clamp-2 drop-shadow-[0_1px_2px_rgba(0,0,0,0.7)]">
                        {activeCue.text}
                      </p>
                    </div>
                  </div>
                )}

                {/* Bottom info — translucent overlay */}
                <div className="absolute inset-x-0 bottom-0 p-3 pt-8 bg-gradient-to-t from-black/70 via-black/30 to-transparent pointer-events-none">
                  <h3 className="text-sm font-bold leading-tight text-white line-clamp-2">{v.title}</h3>
                  <div className="flex items-center gap-2 text-xs text-white/60 mt-1">
                    <Eye className="w-3 h-3" /> {formatViews(v.views)} views
                    <span>•</span> {formatTimeAgo(v.uploadDate)}
                    <span className="ml-auto px-1.5 py-0.5 rounded bg-[#ff4d00] text-white text-[10px] font-bold">SHORTS</span>
                  </div>
                  <div className="flex gap-1 mt-2 flex-wrap">
                    {v.tags?.slice(0,3).map(t=> (
                      <span key={t} className="px-2 py-0.5 rounded-full bg-white/10 backdrop-blur text-white/80 text-[11px] font-medium">#{t}</span>
                    ))}
                  </div>
                </div>

                {/* Right translucent action bar — 500ms blurred translucent */}
                <div className="absolute right-2 md:right-2 bottom-20 md:bottom-24 flex flex-col items-center gap-3.5 md:gap-4">
                  {/* CC strict toggle */}
                  <div className="flex flex-col items-center gap-1">
                    <button
                      onClick={() => setCcEnabled(!ccEnabled)}
                      title={ccEnabled ? 'Hide captions' : 'Show captions'}
                      className={`w-11 h-11 rounded-full backdrop-blur-xl border flex items-center justify-center transition-all ${ccEnabled ? 'bg-[#ff4d00] text-white border-[#ff4d00] shadow-[0_0_16px_rgba(255,77,0,0.5)]' : 'bg-white/15 border-white/20 text-white hover:bg-white/25'}`}
                    >
                      {ccEnabled ? <Subtitles className="w-5 h-5" /> : <Captions className="w-5 h-5 opacity-70" />}
                    </button>
                    <span className="text-[10px] font-bold tracking-wide text-white/80 drop-shadow">CC</span>
                  </div>
                  {/* Like */}
                  <div className="flex flex-col items-center gap-1">
                    <button
                      onClick={() => handleLike(v.id)}
                      className={`w-11 h-11 rounded-full backdrop-blur-xl border flex items-center justify-center transition-all ${liked ? 'bg-[#ff4d00] text-white border-[#ff4d00] shadow-[0_0_16px_rgba(255,77,0,0.5)]' : 'bg-white/15 border-white/20 text-white hover:bg-white/25'}`}
                    >
                      <ThumbsUp className={`w-5 h-5 ${liked ? 'fill-white' : ''}`} />
                    </button>
                    <span className="text-xs font-bold text-white drop-shadow">{formatViews(v.likes)}</span>
                  </div>
                  {/* Dislike */}
                  <div className="flex flex-col items-center gap-1">
                    <button
                      onClick={() => handleDislike(v.id)}
                      className={`w-11 h-11 rounded-full backdrop-blur-xl border flex items-center justify-center transition-all ${disliked ? 'bg-white text-black border-white' : 'bg-white/15 border-white/20 text-white hover:bg-white/25'}`}
                    >
                      <ThumbsDown className={`w-5 h-5 ${disliked ? 'fill-black' : ''}`} />
                    </button>
                    <span className="text-[11px] text-white/80">{v.dislikes > 0 ? formatViews(v.dislikes) : ''}</span>
                  </div>
                  {/* Comment */}
                  <div className="flex flex-col items-center gap-1">
                    <button
                      onClick={() => setShowComments(v.id)}
                      className="w-11 h-11 rounded-full bg-white/15 backdrop-blur-xl border border-white/20 text-white hover:bg-white/25 flex items-center justify-center"
                    >
                      <MessageCircle className="w-5 h-5" />
                    </button>
                    <span className="text-xs font-bold text-white drop-shadow">{shortComments.length}</span>
                  </div>
                  {/* Share */}
                  <button
                    onClick={handleShare}
                    className="w-11 h-11 rounded-full bg-white/15 backdrop-blur-xl border border-white/20 text-white hover:bg-white/25 flex items-center justify-center"
                  >
                    <Share2 className="w-5 h-5" />
                  </button>
                  {/* Channel avatar */}
                  <Link
                    to={`/channel/${v.channelId}`}
                    className="w-11 h-11 rounded-full overflow-hidden border-2 border-white/30 hover:border-[#ff4d00]/50 transition-colors"
                  >
                    <img src={v.channelAvatar} alt={v.channelName} className="w-full h-full object-cover" />
                  </Link>
                </div>

                {/* Mobile tap to pause/play hint — purely CSS overlay, zero layout box on mobile */}
                {/* Active glow border — desktop only (hidden on mobile edge-to-edge) */}
                {isActive && (
                  <div className="hidden md:block absolute inset-0 rounded-[20px] border border-[#ff4d00]/30 pointer-events-none shadow-[0_0_0_1px_rgba(255,77,0,0.25),0_0_32px_rgba(255,77,0,0.2)]" />
                )}
              </div>
            </div>
          )
        })}

        <div className="py-6 text-center text-xs text-white/30 flex items-center justify-center gap-2">
          <Sparkles className="w-3 h-3" /> End of Shorts • {shorts.length} vertical stories
        </div>
      </div>

      {/* Comment slide-out drawer */}
      <AnimatePresence>
        {showComments && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowComments(null)}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed right-0 top-[56px] bottom-0 z-50 w-full max-w-[420px] bg-[#14141c] border-l border-white/10 flex flex-col"
            >
              <div className="h-14 px-4 flex items-center justify-between border-b border-white/10 shrink-0">
                <h3 className="font-black flex items-center gap-2"><MessageCircle className="w-4 h-4" /> Comments • {comments.filter(c=> c.videoId===showComments).length}</h3>
                <button onClick={() => setShowComments(null)} className="p-2 hover:bg-white/10 rounded-full"><X className="w-5 h-5" /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {comments.filter(c=> c.videoId===showComments).length===0 ? (
                  <div className="py-12 text-center">
                    <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto"><MessageCircle className="w-6 h-6 text-white/30" /></div>
                    <p className="text-sm text-white/50 mt-3">No comments yet. Be first!</p>
                  </div>
                ) : (
                  comments.filter(c=> c.videoId===showComments).slice().reverse().map(c=> (
                    <div key={c.id} className="flex gap-3">
                      <img src={c.avatar} alt={c.username} className="w-8 h-8 rounded-full object-cover shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2"><span className="font-semibold text-sm">{c.username}</span><span className="text-xs text-white/40">{c.handle} • {formatTimeAgo(c.timestamp)}</span></div>
                        <div className="text-sm leading-relaxed text-white/90 mt-1 break-words">{c.text}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="p-3 border-t border-white/10 flex gap-2 shrink-0 bg-[#0a0a0f]">
                <img src={currentUser?.avatar ?? `https://i.pravatar.cc/150?u=guest`} alt="you" className="w-8 h-8 rounded-full object-cover shrink-0" />
                <div className="flex-1 flex gap-2">
                  <input
                    value={commentText}
                    onChange={e=>setCommentText(e.target.value)}
                    onKeyDown={e=>{ if(e.key==='Enter'){ handlePostComment(showComments!); }}}
                    placeholder={currentUser ? "Add a comment…" : "Sign in to comment"}
                    disabled={!currentUser}
                    className="flex-1 h-9 px-3 rounded-full bg-[#1c1c26] border border-white/10 focus:border-[#ff4d00]/40 focus:outline-none text-sm"
                  />
                  <button onClick={()=>handlePostComment(showComments!)} disabled={!commentText.trim() || !currentUser} className="w-9 h-9 rounded-full bg-[#ff4d00] hover:bg-[#ff6a2b] disabled:bg-white/10 flex items-center justify-center">
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
