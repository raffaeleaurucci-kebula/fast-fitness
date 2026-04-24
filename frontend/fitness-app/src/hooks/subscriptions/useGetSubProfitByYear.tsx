import { useState } from "react";
import type { ProfitYearOut } from '../../types/profit.ts';

const API_BASE = "http://127.0.0.1:8000";
const TOKEN_KEY = "gym_access_token";

interface ProfitYearReturn {
  loading: boolean;
  error: string | null;
  getSubProfitYear: () => Promise<ProfitYearOut | null>;
}

export function useGetSubProfitByYear(): ProfitYearReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getSubProfitYear = async (): Promise<ProfitYearOut | null> => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/subscriptions/profit/year`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem(TOKEN_KEY)}`,
        },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.detail ?? "Errore durante il calcolo dei profitti.");

        if (data.detail.toLowerCase().includes("token")) {
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

  return { loading, error, getSubProfitYear: getSubProfitYear };
}