import { Link } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { Library, Users, Play, Bell } from 'lucide-react'
import { formatViews } from '../utils/format'
import VideoCard from '../components/VideoCard'

export default function SubscriptionsPage() {
  const { subscriptions, videos, users, currentUser, settings } = useStore()
  const subVideos = videos.filter(v => subscriptions.includes(v.channelId))
  const subChannels = users.filter(u => subscriptions.includes(u.id))

  return (
    <div className="flex-1 min-w-0">
      <div className="max-w-[1400px] mx-auto px-3 sm:px-6 py-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 text-[11px] tracking-widest font-bold text-[#ff4d00]"><Library className="w-3.5 h-3.5" /> SUBSCRIPTIONS</div>
            <h1 className="text-[28px] font-black tracking-tight mt-1">Subscriptions</h1>
            <p className="text-sm text-white/50 mt-1">
              {currentUser ? `Hi ${currentUser.username.split(' ')[0]} — videos from channels you follow` : 'Track your favorite creators'}
              {subscriptions.length > 0 && <span className="ml-2 text-white/30">• {subscriptions.length} channel{subscriptions.length>1?'s':''}</span>}
            </p>
          </div>
          <Link to="/" className="h-9 px-4 rounded-full bg-white text-black hover:bg-white/90 flex items-center gap-2 text-sm font-bold">
            <Play className="w-4 h-4" /> Discover creators
          </Link>
        </div>

        {settings.privateSubscriptions ? (
          <div className="mt-10 py-16 text-center rounded-[20px] bg-[#14141c] border border-white/5">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto"><Users className="w-8 h-8 text-white/30" /></div>
            <h3 className="font-bold mt-4">Subscriptions are private</h3>
            <p className="text-sm text-white/50 mt-1 max-w-md mx-auto">You've set subscriptions to private in <span className="text-white font-semibold">Settings → Privacy</span>. Only you can see them — disable the toggle to make them public again.</p>
            <Link to="/settings" className="inline-flex mt-6 h-10 px-6 rounded-full bg-white text-black hover:bg-white/90 items-center gap-2 font-bold text-sm">Open Settings</Link>
          </div>
        ) : (
          <>
            {subChannels.length > 0 && (
              <div className="mt-6 flex gap-3 overflow-x-auto scrollbar-hide pb-2">
                {subChannels.map(ch => (
                  <div key={ch.id} className="shrink-0 w-[140px] p-3 rounded-xl bg-[#14141c] border border-white/5 flex flex-col items-center text-center">
                    <img src={ch.avatar} alt={ch.username} className="w-14 h-14 rounded-full object-cover border border-white/10" />
                    <div className="font-semibold text-sm mt-2 line-clamp-1">{ch.username}</div>
                    <div className="text-xs text-white/50">{formatViews(ch.subscribers)} subs</div>
                    <div className="mt-2 w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  </div>
                ))}
              </div>
            )}

            {subVideos.length === 0 ? (
              <div className="mt-10 py-16 text-center rounded-[20px] bg-[#14141c] border border-white/5">
                <div className="w-16 h-16 rounded-full bg-[#ff4d00]/15 flex items-center justify-center mx-auto"><Bell className="w-8 h-8 text-[#ff4d00]" /></div>
                <h3 className="font-bold mt-4">No subscriptions yet</h3>
                <p className="text-sm text-white/50 mt-1 max-w-md mx-auto">Hit <span className="text-white font-semibold">Subscribe</span> on any video. Your feed will appear here instantly and persist via LocalStorage.</p>
                <div className="mt-6 flex flex-wrap justify-center gap-2">
                  {users.slice(0,4).map(u => (
                    <div key={u.id} className="flex items-center gap-2 px-3 py-2 rounded-full bg-[#1c1c26] border border-white/5">
                      <img src={u.avatar} className="w-6 h-6 rounded-full" alt={u.username} />
                      <span className="text-sm font-medium">{u.username}</span>
                      <span className="text-xs text-white/40">• {formatViews(u.subscribers)}</span>
                    </div>
                  ))}
                </div>
                <Link to="/" className="inline-flex mt-6 h-10 px-6 rounded-full bg-[#ff4d00] hover:bg-[#ff6a2b] items-center gap-2 font-bold text-sm"><Library className="w-4 h-4" /> Browse home</Link>
              </div>
            ) : (
              <>
                <div className="mt-6 flex items-center gap-2 text-sm">
                  <span className="w-2 h-2 rounded-full bg-[#ff4d00] animate-pulse" />
                  <span className="font-semibold">{subVideos.length} videos from your subscriptions</span>
                  <span className="text-white/30 hidden sm:inline">• sorted by newest</span>
                </div>
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
                  {subVideos.map((v, i) => (
                    <VideoCard key={v.id} video={v} index={i} />
                  ))}
                </div>
              </>
            )}
          </>
        )}

        <div className="mt-8 p-4 rounded-xl bg-[#1c1c26] border border-white/5 flex gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#ff4d00] flex items-center justify-center shrink-0"><Users className="w-4 h-4 text-white" /></div>
          <div className="text-xs leading-relaxed text-white/70">
            <span className="font-bold text-white">How subscriptions work:</span> Click Subscribe on any video page — count updates globally via Zustand. Data syncs to <span className="font-mono text-[#ff8a00]">secure storage</span>. Unsubscribe toggles back instantly.
          </div>
        </div>
      </div>
    </div>
  )
}
