import { useState } from "react";

const API_BASE = "http://127.0.0.1:8000";
const TOKEN_KEY = "gym_access_token";

interface UseDeleteCourseReturn {
  loading: boolean;
  error: string | null;
  deleteCourse: (courseId: number) => Promise<boolean>;
}

export function useDeleteCourse(): UseDeleteCourseReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteCourse = async (courseId: number): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/courses/${courseId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem(TOKEN_KEY)}`,
        },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.detail ?? "Errore durante l'eliminazione del corso.");

        if (data.detail.toLowerCase().includes("token")) {
          localStorage.removeItem(TOKEN_KEY);
          window.location.href = "/login";
        }

        return false;
      }

      return true;
    } catch {
      setError("Impossibile contattare il server. Riprova più tardi.");
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { loading, error, deleteCourse };
}