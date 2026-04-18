import { useState } from "react";

const API_BASE = "http://127.0.0.1:8000";
const TOKEN_KEY = "gym_access_token";

interface UseDeleteSubByUserReturn {
  loading: boolean;
  error: string | null;
  deleteSubByUser: (subscriptionUserCardId: number) => Promise<boolean>;
}

export function useDeleteSubByUser(): UseDeleteSubByUserReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteSubByUser = async (subscriptionUserCardId: number): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/subscriptions/user/${subscriptionUserCardId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem(TOKEN_KEY)}`,
        },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.detail ?? "Errore durante la cancellazione dell'abbonamento.");
        return false;
      }

      return true;
    } catch {
      setError("Impossibile contattare il server. Riprova più tardi.");
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { loading, error, deleteSubByUser };
}