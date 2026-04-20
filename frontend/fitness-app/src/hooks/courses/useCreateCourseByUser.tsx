import { useState } from "react";
import type {CourseUserCardIn, CourseUserCardOut} from "../../types/course_user_card.ts";

const API_BASE = "http://127.0.0.1:8000";
const TOKEN_KEY = "gym_access_token";

interface UseCreateCourseByUserReturn {
  loading: boolean;
  error: string | null;
  createCourseByUser: (payload: CourseUserCardIn) => Promise<CourseUserCardOut | null>;
}

export function useCreateCourseByUser(): UseCreateCourseByUserReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createCourseByUser = async (
    payload: CourseUserCardIn
  ): Promise<CourseUserCardOut | null> => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/courses/create_by_user`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem(TOKEN_KEY)}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));

        let message = "Iscrizione al corso fallita";

        if (Array.isArray(data.detail)) {
          message = data.detail
            .map((err: { msg: string }) => err.msg.replace(/^Value error,\s*/i, ""))
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

  return { loading, error, createCourseByUser };
}