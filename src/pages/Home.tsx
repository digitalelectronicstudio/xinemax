import { useMemo } from 'react'
import { useStore } from '../store/useStore'
import VideoCard from '../components/VideoCard'
import { motion } from 'framer-motion'
import { SlidersHorizontal, Sparkles } from 'lucide-react'

const categories = ["All", "Cinematography", "Technology", "Nature", "Drone 8K", "Trending", "Live"]

export default function Home() {
  const { videos, categoryFilter, setCategoryFilter, searchQuery } = useStore()

  const filtered = useMemo(() => {
    let v = [...videos]
    if (categoryFilter === "Trending") {
      v = [...v].sort((a, b) => b.views - a.views)
    } else if (categoryFilter === "Live") {
      // No live mock yet — intentionally empty to demo live tab
      v = v.filter(x => (x as any).isLive || x.tags.includes("Live"))
    } else if (categoryFilter === "Drone 8K") {
      v = v.filter(x => x.category === "Drone" || x.tags.includes("Drone") || x.tags.includes("8K") || x.category === "Nature" && x.tags.includes("8K"))
      // fallback: if no pure Drone category, keep 8K-heavy cinematography
      if (v.length === 0) v = videos.filter(x => x.tags.includes("8K"))
    } else if (categoryFilter !== "All") {
      v = v.filter(x => x.category === categoryFilter || x.tags.includes(categoryFilter))
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      v = v.filter(x =>
        x.title.toLowerCase().includes(q) ||
        x.description.toLowerCase().includes(q) ||
        x.channelName.toLowerCase().includes(q) ||
        x.tags.some(t => t.toLowerCase().includes(q))
      )
    }
    return v
  }, [videos, categoryFilter, searchQuery])

  return (
    <div className="flex-1 min-w-0">
      {/* Category bar */}
      <div className="sticky top-[56px] z-20 bg-[#06060a]/80 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="px-3 sm:px-4 lg:px-6 h-[48px] flex items-center gap-2 overflow-x-auto scrollbar-hide">
          <button className="shrink-0 w-9 h-8 rounded-full bg-white/10 flex items-center justify-center lg:hidden">
            <SlidersHorizontal className="w-4 h-4" />
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`shrink-0 h-8 px-4 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${categoryFilter===cat ? 'bg-white text-black' : 'bg-[#1c1c26] hover:bg-[#242430] text-white/80 border border-white/5'}`}
            >
              {cat}
            </button>
          ))}
          <div className="hidden lg:flex items-center gap-2 ml-auto pl-4 border-l border-white/10">
            <span className="text-xs text-white/40">Filtered</span>
            <span className="text-sm font-semibold">{filtered.length} videos</span>
          </div>
        </div>
      </div>

      {/* Hero cinematic banner - PS5 style */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#ff4d00]/20 via-transparent to-[#1c1c26]/50" />
        <div className="relative px-3 sm:px-4 lg:px-6 py-6 sm:py-8">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col lg:flex-row lg:items-end justify-between gap-4"
          >
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ff4d00] text-white text-xs font-bold tracking-widest">
                <Sparkles className="w-3.5 h-3.5" /> XINEMAX ORIGINAL • 8K CINEMATIC UNIVERSE
              </div>
              <h1 className="mt-3 text-[28px] sm:text-[36px] font-black tracking-[-0.04em] leading-none">
                Stories that<br />
                <span className="text-[#ff4d00]">deserve the big screen.</span>
              </h1>
              <p className="mt-3 text-sm sm:text-[15px] text-white/60 max-w-[560px] leading-relaxed">
                Drone epics, color science, and AI visuals — curated for filmmakers who shoot to feel. Hover any card to live the PS5 immersion.
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-3">
              <div className="text-right">
                <div className="text-xs tracking-widest font-bold text-white/40">NOW STREAMING</div>
                <div className="text-sm font-semibold">{videos.length} cinematic titles • 8K ready</div>
              </div>
              <div className="w-12 h-12 rounded-xl bg-white text-black flex items-center justify-center font-black text-xl">▶</div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Grid */}
      <div className="px-3 sm:px-4 lg:px-6 pb-10">
        {filtered.length === 0 ? (
          <div className="py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-white/30" />
            </div>
            <h3 className="font-semibold">No videos found</h3>
            <p className="text-sm text-white/50 mt-1">Try another category or search term.</p>
            <button onClick={() => setCategoryFilter("All")} className="mt-4 h-9 px-5 rounded-full bg-white text-black text-sm font-semibold">Clear filters</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 gap-4 sm:gap-5">
            {filtered.map((v, i) => (
              <VideoCard key={v.id} video={v} index={i} />
            ))}
          </div>
        )}

        {/* Footer hint */}
        <div className="mt-10 rounded-2xl border border-white/5 bg-[#14141c] p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#ff4d00]/15 flex items-center justify-center shrink-0">
              <span className="text-[#ff4d00] font-black">8K</span>
            </div>
            <div>
              <div className="font-semibold text-sm">PS5 Immersive Mode active</div>
              <div className="text-xs text-white/50">Hover or tap any card — the entire background breathes with that story.</div>
            </div>
          </div>
          <div className="text-xs text-white/30">Hardware-accelerated • 60 FPS • transform+opacity only</div>
        </div>
      </div>
    </div>
  )
}
