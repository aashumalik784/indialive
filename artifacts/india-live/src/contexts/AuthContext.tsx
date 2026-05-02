import React, { createContext, useContext, useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import { User } from "@/hooks/use-api";

type AuthContextType = {
  currentUser: User | null;
  isLoading: boolean;
  login: (data: any) => Promise<void>;
  signup: (data: any) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);
const STORAGE_KEY = "india_live_user";

function getCachedUser(): User | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function setCachedUser(user: User | null) {
  if (user) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(getCachedUser);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      try {
        const res = await apiRequest("/api/auth/me");
        const data = await res.json();
        if (data.user) {
          setCurrentUser(data.user);
          setCachedUser(data.user);
        } else {
          const cached = getCachedUser();
          if (!cached) {
            setCurrentUser(null);
          }
        }
      } catch {
        // Network error — keep cached user so they stay "logged in" visually
      } finally {
        setIsLoading(false);
      }
    }
    loadUser();
  }, []);

  const login = async (data: any) => {
    const res = await apiRequest("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    setCurrentUser(result.user);
    setCachedUser(result.user);
  };

  const signup = async (data: any) => {
    const res = await apiRequest("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    setCurrentUser(result.user);
    setCachedUser(result.user);
  };

  const logout = async () => {
    try {
      await apiRequest("/api/auth/logout", { method: "POST" });
    } catch {}
    setCurrentUser(null);
    setCachedUser(null);
  };

  return (
    <AuthContext.Provider value={{ currentUser, isLoading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
