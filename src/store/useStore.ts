import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { User, Video, Comment } from '../types'
import { mockUsers, mockVideos, mockComments } from '../data/mockData'

interface AppState {
  users: User[]
  videos: Video[]
  comments: Comment[]
  currentUser: User | null
  subscriptions: string[] // channelIds subscribed by currentUser
  hoveredVideoId: string | null
  watchHistory: string[] // videoIds
  toast: string | null
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
  addVideo: (v: Omit<Video, 'id' | 'views' | 'likes' | 'dislikes' | 'likedBy' | 'dislikedBy' | 'uploadDate'> & Partial<Pick<Video,'views'>>) => string
  deleteVideo: (videoId: string) => void
  incrementView: (videoId: string) => void
  addToHistory: (videoId: string) => void
  clearHistory: () => void
  setToast: (msg: string | null) => void
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
          subscribers: 0,
          verified: false,
          bio: "New on Xinemax — creating cinematic stories."
        }
        set(s => ({ users: [newUser, ...s.users], currentUser: newUser, subscriptions: [] }))
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
        // don't allow subscribing to self? allow but we still handle differently
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
        // also if currentUser is the channel owner, adjust currentUser object
        let newCurrentUser = currentUser
        if (currentUser.id === channelId) {
          newCurrentUser = { ...currentUser, subscribers: Math.max(0, currentUser.subscribers + userDelta) }
        }
        set({ subscriptions: newSubs, users: newUsers, currentUser: newCurrentUser })
      },

      isSubscribed: (channelId) => get().subscriptions.includes(channelId),

      addComment: (videoId, text) => {
        const { currentUser } = get()
        if (!currentUser || !text.trim()) return
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
          duration: payload.duration || "00:42",
          uploadDate: new Date().toISOString(),
          tags: payload.tags || ["8K", "Cinematic", "Xinemax"],
          watchTimeMinutes: 0,
        }
        set(s => ({ videos: [newVideo, ...s.videos] }))
        return id
      },

      deleteVideo: (videoId) => {
        set(s => ({ videos: s.videos.filter(v => v.id !== videoId), comments: s.comments.filter(c => c.videoId !== videoId) }))
      },

      incrementView: (videoId) => {
        set(s => ({ videos: s.videos.map(v => v.id === videoId ? { ...v, views: v.views + 1 } : v) }))
        // also push to history
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
      }),
      version: 3,
    }
  )
)
