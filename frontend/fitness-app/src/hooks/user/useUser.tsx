import {useState} from "react";
import type {UserOut} from "../../types/auth.ts";

const API_BASE = "http://127.0.0.1:8000";
const TOKEN_KEY = "gym_access_token";

interface UseUserReturn {
  loading: boolean;
  error: string | null;
  getUserById: (id: number) => Promise<UserOut | null>;
}

export function useUser(): UseUserReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getUserById = async (id: number): Promise<UserOut | null> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/users/` + id, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            'Authorization': `Bearer ${localStorage.getItem(TOKEN_KEY)}`
        },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.detail ?? "Invalid token.");
        return null;
      }

      return await res.json()
    } catch {
      setError("Unable to contact the server. Please try again later.");
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { loading, error, getUserById };
}