import { initializeApp, getApps } from "firebase/app";
// Added getAuth here to pull the existing instance
import { initializeAuth, getReactNativePersistence, getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";

const firebaseConfig = {
  apiKey:            "AIzaSyAfqAZlKqcmEiKYRY2IBGYdTKnzgXbRAZM",
  authDomain:        "synccalaccounts.firebaseapp.com",
  projectId:         "synccalaccounts",
  storageBucket:     "synccalaccounts.firebasestorage.app",
  messagingSenderId: "933414381924",
  appId:             "1:933414381924:web:c90dce4234e724ec8ef271",
  measurementId:     "G-PV2D9HCSW5",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const db = getFirestore(app);

let _auth = null;
export function getFirebaseAuth() {
  if (!_auth) {
    try {
      // Try to initialize it normally
      _auth = initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage),
      });
    } catch (error) {
      // If Metro hot-reloads and Firebase says it's already initialized,
      // just grab the existing auth instance.
      _auth = getAuth(app);
    }
  }
  return _auth;
}

export default app;r