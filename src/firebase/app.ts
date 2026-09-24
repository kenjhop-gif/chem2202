import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
import { firebaseConfig } from './config';

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
// Local cache keeps the app usable on flaky school Wi-Fi; writes sync when back online.
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
});
