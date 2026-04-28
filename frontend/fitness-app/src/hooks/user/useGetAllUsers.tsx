import { useState } from "react";

const API_BASE = "http://127.0.0.1:8000";
const TOKEN_KEY = "gym_access_token";

export interface UserOut {
  id: number;
  name: string;
  surname: string;
  username: string;
  email: string;
  role: string;
}

interface UseGetAllUsersReturn {
  loading: boolean;
  error: string | null;
  getAllUsers: (limit?: number) => Promise<UserOut[] | null>;
}

export function useGetAllUsers(): UseGetAllUsersReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getAllUsers = async (limit = 100): Promise<UserOut[] | null> => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/users/?limit=${limit}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem(TOKEN_KEY)}`,
        },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.detail ?? "Errore nel caricamento degli utenti.");

        if (typeof data.detail === "string" && data.detail.toLowerCase().includes("token")) {
          localStorage.removeItem(TOKEN_KEY);
          window.location.href = "/login";
        }

        return null;
      }

      return await res.json();
    } catch {
      setError("Impossibile contattare il server. Riprova più tardi.");
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { loading, error, getAllUsers };
}