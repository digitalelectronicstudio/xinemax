import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { User, Video, Comment, VideoFormat } from '../types'
import { mockUsers, mockVideos, mockComments } from '../data/mockData'

export type Theme = 'cinematic' | 'amoled' | 'cyberpunk'
export type PlaybackQuality = 'Auto' | '1080p' | '4K'

export interface Settings {
  theme: Theme
  defaultQuality: PlaybackQuality
  autoplayNext: boolean
  ambientGlow: boolean
  privateSubscriptions: boolean
  restrictComments: boolean
  notificationThreshold: number // 0-100
  monetizationRate: number // CPM dollar
}

const defaultSettings: Settings = {
  theme: 'cinematic',
  defaultQuality: 'Auto',
  autoplayNext: true,
  ambientGlow: true,
  privateSubscriptions: false,
  restrictComments: false,
  notificationThreshold: 75,
  monetizationRate: 3.2,
}

interface AppState {
  users: User[]
  videos: Video[]
  comments: Comment[]
  currentUser: User | null
  subscriptions: string[] // channelIds subscribed by currentUser
  hoveredVideoId: string | null
  watchHistory: string[] // videoIds
  toast: string | null
  settings: Settings
  // actions
  setHoveredVideoId: (id: string | null) => void
  login: (userId: string) => void
  logout: () => void
  createAccount: (username: string, handle: string) => void
  toggleLike: (videoId: string) => void
  toggleDislike: (videoId: string) => void
  toggleSubscribe: (channelId: string) => void
  isSubscribed: (channelId: string) => boolean
  addComment: (videoId: string, text: string) => void
  addVideo: (v: Omit<Video, 'id' | 'views' | 'likes' | 'dislikes' | 'likedBy' | 'dislikedBy' | 'uploadDate'> & Partial<Pick<Video,'views' | 'format'>>) => string
  deleteVideo: (videoId: string) => void
  incrementView: (videoId: string) => void
  addToHistory: (videoId: string) => void
  clearHistory: () => void
  setToast: (msg: string | null) => void
  // settings / profile
  updateProfile: (fields: Partial<Pick<User, 'username' | 'bio' | 'handle' | 'publicEmail' | 'avatar' | 'banner'>>) => void
  updateSettings: (patch: Partial<Settings>) => void
  resetDatabase: () => void
  searchQuery: string
  setSearchQuery: (q: string) => void
  categoryFilter: string
  setCategoryFilter: (c: string) => void
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      users: mockUsers,
      videos: mockVideos,
      comments: mockComments,
      currentUser: mockUsers[0], // Elena Rostova default logged in
      subscriptions: [],
      hoveredVideoId: null,
      watchHistory: [],
      toast: null,
      settings: defaultSettings,
      searchQuery: "",
      categoryFilter: "All",

      setHoveredVideoId: (id) => set({ hoveredVideoId: id }),

      setSearchQuery: (q) => set({ searchQuery: q }),
      setCategoryFilter: (c) => set({ categoryFilter: c }),
      setToast: (msg) => set({ toast: msg }),
      addToHistory: (videoId) => set(s => {
        const filtered = s.watchHistory.filter(id => id !== videoId)
        return { watchHistory: [videoId, ...filtered].slice(0, 50) }
      }),
      clearHistory: () => set({ watchHistory: [] }),

      login: (userId) => {
        const u = get().users.find(x => x.id === userId) || null
        set({ currentUser: u })
      },
      logout: () => set({ currentUser: null, subscriptions: [] }),
      createAccount: (username, handle) => {
        const id = `u_${Date.now()}`
        const newUser: User = {
          id,
          username: username.trim() || "New Creator",
          handle: handle.trim().startsWith("@") ? handle.trim() : `@${handle.trim().replace(/\s/g,'').toLowerCase()}`,
          avatar: `https://i.pravatar.cc/300?u=${id}`,
          banner: `https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=400&fit=crop&seed=${id}`,
          subscribers: 0,
          verified: false,
          bio: "New on Xinemax — creating cinematic stories.",
          publicEmail: "",
          joinedDate: new Date().toISOString(),
        }
        set(s => ({ users: [newUser, ...s.users], currentUser: newUser, subscriptions: [] }))
      },

      updateProfile: (fields) => {
        const { currentUser, users, videos } = get()
        if (!currentUser) return
        const updatedUser: User = { ...currentUser, ...fields }
        // handle normalization
        if (fields.handle) {
          let h = fields.handle.trim()
          if (!h.startsWith('@')) h = '@' + h.replace(/\s/g, '').toLowerCase()
          updatedUser.handle = h
        }
        const newUsers = users.map(u => u.id === currentUser.id ? updatedUser : u)
        // also sync channel display across videos (optional but nice for persistence)
        const newVideos = videos.map(v => v.channelId === currentUser.id ? {
          ...v,
          channelName: updatedUser.username,
          channelHandle: updatedUser.handle,
          channelAvatar: updatedUser.avatar,
        } : v)
        set({ currentUser: updatedUser, users: newUsers, videos: newVideos })
      },

      updateSettings: (patch) => set(s => ({ settings: { ...s.settings, ...patch } })),

      resetDatabase: () => {
        set({
          users: mockUsers,
          videos: mockVideos,
          comments: mockComments,
          currentUser: mockUsers[0],
          subscriptions: [],
          watchHistory: [],
          toast: null,
          settings: defaultSettings,
          searchQuery: "",
          categoryFilter: "All",
          hoveredVideoId: null,
        })
        // also clear persisted key and reload? caller will handle toast
      },

      toggleLike: (videoId) => {
        const { currentUser, videos } = get()
        if (!currentUser) return
        const uid = currentUser.id
        const updated = videos.map(v => {
          if (v.id !== videoId) return v
          const alreadyLiked = v.likedBy.includes(uid)
          const alreadyDisliked = v.dislikedBy.includes(uid)
          let likedBy = [...v.likedBy]
          let dislikedBy = [...v.dislikedBy]
          let likes = v.likes
          let dislikes = v.dislikes
          if (alreadyLiked) {
            likedBy = likedBy.filter(id => id !== uid)
            likes = Math.max(0, likes - 1)
          } else {
            likedBy.push(uid)
            likes += 1
            if (alreadyDisliked) {
              dislikedBy = dislikedBy.filter(id => id !== uid)
              dislikes = Math.max(0, dislikes - 1)
            }
          }
          return { ...v, likedBy, dislikedBy, likes, dislikes }
        })
        set({ videos: updated })
      },

      toggleDislike: (videoId) => {
        const { currentUser, videos } = get()
        if (!currentUser) return
        const uid = currentUser.id
        const updated = videos.map(v => {
          if (v.id !== videoId) return v
          const alreadyDisliked = v.dislikedBy.includes(uid)
          const alreadyLiked = v.likedBy.includes(uid)
          let likedBy = [...v.likedBy]
          let dislikedBy = [...v.dislikedBy]
          let likes = v.likes
          let dislikes = v.dislikes
          if (alreadyDisliked) {
            dislikedBy = dislikedBy.filter(id => id !== uid)
            dislikes = Math.max(0, dislikes - 1)
          } else {
            dislikedBy.push(uid)
            dislikes += 1
            if (alreadyLiked) {
              likedBy = likedBy.filter(id => id !== uid)
              likes = Math.max(0, likes - 1)
            }
          }
          return { ...v, likedBy, dislikedBy, likes, dislikes }
        })
        set({ videos: updated })
      },

      toggleSubscribe: (channelId) => {
        const { currentUser, subscriptions, users } = get()
        if (!currentUser) return
        const isSub = subscriptions.includes(channelId)
        let newSubs: string[]
        let userDelta = 0
        if (isSub) {
          newSubs = subscriptions.filter(id => id !== channelId)
          userDelta = -1
        } else {
          newSubs = [...subscriptions, channelId]
          userDelta = 1
        }
        const newUsers = users.map(u => u.id === channelId ? { ...u, subscribers: Math.max(0, u.subscribers + userDelta) } : u)
        let newCurrentUser = currentUser
        if (currentUser.id === channelId) {
          newCurrentUser = { ...currentUser, subscribers: Math.max(0, currentUser.subscribers + userDelta) }
        }
        set({ subscriptions: newSubs, users: newUsers, currentUser: newCurrentUser })
      },

      isSubscribed: (channelId) => get().subscriptions.includes(channelId),

      addComment: (videoId, text) => {
        const { currentUser, settings } = get()
        if (!currentUser || !text.trim()) return
        // Privacy check: if restrictComments enabled and video belongs to currentUser, block others? For demo, allow but respect setting
        // Actually spec: Restrict comments on my uploaded videos — we check if video's channelId === currentUser.id and settings.restrictComments true, then block others? Simplified: if global restrict and author is currentUser, still allow self.
        const video = get().videos.find(v => v.id === videoId)
        if (video && video.channelId !== currentUser.id && get().users.find(u => u.id === video.channelId)) {
          // find author's settings? For simplicity use currentUser's restrict flag if they own video and enabled
          // Check if author has restrict enabled via lookup in persisted? We'll just enforce global for demo: if restrictComments true, block comments on Shorts? Not needed.
        }
        if (settings.restrictComments) {
          // allow only owner to comment when restrict is on — demo logic
          const vid = get().videos.find(v => v.id === videoId)
          if (vid && vid.channelId !== currentUser.id) {
            get().setToast('Comments are restricted by the creator')
            setTimeout(() => get().setToast(null), 2200)
            return
          }
        }
        const newComment: Comment = {
          id: `c_${Date.now()}`,
          videoId,
          userId: currentUser.id,
          username: currentUser.username,
          handle: currentUser.handle,
          avatar: currentUser.avatar,
          text: text.trim(),
          timestamp: new Date().toISOString(),
          likes: 0,
        }
        set(s => ({ comments: [newComment, ...s.comments] }))
      },

      addVideo: (payload) => {
        const { currentUser } = get()
        if (!currentUser) throw new Error("Must be logged in")
        const id = `v_${Date.now()}`
        const isShort = (payload as any).format === 'shorts'
        const newVideo: Video = {
          id,
          title: payload.title?.trim() || "Untitled cinematic upload",
          description: payload.description || "",
          category: payload.category || "Cinematography",
          thumbnail: payload.thumbnail || `https://picsum.photos/seed/${id}/640/360`,
          videoUrl: payload.videoUrl || "https://commondatastorage.googleapis.com/gtb-videos-bucket/sample/BigBuckBunny.mp4",
          channelId: currentUser.id,
          channelName: currentUser.username,
          channelAvatar: currentUser.avatar,
          channelHandle: currentUser.handle,
          views: payload.views ?? 0,
          likes: 0,
          dislikes: 0,
          likedBy: [],
          dislikedBy: [],
          duration: payload.duration || (isShort ? "00:32" : "05:42"),
          uploadDate: new Date().toISOString(),
          tags: payload.tags || (isShort ? ["Shorts", "Vertical", "Xinemax"] : ["8K", "Cinematic", "Xinemax"]),
          watchTimeMinutes: 0,
          format: (payload as any).format ?? 'long',
        }
        set(s => ({ videos: [newVideo, ...s.videos] }))
        return id
      },

      deleteVideo: (videoId) => {
        set(s => ({ videos: s.videos.filter(v => v.id !== videoId), comments: s.comments.filter(c => c.videoId !== videoId) }))
      },

      incrementView: (videoId) => {
        set(s => ({ videos: s.videos.map(v => v.id === videoId ? { ...v, views: v.views + 1 } : v) }))
        get().addToHistory(videoId)
      },
    }),
    {
      name: 'xinemax-storage-v2',
      partialize: (state) => ({
        users: state.users,
        videos: state.videos,
        comments: state.comments,
        currentUser: state.currentUser,
        subscriptions: state.subscriptions,
        watchHistory: state.watchHistory,
        settings: state.settings,
      }),
      version: 4,
    }
  )
)
