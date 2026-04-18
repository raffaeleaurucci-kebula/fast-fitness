import { useState } from "react";
import type { CreditCardOut } from "../../types/credit_cards.ts";

const API_BASE = "http://127.0.0.1:8000";
const TOKEN_KEY = "gym_access_token";

interface UseGetCardsReturn {
  loading: boolean;
  error: string | null;
  getCards: (userId: number) => Promise<CreditCardOut[] | null>;
}

export function useGetCards(): UseGetCardsReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getCards = async (userId: number): Promise<CreditCardOut[] | null> => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/credit_cards/list/${userId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem(TOKEN_KEY)}`,
        },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.detail ?? "Errore nel recupero delle carte.");
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

  return { loading, error, getCards };
}