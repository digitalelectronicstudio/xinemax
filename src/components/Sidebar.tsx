import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { Home, Compass, Library, Clock, Flame, Film, Cpu, Leaf, Plane, Radio, Settings, HelpCircle, X, Crown, Sparkles, Mail, Shield, Zap, Smartphone } from 'lucide-react'
import { useStore } from '../store/useStore'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const categories = [
  { icon: Film, label: 'Cinematography', filter: 'Cinematography' },
  { icon: Cpu, label: 'Technology', filter: 'Technology' },
  { icon: Leaf, label: 'Nature', filter: 'Nature' },
  { icon: Plane, label: 'Drone 8K', filter: 'Drone 8K' },
  { icon: Flame, label: 'Trending', filter: 'Trending' },
  { icon: Radio, label: 'Live', filter: 'Live' },
]

export default function Sidebar({ collapsed, onClose }: { collapsed?: boolean, onClose?: () => void }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { categoryFilter, setCategoryFilter, setSearchQuery, setToast } = useStore()
  const [showPro, setShowPro] = useState(false)
  const [showHelp, setShowHelp] = useState(false)

  const handleNav = (label: string, to: string) => {
    onClose?.()
    if (label === 'Home') {
      setCategoryFilter('All')
      setSearchQuery('')
      navigate('/')
    } else if (label === 'Explore') {
      setCategoryFilter('All')
      setSearchQuery('')
      navigate('/')
      setToast('Explore — browsing all cinematic worlds')
      setTimeout(() => setToast(null), 2200)
    } else if (label === 'Subscriptions') {
      navigate('/subscriptions')
    } else if (label === 'History') {
      navigate('/history')
    } else {
      navigate(to)
    }
  }

  const handleCategory = (filter: string, label: string) => {
    setCategoryFilter(filter)
    setSearchQuery('')
    navigate('/')
    onClose?.()
    if (filter === 'Live') {
      setToast('Live — no live streams yet. Be first to go 8K live!')
      setTimeout(() => setToast(null), 2500)
    } else if (filter === 'Trending') {
      setToast('Trending — sorted by most views')
      setTimeout(() => setToast(null), 2000)
    } else {
      setToast(`Filtered: ${label}`)
      setTimeout(() => setToast(null), 1500)
    }
  }

  return (
    <>
      <aside className={`shrink-0 bg-[#0a0a0f] border-r border-white/[0.06] flex flex-col h-[calc(100vh-56px)] sticky top-[56px] overflow-y-auto scrollbar-hide ${collapsed ? 'w-[0] lg:w-[240px] overflow-hidden lg:overflow-y-auto' : 'w-[240px]'}`}>
        <div className="p-3 space-y-4">
          <nav className="space-y-1">
            <button
              onClick={() => handleNav('Home', '/')}
              className={`w-full flex items-center gap-3 px-3 h-9 rounded-xl text-sm font-medium transition-colors text-left ${location.pathname === '/' && categoryFilter === 'All' ? 'bg-white text-black' : 'hover:bg-white/10 text-white/80 hover:text-white'}`}
            >
              <Home className="w-5 h-5 shrink-0" />
              <span>Home</span>
            </button>

            <NavLink
              to="/shorts"
              onClick={onClose}
              className={({ isActive }) => `flex items-center gap-3 px-3 h-9 rounded-xl text-sm font-medium transition-colors ${isActive ? 'bg-white text-black' : 'hover:bg-white/10 text-white/80 hover:text-white'}`}
            >
              <Smartphone className="w-5 h-5 shrink-0" />
              <span>Shorts</span>
              <span className="ml-auto text-[10px] font-bold bg-[#ff4d00] text-white px-1.5 py-0.5 rounded-full">9:16</span>
            </NavLink>

            <button
              onClick={() => handleNav('Explore', '/')}
              className="w-full flex items-center gap-3 px-3 h-9 rounded-xl text-sm font-medium hover:bg-white/10 text-white/80 hover:text-white text-left transition-colors"
            >
              <Compass className="w-5 h-5 shrink-0" />
              <span>Explore</span>
            </button>

            <NavLink
              to="/subscriptions"
              onClick={onClose}
              className={({ isActive }) => `flex items-center gap-3 px-3 h-9 rounded-xl text-sm font-medium transition-colors ${isActive ? 'bg-white text-black' : 'hover:bg-white/10 text-white/80 hover:text-white'}`}
            >
              <Library className="w-5 h-5 shrink-0" />
              <span>Subscriptions</span>
              <span className="ml-auto text-[10px] font-bold bg-[#ff4d00] text-white px-1.5 py-0.5 rounded-full">NEW</span>
            </NavLink>

            <NavLink
              to="/history"
              onClick={onClose}
              className={({ isActive }) => `flex items-center gap-3 px-3 h-9 rounded-xl text-sm font-medium transition-colors ${isActive ? 'bg-white text-black' : 'hover:bg-white/10 text-white/80 hover:text-white'}`}
            >
              <Clock className="w-5 h-5 shrink-0" />
              <span>History</span>
            </NavLink>

            <NavLink
              to="/settings"
              onClick={onClose}
              className={({ isActive }) => `flex items-center gap-3 px-3 h-9 rounded-xl text-sm font-medium transition-colors ${isActive ? 'bg-white text-black' : 'hover:bg-white/10 text-white/80 hover:text-white'}`}
            >
              <Settings className="w-5 h-5 shrink-0" />
              <span>Settings</span>
            </NavLink>
          </nav>

          <div className="h-px bg-white/5" />

          <div>
            <div className="px-3 py-2 text-[11px] tracking-widest font-bold text-white/30">EXPLORE</div>
            <div className="space-y-1">
              {categories.map(c => {
                const active = categoryFilter === c.filter
                return (
                  <button
                    key={c.label}
                    onClick={() => handleCategory(c.filter, c.label)}
                    className={`w-full flex items-center gap-3 px-3 h-9 rounded-xl text-sm text-left transition-colors ${active ? 'bg-white text-black font-semibold' : 'hover:bg-white/10 text-white/70 hover:text-white'}`}
                  >
                    <c.icon className="w-5 h-5 shrink-0" />
                    <span>{c.label}</span>
                    {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#ff4d00]" />}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="h-px bg-white/5" />

          <div className="px-3 py-3 rounded-xl bg-gradient-to-br from-[#ff4d00] to-[#ff8a00] text-white relative overflow-hidden">
            <div className="absolute -right-6 -top-6 w-20 h-20 bg-white/15 rounded-full blur-xl" />
            <div className="relative">
              <div className="flex items-center gap-1.5 text-sm font-black leading-tight"><Crown className="w-4 h-4" /> Go 8K Cinematic</div>
              <div className="text-xs opacity-90 mt-1 leading-snug">Unlock drone LUTs + raw workflow. 7-day free trial.</div>
              <button onClick={() => setShowPro(true)} className="mt-3 h-8 px-4 rounded-full bg-white text-black text-xs font-bold hover:bg-white/90 transition-colors">Try Pro</button>
            </div>
          </div>

          <div className="pt-2 space-y-1 pb-6">
            <NavLink
              to="/settings"
              onClick={onClose}
              className={({ isActive }) => `w-full flex items-center gap-3 px-3 h-8 rounded-xl text-sm transition-colors ${isActive ? 'bg-white text-black' : 'hover:bg-white/10 text-white/60 hover:text-white'}`}
            >
              <Settings className="w-4 h-4" /> Settings
            </NavLink>
            <button onClick={() => setShowHelp(true)} className="w-full flex items-center gap-3 px-3 h-8 rounded-xl hover:bg-white/10 text-sm text-white/60 hover:text-white transition-colors text-left">
              <HelpCircle className="w-4 h-4" /> Help
            </button>
            <div className="px-3 pt-3 text-[11px] leading-relaxed text-white/25">
              © 2026 Xinemax LLC<br />Cinematic universe • Made for creators
            </div>
          </div>
        </div>
      </aside>

      {/* PRO MODAL */}
      <AnimatePresence>
        {showPro && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setShowPro(false)}>
            <motion.div initial={{ scale: 0.96, y: 12 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, y: 12 }} onClick={e => e.stopPropagation()} className="w-full max-w-[480px] rounded-[20px] bg-[#14141c] border border-white/10 overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-[#ff4d00] to-[#ff8a00]" />
              <div className="p-6">
                <div className="flex justify-between items-start">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#ff4d00] to-[#ff8a00] flex items-center justify-center"><Crown className="w-5 h-5 text-white" /></div>
                  <button onClick={() => setShowPro(false)} className="p-2 hover:bg-white/10 rounded-full"><X className="w-5 h-5" /></button>
                </div>
                <h3 className="text-xl font-black mt-4">Xinemax Pro — 8K Cinematic</h3>
                <p className="text-sm text-white/60 mt-2">Everything you need to shoot, grade and deliver in 8K. Cancel anytime.</p>
                <div className="mt-5 space-y-2.5 text-sm">
                  <div className="flex items-center gap-2.5 p-3 rounded-xl bg-[#1c1c26] border border-white/5"><Zap className="w-4 h-4 text-[#ff4d00]" /> Drone LUT pack (120+ Kodak, Arri, DJI profiles)</div>
                  <div className="flex items-center gap-2.5 p-3 rounded-xl bg-[#1c1c26] border border-white/5"><Shield className="w-4 h-4 text-emerald-400" /> Raw workflow + 8K proxy presets</div>
                  <div className="flex items-center gap-2.5 p-3 rounded-xl bg-[#1c1c26] border border-white/5"><Sparkles className="w-4 h-4 text-violet-400" /> Priority transcoding — no CORS limits</div>
                </div>
                <div className="flex items-baseline gap-2 mt-6">
                  <span className="text-2xl font-black">$12</span><span className="text-sm text-white/50">/month · 7-day free trial</span>
                </div>
                <button onClick={() => { setShowPro(false); setToast('Pro trial activated — welcome to 8K! 🚀'); setTimeout(() => setToast(null), 2500) }} className="w-full mt-5 h-11 rounded-full bg-[#ff4d00] hover:bg-[#ff6a2b] font-bold">Start 7-day free trial</button>
                <div className="text-center text-xs text-white/30 mt-3">Sandbox demo — no payment required</div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HELP MODAL */}
      <AnimatePresence>
        {showHelp && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setShowHelp(false)}>
            <motion.div initial={{ scale: 0.96, y: 12 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, y: 12 }} onClick={e => e.stopPropagation()} className="w-full max-w-[500px] rounded-[20px] bg-[#14141c] border border-white/10 overflow-hidden">
              <div className="p-6">
                <div className="flex justify-between items-start">
                  <h3 className="text-lg font-black flex items-center gap-2"><HelpCircle className="w-5 h-5" /> Help & Shortcuts</h3>
                  <button onClick={() => setShowHelp(false)} className="p-2 hover:bg-white/10 rounded-full"><X className="w-5 h-5" /></button>
                </div>
                <div className="mt-5 grid grid-cols-1 gap-3 text-sm">
                  <div className="p-3 rounded-xl bg-[#1c1c26] border border-white/5"><span className="font-bold text-[#ff4d00]">Hover any card</span> → immersive blurred backdrop (PS5 effect, 500ms).</div>
                  <div className="p-3 rounded-xl bg-[#1c1c26] border border-white/5"><span className="font-bold">Create Video</span> → pick local file (ObjectURL, no CORS) or paste MP4 URL. Blank = Big Buck Bunny fallback.</div>
                  <div className="p-3 rounded-xl bg-[#1c1c26] border border-white/5"><span className="font-bold">Shorts</span> → vertical 9:16 snap-scroll, auto thumbnail at 1s via canvas.</div>
                  <div className="p-3 rounded-xl bg-[#1c1c26] border border-white/5"><span className="font-bold">Settings</span> → Profile, Themes (Cinematic/AMOLED/Cyberpunk), Player, Privacy & Creator Reset.</div>
                  <div className="p-3 rounded-xl bg-[#1c1c26] border border-white/5 flex items-center gap-2"><Mail className="w-4 h-4" /> support@xinemax.local — sandbox demo, no real email.</div>
                </div>
                <button onClick={() => setShowHelp(false)} className="w-full mt-5 h-10 rounded-full bg-[#ff4d00] hover:bg-[#ff6a2b] font-bold">Got it</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
