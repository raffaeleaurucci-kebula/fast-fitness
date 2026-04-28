import { useState } from "react";
import type { TrainingCardExerciseIn, TrainingCardExerciseOut } from "../../types/training_cards";

const API_BASE = "http://127.0.0.1:8000";
const TOKEN_KEY = "gym_access_token";

interface UseAddExerciseToCardReturn {
  loading: boolean;
  error: string | null;
  addExerciseToCard: (
    cardId: number,
    payload: TrainingCardExerciseIn
  ) => Promise<TrainingCardExerciseOut | null>;
}

export function useAddExerciseToCard(): UseAddExerciseToCardReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addExerciseToCard = async (
    cardId: number,
    payload: TrainingCardExerciseIn
  ): Promise<TrainingCardExerciseOut | null> => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/training-cards/${cardId}/exercises`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem(TOKEN_KEY)}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.detail ?? "Errore durante l'aggiunta dell'esercizio.");

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

  return { loading, error, addExerciseToCard };
}