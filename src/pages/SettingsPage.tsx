import { useState, useEffect } from 'react'
import { useStore, Settings } from '../store/useStore'
import { User, Shield, Palette, Monitor, Lock, Crown, Save, Trash2, Eye, AlertTriangle, Mail, AtSign, User as UserIcon, FileText, Bell, DollarSign, RotateCcw, Sparkles, Zap } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

type Tab = 'account' | 'appearance' | 'player' | 'privacy' | 'creator'

const tabs: { id: Tab; label: string; icon: any; desc: string }[] = [
  { id: 'account', label: 'Account Profile', icon: UserIcon, desc: 'Name, handle, bio, email' },
  { id: 'appearance', label: 'Appearance & Theme', icon: Palette, desc: 'Cinematic dark & orange' },
  { id: 'player', label: 'Video Player', icon: Monitor, desc: 'Quality, autoplay, glow' },
  { id: 'privacy', label: 'Privacy & Safety', icon: Lock, desc: 'Subscriptions & comments' },
  { id: 'creator', label: 'Creator Settings', icon: Crown, desc: 'Monetization & reset' },
]

export default function SettingsPage() {
  const { currentUser, users, updateProfile, settings, updateSettings, resetDatabase, setToast } = useStore()
  const [active, setActive] = useState<Tab>('account')
  const [form, setForm] = useState({
    username: currentUser?.username ?? '',
    handle: currentUser?.handle ?? '',
    bio: currentUser?.bio ?? '',
    publicEmail: currentUser?.publicEmail ?? '',
    avatar: currentUser?.avatar ?? '',
  })
  const [showResetConfirm, setShowResetConfirm] = useState(false)

  useEffect(() => {
    if (currentUser) {
      setForm({
        username: currentUser.username,
        handle: currentUser.handle,
        bio: currentUser.bio ?? '',
        publicEmail: currentUser.publicEmail ?? '',
        avatar: currentUser.avatar,
      })
    }
  }, [currentUser])

  // Apply theme instantly via CSS variables
  useEffect(() => {
    const root = document.documentElement
    root.setAttribute('data-theme', settings.theme)
    // Update CSS variables instantly
    if (settings.theme === 'amoled') {
      root.style.setProperty('--x-bg', '#000000')
      root.style.setProperty('--x-card', '#0a0a0a')
      root.style.setProperty('--x-surface', '#141414')
      root.style.setProperty('--x-border', 'rgba(255,255,255,0.06)')
      document.body.style.background = '#000000'
    } else if (settings.theme === 'cyberpunk') {
      root.style.setProperty('--x-bg', '#0f0705')
      root.style.setProperty('--x-card', '#1a0f0a')
      root.style.setProperty('--x-surface', '#251408')
      root.style.setProperty('--x-border', 'rgba(255,77,0,0.18)')
      document.body.style.background = '#0f0705'
    } else {
      // cinematic
      root.style.setProperty('--x-bg', '#06060a')
      root.style.setProperty('--x-card', '#14141c')
      root.style.setProperty('--x-surface', '#1c1c26')
      root.style.setProperty('--x-border', 'rgba(255,255,255,0.06)')
      document.body.style.background = '#06060a'
    }
  }, [settings.theme])

  const handleSaveProfile = () => {
    if (!currentUser) {
      setToast('Please sign in to edit profile')
      setTimeout(() => setToast(null), 2000)
      return
    }
    if (!form.username.trim()) {
      setToast('Display name cannot be empty')
      setTimeout(() => setToast(null), 2000)
      return
    }
    let handle = form.handle.trim()
    if (!handle) handle = currentUser.handle
    updateProfile({
      username: form.username.trim(),
      handle,
      bio: form.bio.trim(),
      publicEmail: form.publicEmail.trim(),
      avatar: form.avatar.trim() || currentUser.avatar,
    })
    setToast('Saved changes')
    setTimeout(() => setToast(null), 2200)
  }

  const handleReset = () => {
    resetDatabase()
    setShowResetConfirm(false)
    setToast('Factory reset complete — database restored')
    setTimeout(() => setToast(null), 2500)
    // reset CSS
    document.documentElement.setAttribute('data-theme', 'cinematic')
  }

  if (!currentUser) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-20 px-6 text-center">
        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center"><UserIcon className="w-8 h-8 text-white/30" /></div>
        <h2 className="font-black text-xl mt-4">Settings locked</h2>
        <p className="text-sm text-white/50 mt-2">Sign in to manage your Xinemax preferences.</p>
      </div>
    )
  }

  return (
    <div className="flex-1 min-w-0">
      <div className="max-w-[1280px] mx-auto px-3 sm:px-6 py-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 text-[11px] tracking-widest font-bold text-[#ff4d00]"><Shield className="w-3.5 h-3.5" /> SYSTEM SETTINGS</div>
            <h1 className="text-[28px] font-black tracking-tight mt-1">Settings</h1>
            <p className="text-sm text-white/50 mt-1">Enterprise-grade controls — synced instantly, changes apply without reload.</p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-white/50">All changes saved</span>
          </div>
        </div>

        <div className="mt-6 flex flex-col lg:flex-row gap-6">
          {/* Sidebar tabs */}
          <div className="w-full lg:w-[260px] shrink-0">
            <div className="rounded-[16px] bg-[#14141c] border border-white/5 p-2 space-y-1 sticky top-[72px]">
              {tabs.map(t => (
                <button
                  key={t.id}
                  onClick={() => setActive(t.id)}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-colors ${active===t.id ? 'bg-white text-black' : 'hover:bg-white/5 text-white/70 hover:text-white'}`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${active===t.id ? 'bg-black text-white' : 'bg-white/10'}`}>
                    <t.icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-bold leading-none ${active===t.id ? 'text-black' : 'text-white'}`}>{t.label}</div>
                    <div className={`text-xs truncate ${active===t.id ? 'text-black/60' : 'text-white/40'}`}>{t.desc}</div>
                  </div>
                </button>
              ))}
              <div className="pt-3 mt-2 border-t border-white/5 px-3 pb-2">
                <div className="flex items-center gap-2">
                  <img src={currentUser.avatar} alt={currentUser.username} className="w-8 h-8 rounded-full object-cover" />
                  <div className="min-w-0">
                    <div className="text-sm font-bold truncate">{currentUser.username}</div>
                    <div className="text-xs text-white/40 truncate">{currentUser.handle}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={active}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.22 }}
                className="rounded-[16px] bg-[#14141c] border border-white/5 overflow-hidden"
              >
                {/* ACCOUNT */}
                {active === 'account' && (
                  <div className="p-6 sm:p-7">
                    <h3 className="font-black flex items-center gap-2"><UserIcon className="w-4 h-4 text-[#ff4d00]" /> Account Profile</h3>
                    <p className="text-sm text-white/50 mt-1">Update your public channel identity. Changes sync to your videos and channel page instantly.</p>

                    <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold tracking-wide text-white/70 flex items-center gap-1.5"><UserIcon className="w-3 h-3" /> DISPLAY NAME</label>
                        <input value={form.username} onChange={e=> setForm({...form, username: e.target.value})} className="w-full h-11 px-4 rounded-xl bg-[#0a0a0f] border border-white/10 focus:border-[#ff4d00]/40 focus:outline-none text-sm" placeholder="Elena Rostova" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold tracking-wide text-white/70 flex items-center gap-1.5"><AtSign className="w-3 h-3" /> CHANNEL HANDLE</label>
                        <input value={form.handle} onChange={e=> setForm({...form, handle: e.target.value})} className="w-full h-11 px-4 rounded-xl bg-[#0a0a0f] border border-white/10 focus:border-[#ff4d00]/40 focus:outline-none text-sm" placeholder="@elenarostova" />
                      </div>
                      <div className="space-y-1.5 sm:col-span-2">
                        <label className="text-xs font-bold tracking-wide text-white/70 flex items-center gap-1.5"><FileText className="w-3 h-3" /> BIO</label>
                        <textarea value={form.bio} onChange={e=> setForm({...form, bio: e.target.value})} rows={3} className="w-full px-4 py-3 rounded-xl bg-[#0a0a0f] border border-white/10 focus:border-[#ff4d00]/40 focus:outline-none text-sm resize-none" placeholder="8K drone cinematographer..." />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold tracking-wide text-white/70 flex items-center gap-1.5"><Mail className="w-3 h-3" /> PUBLIC EMAIL</label>
                        <input value={form.publicEmail} onChange={e=> setForm({...form, publicEmail: e.target.value})} className="w-full h-11 px-4 rounded-xl bg-[#0a0a0f] border border-white/10 focus:border-[#ff4d00]/40 focus:outline-none text-sm" placeholder="elena@xinemax.cinema" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold tracking-wide text-white/70">AVATAR URL</label>
                        <input value={form.avatar} onChange={e=> setForm({...form, avatar: e.target.value})} className="w-full h-11 px-4 rounded-xl bg-[#0a0a0f] border border-white/10 focus:border-[#ff4d00]/40 focus:outline-none text-sm" placeholder="https://..." />
                      </div>
                    </div>

                    <div className="mt-4 p-3 rounded-xl bg-[#1c1c26] border border-white/5 flex gap-3">
                      <img src={form.avatar || currentUser.avatar} alt="preview" className="w-10 h-10 rounded-full object-cover" />
                      <div className="text-xs leading-relaxed text-white/60">
                        <div className="font-bold text-white">{form.username || 'Your Name'} <span className="font-normal text-white/50">{form.handle || '@handle'}</span></div>
                        <div className="line-clamp-1">{form.bio || 'Your bio will appear on your channel About tab.'}</div>
                      </div>
                    </div>

                    <button onClick={handleSaveProfile} className="mt-6 h-11 px-6 rounded-full bg-[#ff4d00] hover:bg-[#ff6a2b] font-bold text-sm flex items-center gap-2"><Save className="w-4 h-4" /> Save Profile</button>
                  </div>
                )}

                {active === 'appearance' && (
                  <div className="p-6 sm:p-7">
                    <h3 className="font-black flex items-center gap-2"><Palette className="w-4 h-4 text-[#ff4d00]" /> Appearance & Theme</h3>
                    <p className="text-sm text-white/50 mt-1">Functional theme toggle — updates global CSS variables instantly. Cinematic Dark, Pitch Black AMOLED, Cyberpunk Orange.</p>
                    <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {[
                        { id: 'cinematic', name: 'Cinematic Dark', desc: 'Default Xinemax', bg: '#06060a', accent: '#ff4d00', preview: 'bg-[#06060a]' },
                        { id: 'amoled', name: 'Pitch Black', desc: 'AMOLED pure black', bg: '#000000', accent: '#fff', preview: 'bg-black' },
                        { id: 'cyberpunk', name: 'Cyberpunk Orange', desc: 'Neon orange glow', bg: '#0f0705', accent: '#ff4d00', preview: 'bg-[#0f0705]' },
                      ].map(th => (
                        <button
                          key={th.id}
                          onClick={()=> { updateSettings({ theme: th.id as any }); setToast('Saved changes'); setTimeout(()=>setToast(null),1800)}}
                          className={`p-4 rounded-xl border text-left transition-all ${settings.theme===th.id ? 'bg-white text-black border-white shadow-lg' : 'bg-[#0a0a0f] border-white/10 hover:border-white/20 text-white'}`}
                        >
                          <div className={`w-full h-20 rounded-lg border flex items-center justify-center text-xs font-bold ${th.preview} ${settings.theme===th.id ? 'border-black/10' : 'border-white/10'}`}>
                            {th.name}
                          </div>
                          <div className={`font-bold text-sm mt-3 ${settings.theme===th.id ? 'text-black' : 'text-white'}`}>{th.name}</div>
                          <div className={`text-xs ${settings.theme===th.id ? 'text-black/60' : 'text-white/50'}`}>{th.desc}</div>
                          {settings.theme===th.id && <div className="mt-2 text-xs font-bold flex items-center gap-1 text-emerald-600"><Sparkles className="w-3 h-3" /> Active</div>}
                        </button>
                      ))}
                    </div>
                    <div className="mt-6 p-3 rounded-xl bg-[#1c1c26] border border-white/5 text-xs leading-relaxed text-white/60">
                      <span className="font-bold text-white">Instant CSS variables:</span> <span className="font-mono text-[#ff8a00]">--x-bg</span>, <span className="font-mono text-[#ff8a00]">--x-card</span>, <span className="font-mono text-[#ff8a00]">--x-surface</span> update on <span className="font-mono">document.documentElement</span> without reload.
                    </div>
                  </div>
                )}

                {active === 'player' && (
                  <div className="p-6 sm:p-7">
                    <h3 className="font-black flex items-center gap-2"><Monitor className="w-4 h-4 text-[#ff4d00]" /> Video Player Preferences</h3>
                    <p className="text-sm text-white/50 mt-1">Control default quality, autoplay and cinema lighting.</p>

                    <div className="mt-6 space-y-5">
                      <div>
                        <label className="text-xs font-bold tracking-wide text-white/70">DEFAULT PLAYBACK QUALITY</label>
                        <div className="mt-2 grid grid-cols-3 gap-2">
                          {(['Auto','1080p','4K'] as const).map(q=> (
                            <button key={q} onClick={()=> updateSettings({ defaultQuality: q as any })} className={`h-11 rounded-xl border font-bold text-sm ${settings.defaultQuality===q ? 'bg-white text-black border-white' : 'bg-[#0a0a0f] border-white/10 text-white/70 hover:bg-white/5'}`}>{q}{q==='4K' && <span className="ml-1 text-[10px] opacity-60">SIM</span>}</button>
                          ))}
                        </div>
                        <div className="text-xs text-white/40 mt-2">Applied to player as hint — sandbox simulated 4K.</div>
                      </div>

                      {[
                        { key: 'autoplayNext', label: 'Autoplay Next Video', desc: 'Automatically play next in queue', icon: Zap },
                        { key: 'ambientGlow', label: 'Ambient Glow / Cinema Lighting', desc: 'Blurred glow around player — PS5 effect', icon: Sparkles },
                      ].map(item => (
                        <div key={item.key} className="flex items-center justify-between p-4 rounded-xl bg-[#0a0a0f] border border-white/10">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center"><item.icon className="w-4 h-4" /></div>
                            <div>
                              <div className="text-sm font-bold">{item.label}</div>
                              <div className="text-xs text-white/50">{item.desc}</div>
                            </div>
                          </div>
                          <button
                            onClick={()=> updateSettings({ [item.key]: !settings[item.key as keyof Settings] } as any)}
                            className={`w-11 h-6 rounded-full relative transition-colors ${ (settings as any)[item.key] ? 'bg-[#ff4d00]' : 'bg-white/15'}`}
                          >
                            <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${(settings as any)[item.key] ? 'right-0.5' : 'left-0.5'}`} />
                          </button>
                        </div>
                      ))}

                      <div className="p-3 rounded-xl bg-[#ff4d00]/10 border border-[#ff4d00]/20 text-xs text-[#ff8a00] flex gap-2">
                        <Eye className="w-4 h-4 shrink-0" /> Quality: <span className="font-mono text-white">{settings.defaultQuality}</span> · Autoplay {settings.autoplayNext ? 'ON' : 'OFF'} · Glow {settings.ambientGlow ? 'ON' : 'OFF'}
                      </div>
                    </div>
                  </div>
                )}

                {active === 'privacy' && (
                  <div className="p-6 sm:p-7">
                    <h3 className="font-black flex items-center gap-2"><Lock className="w-4 h-4 text-[#ff4d00]" /> Privacy & Safety</h3>
                    <p className="text-sm text-white/50 mt-1">Control who sees your subscriptions and comments.</p>
                    <div className="mt-6 space-y-4">
                      {[
                        { key: 'privateSubscriptions', title: 'Keep all my subscriptions private', desc: 'Hide your subscriptions from other users (channel & Subscriptions page)', icon: Eye },
                        { key: 'restrictComments', title: 'Restrict comments on my uploaded videos', desc: 'Only you can comment on your videos when enabled — others see toast', icon: Shield },
                      ].map(item=> (
                        <div key={item.key} className="flex items-center justify-between p-4 rounded-xl bg-[#0a0a0f] border border-white/10">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center"><item.icon className="w-4 h-4" /></div>
                            <div>
                              <div className="text-sm font-bold">{item.title}</div>
                              <div className="text-xs text-white/50 max-w-[360px]">{item.desc}</div>
                            </div>
                          </div>
                          <button onClick={()=> updateSettings({ [item.key]: !settings[item.key as keyof Settings] } as any)} className={`w-11 h-6 rounded-full relative transition-colors ${ (settings as any)[item.key] ? 'bg-[#ff4d00]' : 'bg-white/15'}`}>
                            <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${(settings as any)[item.key] ? 'right-0.5' : 'left-0.5'}`} />
                          </button>
                        </div>
                      ))}
                      <div className="rounded-xl bg-[#1c1c26] border border-white/5 p-3 flex gap-3 text-xs leading-relaxed text-white/60">
                        <Shield className="w-4 h-4 text-emerald-400 shrink-0" /> Privacy is synced — respects Subscriptions page respects <span className="font-mono text-white">privateSubscriptions</span>.
                      </div>
                    </div>
                  </div>
                )}

                {active === 'creator' && (
                  <div className="p-6 sm:p-7">
                    <h3 className="font-black flex items-center gap-2"><Crown className="w-4 h-4 text-[#ff4d00]" /> Creator Settings</h3>
                    <p className="text-sm text-white/50 mt-1">Monetization, notifications and factory reset.</p>

                    <div className="mt-6 space-y-5">
                      <div className="p-4 rounded-xl bg-[#0a0a0f] border border-white/10">
                        <label className="text-xs font-bold tracking-wide text-white/70 flex items-center gap-1.5"><Bell className="w-3 h-3" /> NOTIFICATION THRESHOLD ({settings.notificationThreshold}%)</label>
                        <input type="range" min={0} max={100} value={settings.notificationThreshold} onChange={e=> updateSettings({ notificationThreshold: parseInt(e.target.value)})} className="w-full mt-3 accent-[#ff4d00]" />
                        <div className="flex justify-between text-[11px] text-white/30 mt-1"><span>Quiet</span><span>Balanced</span><span>All</span></div>
                      </div>

                      <div className="p-4 rounded-xl bg-[#0a0a0f] border border-white/10">
                        <label className="text-xs font-bold tracking-wide text-white/70 flex items-center gap-1.5"><DollarSign className="w-3 h-3" /> MONETIZATION RATE (CPM)</label>
                        <div className="mt-3 flex items-center gap-3">
                          <input type="range" min={1} max={10} step={0.1} value={settings.monetizationRate} onChange={e=> updateSettings({ monetizationRate: parseFloat(e.target.value)})} className="flex-1 accent-[#ff4d00]" />
                          <div className="h-10 px-4 rounded-xl bg-[#1c1c26] border border-white/10 flex items-center gap-1 font-mono text-sm"><span className="text-white/50">$</span>{settings.monetizationRate.toFixed(1)}</div>
                        </div>
                        <div className="text-xs text-white/40 mt-2">Studio revenue = totalViews × ${settings.monetizationRate.toFixed(2)} / 1000 (simulated)</div>
                      </div>

                      <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4">
                        <h4 className="font-bold text-sm flex items-center gap-2 text-red-300"><AlertTriangle className="w-4 h-4" /> Danger Zone</h4>
                        <p className="text-xs text-white/60 mt-1 leading-relaxed">Reset the entire app database to factory defaults: users, videos, comments, subscriptions, history and settings. Object URLs will be cleared. This cannot be undone without re-import.</p>
                        <button onClick={()=> setShowResetConfirm(true)} className="mt-3 h-10 px-5 rounded-full bg-red-500 hover:bg-red-600 text-white font-bold text-sm flex items-center gap-2"><RotateCcw className="w-4 h-4" /> Reset to Factory Defaults</button>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Reset confirm */}
      <AnimatePresence>
        {showResetConfirm && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={()=> setShowResetConfirm(false)}>
            <motion.div initial={{scale:0.96,y:12}} animate={{scale:1,y:0}} exit={{scale:0.96,y:12}} onClick={e=>e.stopPropagation()} className="w-full max-w-[420px] rounded-[20px] bg-[#14141c] border border-white/10 p-6">
              <div className="w-12 h-12 rounded-full bg-red-500/15 flex items-center justify-center mx-auto"><Trash2 className="w-6 h-6 text-red-400" /></div>
              <h3 className="font-black text-center mt-4">Reset everything?</h3>
              <p className="text-sm text-white/60 text-center mt-2">This will restore factory defaults: <span className="font-mono text-white">xinemax-storage-v2</span> — 5 long + 5 long + 3 Shorts mocks + Elena as current user.</p>
              <div className="flex gap-3 mt-6">
                <button onClick={()=> setShowResetConfirm(false)} className="flex-1 h-11 rounded-full border border-white/10 hover:bg-white/5 font-bold text-sm">Cancel</button>
                <button onClick={handleReset} className="flex-1 h-11 rounded-full bg-red-500 hover:bg-red-600 text-white font-bold text-sm">Yes, reset</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
