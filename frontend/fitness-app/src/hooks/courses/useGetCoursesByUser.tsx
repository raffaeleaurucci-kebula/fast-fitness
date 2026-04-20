import { useState } from "react";
import type {CourseUserCardOut} from "../../types/course_user_card.ts";

const API_BASE = "http://127.0.0.1:8000";
const TOKEN_KEY = "gym_access_token";

interface UseGetCoursesByUserReturn {
  loading: boolean;
  error: string | null;
  getCoursesByUser: (userId: number) => Promise<CourseUserCardOut[] | null>;
}

export function useGetCoursesByUser(): UseGetCoursesByUserReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getCoursesByUser = async (userId: number): Promise<CourseUserCardOut[] | null> => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/courses/list/${userId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem(TOKEN_KEY)}`,
        },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.detail ?? "Errore nel caricamento dei corsi utente.");
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

  return { loading, error, getCoursesByUser };
}