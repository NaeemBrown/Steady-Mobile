import { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword,
  sendPasswordResetEmail, signOut, updateProfile,
  GoogleAuthProvider, signInWithCredential,
} from "firebase/auth";
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import * as AuthSession from "expo-auth-session";
import { getFirebaseAuth } from "../lib/firebase.js";
import {
  createUserProfile, getUserProfile, updateUserProfile,
  loadEvents, addEvent, addEvents, updateEvent, deleteEvent,
  loadPeople, addPerson, updatePerson, deletePerson,
  loadCalendarSources, seedCalendarSources, recomputeAndSaveAnalytics,
} from "../services/firestoreService.js";

WebBrowser.maybeCompleteAuthSession();

const AuthContext = createContext(null);
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth() must be inside <AuthProvider>");
  return ctx;
}

const DEFAULT_SOURCES = [
  { id: "work",     name: "Work Calendar",     color: "#6C5CE7", synced: false, events: 0 },
  { id: "personal", name: "Personal Calendar", color: "#2ED47A", synced: false, events: 0 },
  { id: "google",   name: "Google Calendar",   color: "#4285F4", synced: false, events: 0 },
  { id: "outlook",  name: "Outlook Calendar",  color: "#0078D4", synced: false, events: 0 },
];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* ── Google OAuth ─────────────────────────────────────────────── */
  const [_req, response, promptAsync] = Google.useAuthRequest({
    androidClientId: "1055600309782-k0cb31lislmcphci9498h9vavhvqeck0.apps.googleusercontent.com",
    webClientId:     "1055600309782-ucqbcrl2oam1pdco9tnvb87emm82n27t.apps.googleusercontent.com",
    expoClientId:    "1055600309782-ucqbcrl2oam1pdco9tnvb87emm82n27t.apps.googleusercontent.com",
    redirectUri: AuthSession.makeRedirectUri({ useProxy: true }),
  });

  useEffect(() => {
    if (response?.type === "success") {
      const { id_token } = response.params;
      const cred = GoogleAuthProvider.credential(id_token);
      signInWithCredential(getFirebaseAuth(), cred).then(async (result) => {
        const u = result.user;
        let profile = null;
        try { profile = await getUserProfile(u.uid); } catch {}
        if (!profile) {
          await createUserProfile(u.uid, { displayName: u.displayName, email: u.email });
          await seedCalendarSources(u.uid, DEFAULT_SOURCES);
        }
      }).catch(err => setError(friendlyError(err.code)));
    }
  }, [response]);

  /* ── Auth listener ────────────────────────────────────────────── */
  useEffect(() => {
    const unsub = onAuthStateChanged(getFirebaseAuth(), async (fbUser) => {
      if (fbUser) {
        let profile = null;
        try { profile = await getUserProfile(fbUser.uid); } catch {}
        setUser({
          uid: fbUser.uid, email: fbUser.email,
          displayName: fbUser.displayName || profile?.displayName || "",
          photoURL: fbUser.photoURL || null,
          theme: profile?.theme || "midnight",
          ...(profile || {}),
        });
      } else { setUser(null); }
      setLoading(false);
    });
    return unsub;
  }, []);

  /* ── Email/password auth ──────────────────────────────────────── */
  const login = useCallback(async (email, pw) => {
    setError("");
    try { await signInWithEmailAndPassword(getFirebaseAuth(), email, pw); }
    catch (e) { setError(friendlyError(e.code)); throw e; }
  }, []);

  const signup = useCallback(async (email, pw, displayName) => {
    setError("");
    try {
      const cred = await createUserWithEmailAndPassword(getFirebaseAuth(), email, pw);
      await updateProfile(cred.user, { displayName });
      await createUserProfile(cred.user.uid, { displayName, email });
      await seedCalendarSources(cred.user.uid, DEFAULT_SOURCES);
    } catch (e) { setError(friendlyError(e.code)); throw e; }
  }, []);

  const resetPassword = useCallback(async (email) => {
    setError("");
    try { await sendPasswordResetEmail(getFirebaseAuth(), email); }
    catch (e) { setError(friendlyError(e.code)); throw e; }
  }, []);

  const googleSignIn = useCallback(() => {
    setError("");
    promptAsync({ useProxy: true });
  }, [promptAsync]);

  const logout = useCallback(async () => {
    await signOut(getFirebaseAuth()); setUser(null);
  }, []);

  /* ── Firestore CRUD ───────────────────────────────────────────── */
  const getUserEvents      = useCallback(async () => user?.uid ? loadEvents(user.uid) : [], [user]);
  const _createEvent       = useCallback(async (d) => user?.uid ? addEvent(user.uid, d) : null, [user]);
  const _createEvents      = useCallback(async (a) => user?.uid ? addEvents(user.uid, a) : [], [user]);
  const _editEvent         = useCallback(async (id, u) => user?.uid && updateEvent(user.uid, id, u), [user]);
  const _removeEvent       = useCallback(async (id) => user?.uid && deleteEvent(user.uid, id), [user]);
  const getUserPeople      = useCallback(async () => user?.uid ? loadPeople(user.uid) : [], [user]);
  const _createPerson      = useCallback(async (d) => user?.uid ? addPerson(user.uid, d) : null, [user]);
  const _editPerson        = useCallback(async (id, u) => user?.uid && updatePerson(user.uid, id, u), [user]);
  const _removePerson      = useCallback(async (id) => user?.uid && deletePerson(user.uid, id), [user]);
  const getCalendarSources = useCallback(async () => user?.uid ? loadCalendarSources(user.uid) : [], [user]);
  const refreshAnalytics   = useCallback(async (evs) => user?.uid && recomputeAndSaveAnalytics(user.uid, evs), [user]);
  const patchProfile       = useCallback(async (u) => user?.uid && updateUserProfile(user.uid, u), [user]);

  return (
    <AuthContext.Provider value={{
      user, loading, error, setError,
      login, signup, resetPassword, googleSignIn, logout,
      getUserEvents, createEvent: _createEvent, createEvents: _createEvents,
      editEvent: _editEvent, removeEvent: _removeEvent,
      getUserPeople, createPerson: _createPerson, editPerson: _editPerson, removePerson: _removePerson,
      getCalendarSources, refreshAnalytics, patchProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

function friendlyError(code) {
  const map = {
    "auth/invalid-email":          "Enter a valid email.",
    "auth/user-disabled":          "Account disabled.",
    "auth/user-not-found":         "No account with that email.",
    "auth/wrong-password":         "Wrong password.",
    "auth/invalid-credential":     "Invalid email or password.",
    "auth/email-already-in-use":   "Email already registered.",
    "auth/weak-password":          "Password too short (6+ chars).",
    "auth/too-many-requests":      "Too many attempts. Wait a minute.",
    "auth/network-request-failed": "Network error.",
    "auth/popup-closed-by-user":   "",
  };
  return map[code] || (code ? `Error: ${code}` : "Something went wrong.");
}

export default AuthProvider;