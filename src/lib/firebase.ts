// src/lib/firebase.ts
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getRemoteConfig } from 'firebase/remote-config';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

let firebaseAppInstance;

function createFirebaseApp() {
  try {
    firebaseAppInstance = getApps().length ? getApp() : initializeApp(firebaseConfig);
    return firebaseAppInstance;
  } catch (error) {
    console.error("Firebase initialization error:", error);
    return null;
  }
}

let authInstance;
let dbInstance;
let storageInstance;
let remoteConfigInstance;

async function initializeFirebaseServices(app: any) {
  if (app) {
    authInstance = getAuth(app);
    dbInstance = getFirestore(app);
    storageInstance = getStorage(app);
    remoteConfigInstance = getRemoteConfig(app);
  }
}


export { 
    createFirebaseApp,
    initializeFirebaseServices,
    authInstance as auth, 
    dbInstance as db, 
    storageInstance as storage, 
    remoteConfigInstance as remoteConfig 
};
