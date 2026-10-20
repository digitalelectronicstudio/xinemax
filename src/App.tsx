import { useState, useEffect } from 'react'
import { Routes, Route, useLocation, Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import Header from './components/Header'
import Sidebar from './components/Sidebar'
import Home from './pages/Home'
import VideoPage from './pages/VideoPage'
import Studio from './pages/Studio'
import HistoryPage from './pages/HistoryPage'
import SubscriptionsPage from './pages/SubscriptionsPage'
import ChannelPage from './pages/ChannelPage'
import { useStore } from './store/useStore'
import { Home as HomeIcon, LayoutDashboard } from 'lucide-react'

function ImmersiveBackground() {
  const hoveredVideoId = useStore(s => s.hoveredVideoId)
  const videos = useStore(s => s.videos)
  const hovered = videos.find(v => v.id === hoveredVideoId)

  // default ambient gradient when nothing hovered
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* base dark */}
      <div className="absolute inset-0 bg-[#06060a]" />
      {/* ambient orbs */}
      <div className="absolute inset-0">
        <div className="absolute -top-[30%] -left-[20%] w-[80%] h-[80%] rounded-full bg-[#ff4d00]/10 blur-[120px]" />
        <div className="absolute -bottom-[20%] -right-[20%] w-[70%] h-[70%] rounded-full bg-violet-500/10 blur-[120px]" />
      </div>

      {/* cross-fade blurred backdrop */}
      <AnimatePresence mode="wait">
        {hovered ? (
          <motion.div
            key={hovered.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="absolute inset-0"
          >
            <img
              src={hovered.thumbnail}
              alt=""
              className="w-full h-full object-cover scale-110 blur-[32px] opacity-30"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#06060a] via-[#06060a]/70 to-[#06060a]/20" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#06060a]/60 via-transparent to-[#06060a]/40" />
          </motion.div>
        ) : (
          <motion.div
            key="default"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[#ff4d00]/[0.07] via-transparent to-[#1c1c26]/30" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* subtle noise texture overlay */}
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")` }} />
    </div>
  )
}

function AnimatedRoutes() {
  const location = useLocation()
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname + location.search}
        initial={{ opacity: 0, x: 12 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -12 }}
        transition={{ duration: 0.28, ease: [0.25, 0.1, 0.25, 1] }}
        className="flex-1 min-w-0 flex"
      >
        <Routes location={location}>
          <Route path="/" element={<Home />} />
          <Route path="/watch/:id" element={<VideoPage />} />
          <Route path="/studio" element={<Studio />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/subscriptions" element={<SubscriptionsPage />} />
          <Route path="/explore" element={<Home />} />
          <Route path="/channel/:channelId" element={<ChannelPage />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  )
}

function GlobalToast() {
  const toast = useStore(s => s.toast)
  const setToast = useStore(s => s.setToast)
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 2600)
      return () => clearTimeout(t)
    }
  }, [toast, setToast])
  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.97 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
        >
          <div className="px-4 py-3 rounded-full bg-[#1c1c26] border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] flex items-center gap-2 text-sm font-medium">
            <span className="w-2 h-2 rounded-full bg-[#ff4d00] animate-pulse" />
            {toast}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  // lock scroll when mobile sidebar open
  useEffect(() => {
    if (sidebarOpen) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
  }, [sidebarOpen])

  return (
    <div className="min-h-screen bg-[#06060a] text-white flex flex-col relative">
      <ImmersiveBackground />

      <Header onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />

      <div className="flex flex-1 max-w-[1728px] w-full mx-auto pb-16 lg:pb-0">
        {/* Desktop sidebar */}
        <div className="hidden lg:block">
          <Sidebar />
        </div>

        {/* Mobile sidebar drawer */}
        <AnimatePresence>
          {sidebarOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSidebarOpen(false)}
                className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
              />
              <motion.div
                initial={{ x: -280 }}
                animate={{ x: 0 }}
                exit={{ x: -280 }}
                transition={{ type: "spring", damping: 28, stiffness: 300 }}
                className="fixed top-[56px] left-0 bottom-0 z-40 w-[280px] bg-[#0a0a0f] border-r border-white/10 lg:hidden overflow-y-auto"
              >
                <Sidebar onClose={() => setSidebarOpen(false)} />
              </motion.div>
            </>
          )}
        </AnimatePresence>

        <AnimatedRoutes />
      </div>

      {/* Mobile bottom nav hint */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-20 bg-[#0a0a0f]/95 backdrop-blur-xl border-t border-white/10 flex items-center justify-around px-2 py-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
        <Link to="/" className="flex flex-col items-center gap-1 py-1 px-4">
          <HomeIcon className="w-5 h-5" />
          <span className="text-[10px] font-medium">Home</span>
        </Link>
        <Link to="/subscriptions" className="flex flex-col items-center gap-1 py-1 px-4 text-white/60">
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px]">Subs</span>
        </Link>
        <Link to="/history" className="flex flex-col items-center gap-1 py-1 px-4 text-white/60">
          <span className="text-[14px]">◷</span>
          <span className="text-[10px]">History</span>
        </Link>
        <div className="flex flex-col items-center gap-1 py-1 px-4 text-white/40">
          <span className="text-[10px] tracking-widest font-bold">PS5</span>
          <span className="w-8 h-1.5 rounded-full bg-[#ff4d00] shadow-[0_0_8px_rgba(255,77,0,0.6)]" />
        </div>
      </div>

      <GlobalToast />
    </div>
  )
}
