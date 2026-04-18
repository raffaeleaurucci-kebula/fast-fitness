import { useState } from "react";
import type {SubscriptionIn, SubscriptionOut} from "../../types/subscriptions.ts";

const API_BASE = "http://127.0.0.1:8000";
const TOKEN_KEY = "gym_access_token";

interface UseCreateSubReturn {
  loading: boolean;
  error: string | null;
  createSubscription: (subscription_in: SubscriptionIn) => Promise<SubscriptionOut | null>;
}

export function useCreateSub(): UseCreateSubReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createSubscription = async (subscription_in: SubscriptionIn) => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem(TOKEN_KEY);

      const res = await fetch(`${API_BASE}/subscriptions/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(subscription_in),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));

        let message = "Update failed";

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
      setError("Server error");
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { loading, error, createSubscription };
}