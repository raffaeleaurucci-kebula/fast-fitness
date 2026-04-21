import { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.tsx";
import { useGetCards } from "../hooks/credit_cards/useGetCards.tsx";
import { useCreateCard } from "../hooks/credit_cards/useCreateCard.tsx";
import { useCreateSubByUser } from "../hooks/subscriptions/useCreateSubByUser.tsx";
import { useCreateCourseByUser } from "../hooks/courses/useCreateCourseByUser.tsx";
import type { CreditCardOut } from "../types/credit_cards.ts";
import type { SubscriptionOut } from "../types/subscriptions.ts";
import type { CourseOut } from "../types/courses.ts";
import Footer from "../components/Footer.tsx";

// utils
function addMonths(date: Date, months: number): string {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().split("T")[0];
}

function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}

function maskCard(number: string): string {
  return `•••• •••• •••• ${number.slice(-4)}`;
}

type Step = "choose_card" | "add_card" | "confirm";
type Mode = "subscription" | "course";

export default function SubscribePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Determina il tipo di pagina dal state passato
  const locationState = location.state as
    | { plan?: SubscriptionOut; course?: CourseOut }
    | null;

  const plan = locationState?.plan ?? null;
  const course = locationState?.course ?? null;
  const mode: Mode = course ? "course" : "subscription";

  // Dati comuni visualizzati
  const itemTitle = mode === "course" ? course?.type : plan?.title;
  const itemCost = mode === "course" ? course?.cost : plan?.cost;
  const itemDuration = mode === "course" ? course?.duration_month : plan?.duration_month;
  const itemSubtitle =
    mode === "course"
      ? `${course?.n_accesses} accessi totali`
      : `${plan?.weekly_accesses} accessi settimanali`;

  const [cards, setCards] = useState<CreditCardOut[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<number | null>(null);
  const [step, setStep] = useState<Step>("choose_card");
  const [automaticRenewal, setAutomaticRenewal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const [cardForm, setCardForm] = useState({
    number: "",
    expiry_date: "",
    brand: "",
  });
  const [cardFormError, setCardFormError] = useState("");

  const { getCards, loading: loadingCards, error: cardsError } = useGetCards();
  const { createCard, loading: loadingCreateCard, error: createCardError } = useCreateCard();
  const { createSubByUser, loading: loadingSubscribe, error: subscribeError } = useCreateSubByUser();
  const { createCourseByUser, loading: loadingEnroll, error: enrollError } = useCreateCourseByUser();

  const loadingConfirm = mode === "course" ? loadingEnroll : loadingSubscribe;
  const confirmError = mode === "course" ? enrollError : subscribeError;

  // Redirect se mancano i dati
  useEffect(() => {
    if (!plan && !course) {
      navigate(mode === "course" ? "/courses" : "/subscriptions");
    }
  }, [plan, course, navigate, mode]);

  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      const data = await getCards(user.id);
      if (data) setCards(data);
    })();
  }, [user?.id]);

  const validateCardForm = (): boolean => {
    if (!/^\d{16}$/.test(cardForm.number)) {
      setCardFormError("Numero carta non valido (16 cifre richieste)");
      return false;
    }
    if (!/^\d{2}-\d{4}$/.test(cardForm.expiry_date)) {
      setCardFormError("Formato scadenza non valido (MM-YYYY)");
      return false;
    }
    if (cardForm.brand.trim().length < 3) {
      setCardFormError("Circuito non valido");
      return false;
    }
    setCardFormError("");
    return true;
  };

  const handleAddCard = async () => {
    if (!user?.id || !validateCardForm()) return;
    const created = await createCard({
      user_id: user.id,
      number: cardForm.number,
      expiry_date: cardForm.expiry_date,
      brand: cardForm.brand.trim(),
    });
    if (created) {
      setCards((prev) => [...prev, created]);
      setSelectedCardId(created.id);
      setCardForm({ number: "", expiry_date: "", brand: "" });
      setStep("choose_card");
    }
  };

  const handleConfirm = async () => {
    if (!selectedCardId) return;

    if (mode === "subscription" && plan) {
      const result = await createSubByUser({
        card_id: selectedCardId,
        subscription_id: plan.id,
        init_date: todayStr(),
        expiry_date: addMonths(new Date(), plan.duration_month),
        automatic_renewal: automaticRenewal,
        paid_amount: plan.cost,
        cancelled: false,
      });
      if (result) {
        setSuccessMessage(`Abbonamento "${plan.title}" attivato con successo!`);
        setStep("confirm");
      }
    } else if (mode === "course" && course) {
      const result = await createCourseByUser({
        card_id: selectedCardId,
        course_id: course.id,
        init_date: todayStr(),
        expiry_date: addMonths(new Date(), course.duration_month),
        paid_amount: course.cost,
        cancelled: false,
      });
      if (result) {
        setSuccessMessage(`Iscrizione al corso "${course.type}" completata con successo!`);
        setStep("confirm");
      }
    }
  };

  const accentColor = mode === "course" ? "#198754" : "#0d6efd";
  const backPath = mode === "course" ? "/courses" : "/subscriptions";
  const backLabel = mode === "course" ? "Torna ai corsi" : "Torna agli abbonamenti";
  const confirmLabel = mode === "course" ? "Conferma iscrizione" : "Conferma abbonamento";

  return (
    <div className="d-flex flex-column min-vh-100 bg-light">
      <div className="container py-4 flex-grow-1" style={{ maxWidth: 640 }}>

        {/* Back */}
        <div className="mb-3">
          <button
            className="btn btn-sm btn-outline-secondary"
            onClick={() => navigate(backPath)}
          >
            {backLabel}
          </button>
        </div>

        {/* Item card */}
        {(plan || course) && (
          <div className="card shadow-sm border-0 mb-4" style={{ borderRadius: "12px", overflow: "hidden" }}>
            <div style={{ background: accentColor, padding: "4px" }} />
            <div className="card-body d-flex justify-content-between align-items-center px-4 py-3">
              <div>
                <h4 className="mb-1">{itemTitle}</h4>
                <small className="text-muted">{itemSubtitle}</small>
                {mode === "course" && course?.require_subscription && (
                  <div>
                    <span className="badge bg-warning text-dark mt-1" style={{ fontSize: "0.75rem" }}>
                      🔒 Richiede abbonamento attivo
                    </span>
                  </div>
                )}
              </div>
              <div className="text-end">
                <h4 style={{ color: accentColor }} className="mb-0">
                  €{itemCost}
                </h4>
                <small className="text-muted">/ {itemDuration} mesi</small>
              </div>
            </div>
          </div>
        )}

        {/* Success */}
        {step === "confirm" && (
          <div className="alert alert-success text-center shadow-sm" style={{ borderRadius: "12px" }}>
            <h5 className="mb-2">
              {mode === "course" ? "Iscrizione completata!" : "Abbonamento attivato!"}
            </h5>
            <p className="mb-3">{successMessage}</p>
            <button
              className="btn text-white"
              style={{ background: accentColor, borderRadius: "8px" }}
              onClick={() => navigate("/")}
            >
              Vai alla home
            </button>
          </div>
        )}

        {/* Choose card */}
        {step === "choose_card" && (
          <>
            <h5 className="mb-3">Seleziona metodo di pagamento</h5>

            {loadingCards && <p className="text-muted">Caricamento carte...</p>}
            {cardsError && <p className="text-danger">{cardsError}</p>}

            <div className="d-flex flex-column gap-3 mb-3">
              {cards.map((card) => {
                const isSelected = selectedCardId === card.id;
                return (
                  <div
                    key={card.id}
                    onClick={() => setSelectedCardId(card.id)}
                    className="card p-3 shadow-sm"
                    style={{
                      cursor: "pointer",
                      borderRadius: "10px",
                      border: isSelected
                        ? `2px solid ${accentColor}`
                        : "1.5px solid #dee2e6",
                      background: isSelected ? `${accentColor}10` : "#fff",
                      transition: "0.2s",
                    }}
                  >
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <strong>{card.brand}</strong>
                        <div className="text-muted small">{maskCard(card.number)}</div>
                      </div>
                      <span className="badge bg-dark">{card.expiry_date}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              className="btn btn-outline-secondary w-100 mb-3"
              style={{ borderRadius: "8px" }}
              onClick={() => setStep("add_card")}
            >
              + Aggiungi carta
            </button>

            {/* Rinnovo automatico solo per abbonamenti */}
            {mode === "subscription" && (
              <div className="form-check mb-3">
                <input
                  type="checkbox"
                  className="form-check-input"
                  id="automaticRenewal"
                  checked={automaticRenewal}
                  onChange={(e) => setAutomaticRenewal(e.target.checked)}
                />
                <label className="form-check-label" htmlFor="automaticRenewal">
                  Rinnovo automatico
                </label>
              </div>
            )}

            {confirmError && (
              <p className="text-danger small">{confirmError}</p>
            )}

            <button
              className="btn w-100 py-2 text-white fw-semibold"
              style={{ background: accentColor, borderRadius: "10px" }}
              disabled={!selectedCardId || loadingConfirm}
              onClick={handleConfirm}
            >
              {loadingConfirm ? "Elaborazione..." : confirmLabel}
            </button>
          </>
        )}

        {/* Add card */}
        {step === "add_card" && (
          <div className="card shadow-sm border-0" style={{ borderRadius: "14px" }}>
            <div className="card-body p-4">
              <h5 className="mb-4 text-center">💳 Nuova carta di pagamento</h5>

              <div className="mb-3">
                <label className="form-label">Numero carta</label>
                <input
                  className="form-control"
                  placeholder="1234567890123456"
                  maxLength={16}
                  value={cardForm.number}
                  onChange={(e) =>
                    setCardForm({ ...cardForm, number: e.target.value.replace(/\D/g, "") })
                  }
                />
                <div className="form-text">Inserisci le 16 cifre della carta</div>
              </div>

              <div className="mb-3">
                <label className="form-label">Scadenza</label>
                <input
                  className="form-control"
                  placeholder="MM-YYYY"
                  value={cardForm.expiry_date}
                  onChange={(e) =>
                    setCardForm({ ...cardForm, expiry_date: e.target.value })
                  }
                />
                <div className="form-text">Formato richiesto: mese-anno (es. 12-2027)</div>
              </div>

              <div className="mb-4">
                <label className="form-label">Circuito</label>
                <input
                  className="form-control"
                  placeholder="Visa / Mastercard / Amex"
                  value={cardForm.brand}
                  onChange={(e) =>
                    setCardForm({ ...cardForm, brand: e.target.value })
                  }
                />
              </div>

              {(cardFormError || createCardError) && (
                <div className="alert alert-danger py-2">
                  {cardFormError || createCardError}
                </div>
              )}

              <div className="d-grid gap-2">
                <button
                  className="btn text-white"
                  style={{ background: accentColor, borderRadius: "8px" }}
                  onClick={handleAddCard}
                  disabled={loadingCreateCard}
                >
                  {loadingCreateCard ? "Salvataggio..." : "Salva carta"}
                </button>
                <button
                  className="btn btn-outline-secondary"
                  style={{ borderRadius: "8px" }}
                  onClick={() => setStep("choose_card")}
                >
                  Annulla
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}