import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext.tsx";
import TrainingExerciseForm from "../components/TrainingExerciseForm.tsx";
import Footer from "../components/Footer.tsx";

import { useGetAllTrainingCards } from "../hooks/training_cards/useGetAllTrainingCards.tsx";
import { useGetTrainingCardsByUser } from "../hooks/training_cards/useGetTrainingCardsByUser.tsx";
import { useGetAllExercises } from "../hooks/training_cards/useGetAllExercises.tsx";
import { useAddExerciseToCard } from "../hooks/training_cards/useAddExerciseToCard.tsx";
import { useUpdateCardExercise } from "../hooks/training_cards/useUpdateCardExercise.tsx";
import { useRemoveExerciseFromCard } from "../hooks/training_cards/useRemoveExerciseFromCard.tsx";
import { useCreateTrainingCard } from "../hooks/training_cards/useCreateTrainingCard.tsx";
import { useGetAllUsers, type UserOut } from "../hooks/user/useGetAllUsers.tsx";

import CreateCardForm from "../components/CreateCardForm.tsx";
import DayExerciseGroup, { MAX_EXERCISES_PER_DAY } from "../components/DayExerciseGroup.tsx";

import type { TrainingCardOut, TrainingCardExerciseOut, TrainingCardExerciseIn, ExerciseOut } from "../types/training_cards";
import { WEEK_DAY_LABELS } from "../types/training_cards";

// Utility functions

/** Esercizi appartenenti a un determinato giorno della settimana */
function exercisesForDay(exercises: TrainingCardExerciseOut[], day: string) {
  return exercises.filter((e) => e.day_execution === day);
}

/** True se il giorno ha già raggiunto il numero massimo di esercizi */
export function isDayFull(exercises: TrainingCardExerciseOut[], day: string) {
  return exercisesForDay(exercises, day).length >= MAX_EXERCISES_PER_DAY;
}

/**
 * Insieme delle posizioni occupate in un dato giorno.
 * excludeId esclude l'esercizio corrente durante la modifica,
 * in modo che il suo slot risulti disponibile.
 */
export function usedPositionsForDay(
  exercises: TrainingCardExerciseOut[],
  day: string,
  excludeId?: number
): Set<number> {
  return new Set(
    exercisesForDay(exercises, day)
      .filter((e) => e.id !== excludeId)
      .map((e) => e.position)
  );
}

/** True se la posizione è già occupata nel giorno indicato */
export function isPositionTaken(
  exercises: TrainingCardExerciseOut[],
  day: string,
  position: number,
  excludeId?: number
) {
  return usedPositionsForDay(exercises, day, excludeId).has(position);
}

/**
 * Restituisce i giorni con almeno un esercizio, ordinati
 * secondo l'ordine canonico della settimana definito in WEEK_DAY_LABELS.
 */
function getTrainingDays(exercises: TrainingCardExerciseOut[]) {
  const dayKeys = Object.keys(WEEK_DAY_LABELS);
  const days = [...new Set(exercises.map((e) => e.day_execution))];
  return days.sort((a, b) => dayKeys.indexOf(a) - dayKeys.indexOf(b));
}



export default function TrainingCards() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";


  const [cards, setCards] = useState<TrainingCardOut[]>([]);
  const [exercises, setExercises] = useState<ExerciseOut[]>([]);
  const [users, setUsers] = useState<UserOut[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingExercise, setEditingExercise] = useState<TrainingCardExerciseOut | null>(null);
  const [showCreateCard, setShowCreateCard] = useState(false);
  const [filterUserId, setFilterUserId] = useState<string>("");


  const { getAllTrainingCards, loading: loadingCards, error: cardsError } = useGetAllTrainingCards();
  const { getTrainingCardsByUser } = useGetTrainingCardsByUser();
  const { getAllExercises } = useGetAllExercises();
  const { getAllUsers } = useGetAllUsers();
  const { addExerciseToCard, loading: loadingAdd, error: addError } = useAddExerciseToCard();
  const { updateCardExercise, loading: loadingUpdate, error: updateError } = useUpdateCardExercise();
  const { removeExerciseFromCard, loading: loadingRemove } = useRemoveExerciseFromCard();
  const { createTrainingCard, loading: loadingCreate, error: createError } = useCreateTrainingCard();


  // Gli admin caricano tutte le schede e la lista utenti;
  // i normali user caricano solo le proprie schede.
  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      const [cardsData, exData] = await Promise.all([
        isAdmin ? getAllTrainingCards() : getTrainingCardsByUser(user.id),
        getAllExercises(),
      ]);
      if (cardsData) setCards(cardsData);
      if (exData) setExercises(exData);

      // Solo gli admin hanno bisogno della lista utenti
      if (isAdmin) {
        const usersData = await getAllUsers();
        if (usersData) setUsers(usersData.filter((u: UserOut) => u.role === "USER"));
      }
    })();
  }, [user?.id]);


  const selectedCard = cards.find((c) => c.id === selectedCardId) ?? null;
  const trainingDays = selectedCard ? getTrainingDays(selectedCard.exercises) : [];
  const totalExercises = selectedCard?.exercises.length ?? 0;

  // Gli admin possono filtrare per utente; gli utenti vedono solo le proprie schede
  const filteredCards = isAdmin && filterUserId
    ? cards.filter((c) => String(c.user_id) === filterUserId)
    : cards;

  // True se almeno un giorno ha ancora spazio per un nuovo esercizio
  const canAddExercise =
    isAdmin &&
    selectedCard != null &&
    Object.keys(WEEK_DAY_LABELS).some((day) => !isDayFull(selectedCard.exercises, day));


  // Handlers (solo admin)
  const handleFormSubmit = async (payload: TrainingCardExerciseIn) => {
    if (!selectedCardId || !selectedCard) return;
    const { day_execution, position } = payload;
    const dayLabel = WEEK_DAY_LABELS[day_execution] ?? day_execution;

    if (editingExercise) {
      // Modifica: libera il vecchio slot e verifica il nuovo
      if (isPositionTaken(selectedCard.exercises, day_execution, position, editingExercise.id)) {
        alert(`La posizione ${position} è già occupata il ${dayLabel}. Scegli un'altra posizione.`);
        return;
      }
      const updated = await updateCardExercise(selectedCardId, editingExercise.id, payload);
      if (updated) {
        setCards((prev) =>
          prev.map((c) =>
            c.id === selectedCardId
              ? { ...c, exercises: c.exercises.map((e) => (e.id === editingExercise.id ? updated : e)) }
              : c
          )
        );
        setEditingExercise(null);
        setShowForm(false);
      }
    } else {
      // Aggiunta: verifica capienza giornaliera e unicità posizione
      if (isDayFull(selectedCard.exercises, day_execution)) {
        alert(`Il giorno ${dayLabel} ha già raggiunto il limite di ${MAX_EXERCISES_PER_DAY} esercizi.`);
        return;
      }
      if (isPositionTaken(selectedCard.exercises, day_execution, position)) {
        alert(`La posizione ${position} è già occupata il ${dayLabel}. Scegli un'altra posizione.`);
        return;
      }
      const added = await addExerciseToCard(selectedCardId, payload);
      if (added) {
        setCards((prev) =>
          prev.map((c) => (c.id === selectedCardId ? { ...c, exercises: [...c.exercises, added] } : c))
        );
        setShowForm(false);
      }
    }
  };

  const handleDelete = async (cardId: number, cardExId: number) => {
    if (!window.confirm("Rimuovere questo esercizio dalla scheda?")) return;
    const removed = await removeExerciseFromCard(cardId, cardExId);
    if (removed) {
      setCards((prev) =>
        prev.map((c) =>
          c.id === cardId ? { ...c, exercises: c.exercises.filter((e) => e.id !== cardExId) } : c
        )
      );
    }
  };

  const handleStartEdit = (ex: TrainingCardExerciseOut) => {
    setEditingExercise(ex);
    setShowForm(true);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingExercise(null);
  };

  const handleCardCreated = (card: TrainingCardOut) => {
    setCards((prev) => [...prev, card]);
    setShowCreateCard(false);
    setSelectedCardId(card.id);
  };


  return (
    <div className="d-flex flex-column min-vh-100">
      <main className="flex-grow-1">
        <div className="container py-4">

          {/* Titolo adattato al ruolo */}
          <h1 className="h3 mb-1">
            {isAdmin ? "Schede di Allenamento" : "Le mie schede di allenamento"}
          </h1>
          <p className="text-muted mb-4">
            Seleziona una scheda per {isAdmin ? "visualizzarne e modificarne" : "visualizzarne"} gli esercizi
          </p>

          {loadingCards && <p className="text-muted">Caricamento schede...</p>}
          {cardsError && <p className="text-danger">{cardsError}</p>}

          <div className="row g-4">
            {/* ── Colonna sinistra: lista schede ── */}
            <div className="col-12 col-lg-4">
              <div style={{ background: "#fff", borderRadius: "14px", boxShadow: "0 2px 12px rgba(0,0,0,0.07)", overflow: "hidden", border: "1px solid #e9ecef" }}>
                {/* Intestazione colonna */}
                <div style={{ background: "#198754", padding: "16px 20px", color: "#fff" }}>
                  <div className="d-flex align-items-center justify-content-between">
                    <h6 className="mb-0 fw-bold">
                      {isAdmin ? `Schede (${filteredCards.length})` : `Le mie schede (${cards.length})`}
                    </h6>
                    {/* Pulsante "Nuova scheda": solo admin */}
                    {isAdmin && (
                      <button
                        className="btn btn-sm"
                        style={{ background: "rgba(255,255,255,0.2)", color: "#fff", borderRadius: "6px", fontSize: "0.78rem", padding: "3px 10px" }}
                        onClick={() => setShowCreateCard((v) => !v)}
                      >
                        {showCreateCard ? "Annulla" : "Nuova scheda"}
                      </button>
                    )}
                  </div>

                  {/* Filtro per utente: solo admin */}
                  {isAdmin && (
                    <select
                      className="form-select form-select-sm mt-2"
                      style={{ borderRadius: "6px", fontSize: "0.82rem" }}
                      value={filterUserId}
                      onChange={(e) => { setFilterUserId(e.target.value); setSelectedCardId(null); setShowForm(false); }}
                    >
                      <option value="">Tutti gli utenti</option>
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>{u.name} {u.surname} (@{u.username})</option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Form creazione nuova scheda: solo admin */}
                {isAdmin && showCreateCard && (
                  filterUserId ? (
                    <div style={{ padding: "0 16px" }}>
                      <CreateCardForm userId={Number(filterUserId)} loading={loadingCreate} error={createError} onCreated={handleCardCreated} />
                    </div>
                  ) : (
                    <div className="p-3">
                      <small className="text-warning fw-semibold">Seleziona prima un utente dal filtro per creare una scheda.</small>
                    </div>
                  )
                )}

                {/* Lista schede */}
                <div style={{ maxHeight: "520px", overflowY: "auto" }}>
                  {!loadingCards && filteredCards.length === 0 && (
                    <p className="text-center text-muted py-4 small">
                      Nessuna scheda trovata.
                      {isAdmin && filterUserId && <span className="d-block mt-1">Crea la prima scheda con il pulsante in alto.</span>}
                    </p>
                  )}
                  {filteredCards.map((card) => {
                    const isSelected = card.id === selectedCardId;
                    const cardUser = isAdmin ? users.find((u) => u.id === card.user_id) : null;
                    const days = getTrainingDays(card.exercises);
                    return (
                      <button
                        key={card.id}
                        className="w-100 text-start border-0 px-3 py-3"
                        style={{
                          background: isSelected ? "#f0faf4" : "transparent",
                          borderLeft: isSelected ? "4px solid #198754" : "4px solid transparent",
                          borderBottom: "1px solid #f1f3f5",
                          cursor: "pointer",
                        }}
                        onClick={() => { setSelectedCardId(card.id); setShowForm(false); setEditingExercise(null); }}
                      >
                        <div className="d-flex justify-content-between align-items-start">
                          <div>
                            <div className="fw-semibold" style={{ fontSize: "0.9rem" }}>Scheda #{card.id}</div>
                            {/* Nome utente mostrato solo all'admin */}
                            {isAdmin && (
                              <div className="text-muted" style={{ fontSize: "0.78rem" }}>
                                {cardUser ? `${cardUser.name} ${cardUser.surname} (@${cardUser.username})` : `Utente #${card.user_id}`}
                              </div>
                            )}
                            <div className="text-muted" style={{ fontSize: "0.78rem" }}>
                              {card.init_date} — {card.expiry_date}
                            </div>
                          </div>
                          <span className="badge" style={{ background: "#6c757d", color: "#fff", fontSize: "0.7rem" }}>
                            {days.length} giorni · {card.exercises.length} es.
                          </span>
                        </div>
                        {card.description && (
                          <div className="text-muted mt-1" style={{ fontSize: "0.77rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {card.description}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* ── Colonna destra: dettaglio scheda ── */}
            <div className="col-12 col-lg-8">
              {!selectedCard ? (
                <div className="d-flex flex-column align-items-center justify-content-center text-muted" style={{ minHeight: "340px", background: "#fff", borderRadius: "14px", border: "2px dashed #dee2e6" }}>
                  <p className="mb-0 fw-semibold">Seleziona una scheda per visualizzarla</p>
                  <small className="text-muted mt-1">Le schede appaiono a sinistra</small>
                </div>
              ) : (
                <div>
                  <div style={{ background: "#fff", borderRadius: "14px", boxShadow: "0 2px 12px rgba(0,0,0,0.07)", border: "1px solid #e9ecef", overflow: "hidden", marginBottom: "20px" }}>
                    {/* Intestazione scheda */}
                    <div style={{ background: "linear-gradient(135deg, #198754 0%, #157347 100%)", padding: "20px 24px", color: "#fff" }}>
                      <div className="d-flex justify-content-between align-items-start flex-wrap gap-2">
                        <div>
                          <h5 className="mb-0 fw-bold">Scheda #{selectedCard.id}</h5>
                          <div className="text-white-50" style={{ fontSize: "0.85rem" }}>
                            {/* Dettaglio utente mostrato solo all'admin */}
                            {isAdmin && (() => {
                              const u = users.find((u) => u.id === selectedCard.user_id);
                              return u ? `${u.name} ${u.surname} (@${u.username}) · ` : `Utente #${selectedCard.user_id} · `;
                            })()}
                            dal {selectedCard.init_date} al {selectedCard.expiry_date}
                          </div>
                          {selectedCard.description && (
                            <div className="mt-1" style={{ fontSize: "0.88rem", opacity: 0.9 }}>{selectedCard.description}</div>
                          )}
                        </div>

                        {/* Badge riepilogo + pulsante aggiunta esercizio (solo admin) */}
                        <div className="d-flex align-items-center gap-2 flex-wrap">
                          {[
                            `${trainingDays.length} ${trainingDays.length === 1 ? "giorno" : "giorni"} / sett.`,
                            `${totalExercises} esercizi totali`,
                          ].map((label) => (
                            <span key={label} className="badge fs-6" style={{ background: "rgba(255,255,255,0.25)", color: "#fff", fontWeight: 600 }}>
                              {label}
                            </span>
                          ))}
                          {canAddExercise && !showForm && (
                            <button
                              className="btn btn-sm"
                              style={{ background: "rgba(255,255,255,0.2)", color: "#fff", borderRadius: "7px", fontWeight: 600, fontSize: "0.82rem" }}
                              onClick={() => { setEditingExercise(null); setShowForm(true); }}
                            >
                              Aggiungi esercizio
                            </button>
                          )}
                        </div>
                      </div>

                      {selectedCard.note && (
                        <div className="mt-2 px-3 py-2 rounded" style={{ background: "rgba(0,0,0,0.15)", fontSize: "0.82rem" }}>
                          {selectedCard.note}
                        </div>
                      )}
                    </div>

                    {/* Esercizi raggruppati per giorno */}
                    <div style={{ padding: "16px 20px" }}>
                      {totalExercises === 0 ? (
                        <p className="text-center text-muted py-3 small mb-0">
                          {isAdmin ? "Nessun esercizio nella scheda. Aggiungine uno." : "Nessun esercizio nella scheda."}
                        </p>
                      ) : (
                        trainingDays.map((day) => (
                          <DayExerciseGroup
                            key={day}
                            day={day}
                            exercises={selectedCard.exercises.filter((e) => e.day_execution === day)}
                            allExercises={exercises}
                            cardId={selectedCard.id}
                            isAdmin={isAdmin}
                            onEdit={handleStartEdit}
                            onDelete={handleDelete}
                            loadingDelete={loadingRemove}
                          />
                        ))
                      )}
                    </div>
                  </div>

                  {/* Form aggiunta/modifica esercizio — solo admin */}
                  {isAdmin && showForm && (
                    <TrainingExerciseForm
                      cardId={selectedCard.id}
                      availableExercises={exercises}
                      existingExercises={selectedCard.exercises}
                      editingExercise={editingExercise}
                      loading={loadingAdd || loadingUpdate}
                      error={addError || updateError}
                      onSubmit={handleFormSubmit}
                      onCancel={handleCancelForm}
                      isDayFull={(day) => isDayFull(selectedCard.exercises, day)}
                      usedPositionsForDay={(day) => usedPositionsForDay(selectedCard.exercises, day, editingExercise?.id)}
                    />
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}