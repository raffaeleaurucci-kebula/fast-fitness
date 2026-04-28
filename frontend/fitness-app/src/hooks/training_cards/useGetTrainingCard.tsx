import { useState } from "react";
import type { TrainingCardOut } from "../../types/training_cards";

const API_BASE = "http://127.0.0.1:8000";
const TOKEN_KEY = "gym_access_token";

interface UseGetTrainingCardReturn {
  loading: boolean;
  error: string | null;
  getTrainingCard: (cardId: number) => Promise<TrainingCardOut | null>;
}

export function useGetTrainingCard(): UseGetTrainingCardReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getTrainingCard = async (
    cardId: number
  ): Promise<TrainingCardOut | null> => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/training-cards/${cardId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem(TOKEN_KEY)}`,
        },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.detail ?? "Errore nel caricamento della scheda.");

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

  return { loading, error, getTrainingCard };
}