export type WeekDay =
  | "Monday"
  | "Tuesday"
  | "Wednesday"
  | "Thursday"
  | "Friday"
  | "Saturday";

export const WEEK_DAYS: WeekDay[] = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export const WEEK_DAY_LABELS: Record<WeekDay, string> = {
  Monday: "Lunedì",
  Tuesday: "Martedì",
  Wednesday: "Mercoledì",
  Thursday: "Giovedì",
  Friday: "Venerdì",
  Saturday: "Sabato",
};


// EXERCISES (esercizi "base" del catalogo)
export interface ExerciseOut {
  id: number;
  name: string;
  muscle_group: string;
  description: string | null;
}

export interface ExerciseIn {
  name: string;
  muscle_group: string;
  description: string | null;
}


// TRAINING CARD EXERCISES (esercizi specifici di una scheda)
export interface TrainingCardExerciseIn {
  exercise_id: number;
  training_card_id: number;
  day_execution: WeekDay;
  position: number; // 1–12
  sets: number;     // 1–50
  reps: number;     // 1–30
  weight: number | null;
}

export interface TrainingCardExerciseOut {
  id: number;
  exercise_id: number;
  training_card_id: number;
  day_execution: WeekDay;
  position: number;
  sets: number;
  reps: number;
  weight: number | null;
}


// TRAINING CARDS (schede di allenamento)
export interface TrainingCardIn {
  user_id: number;
  init_date: string;   // YYYY-MM-DD
  expiry_date: string;
  description: string | null;
  note: string | null;
}

export interface TrainingCardOut {
  id: number;
  user_id: number;
  init_date: string;
  expiry_date: string;
  description: string | null;
  note: string | null;
  exercises: TrainingCardExerciseOut[];
}