import { useState } from "react";
import type {SubscriptionUserCardIn, SubscriptionUserCardOut} from "../../types/subscription_user_card.ts";

const API_BASE = "http://127.0.0.1:8000";
const TOKEN_KEY = "gym_access_token";

interface UseCreateSubByUserReturn {
  loading: boolean;
  error: string | null;
  createSubByUser: (
    payload: SubscriptionUserCardIn
  ) => Promise<SubscriptionUserCardOut | null>;
}

export function useCreateSubByUser(): UseCreateSubByUserReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createSubByUser = async (
    payload: SubscriptionUserCardIn
  ): Promise<SubscriptionUserCardOut | null> => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/subscriptions/create_by_user/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem(TOKEN_KEY)}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));

        let message = "Subscription failed";

        if (Array.isArray(data.detail)) {
          message = data.detail
            .map((err: { msg: string; }) => err.msg.replace(/^Value error,\s*/i, ""))
            .join(", ");
        } else {
          message = data.detail || data.message || message;
        }

        setError(message);

        if (message.toLowerCase().includes("token")) {
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

  return { loading, error, createSubByUser };
}