import { useState } from 'react'
import { X, Sparkles, User, AtSign } from 'lucide-react'
import { motion } from 'framer-motion'
import { useStore } from '../store/useStore'

export default function AuthModal({ mode: initialMode, onClose }: { mode: 'signin' | 'create', onClose: () => void }) {
  const { users, login, createAccount } = useStore()
  const [mode, setMode] = useState(initialMode)
  const [username, setUsername] = useState("")
  const [handle, setHandle] = useState("")
  const [selectedUser, setSelectedUser] = useState<string>(users[0]?.id || "")

  const handleCreate = () => {
    if (!username.trim()) return
    createAccount(username, handle || username)
    onClose()
  }

  const handleSignIn = () => {
    if (selectedUser) {
      login(selectedUser)
      onClose()
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.96, y: 12, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.96, y: 12, opacity: 0 }}
        transition={{ type: "spring", damping: 24, stiffness: 300 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-[480px] rounded-[20px] bg-[#14141c] border border-white/10 overflow-hidden"
      >
        <div className="h-1 w-full bg-gradient-to-r from-[#ff4d00] to-[#ff8a00]" />
        <div className="p-6 sm:p-7">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <div className="inline-flex items-center gap-2 text-[11px] tracking-widest font-bold text-[#ff4d00] mb-2">
                <Sparkles className="w-3.5 h-3.5" /> XINEMAX ACCOUNTS
              </div>
              <h2 className="text-[22px] font-black tracking-tight leading-none">
                {mode === 'signin' ? "Welcome back" : "Create your creator account"}
              </h2>
              <p className="text-sm text-white/50 mt-2 leading-snug">
                {mode === 'signin' ? "Pick a profile to continue — no password needed in sandbox." : "Join in seconds. Your channel is ready instantly."}
              </p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full shrink-0">
              <X className="w-5 h-5" />
            </button>
          </div>

          {mode === 'signin' ? (
            <div className="space-y-3">
              {users.map(u => (
                <button
                  key={u.id}
                  onClick={() => setSelectedUser(u.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-colors ${selectedUser===u.id ? 'bg-[#ff4d00]/10 border-[#ff4d00]/40' : 'bg-[#1c1c26] border-white/5 hover:border-white/15'}`}
                >
                  <img src={u.avatar} className="w-10 h-10 rounded-full object-cover" alt={u.username} />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm flex items-center gap-1.5">
                      {u.username}
                      {u.verified && <span className="w-3.5 h-3.5 rounded-full bg-white text-black flex items-center justify-center text-[10px]">✓</span>}
                    </div>
                    <div className="text-xs text-white/50 truncate">{u.handle} • {u.subscribers.toLocaleString()} subscribers</div>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedUser===u.id ? 'border-[#ff4d00] bg-[#ff4d00]' : 'border-white/20'}`}>
                    {selectedUser===u.id && <div className="w-2 h-2 bg-white rounded-full" />}
                  </div>
                </button>
              ))}
              <button onClick={handleSignIn} className="w-full h-11 rounded-full bg-[#ff4d00] hover:bg-[#ff6a2b] font-semibold text-sm mt-2 transition-colors">
                Sign In as Selected
              </button>
              <div className="text-center text-sm text-white/50">
                New here? <button onClick={() => setMode('create')} className="text-white font-semibold hover:underline">Create account</button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold tracking-wide text-white/70 flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> DISPLAY NAME</label>
                <input
                  value={username}
                  onChange={e=>setUsername(e.target.value)}
                  placeholder="Elena Rostova"
                  className="w-full h-11 px-4 rounded-xl bg-[#0a0a0f] border border-white/10 focus:border-[#ff4d00]/50 focus:outline-none text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold tracking-wide text-white/70 flex items-center gap-1.5"><AtSign className="w-3.5 h-3.5" /> HANDLE</label>
                <input
                  value={handle}
                  onChange={e=>setHandle(e.target.value)}
                  placeholder="@elenarostova"
                  className="w-full h-11 px-4 rounded-xl bg-[#0a0a0f] border border-white/10 focus:border-[#ff4d00]/50 focus:outline-none text-sm"
                />
              </div>
              <div className="rounded-xl bg-[#ff4d00]/10 border border-[#ff4d00]/20 p-3 flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#ff4d00] flex items-center justify-center shrink-0 mt-0.5">✦</div>
                <div className="text-xs leading-relaxed text-white/80">
                  <span className="font-semibold text-white">Sandbox note:</span> Accounts are stored in LocalStorage — they persist across previews but not across hard sandbox rebuilds. Use Export if you need durability.
                </div>
              </div>
              <button onClick={handleCreate} className="w-full h-11 rounded-full bg-white text-black hover:bg-white/90 font-semibold text-sm transition-colors">
                Create Account & Continue
              </button>
              <div className="text-center text-sm text-white/50">
                Already have one? <button onClick={() => setMode('signin')} className="text-white font-semibold hover:underline">Sign in</button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}
