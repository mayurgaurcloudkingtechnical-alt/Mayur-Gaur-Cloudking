import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { UserProfile } from "../types";
import { AuthApi } from "../api/auth";
import { TokenStorage } from "../storage/secureStore";
import { registerAuthFailureHandler } from "../api/client";

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

export interface AuthContextType {
  status: AuthStatus;
  user: UserProfile | null;
  error: string | null;
  login: (credentials: { identifier: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<UserProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAuthFailure = useCallback(() => {
    setUser(null);
    setStatus("unauthenticated");
  }, []);

  // 1. Initial bootstrap: check for stored tokens & validate session
  useEffect(() => {
    registerAuthFailureHandler(handleAuthFailure);

    async function bootstrap() {
      try {
        const storedUser = await TokenStorage.getUser<UserProfile>();
        const accessToken = await TokenStorage.getAccessToken();
        const refreshToken = await TokenStorage.getRefreshToken();

        if (!accessToken && !refreshToken) {
          setStatus("unauthenticated");
          return;
        }

        if (storedUser) {
          setUser(storedUser);
          setStatus("authenticated");
        }

        // Validate session with backend /me in background
        try {
          const res = await AuthApi.getMe();
          setUser(res.user);
          await TokenStorage.saveUser(res.user);
          setStatus("authenticated");
        } catch {
          // If /me failed, try explicit refresh
          try {
            const refreshed = await AuthApi.refresh();
            setUser(refreshed.user);
            setStatus("authenticated");
          } catch {
            await TokenStorage.clearSession();
            setUser(null);
            setStatus("unauthenticated");
          }
        }
      } catch {
        setStatus("unauthenticated");
      }
    }

    bootstrap();
  }, [handleAuthFailure]);

  const login = async (credentials: { identifier: string; password: string }) => {
    setError(null);
    try {
      const session = await AuthApi.login(credentials);
      setUser(session.user);
      setStatus("authenticated");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to sign in";
      setError(msg);
      throw err;
    }
  };

  const logout = async () => {
    try {
      await AuthApi.logout();
    } finally {
      setUser(null);
      setStatus("unauthenticated");
    }
  };

  const refreshProfile = async () => {
    try {
      const res = await AuthApi.getMe();
      setUser(res.user);
      await TokenStorage.saveUser(res.user);
    } catch (err) {
      console.warn("Failed to refresh user profile:", err);
    }
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        status,
        user,
        error,
        login,
        logout,
        refreshProfile,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
