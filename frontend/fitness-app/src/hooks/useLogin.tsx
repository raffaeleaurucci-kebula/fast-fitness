import { useState } from "react";
import type {LoginCredentials, LoginResponse} from "../types/auth";

const API_BASE = "http://127.0.0.1:8000";

interface UseLoginReturn {
  loading: boolean;
  error: string | null;
  performLogin: (credentials: LoginCredentials) => Promise<string | null>;
}

export function useLogin(): UseLoginReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const performLogin = async (credentials: LoginCredentials): Promise<string | null> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.detail ?? "Invalid credentials.");
        return null;
      }

      const data: LoginResponse = await res.json();
      return data.access_token;
    } catch {
      setError("Unable to contact the server. Please try again later.");
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { loading, error, performLogin };
}