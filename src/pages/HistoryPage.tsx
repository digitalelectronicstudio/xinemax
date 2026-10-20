import { Link } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { Clock, Trash2, Play, Eye, Sparkles } from 'lucide-react'
import { formatViews, formatTimeAgo } from '../utils/format'
import { motion } from 'framer-motion'

export default function HistoryPage() {
  const { watchHistory, videos, clearHistory, setToast } = useStore()
  const historyVideos = watchHistory.map(id => videos.find(v => v.id === id)).filter(Boolean) as typeof videos

  const handleClear = () => {
    if (confirm('Clear watch history?')) {
      clearHistory()
      setToast('History cleared')
      setTimeout(() => setToast(null), 2000)
    }
  }

  return (
    <div className="flex-1 min-w-0">
      <div className="max-w-[1000px] mx-auto px-3 sm:px-6 py-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 text-[11px] tracking-widest font-bold text-[#ff4d00]"><Clock className="w-3.5 h-3.5" /> WATCH HISTORY</div>
            <h1 className="text-[28px] font-black tracking-tight mt-1">History</h1>
            <p className="text-sm text-white/50 mt-1">Videos you’ve watched — tracked locally via Zustand + LocalStorage</p>
          </div>
          {historyVideos.length > 0 && (
            <button onClick={handleClear} className="h-9 px-4 rounded-full border border-white/10 hover:bg-white/10 flex items-center gap-2 text-sm font-medium">
              <Trash2 className="w-4 h-4" /> Clear history
            </button>
          )}
        </div>

        {historyVideos.length === 0 ? (
          <div className="mt-10 py-16 text-center rounded-[20px] bg-[#14141c] border border-white/5">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto"><Play className="w-8 h-8 text-white/30" /></div>
            <h3 className="font-bold mt-4">No history yet</h3>
            <p className="text-sm text-white/50 mt-1 max-w-md mx-auto">Watch a video — it will appear here instantly. History survives reloads via LocalStorage.</p>
            <Link to="/" className="inline-flex mt-6 h-10 px-6 rounded-full bg-[#ff4d00] hover:bg-[#ff6a2b] items-center font-bold text-sm">Browse videos</Link>
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            {historyVideos.map((v, i) => (
              <motion.div key={v.id + i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="group flex gap-3 sm:gap-4 p-3 rounded-xl bg-[#14141c] border border-white/5 hover:border-[#ff4d00]/20 transition-colors">
                <Link to={`/watch/${v.id}`} className="relative w-[160px] sm:w-[220px] aspect-video rounded-lg overflow-hidden bg-black shrink-0">
                  <img src={v.thumbnail} alt={v.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute bottom-1 right-1 px-1 py-0.5 rounded bg-black/80 text-[11px] font-medium">{v.duration}</div>
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center"><div className="w-0 h-0 border-l-[10px] border-l-black border-y-[6px] border-y-transparent ml-0.5" /></div>
                  </div>
                </Link>
                <div className="flex-1 min-w-0 py-1">
                  <Link to={`/watch/${v.id}`} className="font-semibold text-sm sm:text-[15px] leading-tight line-clamp-2 group-hover:text-[#ff8a00] transition-colors">{v.title}</Link>
                  <div className="text-xs sm:text-sm text-white/60 mt-1">{v.channelName} • {v.channelHandle}</div>
                  <div className="flex items-center gap-2 text-xs text-white/40 mt-1">
                    <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {formatViews(v.views)} views</span>
                    <span>•</span>
                    <span>{formatTimeAgo(v.uploadDate)}</span>
                    <span className="hidden sm:inline-flex ml-2 px-2 py-0.5 rounded-full bg-white/10 text-white/60 text-[11px]">{v.category}</span>
                  </div>
                  <div className="hidden sm:block text-xs text-white/50 mt-2 line-clamp-1">{v.description.slice(0, 120)}…</div>
                </div>
              </motion.div>
            ))}
            <div className="flex items-center gap-2 text-xs text-white/30 pt-4"><Sparkles className="w-3 h-3" /> {historyVideos.length} videos in history • newest first</div>
          </div>
        )}
      </div>
    </div>
  )
}
