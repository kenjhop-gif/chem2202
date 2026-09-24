import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  updateProfile,
  type User,
} from 'firebase/auth';
import { auth } from '../firebase/app';
import { createProfile, saveAttempts, updateOwnProfile, watchProfile, type UserProfile } from '../firebase/data';
import { localStore, progressStore } from '../progress/store';
import { createRemoteStore } from '../progress/remoteStore';
import { loadPrefs, replacePrefs, setPrefsSink } from '../progress/prefs';

interface AuthContextValue {
  /** undefined while Firebase is still checking. */
  user: User | null | undefined;
  /** undefined while loading; null if signed in but no profile yet. */
  profile: UserProfile | null | undefined;
  signUp(name: string, email: string, password: string, role: 'student' | 'parent'): Promise<void>;
  signIn(email: string, password: string): Promise<void>;
  signOut(): Promise<void>;
  resetPassword(email: string): Promise<void>;
  completeProfile(name: string, role: 'student' | 'parent'): Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [profile, setProfile] = useState<UserProfile | null | undefined>(undefined);

  useEffect(() => onAuthStateChanged(auth, setUser), []);

  useEffect(() => {
    if (!user) {
      setProfile(user === null ? null : undefined);
      return;
    }
    setProfile(undefined);
    return watchProfile(user.uid, setProfile, (e) => {
      console.error('Profile read failed', e);
      setProfile(null);
    });
  }, [user]);

  // Once the profile exists: sync preferences and switch progress to the account.
  const uid = profile?.uid;
  useEffect(() => {
    if (!uid || !profile || profile.disabled) return;
    if (profile.prefs) replacePrefs(profile.prefs);
    else updateOwnProfile(uid, { prefs: loadPrefs() }).catch(() => undefined);
    setPrefsSink((prefs) => {
      updateOwnProfile(uid, { prefs }).catch((e) => console.error('Could not save settings', e));
    });

    const remote = createRemoteStore(uid);
    progressStore.use(remote.store);

    // Move any practice done on this device before signing in onto the account.
    const pending = localStore.all();
    if (pending.length) {
      saveAttempts(uid, pending)
        .then(() => localStore.clear())
        .catch((e) => console.error('Could not move local progress', e));
    }

    return () => {
      setPrefsSink(null);
      progressStore.use(localStore);
      remote.stop();
    };
    // Re-run only when the signed-in user (or their disabled state) changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid, profile?.disabled]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      profile,
      async signUp(name, email, password, role) {
        const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
        await updateProfile(cred.user, { displayName: name.trim() });
        await createProfile(cred.user.uid, cred.user.email ?? email.trim(), name.trim(), role);
      },
      async signIn(email, password) {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      },
      async signOut() {
        await fbSignOut(auth);
      },
      async resetPassword(email) {
        await sendPasswordResetEmail(auth, email.trim());
      },
      async completeProfile(name, role) {
        if (!user) return;
        await createProfile(user.uid, user.email ?? '', name.trim(), role);
      },
    }),
    [user, profile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth outside AuthProvider');
  return ctx;
}

/** Friendly messages for common Firebase auth errors. */
export function authErrorMessage(e: unknown): string {
  const code = (e as { code?: string })?.code ?? '';
  switch (code) {
    case 'auth/invalid-email':
      return 'That email address doesn’t look right.';
    case 'auth/email-already-in-use':
      return 'There’s already an account with that email. Try signing in instead.';
    case 'auth/weak-password':
      return 'Use a password with at least 6 characters.';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Email or password is incorrect.';
    case 'auth/too-many-requests':
      return 'Too many tries. Wait a minute and try again.';
    case 'auth/network-request-failed':
      return 'Couldn’t reach the server. Check your internet connection.';
    default:
      return 'Something went wrong. Try again.';
  }
}
