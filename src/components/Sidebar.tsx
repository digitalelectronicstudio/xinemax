import { NavLink } from 'react-router-dom'
import { Home, Compass, Library, Clock, Flame, Film, Cpu, Leaf, Plane, Radio, Settings, HelpCircle } from 'lucide-react'

const nav = [
  { icon: Home, label: 'Home', to: '/' },
  { icon: Compass, label: 'Explore', to: '/' },
  { icon: Library, label: 'Subscriptions', to: '/studio' },
  { icon: Clock, label: 'History', to: '/' },
]

const categories = [
  { icon: Film, label: 'Cinematography' },
  { icon: Cpu, label: 'Technology' },
  { icon: Leaf, label: 'Nature' },
  { icon: Plane, label: 'Drone 8K' },
  { icon: Flame, label: 'Trending' },
  { icon: Radio, label: 'Live' },
]

export default function Sidebar({ collapsed, onClose }: { collapsed?: boolean, onClose?: () => void }) {
  return (
    <aside className={`shrink-0 bg-[#0a0a0f] border-r border-white/[0.06] flex flex-col h-[calc(100vh-56px)] sticky top-[56px] overflow-y-auto scrollbar-hide ${collapsed ? 'w-[0] lg:w-[240px] overflow-hidden lg:overflow-y-auto' : 'w-[240px]'}`}>
      <div className="p-3 space-y-4">
        <nav className="space-y-1">
          {nav.map(item => (
            <NavLink
              key={item.label}
              to={item.to}
              onClick={onClose}
              className={({ isActive }) => `flex items-center gap-3 px-3 h-9 rounded-xl text-sm font-medium transition-colors ${isActive ? 'bg-white text-black' : 'hover:bg-white/10 text-white/80 hover:text-white'}`}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="h-px bg-white/5" />

        <div>
          <div className="px-3 py-2 text-[11px] tracking-widest font-bold text-white/30">EXPLORE</div>
          <div className="space-y-1">
            {categories.map(c => (
              <button key={c.label} className="w-full flex items-center gap-3 px-3 h-9 rounded-xl hover:bg-white/10 text-sm text-white/70 hover:text-white text-left transition-colors">
                <c.icon className="w-5 h-5 shrink-0" />
                <span>{c.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="h-px bg-white/5" />

        <div className="px-3 py-3 rounded-xl bg-gradient-to-br from-[#ff4d00] to-[#ff8a00] text-white">
          <div className="text-sm font-black leading-tight">Go 8K Cinematic</div>
          <div className="text-xs opacity-90 mt-1 leading-snug">Unlock drone LUTs + raw workflow. 7-day free trial.</div>
          <button className="mt-3 h-8 px-4 rounded-full bg-white text-black text-xs font-bold">Try Pro</button>
        </div>

        <div className="pt-2 space-y-1 pb-6">
          <button className="w-full flex items-center gap-3 px-3 h-8 rounded-xl hover:bg-white/10 text-sm text-white/60">
            <Settings className="w-4 h-4" /> Settings
          </button>
          <button className="w-full flex items-center gap-3 px-3 h-8 rounded-xl hover:bg-white/10 text-sm text-white/60">
            <HelpCircle className="w-4 h-4" /> Help
          </button>
          <div className="px-3 pt-3 text-[11px] leading-relaxed text-white/25">
            © 2026 Xinemax LLC<br />Cinematic universe • Made for creators
          </div>
        </div>
      </div>
    </aside>
  )
}
