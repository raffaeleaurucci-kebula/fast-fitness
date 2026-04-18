import { useState } from "react";
import type { SubscriptionOut } from "../../types/subscriptions.ts";

const API_BASE = "http://127.0.0.1:8000";
const TOKEN_KEY = "gym_access_token";

interface UseSubscriptionsReturn {
  loading: boolean;
  error: string | null;
  getSubscriptions: (costSup: number) => Promise<SubscriptionOut[] | null>;
}

export function useSubscriptions(): UseSubscriptionsReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getSubscriptions = async (
    costSup: number
  ): Promise<SubscriptionOut[] | null> => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `${API_BASE}/subscriptions/list?cost_sup=${costSup}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem(TOKEN_KEY)}`,
          },
        }
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.detail ?? "Error fetching subscriptions.");
        return null;
      }

      return await res.json();
    } catch {
      setError("Unable to contact the server. Please try again later.");
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { loading, error, getSubscriptions };
}