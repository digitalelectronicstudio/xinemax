import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Video as VideoIcon, Eye, Clock } from 'lucide-react'
import { Video } from '../types'
import { formatViews, formatTimeAgo } from '../utils/format'
import { useStore } from '../store/useStore'

export default function VideoCard({ video, index }: { video: Video, index: number }) {
  const setHovered = useStore(s => s.setHoveredVideoId)

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.4, ease: "easeOut" }}
      onHoverStart={() => setHovered(video.id)}
      onHoverEnd={() => setHovered(null)}
      onFocus={() => setHovered(video.id)}
      onBlur={() => setHovered(null)}
      onTouchStart={() => setHovered(video.id)}
      onTouchEnd={() => setTimeout(() => setHovered(null), 800)}
      onMouseEnter={() => setHovered(video.id)}
      onMouseLeave={() => setHovered(null)}
      className="group relative gpu"
      tabIndex={0}
    >
      <Link to={`/watch/${video.id}`} className="block">
        {/* Card shell with glow */}
        <div className="relative rounded-[16px] overflow-hidden bg-[#14141c] border border-white/[0.06] transition-all duration-300 ease-out group-hover:border-[#ff4d00]/40 group-hover:shadow-[0_0_0_1px_rgba(255,77,0,0.3),0_12px_40px_rgba(255,77,0,0.15),0_4px_20px_rgba(0,0,0,0.5)] group-hover:scale-[1.02] group-hover:z-10 group-focus-visible:border-[#ff4d00]/40 group-focus-visible:shadow-[0_0_0_1px_rgba(255,77,0,0.3),0_12px_40px_rgba(255,77,0,0.15)] group-focus-visible:scale-[1.02] will-change-transform">
          {/* thumbnail */}
          <div className="relative aspect-video overflow-hidden bg-[#0a0a0f]">
            <img
              src={video.thumbnail}
              alt={video.title}
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 will-change-transform"
              onError={(e) => {
                (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${video.id}/640/360`
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-transparent opacity-60" />
            <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/80 backdrop-blur text-[11px] font-medium tracking-wide flex items-center gap-1">
              <Clock className="w-3 h-3 opacity-70" /> {video.duration}
            </div>
            <div className="absolute top-2 left-2 flex gap-1.5">
              {video.tags?.slice(0,2).map(tag => (
                <span key={tag} className="px-1.5 py-0.5 rounded-full bg-[#ff4d00] text-[10px] font-bold tracking-wide text-white">
                  {tag.toUpperCase()}
                </span>
              ))}
            </div>
            {/* play hint */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="w-12 h-12 rounded-full bg-white/90 backdrop-blur flex items-center justify-center shadow-xl scale-90 group-hover:scale-100 transition-transform duration-300">
                <div className="w-0 h-0 border-l-[14px] border-l-black border-y-[8px] border-y-transparent ml-1" />
              </div>
            </div>
          </div>

          {/* content — cinematic reveal: slide up + fade */}
          <div className="p-3 sm:p-3.5">
            <div className="flex gap-3">
              <Link
                to={`/channel/${video.channelId}`}
                onClick={e => e.stopPropagation()}
                className="shrink-0"
              >
                <img
                  src={video.channelAvatar}
                  alt={video.channelName}
                  className="w-9 h-9 rounded-full object-cover mt-0.5 border border-white/10 hover:border-[#ff4d00]/40 transition-colors"
                  onError={(e) => (e.target as HTMLImageElement).src = `https://i.pravatar.cc/150?u=${video.channelId}`}
                />
              </Link>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-[14px] leading-[1.35] line-clamp-2 group-hover:text-white transition-colors">
                  {video.title}
                </h3>

                {/* Reveal meta on hover: opacity 0 -> 1 + translateY */}
                <div className="mt-1.5 space-y-0.5 transition-all duration-300 ease-out opacity-70 group-hover:opacity-100 translate-y-0 group-hover:translate-y-0">
                  <Link
                    to={`/channel/${video.channelId}`}
                    onClick={e => e.stopPropagation()}
                    className="flex items-center gap-1.5 text-[13px] text-white/60 hover:text-white group/channel transition-colors w-fit"
                  >
                    <span className="truncate group-hover/channel:underline">{video.channelName}</span>
                    {(video.channelId === 'u_elena' || video.channelId === 'u_marcus') && (
                      <span className="w-3.5 h-3.5 rounded-full bg-white text-black flex items-center justify-center text-[9px] font-bold shrink-0">✓</span>
                    )}
                  </Link>
                  <div className="flex items-center gap-1.5 text-xs text-white/40 group-hover:text-white/60 transition-colors">
                    <Eye className="w-3 h-3" />
                    <span>{formatViews(video.views)} views</span>
                    <span className="w-1 h-1 rounded-full bg-white/30" />
                    <span>{formatTimeAgo(video.uploadDate)}</span>
                  </div>
                </div>

                {/* extra reveal: tags / category slide up */}
                <div className="hidden sm:flex items-center gap-1.5 mt-2 opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 ease-out delay-75">
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/10 border border-white/10 text-white/70">
                    {video.category}
                  </span>
                  <span className="text-[11px] text-white/30 flex items-center gap-1">
                    <VideoIcon className="w-3 h-3" /> {video.channelHandle}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
