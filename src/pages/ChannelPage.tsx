import { useParams, Link } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, Users, Calendar, Play, Film, Sparkles, Bell, BellOff, Verified, Video as VideoIcon } from 'lucide-react'
import VideoCard from '../components/VideoCard'
import { formatViews, formatDurationUpload } from '../utils/format'

export default function ChannelPage() {
  const { channelId } = useParams<{ channelId: string }>()
  const { users, videos, currentUser, isSubscribed, toggleSubscribe, setToast } = useStore()
  const [activeTab, setActiveTab] = useState<'videos' | 'about'>('videos')

  // DYNAMIC ROUTING & SAFETY GUARD — safe conditional rendering
  const creator = useMemo(() => users.find(u => u.id === channelId) ?? null, [users, channelId])

  const creatorVideos = useMemo(() => {
    if (!channelId) return []
    return videos.filter(v => v.channelId === channelId)
  }, [videos, channelId])

  const totalViews = useMemo(() => creatorVideos.reduce((acc, v) => acc + (v?.views ?? 0), 0), [creatorVideos])
  const totalLikes = useMemo(() => creatorVideos.reduce((acc, v) => acc + (v?.likes ?? 0), 0), [creatorVideos])

  // Safety guard: clean placeholder if creator not found — prevents sandbox crashes
  if (!channelId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-20 px-6 text-center">
        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">?</div>
        <h2 className="text-xl font-bold">Missing channel</h2>
        <p className="text-sm text-white/50 mt-2">No channel ID was provided in the URL.</p>
        <Link to="/" className="mt-6 h-10 px-6 rounded-full bg-[#ff4d00] hover:bg-[#ff6a2b] inline-flex items-center font-semibold text-sm">Back to Home</Link>
      </div>
    )
  }

  if (!creator) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-20 px-6 text-center">
        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
          <Users className="w-8 h-8 text-white/40" />
        </div>
        <h2 className="text-xl font-bold">Creator not found</h2>
        <p className="text-sm text-white/50 mt-2 max-w-md">We couldn't find a channel with ID <span className="font-mono text-white">{channelId}</span>. It may have been removed or the link is incorrect.</p>
        <Link to="/" className="mt-6 h-10 px-6 rounded-full bg-[#ff4d00] hover:bg-[#ff6a2b] inline-flex items-center font-semibold text-sm">Browse Xinemax</Link>
      </div>
    )
  }

  const subscribed = isSubscribed(creator.id)
  const isOwnChannel = currentUser?.id === creator.id

  const handleSubscribe = () => {
    if (!currentUser) {
      setToast('Please sign in to subscribe — pick Elena or create an account')
      setTimeout(() => setToast(null), 2400)
      return
    }
    toggleSubscribe(creator.id)
    // instant feedback toast (global persistent state sync)
    if (!subscribed) {
      setToast(`Subscribed to ${creator.username}!`)
    } else {
      setToast(`Unsubscribed from ${creator.username}`)
    }
    setTimeout(() => setToast(null), 2000)
  }

  return (
    <div className="flex-1 min-w-0">
      <div className="max-w-[1728px] mx-auto">
        {/* PUBLIC CHANNEL HEADER */}
        <div className="relative">
          {/* Banner */}
          <div className="h-[140px] sm:h-[220px] lg:h-[260px] w-full overflow-hidden bg-[#14141c] relative">
            {creator?.banner ? (
              <img
                src={creator.banner}
                alt={creator?.username ? `${creator.username} banner` : 'Channel banner'}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none'
                }}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-[#ff4d00]/30 via-[#1c1c26] to-[#0a0a0f]" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#06060a] via-[#06060a]/40 to-transparent" />
            {/* subtle immersive glow matching PS5 theme */}
            <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-[#ff4d00]/10 blur-[80px] rounded-full" />
          </div>

          {/* Channel identity row */}
          <div className="px-3 sm:px-6 lg:px-8 relative">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-6 -mt-10 sm:-mt-12 relative z-10">
              <img
                src={creator?.avatar ?? `https://i.pravatar.cc/300?u=${creator?.id}`}
                alt={creator?.username ?? 'Creator avatar'}
                className="w-20 h-20 sm:w-28 sm:h-28 rounded-[20px] sm:rounded-[24px] object-cover border-4 border-[#06060a] shadow-xl bg-[#14141c] shrink-0"
                onError={(e) => (e.target as HTMLImageElement).src = `https://i.pravatar.cc/150?u=${creator?.id}` }
              />
              <div className="flex-1 min-w-0 pb-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-[22px] sm:text-[26px] font-black tracking-tight leading-none flex items-center gap-2">
                    {creator?.username ?? 'Unknown Creator'}
                    {creator?.verified && (
                      <span className="w-5 h-5 rounded-full bg-white text-black flex items-center justify-center text-xs font-bold" title="Verified">
                        <Verified className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </h1>
                  {!isOwnChannel && subscribed && (
                    <span className="hidden sm:inline-flex items-center gap-1 text-[11px] tracking-widest font-bold bg-white/10 border border-white/10 px-2 py-0.5 rounded-full text-white/70">FOLLOWING</span>
                  )}
                </div>
                <div className="text-sm text-white/60 mt-1 flex flex-wrap items-center gap-2">
                  <span>{creator?.handle ?? '@unknown'}</span>
                  <span className="w-1 h-1 rounded-full bg-white/30" />
                  <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" />{formatViews(creator?.subscribers ?? 0)} subscribers</span>
                  <span className="w-1 h-1 rounded-full bg-white/30 hidden sm:inline" />
                  <span className="hidden sm:inline-flex items-center gap-1.5"><Film className="w-3.5 h-3.5" />{creatorVideos.length} videos</span>
                </div>
                {/* short bio preview for header */}
                {creator?.bio && (
                  <p className="text-sm text-white/70 mt-2 max-w-[720px] line-clamp-2 leading-relaxed hidden sm:block">{creator.bio}</p>
                )}
              </div>

              {/* PROMINENT SUBSCRIBE BUTTON — interactive, persistent, synced */}
              <div className="flex items-center gap-2 sm:pb-1 shrink-0">
                {isOwnChannel ? (
                  <div className="h-10 px-5 rounded-full bg-white/10 border border-white/10 flex items-center gap-2 text-sm font-bold text-white/70">
                    <Sparkles className="w-4 h-4" /> Your channel
                  </div>
                ) : (
                  <button
                    onClick={handleSubscribe}
                    className={`h-10 px-6 sm:px-7 rounded-full text-sm font-black tracking-wide transition-all flex items-center gap-2 ${subscribed ? 'bg-white/10 hover:bg-white/15 text-white border border-white/15' : 'bg-white text-black hover:bg-white/90 shadow-lg'}`}
                  >
                    {subscribed ? (
                      <>
                        <BellOff className="w-4 h-4" /> Subscribed
                      </>
                    ) : (
                      <>
                        <Bell className="w-4 h-4" /> Subscribe
                      </>
                    )}
                  </button>
                )}
                <Link to={`/watch/${creatorVideos[0]?.id ?? ''}`} className={`h-10 w-10 rounded-full bg-[#1c1c26] border border-white/10 flex items-center justify-center hover:bg-[#242430] transition-colors ${creatorVideos.length === 0 ? 'opacity-40 pointer-events-none' : ''}`}>
                  <Play className="w-4 h-4 ml-0.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* CREATOR CONTENT TABS */}
        <div className="mt-6 sm:mt-8 px-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-1 sm:gap-2 border-b border-white/10 relative">
            <button
              onClick={() => setActiveTab('videos')}
              className={`relative h-11 px-4 sm:px-5 font-bold text-sm transition-colors ${activeTab === 'videos' ? 'text-white' : 'text-white/50 hover:text-white'}`}
            >
              <span className="flex items-center gap-2">
                <VideoIcon className="w-4 h-4 hidden sm:block" /> Videos
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${activeTab === 'videos' ? 'bg-white text-black' : 'bg-white/10 text-white/60'}`}>{creatorVideos.length}</span>
              </span>
              {activeTab === 'videos' && (
                <motion.div layoutId="channel-tab" className="absolute left-0 right-0 -bottom-px h-[2px] bg-[#ff4d00]" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('about')}
              className={`relative h-11 px-4 sm:px-5 font-bold text-sm transition-colors ${activeTab === 'about' ? 'text-white' : 'text-white/50 hover:text-white'}`}
            >
              About
              {activeTab === 'about' && (
                <motion.div layoutId="channel-tab" className="absolute left-0 right-0 -bottom-px h-[2px] bg-[#ff4d00]" />
              )}
            </button>
            <div className="ml-auto hidden sm:flex items-center gap-2 text-xs text-white/40">
              <Eye className="w-3.5 h-3.5" /> {formatViews(totalViews)} total views
            </div>
          </div>

          {/* Tab Content */}
          <div className="py-6 min-h-[320px]">
            <AnimatePresence mode="wait">
              {activeTab === 'videos' ? (
                <motion.div
                  key="videos"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.24 }}
                >
                  {creatorVideos.length === 0 ? (
                    // CLEAN PLACEHOLDER if creator has no videos — prevents sandbox crashes
                    <div className="py-16 sm:py-20 text-center rounded-[20px] bg-[#14141c] border border-white/5">
                      <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto">
                        <Film className="w-8 h-8 text-white/30" />
                      </div>
                      <h3 className="font-bold mt-4 text-[16px]">{creator?.username ?? 'This creator'} hasn't uploaded yet</h3>
                      <p className="text-sm text-white/50 mt-2 max-w-md mx-auto leading-relaxed">
                        Once {creator?.username?.split(' ')[0] ?? 'they'} publish a video, it will appear here in the PS5-inspired grid. Check back soon or explore other creators.
                      </p>
                      <Link to="/" className="inline-flex mt-6 h-10 px-6 rounded-full bg-white text-black hover:bg-white/90 items-center font-bold text-sm">
                        Discover videos
                      </Link>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
                      {creatorVideos.map((v, i) => (
                        <VideoCard key={v.id} video={v} index={i} />
                      ))}
                    </div>
                  )}

                  {creatorVideos.length > 0 && (
                    <div className="mt-8 flex items-center justify-center gap-2 text-xs text-white/30">
                      <Sparkles className="w-3 h-3" /> PS5 dashboard grid — hover any card for immersive glow
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="about"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.24 }}
                  className="grid grid-cols-1 lg:grid-cols-3 gap-6"
                >
                  {/* Bio + stats */}
                  <div className="lg:col-span-2 space-y-5">
                    <div className="rounded-[16px] bg-[#14141c] border border-white/5 p-5 sm:p-6">
                      <h3 className="font-black text-sm tracking-wide flex items-center gap-2"> <Sparkles className="w-4 h-4 text-[#ff4d00]" /> ABOUT {creator?.username?.toUpperCase() ?? 'CREATOR'}</h3>
                      <p className="text-[14px] leading-relaxed text-white/80 mt-3 whitespace-pre-wrap">
                        {creator?.bio ?? 'No bio yet — this creator is still writing their story.'}
                      </p>
                      <div className="mt-5 flex flex-wrap gap-2">
                        <span className="px-3 py-1 rounded-full bg-white/10 border border-white/10 text-xs font-semibold">{creator?.handle ?? '@unknown'}</span>
                        {creator?.verified && <span className="px-3 py-1 rounded-full bg-[#ff4d00] text-white text-xs font-bold flex items-center gap-1"><Verified className="w-3 h-3" /> Verified</span>}
                        <span className="px-3 py-1 rounded-full bg-white/5 text-xs text-white/60">{creatorVideos.length} uploads</span>
                      </div>
                    </div>

                    <div className="rounded-[16px] bg-[#14141c] border border-white/5 p-5 sm:p-6">
                      <h4 className="font-bold text-sm">Channel details</h4>
                      <div className="mt-4 space-y-3 text-sm">
                        <div className="flex items-center justify-between py-2 border-b border-white/5">
                          <span className="text-white/50 flex items-center gap-2"><Calendar className="w-4 h-4" /> Joined</span>
                          <span className="font-semibold">{creator?.joinedDate ? formatDurationUpload(creator.joinedDate) : '2019 — early creator'}</span>
                        </div>
                        <div className="flex items-center justify-between py-2 border-b border-white/5">
                          <span className="text-white/50 flex items-center gap-2"><Eye className="w-4 h-4" /> Total views</span>
                          <span className="font-semibold">{formatViews(totalViews)}</span>
                        </div>
                        <div className="flex items-center justify-between py-2 border-b border-white/5">
                          <span className="text-white/50 flex items-center gap-2"><Film className="w-4 h-4" /> Videos</span>
                          <span className="font-semibold">{creatorVideos.length}</span>
                        </div>
                        <div className="flex items-center justify-between py-2">
                          <span className="text-white/50 flex items-center gap-2"><Users className="w-4 h-4" /> Subscribers</span>
                          <span className="font-semibold">{formatViews(creator?.subscribers ?? 0)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Cumulative stats card */}
                  <div className="space-y-4">
                    <div className="rounded-[16px] bg-gradient-to-br from-[#ff4d00] to-[#ff8a00] p-5 text-white relative overflow-hidden">
                      <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/15 rounded-full blur-2xl" />
                      <div className="relative">
                        <div className="text-xs tracking-widest font-bold opacity-80">CUMULATIVE REACH</div>
                        <div className="text-3xl font-black mt-2">{formatViews(totalViews)}</div>
                        <div className="text-sm opacity-90">total views across {creatorVideos.length} videos</div>
                        <div className="mt-4 flex items-center gap-2 text-xs bg-white/15 backdrop-blur px-3 py-2 rounded-full w-fit">
                          <Eye className="w-3.5 h-3.5" /> Avg {creatorVideos.length ? formatViews(Math.round(totalViews / creatorVideos.length)) : '0'} / video
                        </div>
                      </div>
                    </div>

                    <div className="rounded-[16px] bg-[#14141c] border border-white/5 p-5">
                      <h4 className="font-bold text-sm flex items-center gap-2"><Users className="w-4 h-4 text-[#ff4d00]" /> Community</h4>
                      <div className="mt-3">
                        <div className="text-2xl font-black">{formatViews(creator?.subscribers ?? 0)}</div>
                        <div className="text-xs text-white/50">subscribers • updates instantly everywhere</div>
                      </div>
                      {!isOwnChannel && (
                        <button onClick={handleSubscribe} className={`w-full mt-4 h-10 rounded-full font-bold text-sm flex items-center justify-center gap-2 transition-colors ${subscribed ? 'bg-white/10 border border-white/10 text-white' : 'bg-white text-black'}`}>
                          {subscribed ? <><BellOff className="w-4 h-4" /> Subscribed</> : <><Bell className="w-4 h-4" /> Subscribe</>}
                        </button>
                      )}
                      <p className="text-[11px] text-white/30 mt-3 text-center">Persistent via Zustand + LocalStorage — syncs to Home, Player & Studio</p>
                    </div>

                    {creatorVideos.length > 0 && (
                      <div className="rounded-[16px] bg-[#14141c] border border-white/5 p-4">
                        <div className="text-xs font-bold tracking-widest text-white/40">MOST VIEWED</div>
                        {(() => {
                          const top = [...creatorVideos].sort((a,b)=> (b.views??0)-(a.views??0))[0]
                          if (!top) return null
                          return (
                            <Link to={`/watch/${top.id}`} className="mt-3 flex gap-3 group">
                              <img src={top.thumbnail} alt={top.title} className="w-24 aspect-video rounded-lg object-cover border border-white/5 group-hover:border-[#ff4d00]/30 transition-colors" />
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-semibold line-clamp-2 group-hover:text-[#ff8a00] transition-colors">{top.title}</div>
                                <div className="text-xs text-white/50 mt-1 flex items-center gap-1"><Eye className="w-3 h-3" /> {formatViews(top.views)}</div>
                              </div>
                            </Link>
                          )
                        })()}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  )
}
