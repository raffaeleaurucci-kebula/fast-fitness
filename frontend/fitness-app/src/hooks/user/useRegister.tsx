import { useState } from "react";
import type { RegisterData } from "../../types/auth.ts";

const API_BASE = "http://127.0.0.1:8000";

interface UseRegisterReturn {
  loading: boolean;
  error: string | null;
  performRegister: (data: RegisterData) => Promise<boolean>;
}

export function useRegister(): UseRegisterReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const performRegister = async (data: RegisterData): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/users/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setError(json.detail ?? "Errore durante la registrazione.");
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

  return { loading, error, performRegister };
}