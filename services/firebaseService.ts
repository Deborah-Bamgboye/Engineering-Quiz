
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getFirestore, collection, addDoc, query, orderBy, limit, getDocs, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

/**
 * We use process.env to allow these values to be injected securely by Vercel.
 * If these are not provided, the app gracefully falls back to LocalStorage.
 */
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || "", 
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.FIREBASE_APP_ID || ""
};

let db: any = null;
let isFirebaseEnabled = false;

try {
  // Only attempt initialization if an API key is actually provided in the environment
  if (firebaseConfig.apiKey && firebaseConfig.apiKey !== "") {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    isFirebaseEnabled = true;
  }
} catch (e) {
  console.warn("Firebase initialization skipped or failed. Falling back to local storage.", e);
}

const LOCAL_STORAGE_KEY = 'eng_quiz_local_attempts';

export const saveQuizAttempt = async (score: number, total: number) => {
  const attempt = {
    score,
    total,
    percentage: (score / total) * 100,
    timestamp: new Date().toISOString(),
    id: Math.random().toString(36).substr(2, 9)
  };

  // Always save to local storage for offline support and immediate persistence
  const localData = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]');
  const updatedLocal = [attempt, ...localData].slice(0, 10);
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedLocal));

  if (isFirebaseEnabled && db) {
    try {
      await addDoc(collection(db, "attempts"), {
        ...attempt,
        timestamp: serverTimestamp(),
      });
    } catch (e) {
      console.error("Cloud save failed:", e);
    }
  }
  return attempt.id;
};

export const getRecentAttempts = async () => {
  const localData = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]');

  if (isFirebaseEnabled && db) {
    try {
      const q = query(collection(db, "attempts"), orderBy("timestamp", "desc"), limit(5));
      const querySnapshot = await getDocs(q);
      const cloudData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate?.()?.toISOString() || new Date().toISOString()
      }));
      return cloudData.length > 0 ? cloudData : localData;
    } catch (e) {
      console.warn("Using local history fallback.");
      return localData;
    }
  }
  
  return localData;
};
