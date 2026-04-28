import type { TrainingCardExerciseOut, ExerciseOut } from "../types/training_cards";
import { WEEK_DAY_LABELS } from "../types/training_cards";

// Colori di sfondo per gruppo muscolare
const MUSCLE_COLORS: Record<string, string> = {
  Petto: "#e3f2fd",
  Schiena: "#e8f5e9",
  Gambe: "#fff3e0",
  Polpacci: "#fce4ec",
  Spalle: "#f3e5f5",
  Bicipiti: "#e0f7fa",
  Tricipiti: "#fff8e1",
  Addome: "#f1f8e9",
};

const muscleColor = (group?: string) => (group ? (MUSCLE_COLORS[group] ?? "#f8f9fa") : "#f8f9fa");

interface ExerciseRowProps {
  cardEx: TrainingCardExerciseOut;
  exercise: ExerciseOut | undefined;
  cardId: number;
  /** Solo admin */
  isAdmin: boolean;
  onEdit: (ex: TrainingCardExerciseOut) => void;
  onDelete: (cardId: number, cardExId: number) => void;
  loadingDelete: boolean;
}

export default function ExerciseRow({
  cardEx,
  exercise,
  cardId,
  isAdmin,
  onEdit,
  onDelete,
  loadingDelete,
}: ExerciseRowProps) {
  return (
    <div
      className="d-flex align-items-center justify-content-between rounded px-3 py-2 mb-2"
      style={{
        background: muscleColor(exercise?.muscle_group),
        border: "1px solid rgba(0,0,0,0.06)",
        fontSize: "0.88rem",
      }}
    >
      {/* Info esercizio */}
      <div className="d-flex align-items-center gap-2 flex-wrap">
        <span className="badge" style={{ background: "#198754", color: "#fff", minWidth: "28px", textAlign: "center" }}>
          {cardEx.position}
        </span>
        <strong>{exercise?.name ?? `Esercizio #${cardEx.exercise_id}`}</strong>
        <span className="text-muted">·</span>
        <span>{WEEK_DAY_LABELS[cardEx.day_execution] ?? cardEx.day_execution}</span>
        <span className="text-muted">·</span>
        <span>
          {cardEx.sets}x{cardEx.reps}
          {cardEx.weight != null ? ` @ ${cardEx.weight}kg` : ""}
        </span>
        {exercise?.muscle_group && (
          <span className="badge bg-secondary bg-opacity-25 text-dark" style={{ fontSize: "0.72rem" }}>
            {exercise.muscle_group}
          </span>
        )}
      </div>

      {/* Pulsanti azione visibili solo agli admin */}
      {isAdmin && (
        <div className="d-flex gap-2 ms-2">
          <button
            className="btn btn-outline-primary btn-sm"
            style={{ fontSize: "0.75rem", padding: "2px 10px" }}
            onClick={() => onEdit(cardEx)}
          >
            Modifica
          </button>
          <button
            className="btn btn-outline-danger btn-sm"
            style={{ fontSize: "0.75rem", padding: "2px 10px" }}
            onClick={() => onDelete(cardId, cardEx.id)}
            disabled={loadingDelete}
          >
            {loadingDelete ? "..." : "Rimuovi"}
          </button>
        </div>
      )}
    </div>
  );
}