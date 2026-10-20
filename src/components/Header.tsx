import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search, Video, Bell, Menu, X, LogOut, LayoutDashboard, User } from 'lucide-react'
import { useStore } from '../store/useStore'
import CreateVideoModal from './CreateVideoModal'
import AuthModal from './AuthModal'
import { motion, AnimatePresence } from 'framer-motion'

export default function Header({ onMenuToggle }: { onMenuToggle?: () => void }) {
  const { currentUser, logout, searchQuery, setSearchQuery } = useStore()
  const [showCreate, setShowCreate] = useState(false)
  const [showAuth, setShowAuth] = useState<null | 'signin' | 'create'>(null)
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
  const navigate = useNavigate()

  return (
    <>
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-[#06060a]/80 border-b border-white/[0.06]">
        <div className="max-w-[1728px] mx-auto px-3 sm:px-4 lg:px-6 h-[56px] flex items-center gap-3 sm:gap-6">
          {/* left */}
          <div className="flex items-center gap-3 shrink-0">
            <button onClick={onMenuToggle} className="p-2 hover:bg-white/10 rounded-full lg:hidden">
              <Menu className="w-5 h-5" />
            </button>
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#ff4d00] flex items-center justify-center font-black text-sm tracking-tighter">X</div>
              <span className="font-black tracking-[-0.04em] text-[20px] sm:text-[22px]">XINE<span className="text-[#ff4d00]">MAX</span></span>
              <span className="hidden sm:inline text-[10px] tracking-widest bg-white text-black px-1.5 py-0.5 rounded font-bold ml-1">8K</span>
            </Link>
          </div>

          {/* center search */}
          <div className="flex-1 flex justify-center max-w-[640px] mx-auto hidden sm:flex">
            <div className="flex w-full">
              <div className="flex-1 relative">
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search cinematography, nature, tech…"
                  className="w-full h-9 bg-[#14141c] border border-[#2a2a3a] rounded-l-full pl-4 pr-4 text-sm placeholder:text-white/40 focus:outline-none focus:border-[#ff4d00]/50 focus:bg-[#1c1c26] transition-colors"
                />
              </div>
              <button className="h-9 px-5 bg-[#1c1c26] border border-l-0 border-[#2a2a3a] rounded-r-full hover:bg-[#242430] transition-colors">
                <Search className="w-4 h-4 text-white/70" />
              </button>
            </div>
          </div>

          {/* mobile search icon */}
          <div className="sm:hidden ml-auto">
            <button onClick={() => setMobileSearchOpen(!mobileSearchOpen)} className="p-2 hover:bg-white/10 rounded-full">
              <Search className="w-5 h-5" />
            </button>
          </div>

          {/* right */}
          <div className="flex items-center gap-1 sm:gap-3 shrink-0">
            <button onClick={() => {
              if (!currentUser) setShowAuth('signin')
              else setShowCreate(true)
            }} className="hidden sm:flex items-center gap-2 h-9 px-3 sm:px-4 bg-[#ff4d00] hover:bg-[#ff6a2b] rounded-full text-sm font-semibold transition-colors">
              <Video className="w-4 h-4" />
              <span>Create</span>
            </button>

            <button onClick={() => {
              if (!currentUser) setShowAuth('signin')
              else setShowCreate(true)
            }} className="sm:hidden p-2 bg-[#ff4d00] rounded-full">
              <Video className="w-4 h-4" />
            </button>

            {currentUser ? (
              <>
                <Link to="/studio" className="hidden sm:flex p-2 hover:bg-white/10 rounded-full">
                  <LayoutDashboard className="w-5 h-5" />
                </Link>
                <button className="p-2 hover:bg-white/10 rounded-full hidden sm:flex">
                  <Bell className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-2">
                  <img src={currentUser.avatar} alt={currentUser.username} className="w-8 h-8 rounded-full object-cover border border-white/10" />
                  <div className="hidden lg:block text-left leading-none">
                    <div className="text-sm font-semibold leading-none">{currentUser.username}</div>
                    <div className="text-xs text-white/50">{currentUser.handle}</div>
                  </div>
                  <button onClick={logout} className="hidden sm:flex p-1.5 hover:bg-white/10 rounded-full ml-1">
                    <LogOut className="w-4 h-4 text-white/60" />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <button onClick={() => setShowAuth('signin')} className="h-9 px-4 rounded-full border border-white/10 hover:bg-white/10 text-sm font-medium transition-colors">
                  Sign In
                </button>
                <button onClick={() => setShowAuth('create')} className="h-9 px-4 rounded-full bg-white text-black hover:bg-white/90 text-sm font-semibold transition-colors">
                  Create Account
                </button>
              </div>
            )}
          </div>
        </div>

        {/* mobile search bar */}
        <AnimatePresence>
          {mobileSearchOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="sm:hidden border-t border-white/5 px-3 py-3 bg-[#0a0a0f]"
            >
              <div className="flex">
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search…"
                  className="flex-1 h-10 bg-[#14141c] border border-[#2a2a3a] rounded-l-full pl-4 pr-4 text-sm focus:outline-none"
                />
                <button className="h-10 px-5 bg-[#1c1c26] border border-l-0 border-[#2a2a3a] rounded-r-full">
                  <Search className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <AnimatePresence>
        {showCreate && <CreateVideoModal onClose={() => setShowCreate(false)} onCreated={(id) => { setShowCreate(false); navigate(`/watch/${id}`)}} />}
      </AnimatePresence>
      <AnimatePresence>
        {showAuth && <AuthModal mode={showAuth} onClose={() => setShowAuth(null)} />}
      </AnimatePresence>
    </>
  )
}
