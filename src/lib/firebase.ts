// src/lib/firebase.ts
import { initializeApp, getApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';
import { getRemoteConfig, type RemoteConfig } from 'firebase/remote-config';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

let firebaseAppInstance: FirebaseApp | undefined;
let authInstance: Auth | undefined;
let dbInstance: Firestore | undefined;
let storageInstance: FirebaseStorage | undefined;
let remoteConfigInstance: RemoteConfig | undefined;

function createFirebaseApp(): FirebaseApp | null {
  const requiredEnvVars: Record<string, string | undefined> = {
    NEXT_PUBLIC_FIREBASE_API_KEY: firebaseConfig.apiKey,
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: firebaseConfig.authDomain,
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: firebaseConfig.projectId,
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: firebaseConfig.storageBucket,
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: firebaseConfig.messagingSenderId,
    NEXT_PUBLIC_FIREBASE_APP_ID: firebaseConfig.appId,
  };

  const missingKeys = Object.entries(requiredEnvVars)
    .filter(([_, value]) => !value)
    .map(([key]) => key);

  if (missingKeys.length > 0) {
    console.error(
      `Firebase configuration is incomplete. The following environment variables are missing or empty: ${missingKeys.join(
        ", "
      )}. Please check your .env.local file or your hosting environment's configuration.`
    );
    return null;
  }

  try {
    if (getApps().length === 0) {
      firebaseAppInstance = initializeApp(firebaseConfig);
    } else {
      firebaseAppInstance = getApp();
    }
    return firebaseAppInstance;
  } catch (error: any) {
    console.error("Firebase initialization error:", error.message || error);
    return null;
  }
}

async function initializeFirebaseServices(app: FirebaseApp | null) {
  if (app) {
    try {
      authInstance = getAuth(app);
      dbInstance = getFirestore(app);
      storageInstance = getStorage(app);
      remoteConfigInstance = getRemoteConfig(app);
      // Perform initial fetch and activate for Remote Config if needed
      // For example:
      // await fetchAndActivate(remoteConfigInstance);
    } catch (e: any) {
      console.error('Error initializing Firebase services:', e.message || e);
    }
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