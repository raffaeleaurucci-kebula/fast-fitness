import { useState } from "react";
import type { ExerciseOut } from "../../types/training_cards";

const API_BASE = "http://127.0.0.1:8000";

interface UseGetAllExercisesReturn {
  loading: boolean;
  error: string | null;
  getAllExercises: () => Promise<ExerciseOut[] | null>;
}

export function useGetAllExercises(): UseGetAllExercisesReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getAllExercises = async (): Promise<ExerciseOut[] | null> => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/training-cards/exercises`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.detail ?? "Errore nel caricamento degli esercizi.");
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

  return { loading, error, getAllExercises };
}