import { useState } from "react";
import type { CreditCardIn, CreditCardOut } from "../../types/credit_cards.ts";

const API_BASE = "http://127.0.0.1:8000";
const TOKEN_KEY = "gym_access_token";

interface UseCreateCardReturn {
  loading: boolean;
  error: string | null;
  createCard: (card: CreditCardIn) => Promise<CreditCardOut | null>;
}

export function useCreateCard(): UseCreateCardReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createCard = async (card: CreditCardIn): Promise<CreditCardOut | null> => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/credit_cards/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem(TOKEN_KEY)}`,
        },
        body: JSON.stringify(card),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.detail ?? "Errore durante l'aggiunta della carta.");
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

  return { loading, error, createCard };
}