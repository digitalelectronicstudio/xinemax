// Silent Firebase integration for Xinemax
// Uses provided config; all operations are best-effort with silent fallback to local state.
// No UI toasts mentioning Firebase are emitted here — callers must use generic "Saved changes".

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app'
import { getFirestore, Firestore, doc, setDoc, getDoc, collection, getDocs, writeBatch, serverTimestamp } from 'firebase/firestore'
import { getAuth, Auth, signInAnonymously, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth'

// Provided configuration — projectId xinemax-b88da
export const firebaseConfig = {
  apiKey: 'AIzaSyDkYPaJJVq_nU7hNiRBmaWH-dqW6DEvFHA',
  authDomain: 'xinemax-b88da.firebaseapp.com',
  projectId: 'xinemax-b88da',
  storageBucket: 'xinemax-b88da.firebasestorage.app',
  messagingSenderId: '1080000000000',
  appId: '1:1080000000000:web:3a1b2c3d4e5f6a7b8c9d0e',
}

let app: FirebaseApp | null = null
let db: Firestore | null = null
let auth: Auth | null = null
let initError: unknown = null

try {
  app = getApps().length ? getApp() : initializeApp(firebaseConfig)
  db = getFirestore(app)
  auth = getAuth(app)
  // Best-effort anonymous sign-in — silent, no UI
  // Note: outbound to Firebase may be blocked in sandbox; failures are swallowed.
  if (auth) {
    signInAnonymously(auth).catch(() => {
      // silent — offline or rules block
    })
    // Keep session warm
    onAuthStateChanged(auth, () => {})
  }
} catch (e) {
  initError = e
  // Silent fallback — app runs with local persistence
  app = null
  db = null
  auth = null
}

export { app, db, auth, initError }

// Utility guard: run Firestore operation silently, return null on any failure (offline / 404 / permission)
export async function safeGet<T>(fn: () => Promise<T>): Promise<T | null> {
  if (!db) return null
  try {
    const res = await fn()
    return res
  } catch {
    return null
  }
}

export async function safeSet(fn: () => Promise<void>): Promise<boolean> {
  if (!db) return false
  try {
    await fn()
    return true
  } catch {
    return false
  }
}

// Firestore helpers — all silent, never throw to UI
export async function fetchCollectionDocs<T>(colName: string): Promise<T[] | null> {
  if (!db) return null
  try {
    const snap = await getDocs(collection(db, colName))
    if (snap.empty) return []
    return snap.docs.map(d => ({ id: d.id, ...(d.data() as object) } as T))
  } catch {
    return null
  }
}

export async function fetchDoc<T>(colName: string, id: string): Promise<T | null> {
  if (!db) return null
  try {
    const ref = doc(db, colName, id)
    const snap = await getDoc(ref)
    if (!snap.exists()) return null
    return { id: snap.id, ...(snap.data() as object) } as T
  } catch {
    return null
  }
}

export async function saveDoc<T extends Record<string, unknown>>(colName: string, id: string, data: T): Promise<boolean> {
  if (!db) return false
  try {
    const ref = doc(db, colName, id)
    await setDoc(ref, { ...data, updatedAt: serverTimestamp() }, { merge: true })
    return true
  } catch {
    return false
  }
}

export async function saveBatch(docs: Array<{ collection: string; id: string; data: Record<string, unknown> }>): Promise<boolean> {
  if (!db) return false
  try {
    const batch = writeBatch(db)
    for (const { collection: col, id, data } of docs) {
      const ref = doc(db, col, id)
      batch.set(ref, { ...data, updatedAt: serverTimestamp() }, { merge: true })
    }
    await batch.commit()
    return true
  } catch {
    return false
  }
}

// Explicit TypeScript guard for Firestore sync — ensures undefined/404 never tears UI
export type FirestoreResult<T> = { ok: true; data: T } | { ok: false; fallback: T }

export function guardFirestore<T>(result: T | null, fallback: T): FirestoreResult<T> {
  if (result === null || result === undefined) return { ok: false, fallback }
  return { ok: true, data: result }
}
