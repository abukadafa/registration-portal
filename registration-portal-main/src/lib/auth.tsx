"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  signInWithEmailAndPassword as fbSignIn,
  signOut as fbSignOut,
  onAuthStateChanged,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db, isFirebaseConfigured } from "./firebase";

export type UserRole =
  | "admin"
  | "registration-officer"
  | "attendance-officer"
  | "finance-officer";

const KNOWN_ROLES: UserRole[] = [
  "admin",
  "registration-officer",
  "attendance-officer",
  "finance-officer",
];

function isKnownRole(value: unknown): value is UserRole {
  return typeof value === "string" && (KNOWN_ROLES as string[]).includes(value);
}

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  // null = signed in, but no (or an invalid) role assigned — fail closed,
  // never treat a missing role as "grant some default access".
  role: UserRole | null;
}

/**
 * Central permission checks. Keep these in one place so the UI, and anyone
 * reasoning about who can do what, don't have to re-derive the rules per
 * component. Real enforcement still lives server-side in firestore.rules /
 * storage.rules — these helpers only control what the UI *shows*.
 */
export const permissions = {
  isAdmin: (role: UserRole | null) => role === "admin",
  canManageParticipants: (role: UserRole | null) =>
    role === "admin" || role === "registration-officer",
  canManagePayments: (role: UserRole | null) =>
    role === "admin" || role === "finance-officer",
  canManageAttendance: (role: UserRole | null) =>
    role === "admin" || role === "attendance-officer",
  canViewRegistrations: (role: UserRole | null) =>
    role === "admin" || role === "registration-officer" || role === "finance-officer",
  canAccessRecycleBin: (role: UserRole | null) => role === "admin",
  canRunReports: (role: UserRole | null) => role === "admin",
};

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  isMock: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Read mock user from localStorage on load if in mock mode
  useEffect(() => {
    if (!isFirebaseConfigured) {
      const stored = localStorage.getItem("mock_auth_user");
      if (stored) {
        // Deliberately deferred to an effect: localStorage isn't available
        // during server rendering, so this has to run post-hydration.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setUser(JSON.parse(stored));
      }
      setLoading(false);
      return;
    }

    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setLoading(true);
      if (fbUser) {
        try {
          // Fetch role from Firestore users collection. A user can
          // authenticate with Firebase Auth without having a corresponding
          // users/{uid} role document (e.g. an account was created but
          // never assigned a role) — that must NOT grant any access.
          const userDocRef = doc(db, "users", fbUser.uid);
          const userDoc = await getDoc(userDocRef);

          let role: UserRole | null = null;
          let displayName = fbUser.displayName;

          if (userDoc.exists()) {
            const data = userDoc.data();
            if (isKnownRole(data.role)) {
              role = data.role;
            } else {
              console.warn(`users/${fbUser.uid} has an unrecognized role value. Denying access.`);
            }
            displayName = data.name || fbUser.displayName;
          } else {
            console.warn(`User document users/${fbUser.uid} not found. Denying access until an admin assigns a role.`);
          }

          setUser({
            uid: fbUser.uid,
            email: fbUser.email,
            displayName,
            role,
          });
        } catch (err) {
          console.error("Error fetching user profile:", err);
          // Fail closed: a failure to read the role must never be treated
          // as "grant access".
          setUser({
            uid: fbUser.uid,
            email: fbUser.email,
            displayName: fbUser.displayName,
            role: null,
          });
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  async function signIn(email: string, password: string) {
    setError(null);
    if (!isFirebaseConfigured) {
      // Mock Sign In Logic
      // Check if email contains officer, otherwise default to admin
      let role: UserRole = "admin";
      let displayName = "Admin Staff";
      
      if (email.toLowerCase().includes("finance")) {
        role = "finance-officer";
        displayName = "Finance Officer";
      } else if (email.toLowerCase().includes("officer")) {
        role = "registration-officer";
        displayName = "Registration Officer";
      } else if (email.toLowerCase().includes("scan")) {
        role = "attendance-officer";
        displayName = "Attendance Officer";
      }

      const mockUser: AuthUser = {
        uid: `mock-user-${role}`,
        email: email,
        displayName: displayName,
        role: role,
      };

      localStorage.setItem("mock_auth_user", JSON.stringify(mockUser));
      setUser(mockUser);
      return;
    }

    if (!auth) {
      throw new Error("Firebase Auth is not initialized");
    }

    await fbSignIn(auth, email, password);
  }

  async function signOut() {
    if (!isFirebaseConfigured) {
      localStorage.removeItem("mock_auth_user");
      setUser(null);
      return;
    }

    if (!auth) return;
    await fbSignOut(auth);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isMock: !isFirebaseConfigured,
        signIn,
        signOut,
        error,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
