import { useState } from "react";
import type {SubscriptionUserCardOut} from "../../types/subscription_user_card.ts";

const API_BASE = "http://127.0.0.1:8000";
const TOKEN_KEY = "gym_access_token";

interface UseGetSubsByUserReturn {
  loading: boolean;
  error: string | null;
  getSubsByUser: (userId: number) => Promise<SubscriptionUserCardOut[] | null>;
}

export function useGetSubsByUser(): UseGetSubsByUserReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getSubsByUser = async (userId: number): Promise<SubscriptionUserCardOut[] | null> => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/subscriptions/list/${userId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem(TOKEN_KEY)}`,
        },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.detail ?? "Errore nel recupero degli abbonamenti utente.");
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

  return { loading, error, getSubsByUser };
}