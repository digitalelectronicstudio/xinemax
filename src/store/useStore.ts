import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { User, Video, Comment } from '../types'
import { mockUsers, mockVideos, mockComments } from '../data/mockData'
import { generateSubtitlePack, durationToSeconds } from '../utils/subtitles'
import { db, saveDoc, saveBatch, fetchCollectionDocs, fetchDoc } from '../lib/firebase'

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

// Silent Firestore helpers — never throw to UI
function fireAndForget(p: Promise<unknown>) {
  p.catch(() => {})
}

function syncVideoToFirestore(video: Video) {
  if (!db) return
  // Ensure subtitle pack exists before sync — generate if missing
  let v = video
  if (!v.subtitles) {
    const pack = generateSubtitlePack(v.title, v.description, durationToSeconds(v.duration))
    v = { ...v, subtitles: pack }
  }
  fireAndForget(saveDoc('videos', v.id, v as unknown as Record<string, unknown>))
}

function syncUserToFirestore(user: User) {
  if (!db) return
  fireAndForget(saveDoc('users', user.id, user as unknown as Record<string, unknown>))
}

function syncCommentToFirestore(comment: Comment) {
  if (!db) return
  fireAndForget(saveDoc('comments', comment.id, comment as unknown as Record<string, unknown>))
}

function syncSettingsToFirestore(userId: string, settings: Settings) {
  if (!db) return
  fireAndForget(saveDoc('settings', userId, settings as unknown as Record<string, unknown>))
  // Also sync under analytics for spec compliance
  fireAndForget(saveDoc('analytics', `settings_${userId}`, { userId, settings, updatedAt: new Date().toISOString() } as unknown as Record<string, unknown>))
}

function syncSubscriptionToFirestore(userId: string, channelId: string, isSub: boolean) {
  if (!db) return
  fireAndForget(saveDoc('subscriptions', `${userId}_${channelId}`, { userId, channelId, subscribed: isSub, updatedAt: new Date().toISOString() } as unknown as Record<string, unknown>))
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
  // internal firebase hydration state
  _hydratedFromFirebase: boolean
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
  // firebase
  hydrateFromFirestore: () => Promise<void>
  ensureVideoSubtitles: (videoId: string) => void
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      users: mockUsers,
      videos: mockVideos.map(v => ({
        ...v,
        subtitles: (v as unknown as Record<string, unknown>).subtitles as Video['subtitles'] ?? generateSubtitlePack(v.title, v.description, durationToSeconds(v.duration))
      })),
      comments: mockComments,
      currentUser: mockUsers[0], // Elena Rostova default logged in
      subscriptions: [],
      hoveredVideoId: null,
      watchHistory: [],
      toast: null,
      settings: defaultSettings,
      searchQuery: '',
      categoryFilter: 'All',
      _hydratedFromFirebase: false,

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
          username: username.trim() || 'New Creator',
          handle: handle.trim().startsWith('@') ? handle.trim() : `@${handle.trim().replace(/\s/g,'').toLowerCase()}`,
          avatar: `https://i.pravatar.cc/300?u=${id}`,
          banner: `https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=400&fit=crop&seed=${id}`,
          subscribers: 0,
          verified: false,
          bio: 'New on Xinemax — creating cinematic stories.',
          publicEmail: '',
          joinedDate: new Date().toISOString(),
        }
        set(s => ({ users: [newUser, ...s.users], currentUser: newUser, subscriptions: [] }))
        syncUserToFirestore(newUser)
        if (db) fireAndForget(saveDoc('analytics', `user_create_${id}`, { type: 'user_create', userId: id, timestamp: new Date().toISOString() } as unknown as Record<string, unknown>))
      },

      updateProfile: (fields) => {
        const { currentUser, users, videos } = get()
        if (!currentUser) return
        const updatedUser: User = { ...currentUser, ...fields }
        if (fields.handle) {
          let h = fields.handle.trim()
          if (!h.startsWith('@')) h = '@' + h.replace(/\s/g, '').toLowerCase()
          updatedUser.handle = h
        }
        const newUsers = users.map(u => u.id === currentUser.id ? updatedUser : u)
        const newVideos = videos.map(v => v.channelId === currentUser.id ? {
          ...v,
          channelName: updatedUser.username,
          channelHandle: updatedUser.handle,
          channelAvatar: updatedUser.avatar,
        } : v)
        set({ currentUser: updatedUser, users: newUsers, videos: newVideos })
        syncUserToFirestore(updatedUser)
        // also sync updated videos silently
        newVideos.filter(v => v.channelId === currentUser.id).forEach(syncVideoToFirestore)
        // analytics
        if (db) fireAndForget(saveDoc('analytics', `profile_${currentUser.id}_${Date.now()}`, { type: 'profile_update', userId: currentUser.id, timestamp: new Date().toISOString() } as unknown as Record<string, unknown>))
      },

      updateSettings: (patch) => set(s => {
        const next = { ...s.settings, ...patch }
        if (s.currentUser) syncSettingsToFirestore(s.currentUser.id, next)
        return { settings: next }
      }),

      resetDatabase: () => {
        const vids = mockVideos.map(v => ({
          ...v,
          subtitles: generateSubtitlePack(v.title, v.description, durationToSeconds(v.duration))
        }))
        set({
          users: mockUsers,
          videos: vids,
          comments: mockComments,
          currentUser: mockUsers[0],
          subscriptions: [],
          watchHistory: [],
          toast: null,
          settings: defaultSettings,
          searchQuery: '',
          categoryFilter: 'All',
          hoveredVideoId: null,
        })
        // silent sync batch to Firestore
        if (db) {
          const batchDocs: Array<{ collection: string; id: string; data: Record<string, unknown> }> = []
          mockUsers.forEach(u => batchDocs.push({ collection: 'users', id: u.id, data: u as unknown as Record<string, unknown> }))
          vids.forEach(v => batchDocs.push({ collection: 'videos', id: v.id, data: v as unknown as Record<string, unknown> }))
          mockComments.forEach(c => batchDocs.push({ collection: 'comments', id: c.id, data: c as unknown as Record<string, unknown> }))
          fireAndForget(saveBatch(batchDocs))
        }
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
          const next = { ...v, likedBy, dislikedBy, likes, dislikes }
          syncVideoToFirestore(next)
          return next
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
          const next = { ...v, likedBy, dislikedBy, likes, dislikes }
          syncVideoToFirestore(next)
          return next
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
        syncSubscriptionToFirestore(currentUser.id, channelId, !isSub)
        const targetUser = newUsers.find(u => u.id === channelId)
        if (targetUser) syncUserToFirestore(targetUser)
        if (newCurrentUser.id === channelId) syncUserToFirestore(newCurrentUser)
      },

      isSubscribed: (channelId) => get().subscriptions.includes(channelId),

      addComment: (videoId, text) => {
        const { currentUser, settings } = get()
        if (!currentUser || !text.trim()) return
        if (settings.restrictComments) {
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
        syncCommentToFirestore(newComment)
        if (db) fireAndForget(saveDoc('analytics', `comment_${newComment.id}`, { type: 'comment', videoId, userId: currentUser.id, timestamp: newComment.timestamp } as unknown as Record<string, unknown>))
      },

      addVideo: (payload) => {
        const { currentUser } = get()
        if (!currentUser) throw new Error('Must be logged in')
        const id = `v_${Date.now()}`
        const isShort = (payload as unknown as Record<string, unknown>).format === 'shorts'
        const pack = generateSubtitlePack(
          (payload.title?.trim() || 'Untitled cinematic upload'),
          payload.description || '',
          durationToSeconds(payload.duration || (isShort ? '00:32' : '05:42'))
        )
        const newVideo: Video = {
          id,
          title: payload.title?.trim() || 'Untitled cinematic upload',
          description: payload.description || '',
          category: payload.category || 'Cinematography',
          thumbnail: payload.thumbnail || `https://picsum.photos/seed/${id}/640/360`,
          videoUrl: payload.videoUrl || 'https://commondatastorage.googleapis.com/gtb-videos-bucket/sample/BigBuckBunny.mp4',
          channelId: currentUser.id,
          channelName: currentUser.username,
          channelAvatar: currentUser.avatar,
          channelHandle: currentUser.handle,
          views: (payload as unknown as Record<string, unknown>).views as number ?? 0,
          likes: 0,
          dislikes: 0,
          likedBy: [],
          dislikedBy: [],
          duration: payload.duration || (isShort ? '00:32' : '05:42'),
          uploadDate: new Date().toISOString(),
          tags: payload.tags || (isShort ? ['Shorts', 'Vertical', 'Xinemax'] : ['8K', 'Cinematic', 'Xinemax']),
          watchTimeMinutes: 0,
          format: (payload as unknown as Record<string, unknown>).format as Video['format'] ?? 'long',
          subtitles: pack,
        }
        set(s => ({ videos: [newVideo, ...s.videos] }))
        syncVideoToFirestore(newVideo)
        if (db) fireAndForget(saveDoc('analytics', `video_${id}`, { type: 'video_create', videoId: id, channelId: currentUser.id, format: newVideo.format, timestamp: newVideo.uploadDate } as unknown as Record<string, unknown>))
        return id
      },

      deleteVideo: (videoId) => {
        set(s => ({ videos: s.videos.filter(v => v.id !== videoId), comments: s.comments.filter(c => c.videoId !== videoId) }))
        // Firestore deletes are best-effort; we mark as deleted silently
        if (db) fireAndForget(saveDoc('videos', videoId, { deleted: true, deletedAt: new Date().toISOString() } as unknown as Record<string, unknown>))
      },

      incrementView: (videoId) => {
        set(s => ({ videos: s.videos.map(v => v.id === videoId ? { ...v, views: v.views + 1 } : v) }))
        get().addToHistory(videoId)
        const vid = get().videos.find(v => v.id === videoId)
        if (vid) {
          syncVideoToFirestore({ ...vid, views: vid.views + 1 } as Video)
          if (db) fireAndForget(saveDoc('analytics', `view_${videoId}_${Date.now()}`, { type: 'view', videoId, timestamp: new Date().toISOString() } as unknown as Record<string, unknown>))
        }
      },

      hydrateFromFirestore: async () => {
        if (!db || get()._hydratedFromFirebase) return
        try {
          // Explicit TypeScript handling — never assume Firestore returns data
          const [videos, users, comments] = await Promise.all([
            fetchCollectionDocs<Video>('videos'),
            fetchCollectionDocs<User>('users'),
            fetchCollectionDocs<Comment>('comments'),
          ])

          // Only hydrate if Firestore actually has data (prevents 404/tearing)
          // Guard against undefined / empty
          const updates: Partial<AppState> = {}
          let hasUpdate = false

          if (videos !== null && Array.isArray(videos) && videos.length > 0) {
            // Ensure subtitles present, validate shape
            const safeVideos: Video[] = videos
              .filter((v): v is Video => typeof (v as unknown as Record<string, unknown>).id === 'string' && typeof (v as unknown as Record<string, unknown>).title === 'string')
              .map(v => ({
                ...v,
                subtitles: (v as unknown as Record<string, unknown>).subtitles as Video['subtitles'] ?? generateSubtitlePack(v.title, v.description, durationToSeconds(v.duration)),
                format: (v as unknown as Record<string, unknown>).format as Video['format'] ?? 'long',
              }))
            if (safeVideos.length > 0) {
              updates.videos = safeVideos
              hasUpdate = true
            }
          }

          if (users !== null && Array.isArray(users) && users.length > 0) {
            const safeUsers = users.filter((u): u is User => typeof (u as unknown as Record<string, unknown>).id === 'string' && typeof (u as unknown as Record<string, unknown>).username === 'string')
            if (safeUsers.length > 0) {
              updates.users = safeUsers
              const current = get().currentUser
              if (current) {
                const refreshed = safeUsers.find(u => u.id === current.id)
                if (refreshed) updates.currentUser = refreshed
              }
              hasUpdate = true
            }
          }

          if (comments !== null && Array.isArray(comments) && comments.length > 0) {
            const safeComments = comments.filter((c): c is Comment => typeof (c as unknown as Record<string, unknown>).id === 'string' && typeof (c as unknown as Record<string, unknown>).videoId === 'string')
            if (safeComments.length > 0) {
              updates.comments = safeComments
              hasUpdate = true
            }
          }

          // Also fetch settings for current user
          const currentUser = get().currentUser
          if (currentUser) {
            const remoteSettings = await fetchDoc<Settings>('settings', currentUser.id)
            if (remoteSettings !== null && typeof (remoteSettings as unknown as Record<string, unknown>).theme === 'string') {
              updates.settings = { ...defaultSettings, ...(remoteSettings as unknown as Settings) }
              hasUpdate = true
            }
          }

          if (hasUpdate) {
            set({ ...updates, _hydratedFromFirebase: true })
          } else {
            // Mark hydrated even if empty to avoid loop, but keep local fallback
            set({ _hydratedFromFirebase: true })
          }
        } catch {
          // Silent fallback — never tear UI with 404/undefined
          set({ _hydratedFromFirebase: true })
        }
      },

      ensureVideoSubtitles: (videoId: string) => {
        const vid = get().videos.find(v => v.id === videoId)
        if (!vid || vid.subtitles) return
        const pack = generateSubtitlePack(vid.title, vid.description, durationToSeconds(vid.duration))
        const updated = get().videos.map(v => v.id === videoId ? { ...v, subtitles: pack } : v)
        set({ videos: updated })
        syncVideoToFirestore({ ...vid, subtitles: pack })
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
      version: 5,
      migrate: (persistedState, version) => {
        // Ensure subtitles exist after migration
        const s = persistedState as Partial<AppState>
        if (s.videos && Array.isArray(s.videos)) {
          s.videos = s.videos.map((v: Video) => ({
            ...v,
            subtitles: (v as unknown as Record<string, unknown>).subtitles as Video['subtitles'] ?? generateSubtitlePack(v.title, v.description, durationToSeconds(v.duration)),
          }))
        }
        return s as AppState
      },
    }
  )
)

// Eager hydrate helper for App.tsx — fire once, silent
export function initFirebaseSync() {
  // Delay slightly to let persist rehydrate first
  setTimeout(() => {
    const state = useStore.getState()
    if (!state._hydratedFromFirebase) {
      state.hydrateFromFirestore().catch(() => {})
    }
    // Ensure all videos have subtitles (client-side VTT simulation)
    const vids = useStore.getState().videos
    vids.forEach(v => {
      if (!v.subtitles) useStore.getState().ensureVideoSubtitles(v.id)
    })
  }, 800)
}
