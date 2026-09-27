import { initializeApp } from 'firebase/app'
import { getAuth, connectAuthEmulator } from 'firebase/auth'
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore'
import { getStorage, connectStorageEmulator } from 'firebase/storage'
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions'

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY     || 'demo-api-key',
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'demo-project.firebaseapp.com',
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID  || 'demo-project',
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'demo-project.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '123456789',
  appId:             import.meta.env.VITE_FIREBASE_APP_ID || '1:123456789:web:abcdef',
}

const app      = initializeApp(firebaseConfig)
export const auth      = getAuth(app)
export const db        = getFirestore(app)
export const storage   = getStorage(app)
export const functions = getFunctions(app)

// Connect to local emulators when VITE_USE_EMULATORS=true
if (import.meta.env.VITE_USE_EMULATORS === 'true') {
  try {
    connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true })
  } catch (e) {
    console.warn('Auth emulator init notice:', e.message)
  }
  try {
    connectFirestoreEmulator(db, '127.0.0.1', 8080)
  } catch (e) {
    console.warn('Firestore emulator init notice:', e.message)
  }
  try {
    connectStorageEmulator(storage, '127.0.0.1', 9199)
  } catch (e) {
    console.warn('Storage emulator init notice:', e.message)
  }
  try {
    connectFunctionsEmulator(functions, '127.0.0.1', 5001)
  } catch (e) {
    console.warn('Functions emulator init notice:', e.message)
  }
}

export default app
