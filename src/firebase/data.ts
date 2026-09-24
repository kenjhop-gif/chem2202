// Firestore data model (see firestore.rules for who can read and write what).
//
//   users/{uid}                       UserProfile
//   users/{uid}/attempts/{id}         AttemptRecord (practice log, never grades)
//   linkCodes/{code}                  { studentUid } — a student's code for linking a parent
//   links/{studentUid}_{parentUid}    ParentLink — a parent can view that student's progress
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db } from './app';
import type { AttemptRecord } from '../progress/store';
import type { Prefs } from '../progress/prefs';

export type Role = 'student' | 'parent' | 'admin';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: Role;
  disabled: boolean;
  /** Subscription hook for later; everyone has access for now. */
  hasAccess: boolean;
  linkCode?: string;
  prefs?: Prefs;
  createdAt?: unknown;
}

export interface ParentLink {
  id: string;
  studentUid: string;
  parentUid: string;
  studentName: string;
  parentName: string;
  code: string;
}

export const userRef = (uid: string) => doc(db, 'users', uid);
const attemptsCol = (uid: string) => collection(db, 'users', uid, 'attempts');

export async function createProfile(uid: string, email: string, displayName: string, role: 'student' | 'parent') {
  await setDoc(userRef(uid), {
    uid,
    email,
    displayName,
    role,
    disabled: false,
    hasAccess: true,
    createdAt: serverTimestamp(),
  });
}

export function watchProfile(uid: string, cb: (p: UserProfile | null) => void, onError?: (e: Error) => void) {
  return onSnapshot(userRef(uid), (s) => cb(s.exists() ? (s.data() as UserProfile) : null), onError);
}

export function updateOwnProfile(uid: string, patch: Partial<Pick<UserProfile, 'displayName' | 'prefs' | 'linkCode'>>) {
  return updateDoc(userRef(uid), patch);
}

export function watchAllUsers(cb: (users: UserProfile[]) => void, onError?: (e: Error) => void) {
  return onSnapshot(collection(db, 'users'), (s) => cb(s.docs.map((d) => d.data() as UserProfile)), onError);
}

export function adminUpdateUser(uid: string, patch: Partial<Pick<UserProfile, 'role' | 'disabled' | 'hasAccess'>>) {
  return updateDoc(userRef(uid), patch);
}

// ---------- Attempts ----------

export function watchAttempts(uid: string, cb: (a: AttemptRecord[]) => void, onError?: (e: Error) => void) {
  return onSnapshot(attemptsCol(uid), (s) => cb(s.docs.map((d) => d.data() as AttemptRecord)), onError);
}

export function saveAttempt(uid: string, record: AttemptRecord) {
  return setDoc(doc(attemptsCol(uid), record.id), record);
}

export async function saveAttempts(uid: string, records: AttemptRecord[]) {
  for (let i = 0; i < records.length; i += 400) {
    const batch = writeBatch(db);
    for (const r of records.slice(i, i + 400)) batch.set(doc(attemptsCol(uid), r.id), r);
    await batch.commit();
  }
}

// ---------- Parent links ----------

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O or 1/I

function randomCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  return [...bytes].map((b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join('');
}

/** Creates (or replaces) a student's link code. */
export async function newLinkCode(uid: string, studentName: string, previous?: string): Promise<string> {
  const code = randomCode();
  await setDoc(doc(db, 'linkCodes', code), { studentUid: uid, studentName, createdAt: serverTimestamp() });
  await updateOwnProfile(uid, { linkCode: code });
  if (previous) await deleteDoc(doc(db, 'linkCodes', previous)).catch(() => undefined);
  return code;
}

export class LinkError extends Error {}

export async function linkWithCode(parent: UserProfile, rawCode: string): Promise<string> {
  const code = rawCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  const snap = await getDoc(doc(db, 'linkCodes', code));
  if (!snap.exists()) throw new LinkError('That code didn’t match a student. Check it and try again.');
  const studentUid = snap.data().studentUid as string;
  const studentName = (snap.data().studentName as string | undefined) ?? 'Student';
  if (studentUid === parent.uid) throw new LinkError('That’s your own code.');
  const id = `${studentUid}_${parent.uid}`;
  await setDoc(doc(db, 'links', id), {
    id,
    studentUid,
    parentUid: parent.uid,
    parentName: parent.displayName,
    studentName,
    code,
    createdAt: serverTimestamp(),
  });
  return studentName;
}

export function watchLinks(field: 'studentUid' | 'parentUid' | null, uid: string | null, cb: (l: ParentLink[]) => void, onError?: (e: Error) => void) {
  const col = collection(db, 'links');
  const q = field && uid ? query(col, where(field, '==', uid)) : col;
  return onSnapshot(q, (s) => cb(s.docs.map((d) => d.data() as ParentLink)), onError);
}

export function removeLink(id: string) {
  return deleteDoc(doc(db, 'links', id));
}
