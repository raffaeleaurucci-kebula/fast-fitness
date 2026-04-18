import { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.tsx";
import { useGetCards } from "../hooks/credit_cards/useGetCards.tsx";
import { useCreateCard } from "../hooks/credit_cards/useCreateCard.tsx";
import { useCreateSubByUser } from "../hooks/subscriptions/useCreateSubByUser.tsx";
import type { CreditCardOut } from "../types/credit_cards.ts";
import type { SubscriptionOut } from "../types/subscriptions.ts";
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

export default function SubscribePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const plan =
    (location.state as { plan?: SubscriptionOut } | null)?.plan ?? null;

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
  const { createCard, loading: loadingCreateCard, error: createCardError } =
    useCreateCard();
  const {
    createSubByUser,
    loading: loadingSubscribe,
    error: subscribeError,
  } = useCreateSubByUser();

  useEffect(() => {
    if (!plan) navigate("/subscriptions");
  }, [plan, navigate]);

  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      const data = await getCards(user.id);
      if (data) setCards(data);
    })();
  }, [user?.id]);

  const validateCardForm = (): boolean => {
    if (!/^\d{16}$/.test(cardForm.number)) {
      setCardFormError("Numero carta non valido");
      return false;
    }
    if (!/^\d{2}-\d{4}$/.test(cardForm.expiry_date)) {
      setCardFormError("Formato MM-YYYY richiesto");
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

  const handleSubscribe = async () => {
    if (!selectedCardId || !plan) return;

    const result = await createSubByUser({
      card_id: selectedCardId,
      subscription_id: plan.id,
      init_date: todayStr(),
      expiry_date: addMonths(new Date(), plan.duration_month),
      automatic_renewal: automaticRenewal,
    });

    if (result) {
      setSuccessMessage(`Abbonamento "${plan.title}" attivato con successo!`);
      setStep("confirm");
    }
  };

  return (
    <div className="d-flex flex-column min-vh-100 bg-light">

      <div className="container py-4 flex-grow-1" style={{ maxWidth: 640 }}>

        {/* TOP LEFT BACK BUTTON */}
        <div className="mb-3">
          <button
            className="btn btn-sm btn-outline-secondary"
            onClick={() => navigate("/subscriptions")}
          >
            Torna agli abbonamenti
          </button>
        </div>

        {/* PLAN CARD */}
        {plan && (
          <div className="card shadow-sm border-0 mb-4">
            <div className="card-body d-flex justify-content-between align-items-center">
              <div>
                <h4 className="mb-1">{plan.title}</h4>
                <small className="text-muted">
                  {plan.weekly_accesses} accessi settimanali
                </small>
              </div>
              <div className="text-end">
                <h4 className="text-primary mb-0">€{plan.cost}</h4>
                <small className="text-muted">/ {plan.duration_month} mesi</small>
              </div>
            </div>
          </div>
        )}

        {/* SUCCESS */}
        {step === "confirm" && (
          <div className="alert alert-success text-center shadow-sm">
            <h5>Abbonamento attivato!</h5>
            <p>{successMessage}</p>
            <button className="btn btn-primary" onClick={() => navigate("/")}>
              Vai alla home
            </button>
          </div>
        )}

        {/* CARDS */}
        {step === "choose_card" && (
          <>
            <h5 className="mb-3">Seleziona metodo di pagamento</h5>

            {loadingCards && <p>Caricamento...</p>}
            {cardsError && <p className="text-danger">{cardsError}</p>}

            <div className="d-flex flex-column gap-3 mb-3">
              {cards.map((card) => {
                const isSelected = selectedCardId === card.id;

                return (
                  <div
                    key={card.id}
                    onClick={() => setSelectedCardId(card.id)}
                    className={`card p-3 shadow-sm ${
                      isSelected
                        ? "border-primary border-2 bg-primary bg-opacity-10"
                        : "border"
                    }`}
                    style={{
                      cursor: "pointer",
                      transition: "0.2s",
                    }}
                  >
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <strong>{card.brand}</strong>
                        <div className="text-muted small">
                          {maskCard(card.number)}
                        </div>
                      </div>

                      <div className="text-end">
                        <span className="badge bg-dark">
                          {card.expiry_date}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              className="btn btn-outline-primary w-100 mb-3"
              onClick={() => setStep("add_card")}
            >
              + Aggiungi carta
            </button>

            <div className="form-check mb-3">
              <input
                type="checkbox"
                className="form-check-input"
                checked={automaticRenewal}
                onChange={(e) => setAutomaticRenewal(e.target.checked)}
              />
              <label className="form-check-label">
                Rinnovo automatico
              </label>
            </div>

            {subscribeError && (
              <p className="text-danger">{subscribeError}</p>
            )}

            <button
              className="btn btn-success w-100 py-2"
              disabled={!selectedCardId || loadingSubscribe}
              onClick={handleSubscribe}
            >
              {loadingSubscribe ? "Attivazione..." : "Conferma abbonamento"}
            </button>
          </>
        )}

        {/* ADD CARD */}
        {step === "add_card" && (
          <div className="card shadow-sm border-0">
            <div className="card-body p-4">

              <h5 className="mb-4 text-center">💳 Nuova carta di pagamento</h5>

              {/* NUMBER */}
              <div className="mb-3">
                <label className="form-label">Numero carta</label>
                <input
                  className="form-control"
                  placeholder="1234 5678 9012 3456"
                  maxLength={16}
                  value={cardForm.number}
                  onChange={(e) =>
                    setCardForm({
                      ...cardForm,
                      number: e.target.value.replace(/\D/g, ""),
                    })
                  }
                />
                <div className="form-text">
                  Inserisci le 16 cifre della carta
                </div>
              </div>

              {/* EXPIRY */}
              <div className="mb-3">
                <label className="form-label">Scadenza</label>
                <input
                  className="form-control"
                  placeholder="MM-YYYY"
                  value={cardForm.expiry_date}
                  onChange={(e) =>
                    setCardForm({
                      ...cardForm,
                      expiry_date: e.target.value,
                    })
                  }
                />
                <div className="form-text">
                  Formato richiesto: mese-anno
                </div>
              </div>

              {/* BRAND */}
              <div className="mb-4">
                <label className="form-label">Circuito</label>
                <input
                  className="form-control"
                  placeholder="Visa / Mastercard / Amex"
                  value={cardForm.brand}
                  onChange={(e) =>
                    setCardForm({
                      ...cardForm,
                      brand: e.target.value,
                    })
                  }
                />
              </div>

              {/* ERROR */}
              {cardFormError && (
                <div className="alert alert-danger py-2">
                  {cardFormError}
                </div>
              )}

              {/* BUTTONS */}
              <div className="d-grid gap-2">
                <button
                  className="btn btn-success"
                  onClick={handleAddCard}
                  disabled={loadingCreateCard}
                >
                  {loadingCreateCard ? "Salvataggio..." : "Salva carta"}
                </button>

                <button
                  className="btn btn-outline-secondary"
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