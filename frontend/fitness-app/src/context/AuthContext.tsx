/*
import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import type {CurrentUser} from "../types/auth";

interface AuthContextType {
  token: string | null;
  user: CurrentUser | null;
  login: (token: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

const TOKEN_KEY = "gym_access_token";

function parseJwt(token: string): CurrentUser | null {
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = JSON.parse(atob(base64));
    return { id: json.user_id, role: json.role };
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(
    () => localStorage.getItem(TOKEN_KEY)
  );
  const [user, setUser] = useState<CurrentUser | null>(() => {
    const stored = localStorage.getItem(TOKEN_KEY);
    return stored ? parseJwt(stored) : null;
  });

  const login = useCallback((newToken: string) => {
    localStorage.setItem(TOKEN_KEY, newToken);
    setToken(newToken);
    setUser(parseJwt(newToken));
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ token, user, login, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}*/
import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import type { CurrentUser, UserOut } from "../types/auth";

interface AuthContextType {
  token: string | null;
  user: CurrentUser | null;
  userData: UserOut | null;
  setUserData: (user: UserOut | null) => void;
  login: (token: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

const TOKEN_KEY = "gym_access_token";
const API_BASE = "http://127.0.0.1:8000";

function parseJwt(token: string): CurrentUser | null {
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = JSON.parse(atob(base64));
    return { id: json.user_id, role: json.role };
  } catch {
    return null;
  }
}

async function fetchUser(id: number, token: string): Promise<UserOut | null> {
  try {
    const res = await fetch(`${API_BASE}/users/${id}`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(
    () => localStorage.getItem(TOKEN_KEY)
  );
  const [user, setUser] = useState<CurrentUser | null>(() => {
    const stored = localStorage.getItem(TOKEN_KEY);
    return stored ? parseJwt(stored) : null;
  });
  const [userData, setUserData] = useState<UserOut | null>(null);

  // Fetch full user data whenever token/user changes
  useEffect(() => {
    if (!user?.id || !token) {
      setUserData(null);
      return;
    }
    fetchUser(user.id, token).then(setUserData);
  }, [user?.id, token]);

  const login = useCallback((newToken: string) => {
    localStorage.setItem(TOKEN_KEY, newToken);
    setToken(newToken);
    setUser(parseJwt(newToken));
    // userData will be fetched by the effect above
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
    setUserData(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{ token, user, userData, setUserData, login, logout, isAuthenticated: !!token }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}