import { useState } from "react";
import type { CourseIn, CourseOut } from "../../types/courses.ts";

const API_BASE = "http://127.0.0.1:8000";
const TOKEN_KEY = "gym_access_token";

interface UseCreateCourseReturn {
  loading: boolean;
  error: string | null;
  createCourse: (course_in: CourseIn) => Promise<CourseOut | null>;
}

export function useCreateCourse(): UseCreateCourseReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createCourse = async (course_in: CourseIn): Promise<CourseOut | null> => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem(TOKEN_KEY);

      const res = await fetch(`${API_BASE}/courses/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(course_in),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));

        let message = "Creazione corso fallita";

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

  return { loading, error, createCourse };
}