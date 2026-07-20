"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  signInWithEmailAndPassword as fbSignIn,
  signOut as fbSignOut,
  onAuthStateChanged,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db, isFirebaseConfigured } from "./firebase";

export type UserRole = "admin" | "registration-officer" | "attendance-officer";

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: UserRole;
}

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
          // Fetch role from Firestore users collection
          const userDocRef = doc(db, "users", fbUser.uid);
          const userDoc = await getDoc(userDocRef);
          
          let role: UserRole = "registration-officer"; // default fallback role
          let displayName = fbUser.displayName;

          if (userDoc.exists()) {
            const data = userDoc.data();
            role = data.role as UserRole;
            displayName = data.name || fbUser.displayName;
          } else {
            console.warn(`User document users/${fbUser.uid} not found. Defaulting to registration-officer.`);
          }

          setUser({
            uid: fbUser.uid,
            email: fbUser.email,
            displayName,
            role,
          });
        } catch (err) {
          console.error("Error fetching user profile:", err);
          setUser({
            uid: fbUser.uid,
            email: fbUser.email,
            displayName: fbUser.displayName,
            role: "registration-officer", // Fallback
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
      
      if (email.toLowerCase().includes("officer")) {
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
