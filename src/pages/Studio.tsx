import { useStore } from '../store/useStore'
import { formatViews, formatTimeAgo } from '../utils/format'
import { Eye, Clock, DollarSign, Users, Trash2, Archive, TrendingUp, Video, Download, Sparkles, BarChart3, Play } from 'lucide-react'
import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import CreateVideoModal from '../components/CreateVideoModal'
import { Link } from 'react-router-dom'

export default function Studio() {
  const { currentUser, videos, users, deleteVideo } = useStore()
  const [showCreate, setShowCreate] = useState(false)
  const [archived, setArchived] = useState<Set<string>>(new Set())

  const myVideos = useMemo(() => {
    if (!currentUser) return []
    return videos.filter(v => v.channelId === currentUser.id)
  }, [videos, currentUser])

  const stats = useMemo(() => {
    const totalViews = myVideos.reduce((a, v) => a + v.views, 0)
    const totalWatchHours = myVideos.reduce((a, v) => a + (v.views * (parseFloat(v.duration.split(':')[0]) || 5) / 60), 0) // approx
    // more accurate: using watchTimeMinutes * views /60
    const watchHoursPrecise = myVideos.reduce((a, v) => a + ((v.watchTimeMinutes || 5) * v.views / 60), 0)
    const totalLikes = myVideos.reduce((a, v) => a + v.likes, 0)
    const subs = users.find(u => u.id === currentUser?.id)?.subscribers ?? 0
    const revenue = totalViews * 0.0032 // $3.2 CPM estimate
    return { totalViews, watchHours: Math.round(watchHoursPrecise), totalLikes, subs, revenue }
  }, [myVideos, users, currentUser])

  const chartData = myVideos.map(v => ({
    name: v.title.slice(0, 18) + (v.title.length > 18 ? '…' : ''),
    views: v.views,
    likes: v.likes,
  }))

  const handleDelete = (id: string) => {
    if (confirm("Delete this video? This cannot be undone in this session.")) {
      deleteVideo(id)
    }
  }
  const toggleArchive = (id: string) => {
    setArchived(prev => {
      const n = new Set(prev)
      if (n.has(id)) n.delete(id); else n.add(id)
      return n
    })
  }

  const handleExport = () => {
    const data = JSON.stringify({ videos: myVideos, exportedAt: new Date().toISOString(), user: currentUser }, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `xinemax-${currentUser?.handle || 'export'}-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (!currentUser) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-20 px-6 text-center">
        <div className="w-16 h-16 rounded-full bg-[#ff4d00]/15 flex items-center justify-center mb-4">
          <BarChart3 className="w-8 h-8 text-[#ff4d00]" />
        </div>
        <h2 className="text-xl font-black">Creator Studio locked</h2>
        <p className="text-sm text-white/50 mt-2 max-w-md">Sign in to access analytics, manage videos, and publish. Your dashboard is LocalStorage-persisted and ready.</p>
      </div>
    )
  }

  return (
    <div className="flex-1 min-w-0">
      <div className="max-w-[1400px] mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 text-[11px] tracking-widest font-bold text-[#ff4d00]">
              <Sparkles className="w-3.5 h-3.5" /> CREATOR STUDIO
            </div>
            <h1 className="text-[28px] font-black tracking-tight leading-none mt-1">Welcome back, {currentUser.username.split(' ')[0]}</h1>
            <p className="text-sm text-white/50 mt-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Live analytics • Last updated just now
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={handleExport} className="h-10 px-4 rounded-full border border-white/10 hover:bg-white/10 flex items-center gap-2 text-sm font-medium">
              <Download className="w-4 h-4" /> Export JSON
            </button>
            <button onClick={() => setShowCreate(true)} className="h-10 px-5 rounded-full bg-[#ff4d00] hover:bg-[#ff6a2b] flex items-center gap-2 text-sm font-bold">
              <Video className="w-4 h-4" /> Create Video
            </button>
          </div>
        </div>

        {/* Banner channel */}
        <div className="mt-6 rounded-[16px] overflow-hidden border border-white/10 bg-[#14141c]">
          <div className="h-[140px] sm:h-[180px] relative">
            <img src={currentUser.banner || "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=400&fit=crop"} alt="banner" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#14141c] via-transparent to-transparent" />
            <div className="absolute bottom-4 left-4 sm:left-6 flex items-end gap-4">
              <img src={currentUser.avatar} alt={currentUser.username} className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-4 border-[#14141c] shadow-xl" />
              <div className="pb-1">
                <div className="font-black text-lg flex items-center gap-2">
                  {currentUser.username} {currentUser.verified && <span className="w-4 h-4 rounded-full bg-white text-black flex items-center justify-center text-xs">✓</span>}
                </div>
                <div className="text-sm text-white/60">{currentUser.handle} • {formatViews(currentUser.subscribers)} subscribers • {myVideos.length} videos</div>
              </div>
            </div>
          </div>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="rounded-[16px] bg-[#14141c] border border-white/5 p-5">
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl bg-[#ff4d00]/15 flex items-center justify-center"><Eye className="w-4 h-4 text-[#ff4d00]" /></div>
              <span className="text-xs font-bold tracking-wide text-emerald-400 flex items-center gap-1"><TrendingUp className="w-3 h-3" /> +12.4%</span>
            </div>
            <div className="text-2xl font-black mt-3">{formatViews(stats.totalViews)}</div>
            <div className="text-xs tracking-widest font-bold text-white/40 mt-1">TOTAL VIEWS</div>
            <div className="text-xs text-white/50 mt-2">Across {myVideos.length} uploads</div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-[16px] bg-[#14141c] border border-white/5 p-5">
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl bg-blue-500/15 flex items-center justify-center"><Clock className="w-4 h-4 text-blue-400" /></div>
              <span className="text-xs font-bold tracking-wide text-emerald-400 flex items-center gap-1"><TrendingUp className="w-3 h-3" /> +8.1%</span>
            </div>
            <div className="text-2xl font-black mt-3">{stats.watchHours.toLocaleString()}h</div>
            <div className="text-xs tracking-widest font-bold text-white/40 mt-1">WATCH TIME</div>
            <div className="text-xs text-white/50 mt-2">Est. hours watched</div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="rounded-[16px] bg-[#14141c] border border-white/5 p-5">
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl bg-violet-500/15 flex items-center justify-center"><Users className="w-4 h-4 text-violet-400" /></div>
              <span className="text-xs font-bold tracking-wide text-emerald-400 flex items-center gap-1"><TrendingUp className="w-3 h-3" /> +2.3%</span>
            </div>
            <div className="text-2xl font-black mt-3">{formatViews(stats.subs)}</div>
            <div className="text-xs tracking-widest font-bold text-white/40 mt-1">SUBSCRIBERS</div>
            <div className="text-xs text-white/50 mt-2">Channel growth</div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-[16px] bg-gradient-to-br from-[#ff4d00] to-[#ff8a00] p-5 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10" />
            <div className="relative">
              <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center"><DollarSign className="w-4 h-4 text-white" /></div>
              <div className="text-2xl font-black mt-3">${stats.revenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
              <div className="text-xs tracking-widest font-bold text-white/80 mt-1">EST. REVENUE</div>
              <div className="text-xs text-white/80 mt-2">~$3.20 CPM • Xinemax Partner</div>
            </div>
          </motion.div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-6">
          <div className="lg:col-span-2 rounded-[16px] bg-[#14141c] border border-white/5 p-5">
            <h3 className="font-bold flex items-center gap-2"><BarChart3 className="w-4 h-4 text-[#ff4d00]" /> Views per video</h3>
            <p className="text-xs text-white/40">Performance of your uploads</p>
            <div className="h-[260px] mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ff4d00" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#ff4d00" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} axisLine={false} tickLine={false} interval={0} angle={-12} dy={10} height={50} />
                  <YAxis tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v)=> formatViews(v)} />
                  <Tooltip
                    contentStyle={{ background: '#1c1c26', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, color: '#fff' }}
                    formatter={(value: any)=> [formatViews(value as number), 'Views']}
                  />
                  <Area type="monotone" dataKey="views" stroke="#ff4d00" strokeWidth={2.5} fill="url(#colorViews)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="rounded-[16px] bg-[#14141c] border border-white/5 p-5">
            <h3 className="font-bold flex items-center gap-2"><TrendingUp className="w-4 h-4 text-emerald-400" /> Engagement</h3>
            <p className="text-xs text-white/40">Likes vs views</p>
            <div className="h-[260px] mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }} axisLine={false} tickLine={false} interval={0} angle={-12} dy={10} height={50} />
                  <YAxis tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: '#1c1c26', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12 }} />
                  <Bar dataKey="likes" fill="#ff4d00" radius={[6,6,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Manage videos */}
        <div className="mt-6 rounded-[16px] bg-[#14141c] border border-white/5 overflow-hidden">
          <div className="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5">
            <div>
              <h3 className="font-bold flex items-center gap-2"><Video className="w-4 h-4" /> Manage Videos</h3>
              <p className="text-xs text-white/40">{myVideos.length} uploads • Includes archived items</p>
            </div>
            <div className="text-xs text-white/30 hidden sm:block">Delete or archive • Changes persist in LocalStorage</div>
          </div>

          {myVideos.length === 0 ? (
            <div className="py-16 text-center px-6">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                <Play className="w-8 h-8 text-white/30" />
              </div>
              <h4 className="font-bold">No videos yet</h4>
              <p className="text-sm text-white/50 mt-1">Your cinematic journey starts with one upload.</p>
              <button onClick={() => setShowCreate(true)} className="mt-4 h-10 px-6 rounded-full bg-[#ff4d00] hover:bg-[#ff6a2b] font-semibold text-sm">Create your first video</button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-[#0a0a0f]/50">
                  <tr className="text-[11px] tracking-widest font-bold text-white/40">
                    <th className="px-5 py-3 font-bold">VIDEO</th>
                    <th className="px-3 py-3 font-bold hidden md:table-cell">VIEWS</th>
                    <th className="px-3 py-3 font-bold hidden lg:table-cell">LIKES</th>
                    <th className="px-3 py-3 font-bold hidden sm:table-cell">DATE</th>
                    <th className="px-5 py-3 font-bold text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {myVideos.map(v => (
                    <tr key={v.id} className={`group hover:bg-white/[0.03] transition-colors ${archived.has(v.id) ? 'opacity-50' : ''}`}>
                      <td className="px-5 py-4">
                        <div className="flex gap-3">
                          <Link to={`/watch/${v.id}`} className="relative w-[120px] aspect-video rounded-lg overflow-hidden bg-black shrink-0 border border-white/5">
                            <img src={v.thumbnail} alt={v.title} className="w-full h-full object-cover" />
                            <div className="absolute bottom-1 right-1 px-1 py-0.5 rounded bg-black/80 text-[10px] font-medium">{v.duration}</div>
                            {archived.has(v.id) && <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-[10px] font-bold tracking-widest">ARCHIVED</div>}
                          </Link>
                          <div className="min-w-0">
                            <Link to={`/watch/${v.id}`} className="font-semibold text-sm leading-tight line-clamp-2 hover:text-[#ff8a00] transition-colors">{v.title}</Link>
                            <div className="text-xs text-white/40 mt-1 flex items-center gap-1.5">
                              <span className="px-1.5 py-0.5 rounded bg-white/10 text-white/60 text-[11px]">{v.category}</span>
                              <span className="hidden sm:inline">• {formatTimeAgo(v.uploadDate)}</span>
                            </div>
                            <div className="flex md:hidden gap-3 mt-1 text-xs text-white/50">
                              <span>{formatViews(v.views)} views</span>
                              <span>{formatViews(v.likes)} likes</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-4 hidden md:table-cell text-sm font-medium">{formatViews(v.views)}</td>
                      <td className="px-3 py-4 hidden lg:table-cell text-sm text-white/70">{formatViews(v.likes)}</td>
                      <td className="px-3 py-4 hidden sm:table-cell text-sm text-white/50">{formatTimeAgo(v.uploadDate)}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => toggleArchive(v.id)}
                            className={`h-8 px-3 rounded-full border text-xs font-semibold flex items-center gap-1.5 ${archived.has(v.id) ? 'bg-white text-black border-white' : 'border-white/10 hover:bg-white/10 text-white/70'}`}
                          >
                            <Archive className="w-3.5 h-3.5" /> {archived.has(v.id) ? 'Unarchive' : 'Archive'}
                          </button>
                          <button
                            onClick={() => handleDelete(v.id)}
                            className="w-8 h-8 rounded-full bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 flex items-center justify-center"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4 text-red-400" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="mt-6 rounded-xl bg-[#ff4d00]/10 border border-[#ff4d00]/20 p-4 flex gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#ff4d00] flex items-center justify-center shrink-0">◉</div>
          <div className="text-sm leading-relaxed text-white/80">
            <span className="font-bold text-white">Pro tip:</span> All Studio actions mutate the global Zustand store and persist to <span className="font-mono text-[#ff8a00]">localStorage</span>. If you rebuild the sandbox container, export your JSON first — then re-import by staying on this branch.
          </div>
        </div>
      </div>

      {showCreate && <CreateVideoModal onClose={()=>setShowCreate(false)} onCreated={()=> setShowCreate(false)} />}
    </div>
  )
}
