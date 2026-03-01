/**
 * firestoreService.js
 * ─────────────────────────────────────────────────────────────────────────────
 * ALL Firestore reads/writes live here.  Nothing else in the app should import
 * `db` directly — go through these functions so the auth-scoping is enforced
 * in one place.
 *
 * Firestore schema
 * ────────────────
 * users/{uid}                     → profile doc  (displayName, email, theme, createdAt)
 * users/{uid}/events/{eventId}    → event docs
 * users/{uid}/people/{personId}   → contact docs
 * users/{uid}/calendarSources/{id}→ calendar source docs
 * users/{uid}/analytics/summary   → computed analytics snapshot
 * users/{uid}/oauthTokens/google  → Google OAuth tokens  (server-side ideally, stored here for now)
 * users/{uid}/oauthTokens/microsoft → MS Graph tokens
 */

import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";
import { db } from "../lib/firebase.js";

// ─── helpers ──────────────────────────────────────────────────────────────────

/** Throw if no uid — this is the single auth-gate for all writes. */
function requireUid(uid) {
  if (!uid) throw new Error("Not authenticated — uid is required.");
}

// Sub-collection refs scoped to the current user
const eventsCol   = (uid) => collection(db, "users", uid, "events");
const peopleCol   = (uid) => collection(db, "users", uid, "people");
const sourcesCol  = (uid) => collection(db, "users", uid, "calendarSources");
const analyticsDoc = (uid) => doc(db, "users", uid, "analytics", "summary");
const oauthDoc    = (uid, provider) => doc(db, "users", uid, "oauthTokens", provider);
const profileDoc  = (uid) => doc(db, "users", uid);


// ─── USER PROFILE ─────────────────────────────────────────────────────────────

/** Create or overwrite the user's profile document on first sign-up. */
export async function createUserProfile(uid, { displayName, email, theme = "midnight" }) {
  requireUid(uid);
  await setDoc(profileDoc(uid), {
    displayName,
    email,
    theme,
    createdAt: serverTimestamp(),
  });
}

/** Fetch the user's profile. Returns null if it doesn't exist yet. */
export async function getUserProfile(uid) {
  requireUid(uid);
  const snap = await getDoc(profileDoc(uid));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

/** Patch any fields on the profile (e.g. theme change). */
export async function updateUserProfile(uid, updates) {
  requireUid(uid);
  await updateDoc(profileDoc(uid), { ...updates, updatedAt: serverTimestamp() });
}


// ─── EVENTS ───────────────────────────────────────────────────────────────────

/** Load ALL events for this user, sorted by day. */
export async function loadEvents(uid) {
  requireUid(uid);
  const q = query(eventsCol(uid), orderBy("day", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ firestoreId: d.id, ...d.data() }));
}

/** Add a single event. Returns the new Firestore doc id. */
export async function addEvent(uid, event) {
  requireUid(uid);
  const ref = await addDoc(eventsCol(uid), {
    ...event,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

/**
 * Bulk-add multiple events (e.g. recurring events or initial seed).
 * Uses a batched write for efficiency.
 */
export async function addEvents(uid, eventArray) {
  requireUid(uid);
  const batch = writeBatch(db);
  const ids = [];
  for (const event of eventArray) {
    const ref = doc(eventsCol(uid)); // auto-id
    batch.set(ref, { ...event, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
    ids.push(ref.id);
  }
  await batch.commit();
  return ids;
}

/** Update specific fields on an existing event. */
export async function updateEvent(uid, firestoreId, updates) {
  requireUid(uid);
  await updateDoc(doc(eventsCol(uid), firestoreId), {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

/** Delete a single event. */
export async function deleteEvent(uid, firestoreId) {
  requireUid(uid);
  await deleteDoc(doc(eventsCol(uid), firestoreId));
}

/**
 * Replace ALL events in one transaction (e.g. after a calendar sync).
 * Deletes every existing doc then writes fresh ones.
 */
export async function replaceAllEvents(uid, eventArray) {
  requireUid(uid);
  // Delete existing
  const existingSnap = await getDocs(eventsCol(uid));
  const deleteBatch = writeBatch(db);
  existingSnap.docs.forEach((d) => deleteBatch.delete(d.ref));
  await deleteBatch.commit();
  // Write new
  return addEvents(uid, eventArray);
}


// ─── PEOPLE / CONTACTS ────────────────────────────────────────────────────────

/** Load all contacts for this user. */
export async function loadPeople(uid) {
  requireUid(uid);
  const snap = await getDocs(peopleCol(uid));
  return snap.docs.map((d) => ({ firestoreId: d.id, ...d.data() }));
}

/** Add a new contact. */
export async function addPerson(uid, person) {
  requireUid(uid);
  const ref = await addDoc(peopleCol(uid), {
    ...person,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

/** Update a contact (e.g. increment meetings, toggle starred). */
export async function updatePerson(uid, firestoreId, updates) {
  requireUid(uid);
  await updateDoc(doc(peopleCol(uid), firestoreId), updates);
}

/** Delete a contact. */
export async function deletePerson(uid, firestoreId) {
  requireUid(uid);
  await deleteDoc(doc(peopleCol(uid), firestoreId));
}

/**
 * Upsert people array — replaces entire collection.
 * Useful when syncing contacts from a third-party calendar.
 */
export async function replacePeople(uid, peopleArray) {
  requireUid(uid);
  const existingSnap = await getDocs(peopleCol(uid));
  const batch = writeBatch(db);
  existingSnap.docs.forEach((d) => batch.delete(d.ref));
  for (const person of peopleArray) {
    const ref = doc(peopleCol(uid));
    batch.set(ref, { ...person, createdAt: serverTimestamp() });
  }
  await batch.commit();
}


// ─── CALENDAR SOURCES ─────────────────────────────────────────────────────────

/** Load all calendar sources for this user. */
export async function loadCalendarSources(uid) {
  requireUid(uid);
  const snap = await getDocs(sourcesCol(uid));
  return snap.docs.map((d) => ({ firestoreId: d.id, ...d.data() }));
}

/** Set the initial default calendar sources on account creation. */
export async function seedCalendarSources(uid, sources) {
  requireUid(uid);
  const batch = writeBatch(db);
  for (const source of sources) {
    const ref = doc(sourcesCol(uid), source.id); // use human-readable id as doc id
    batch.set(ref, { ...source, createdAt: serverTimestamp() });
  }
  await batch.commit();
}

/** Update a calendar source (e.g. toggle synced, update event count). */
export async function updateCalendarSource(uid, sourceId, updates) {
  requireUid(uid);
  const payload = { ...updates };
  if (updates.synced === true) payload.lastSynced = new Date().toISOString();
  await updateDoc(doc(sourcesCol(uid), sourceId), payload);
}


// ─── ANALYTICS SNAPSHOT ───────────────────────────────────────────────────────

/**
 * Persist a lightweight analytics snapshot so the Analytics page can load
 * instantly without re-computing from scratch every session.
 */
export async function saveAnalyticsSnapshot(uid, snapshot) {
  requireUid(uid);
  await setDoc(analyticsDoc(uid), {
    ...snapshot,
    computedAt: serverTimestamp(),
  });
}

export async function loadAnalyticsSnapshot(uid) {
  requireUid(uid);
  const snap = await getDoc(analyticsDoc(uid));
  return snap.exists() ? snap.data() : null;
}

/**
 * Compute an analytics snapshot from the provided events array and save it.
 * Call this after any significant change to the events collection.
 */
export async function recomputeAndSaveAnalytics(uid, events) {
  requireUid(uid);
  const byType = {};
  const bySource = {};
  const byHour = {};

  for (const ev of events) {
    // by type
    byType[ev.type] = (byType[ev.type] || 0) + 1;
    // by source
    bySource[ev.source] = (bySource[ev.source] || 0) + 1;
    // by hour
    if (ev.time && ev.time !== "All day") {
      const hour = parseInt(ev.time.split(":")[0], 10);
      byHour[hour] = (byHour[hour] || 0) + 1;
    }
  }

  const snapshot = {
    totalEvents: events.length,
    byType,
    bySource,
    byHour,
  };

  await saveAnalyticsSnapshot(uid, snapshot);
  return snapshot;
}


// ─── OAUTH TOKEN STORAGE ──────────────────────────────────────────────────────
// NOTE: In production you'd store access tokens server-side (Cloud Functions).
// Storing them in Firestore is acceptable for a client-side MVP but make sure
// Firestore Security Rules restrict reads to `request.auth.uid == userId`.

/** Persist OAuth tokens for a provider ("google" | "microsoft"). */
export async function saveOAuthTokens(uid, provider, tokens) {
  requireUid(uid);
  await setDoc(oauthDoc(uid, provider), {
    ...tokens,
    savedAt: serverTimestamp(),
  });
}

/** Retrieve stored OAuth tokens for a provider. */
export async function getOAuthTokens(uid, provider) {
  requireUid(uid);
  const snap = await getDoc(oauthDoc(uid, provider));
  return snap.exists() ? snap.data() : null;
}

/** Remove stored tokens (on disconnect / revoke). */
export async function deleteOAuthTokens(uid, provider) {
  requireUid(uid);
  await deleteDoc(oauthDoc(uid, provider));
}