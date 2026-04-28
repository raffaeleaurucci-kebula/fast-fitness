import React, { useState } from "react";
import { useCreateTrainingCard } from "../hooks/training_cards/useCreateTrainingCard.tsx";
import type { TrainingCardOut, TrainingCardIn } from "../types/training_cards";

interface CreateCardFormProps {
  userId: number;
  loading: boolean;
  error: string | null;
  onCreated: (card: TrainingCardOut) => void;
}

const fieldStyle: React.CSSProperties = {
  borderRadius: "7px",
  border: "1.5px solid #dee2e6",
  padding: "8px 12px",
  fontSize: "0.88rem",
  width: "100%",
};

export default function CreateCardForm({ userId, loading, error, onCreated }: CreateCardFormProps) {
  const { createTrainingCard } = useCreateTrainingCard();

  const [form, setForm] = useState({ init_date: "", expiry_date: "", description: "", note: "" });
  const [localError, setLocalError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
    setLocalError("");
  };

  const handleSubmit = async () => {
    // Validazione date
    if (!form.init_date || !form.expiry_date) {
      setLocalError("Le date di inizio e fine sono obbligatorie.");
      return;
    }
    if (form.expiry_date <= form.init_date) {
      setLocalError("La data di scadenza deve essere successiva a quella di inizio.");
      return;
    }

    const payload: TrainingCardIn = {
      user_id: userId,
      init_date: form.init_date,
      expiry_date: form.expiry_date,
      description: form.description || null,
      note: form.note || null,
    };

    const created = await createTrainingCard(payload);
    if (created) onCreated(created);
  };

  return (
    <div className="mt-3 p-4 rounded" style={{ background: "#f8f9fa", border: "1px dashed #ced4da" }}>
      <h6 className="fw-bold mb-3" style={{ color: "#198754" }}>
        Crea nuova scheda per questo utente
      </h6>

      <div className="row g-3">
        <div className="col-6">
          <label className="form-label small fw-semibold mb-1">Data inizio</label>
          <input type="date" name="init_date" value={form.init_date} onChange={handleChange} style={fieldStyle} />
        </div>
        <div className="col-6">
          <label className="form-label small fw-semibold mb-1">Data scadenza</label>
          <input type="date" name="expiry_date" value={form.expiry_date} onChange={handleChange} style={fieldStyle} />
        </div>
        <div className="col-12">
          <label className="form-label small fw-semibold mb-1">Descrizione (opzionale)</label>
          <input
            type="text"
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="es. Scheda ipertrofia — fase 1"
            style={fieldStyle}
          />
        </div>
        <div className="col-12">
          <label className="form-label small fw-semibold mb-1">Note (opzionale)</label>
          <input
            type="text"
            name="note"
            value={form.note}
            onChange={handleChange}
            placeholder="Note aggiuntive per l'atleta"
            style={fieldStyle}
          />
        </div>
      </div>

      {/* Errori di validazione */}
      {(localError || error) && (
        <small className="text-danger d-block mt-2">Attenzione: {localError || error}</small>
      )}

      <button
        className="btn btn-success btn-sm mt-3 fw-semibold"
        onClick={handleSubmit}
        disabled={loading}
        style={{ borderRadius: "7px" }}
      >
        {loading ? "Creazione..." : "Crea scheda"}
      </button>
    </div>
  );
}