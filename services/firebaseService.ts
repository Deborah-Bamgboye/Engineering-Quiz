
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getFirestore, collection, addDoc, query, orderBy, limit, getDocs, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { Attempt } from '../types';

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
  if (firebaseConfig.apiKey && firebaseConfig.apiKey !== "") {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    isFirebaseEnabled = true;
  }
} catch (e) {
  console.warn("Firebase initialization skipped or failed. Falling back to local storage.", e);
}

const LOCAL_STORAGE_KEY = 'eng_quiz_local_attempts';

export const saveQuizAttempt = async (score: number, total: number, codeName: string) => {
  const attempt = {
    score,
    total,
    codeName,
    percentage: (score / total) * 100,
    timestamp: new Date().toISOString(),
    id: Math.random().toString(36).substr(2, 9)
  };

  const localData = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]');
  const updatedLocal = [attempt, ...localData].slice(0, 20);
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
  return localData;
};

export const getGlobalAttempts = async (): Promise<Attempt[]> => {
  if (isFirebaseEnabled && db) {
    try {
      const q = query(collection(db, "attempts"), orderBy("timestamp", "desc"), limit(50));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate?.()?.toISOString() || new Date().toISOString()
      })) as Attempt[];
    } catch (e) {
      console.error("Failed to fetch global attempts", e);
    }
  }
  return JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]');
};
