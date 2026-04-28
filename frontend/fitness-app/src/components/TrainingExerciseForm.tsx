import React, { useState, useEffect } from "react";
import type { ExerciseOut, TrainingCardExerciseIn, TrainingCardExerciseOut, WeekDay } from "../types/training_cards";
import { WEEK_DAYS, WEEK_DAY_LABELS } from "../types/training_cards";
import { MAX_EXERCISES_PER_DAY } from "./DayExerciseGroup.tsx";

// Stile comune per input e select
const inputStyle: React.CSSProperties = {
  borderRadius: "8px",
  border: "1.5px solid #dee2e6",
  padding: "9px 13px",
  fontSize: "0.9rem",
  width: "100%",
};

// Focus/blur per evidenziare il campo attivo
const onFocus = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
  e.target.style.borderColor = "#198754";
  e.target.style.boxShadow = "0 0 0 3px rgba(25,135,84,0.12)";
  e.target.style.outline = "none";
};
const onBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
  e.target.style.borderColor = "#dee2e6";
  e.target.style.boxShadow = "none";
};

// Stato iniziale del form
interface FormState {
  exercise_id: number | "";
  day_execution: WeekDay | "";
  position: number | "";
  sets: number | "";
  reps: number | "";
  weight: number | "";
}

const emptyForm: FormState = {
  exercise_id: "",
  day_execution: "",
  position: "",
  sets: "",
  reps: "",
  weight: "",
};

interface Props {
  cardId: number;
  availableExercises: ExerciseOut[];
  existingExercises: TrainingCardExerciseOut[];
  editingExercise?: TrainingCardExerciseOut | null;
  loading: boolean;
  error: string | null;
  onSubmit: (payload: TrainingCardExerciseIn) => void;
  onCancel: () => void;
  // Ritorna true se il giorno ha già raggiunto il limite di esercizi
  isDayFull: (day: string) => boolean;
  // Posizioni già occupate nel giorno selezionato.
  usedPositionsForDay: (day: string) => Set<number>;
}

export default function TrainingExerciseForm({
  cardId,
  availableExercises,
  editingExercise,
  loading,
  error,
  onSubmit,
  onCancel,
  isDayFull,
  usedPositionsForDay,
}: Props) {
  const isEditing = !!editingExercise;
  const [form, setForm] = useState<FormState>(emptyForm);
  const [validationError, setValidationError] = useState("");

  // Precompila il form in modalità modifica
  useEffect(() => {
    setForm(
      editingExercise
        ? {
            exercise_id: editingExercise.exercise_id,
            day_execution: editingExercise.day_execution,
            position: editingExercise.position,
            sets: editingExercise.sets,
            reps: editingExercise.reps,
            weight: editingExercise.weight ?? "",
          }
        : emptyForm
    );
    setValidationError("");
  }, [editingExercise]);

  // Posizioni occupate nel giorno correntemente selezionato
  const occupiedOnSelectedDay = form.day_execution !== "" ? usedPositionsForDay(form.day_execution) : new Set<number>();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    // Cambio giorno → reset posizione per evitare conflitti
    setForm((prev) =>
      name === "day_execution"
        ? { ...prev, day_execution: value as WeekDay | "", position: "" }
        : { ...prev, [name]: value }
    );
    setValidationError("");
  };

  const handleSubmit = () => {
    // Campi obbligatori
    if (!form.exercise_id || !form.day_execution || form.position === "") {
      setValidationError("Esercizio, giorno e posizione sono obbligatori.");
      return;
    }

    const pos = Number(form.position);

    if (pos < 1 || pos > MAX_EXERCISES_PER_DAY) {
      setValidationError(`La posizione deve essere compresa tra 1 e ${MAX_EXERCISES_PER_DAY}.`);
      return;
    }
    if (occupiedOnSelectedDay.has(pos)) {
      setValidationError(`La posizione ${pos} è già occupata il ${WEEK_DAY_LABELS[form.day_execution]}. Scegli un'altra posizione.`);
      return;
    }
    if (!isEditing && isDayFull(form.day_execution)) {
      setValidationError(`Il giorno ${WEEK_DAY_LABELS[form.day_execution]} ha già raggiunto il limite di ${MAX_EXERCISES_PER_DAY} esercizi.`);
      return;
    }

    const sets = Number(form.sets);
    const reps = Number(form.reps);
    if (!sets || sets < 1 || sets > 50) { setValidationError("Le serie devono essere tra 1 e 50."); return; }
    if (!reps || reps < 1 || reps > 30) { setValidationError("Le ripetizioni devono essere tra 1 e 30."); return; }

    const payload: TrainingCardExerciseIn = {
      exercise_id: Number(form.exercise_id),
      training_card_id: cardId,
      day_execution: form.day_execution as WeekDay,
      position: pos,
      sets,
      reps,
      weight: form.weight !== "" ? Number(form.weight) : null,
    };

    onSubmit(payload);
  };

  // Raggruppa gli esercizi per gruppo muscolare per la select
  const groupedExercises = availableExercises.reduce<Record<string, ExerciseOut[]>>((acc, ex) => {
    (acc[ex.muscle_group] ??= []).push(ex);
    return acc;
  }, {});

  const selectedExercise = availableExercises.find((e) => e.id === Number(form.exercise_id));

  // Posizioni libere nel giorno selezionato
  const freePositions = Array.from({ length: MAX_EXERCISES_PER_DAY }, (_, i) => i + 1).filter(
    (p) => !occupiedOnSelectedDay.has(p)
  );

  return (
    <div style={{ background: "#fff", borderRadius: "14px", boxShadow: "0 4px 20px rgba(0,0,0,0.09)", overflow: "hidden", border: "1px solid #e9ecef" }}>
      {/* Intestazione */}
      <div style={{ background: isEditing ? "#0d6efd" : "#198754", padding: "18px 24px" }}>
        <h5 className="mb-0 text-white fw-bold">
          {isEditing ? "Modifica esercizio" : "Aggiungi esercizio alla scheda"}
        </h5>
        <small className="text-white-50">
          {isEditing ? "Aggiorna i dettagli dell'esercizio" : "Scegli un esercizio e imposta i parametri"}
        </small>
      </div>

      {/* Corpo del form */}
      <div style={{ padding: "24px 28px" }}>
        <div className="row g-3">

          {/* Selezione esercizio */}
          <div className="col-12">
            <label className="form-label fw-semibold mb-1" style={{ fontSize: "0.875rem" }}>Esercizio</label>
            <select name="exercise_id" value={form.exercise_id} onChange={handleChange} style={{ ...inputStyle, appearance: "auto" }} onFocus={onFocus as any} onBlur={onBlur as any}>
              <option value="">— Seleziona un esercizio —</option>
              {Object.entries(groupedExercises).map(([group, exList]) => (
                <optgroup key={group} label={group}>
                  {exList.map((ex) => <option key={ex.id} value={ex.id}>{ex.name}</option>)}
                </optgroup>
              ))}
            </select>
            {/* Anteprima del gruppo muscolare */}
            {selectedExercise && (
              <div className="mt-2 px-3 py-2 rounded" style={{ background: "#f0faf4", border: "1px solid #b2dfdb", fontSize: "0.82rem", color: "#0a3622" }}>
                <strong>{selectedExercise.muscle_group}</strong>
                {selectedExercise.description && <span> — {selectedExercise.description}</span>}
              </div>
            )}
          </div>

          {/* Giorno di esecuzione */}
          <div className="col-12 col-md-6">
            <label className="form-label fw-semibold mb-1" style={{ fontSize: "0.875rem" }}>Giorno di esecuzione</label>
            <select name="day_execution" value={form.day_execution} onChange={handleChange} style={{ ...inputStyle, appearance: "auto" }} onFocus={onFocus as any} onBlur={onBlur as any}>
              <option value="">— Seleziona il giorno —</option>
              {WEEK_DAYS.map((day) => {
                const full = !isEditing && isDayFull(day);
                return (
                  <option key={day} value={day} disabled={full}>
                    {WEEK_DAY_LABELS[day]}{full ? " (pieno)" : ""}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Posizione nel giorno */}
          <div className="col-12 col-md-6">
            <label className="form-label fw-semibold mb-1" style={{ fontSize: "0.875rem" }}>
              Posizione nel giorno (1–{MAX_EXERCISES_PER_DAY})
            </label>
            <select name="position" value={form.position} onChange={handleChange} disabled={form.day_execution === ""} style={{ ...inputStyle, appearance: "auto" }} onFocus={onFocus as any} onBlur={onBlur as any}>
              <option value="">— Seleziona posizione —</option>
              {Array.from({ length: MAX_EXERCISES_PER_DAY }, (_, i) => i + 1).map((pos) => {
                const taken = occupiedOnSelectedDay.has(pos);
                return (
                  <option key={pos} value={pos} disabled={taken}>
                    {pos}{taken ? " (occupata)" : ""}
                  </option>
                );
              })}
            </select>
            <small className="text-muted" style={{ fontSize: "0.78rem" }}>
              {form.day_execution === ""
                ? "Seleziona prima il giorno."
                : `Posizioni libere il ${WEEK_DAY_LABELS[form.day_execution]}: ${freePositions.join(", ") || "nessuna"}`}
            </small>
          </div>

          {/* Serie */}
          <div className="col-4">
            <label className="form-label fw-semibold mb-1" style={{ fontSize: "0.875rem" }}>Serie</label>
            <input type="number" name="sets" min={1} max={50} value={form.sets} onChange={handleChange} placeholder="es. 4" style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
            <small className="text-muted" style={{ fontSize: "0.78rem" }}>1–50</small>
          </div>

          {/* Ripetizioni */}
          <div className="col-4">
            <label className="form-label fw-semibold mb-1" style={{ fontSize: "0.875rem" }}>Ripetizioni</label>
            <input type="number" name="reps" min={1} max={30} value={form.reps} onChange={handleChange} placeholder="es. 10" style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
            <small className="text-muted" style={{ fontSize: "0.78rem" }}>1–30</small>
          </div>

          {/* Peso */}
          <div className="col-4">
            <label className="form-label fw-semibold mb-1" style={{ fontSize: "0.875rem" }}>Peso (kg)</label>
            <input type="number" name="weight" min={0} step={0.5} value={form.weight} onChange={handleChange} placeholder="Opz." style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
            <small className="text-muted" style={{ fontSize: "0.78rem" }}>Opzionale</small>
          </div>
        </div>

        {/* Errori di validazione */}
        {(validationError || error) && (
          <div className="mt-3 p-3 rounded" style={{ background: "#fff3f3", border: "1px solid #f5c2c7" }}>
            <small className="text-danger">{validationError || error}</small>
          </div>
        )}

        {/* Pulsanti azione */}
        <div className="d-flex gap-2 mt-4">
          <button className="btn btn-success fw-semibold" style={{ borderRadius: "8px", minWidth: "140px" }} onClick={handleSubmit} disabled={loading}>
            {loading ? "Salvataggio..." : isEditing ? "Aggiorna esercizio" : "Aggiungi esercizio"}
          </button>
          <button className="btn btn-outline-secondary" style={{ borderRadius: "8px" }} onClick={onCancel} disabled={loading}>
            Annulla
          </button>
        </div>
      </div>
    </div>
  );
}