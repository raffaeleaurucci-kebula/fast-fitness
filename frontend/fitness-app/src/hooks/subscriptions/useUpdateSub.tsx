import { useState } from "react";
import type { SubscriptionIn, SubscriptionOut } from "../../types/subscriptions.ts";

const API_BASE = "http://127.0.0.1:8000";
const TOKEN_KEY = "gym_access_token";

interface UseUpdateSubReturn {
  loading: boolean;
  error: string | null;
  updateSubscription: (
    subscriptionId: number,
    data: SubscriptionIn
  ) => Promise<SubscriptionOut | null>;
}

export function useUpdateSub(): UseUpdateSubReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateSubscription = async (
    subscriptionId: number,
    data: SubscriptionIn
  ): Promise<SubscriptionOut | null> => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/subscriptions/${subscriptionId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem(TOKEN_KEY)}`,
        },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.detail ?? "Errore durante l'aggiornamento dell'abbonamento.");

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

  return { loading, error, updateSubscription };
}