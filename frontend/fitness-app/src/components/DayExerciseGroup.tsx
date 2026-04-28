import type { TrainingCardExerciseOut, ExerciseOut } from "../types/training_cards";
import { WEEK_DAY_LABELS } from "../types/training_cards";
import ExerciseRow from "./ExerciseRow.tsx";

// Limite massimo esercizi per giorno
export const MAX_EXERCISES_PER_DAY = 6;

interface DayExerciseGroupProps {
  day: string;
  exercises: TrainingCardExerciseOut[];
  allExercises: ExerciseOut[];
  cardId: number;
  // Solo admin: abilita modifica e cancellazione
  isAdmin: boolean;
  onEdit: (ex: TrainingCardExerciseOut) => void;
  onDelete: (cardId: number, cardExId: number) => void;
  loadingDelete: boolean;
}

export default function DayExerciseGroup({
  day,
  exercises,
  allExercises,
  cardId,
  isAdmin,
  onEdit,
  onDelete,
  loadingDelete,
}: DayExerciseGroupProps) {
  const count = exercises.length;
  const isFull = count >= MAX_EXERCISES_PER_DAY;

  return (
    <div className="mb-4">
      {/* Intestazione del giorno */}
      <div
        className="d-flex align-items-center justify-content-between mb-2 px-1"
        style={{ borderBottom: "2px solid #e9ecef", paddingBottom: "6px" }}
      >
        <span className="fw-semibold" style={{ fontSize: "0.88rem", color: "#343a40" }}>
          {WEEK_DAY_LABELS[day] ?? day}
        </span>
        <span
          className="badge"
          style={{ background: isFull ? "#dc3545" : "#198754", color: "#fff", fontSize: "0.72rem" }}
        >
          {count}/{MAX_EXERCISES_PER_DAY} esercizi
        </span>
      </div>

      {/* Lista esercizi ordinata per posizione */}
      {[...exercises]
        .sort((a, b) => a.position - b.position)
        .map((cardEx) => (
          <ExerciseRow
            key={cardEx.id}
            cardEx={cardEx}
            exercise={allExercises.find((e) => e.id === cardEx.exercise_id)}
            cardId={cardId}
            isAdmin={isAdmin}
            onEdit={onEdit}
            onDelete={onDelete}
            loadingDelete={loadingDelete}
          />
        ))}
    </div>
  );
}