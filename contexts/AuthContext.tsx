
/**
 * Authentication Context - DISABLED
 *
 * Authentication has been disabled. All auth methods are no-ops.
 */

import React, { createContext, useContext, ReactNode } from "react";

interface User {
  id: string;
  email: string;
  name?: string;
  image?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, name?: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signInWithGitHub: () => Promise<void>;
  signOut: () => Promise<void>;
  fetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  // Mock user - always authenticated
  const user: User = {
    id: "guest",
    email: "guest@app.com",
    name: "Guest User",
  };

  const noOp = async () => {
    // Authentication disabled
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading: false,
        signInWithEmail: noOp,
        signUpWithEmail: noOp,
        signInWithGoogle: noOp,
        signInWithApple: noOp,
        signInWithGitHub: noOp,
        signOut: noOp,
        fetchUser: noOp,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
