import { useState } from "react";
import type { UpdateUserData, UserOut } from "../../types/auth.ts";

const API_BASE = "http://127.0.0.1:8000";
const TOKEN_KEY = "gym_access_token";

interface UseUpdateUserReturn {
  loading: boolean;
  error: string | null;
  updateUserById: (id: number, user_in: UpdateUserData) => Promise<UserOut | null>;
}

export function useUpdateUser(): UseUpdateUserReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  //TODO: WHY WHEN NEW PASSWORD EQUAL TO OLD PASSWORD THE ERROR DOESN'T VISUALIZED???
  const updateUserById = async (id: number, user_in: UpdateUserData) => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem(TOKEN_KEY);

      const res = await fetch(`${API_BASE}/users/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(user_in),
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

  return { loading, error, updateUserById };
}