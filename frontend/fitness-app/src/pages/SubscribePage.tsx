import { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.tsx";
import { useGetCards } from "../hooks/credit_cards/useGetCards.tsx";
import { useCreateCard } from "../hooks/credit_cards/useCreateCard.tsx";
import { useCreateSubByUser } from "../hooks/subscriptions/useCreateSubByUser.tsx";
import type { CreditCardOut } from "../types/credit_cards.ts";
import type { SubscriptionOut } from "../types/subscriptions.ts";

// Aggiunge i mesi a una data e ritorna stringa YYYY-MM-DD
function addMonths(date: Date, months: number): string {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().split("T")[0];
}

function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}

// Mostra solo le ultime 4 cifre della carta
function maskCard(number: string): string {
  return `•••• •••• •••• ${number.slice(-4)}`;
}

type Step = "choose_card" | "add_card" | "confirm";

export default function SubscribePage() {
  const { subscriptionId } = useParams<{ subscriptionId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Piano passato via navigate state oppure lo recuperiamo dal server
  const planFromState = (location.state as { plan?: SubscriptionOut } | null)?.plan ?? null;
  const [plan, setPlan] = useState<SubscriptionOut | null>(planFromState);

  const [cards, setCards] = useState<CreditCardOut[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<number | null>(null);
  const [step, setStep] = useState<Step>("choose_card");
  const [automaticRenewal, setAutomaticRenewal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Form nuova carta
  const [cardForm, setCardForm] = useState({
    number: "",
    expiry_date: "", // MM-YYYY
    brand: "",
  });
  const [cardFormError, setCardFormError] = useState("");

  const { getCards, loading: loadingCards, error: cardsError } = useGetCards();
  const { createCard, loading: loadingCreateCard, error: createCardError } = useCreateCard();
  const {
    createSubByUser,
    loading: loadingSubscribe,
    error: subscribeError,
  } = useCreateSubByUser();

  // Carica le carte dell'utente
  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      const data = await getCards(user.id);
      if (data) setCards(data);
    })();
  }, [user?.id]);

  // Se il piano non è passato nello state, lo recupera dal server
  useEffect(() => {
    if (plan || !subscriptionId) return;
    fetch(`http://127.0.0.1:8000/subscriptions/${subscriptionId}`)
      .then((r) => r.json())
      .then((data) => setPlan(data))
      .catch(() => {});
  }, [subscriptionId, plan]);

  // ── AGGIUNTA CARTA ──────────────────────────────────────────────────────
  const validateCardForm = (): boolean => {
    if (!/^\d{16}$/.test(cardForm.number)) {
      setCardFormError("Il numero della carta deve essere di 16 cifre numeriche.");
      return false;
    }
    if (!/^\d{2}-\d{4}$/.test(cardForm.expiry_date)) {
      setCardFormError("La data di scadenza deve essere nel formato MM-YYYY.");
      return false;
    }
    if (cardForm.brand.trim().length < 3) {
      setCardFormError("Il circuito deve avere almeno 3 caratteri.");
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

  // ── CONFERMA SOTTOSCRIZIONE ─────────────────────────────────────────────
  const handleSubscribe = async () => {
    if (!selectedCardId || !plan) return;

    const initDate = todayStr();
    const expiryDate = addMonths(new Date(), plan.duration_month);

    const result = await createSubByUser({
      card_id: selectedCardId,
      subscription_id: plan.id,
      init_date: initDate,
      expiry_date: expiryDate,
      automatic_renewal: automaticRenewal,
    });

    if (result) {
      setSuccessMessage(
        `Abbonamento "${plan.title}" attivato con successo! Valido fino al ${expiryDate}.`
      );
      setStep("confirm");
    }
  };

  // ── RENDER ──────────────────────────────────────────────────────────────
  return (
    <div className="container py-4" style={{ maxWidth: 640 }}>
      <button
        className="btn btn-link ps-0 mb-3 text-decoration-none"
        onClick={() => navigate(-1)}
      >
        ← Torna agli abbonamenti
      </button>

      {/* Riepilogo piano */}
      {plan && (
        <div className="card border-primary mb-4 shadow-sm">
          <div className="card-body">
            <h5 className="card-title text-primary mb-1">{plan.title}</h5>
            <p className="mb-0 text-muted">
              <strong>€{plan.cost}</strong> / {plan.duration_month} mese/i &nbsp;·&nbsp;
              {plan.weekly_accesses} accessi/settimana
            </p>
          </div>
        </div>
      )}

      {/* ── STEP: SUCCESSO ─────────────────────────────────────────────── */}
      {step === "confirm" && (
        <div className="alert alert-success text-center" role="alert">
          <span className="fs-4">🎉</span>
          <p className="mt-2 mb-3">{successMessage}</p>
          <button className="btn btn-primary" onClick={() => navigate("/")}>
            Vai alla home
          </button>
        </div>
      )}

      {/* ── STEP: SCELTA CARTA ─────────────────────────────────────────── */}
      {step === "choose_card" && (
        <>
          <h5 className="mb-3">Scegli il metodo di pagamento</h5>

          {loadingCards && <p className="text-muted">Caricamento carte...</p>}
          {cardsError && <p className="text-danger">{cardsError}</p>}

          {!loadingCards && cards.length === 0 && (
            <p className="text-muted">
              Nessuna carta salvata.{" "}
              <button
                className="btn btn-link p-0"
                onClick={() => setStep("add_card")}
              >
                Aggiungine una
              </button>
              .
            </p>
          )}

          <div className="d-flex flex-column gap-2 mb-3">
            {cards.map((card) => (
              <div
                key={card.id}
                className={`card border-2 p-3 cursor-pointer ${
                  selectedCardId === card.id ? "border-primary bg-light" : "border-secondary"
                }`}
                style={{ cursor: "pointer" }}
                onClick={() => setSelectedCardId(card.id)}
              >
                <div className="d-flex align-items-center gap-3">
                  <input
                    type="radio"
                    name="selectedCard"
                    checked={selectedCardId === card.id}
                    onChange={() => setSelectedCardId(card.id)}
                  />
                  <div>
                    <strong>{card.brand}</strong>
                    <span className="ms-2 text-muted">{maskCard(card.number)}</span>
                    <span className="ms-2 text-muted small">
                      Scad. {card.expiry_date}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            className="btn btn-outline-secondary btn-sm mb-4"
            onClick={() => setStep("add_card")}
          >
            + Aggiungi nuova carta
          </button>

          {/* Rinnovo automatico */}
          <div className="form-check mb-4">
            <input
              className="form-check-input"
              type="checkbox"
              id="autoRenewal"
              checked={automaticRenewal}
              onChange={(e) => setAutomaticRenewal(e.target.checked)}
            />
            <label className="form-check-label" htmlFor="autoRenewal">
              Abilita rinnovo automatico
            </label>
          </div>

          {subscribeError && (
            <p className="text-danger mb-3">{subscribeError}</p>
          )}

          <button
            className="btn btn-primary w-100 py-2"
            disabled={!selectedCardId || loadingSubscribe || !plan}
            onClick={handleSubscribe}
          >
            {loadingSubscribe ? "Attivazione in corso..." : "Conferma sottoscrizione"}
          </button>
        </>
      )}

      {/* ── STEP: AGGIUNGI CARTA ───────────────────────────────────────── */}
      {step === "add_card" && (
        <>
          <h5 className="mb-3">Aggiungi una carta di credito</h5>

          <div className="d-flex flex-column gap-3">
            <div>
              <label className="form-label">Numero carta (16 cifre)</label>
              <input
                className="form-control"
                maxLength={16}
                placeholder="1234567812345678"
                value={cardForm.number}
                onChange={(e) =>
                  setCardForm({ ...cardForm, number: e.target.value.replace(/\D/g, "") })
                }
              />
            </div>

            <div>
              <label className="form-label">Scadenza (MM-YYYY)</label>
              <input
                className="form-control"
                placeholder="12-2028"
                value={cardForm.expiry_date}
                onChange={(e) =>
                  setCardForm({ ...cardForm, expiry_date: e.target.value })
                }
              />
            </div>

            <div>
              <label className="form-label">Circuito (es. Visa, Mastercard)</label>
              <input
                className="form-control"
                placeholder="Visa"
                value={cardForm.brand}
                onChange={(e) =>
                  setCardForm({ ...cardForm, brand: e.target.value })
                }
              />
            </div>
          </div>

          {(cardFormError || createCardError) && (
            <p className="text-danger mt-2">{cardFormError || createCardError}</p>
          )}

          <div className="d-flex gap-2 mt-4">
            <button
              className="btn btn-success w-50"
              onClick={handleAddCard}
              disabled={loadingCreateCard}
            >
              {loadingCreateCard ? "Salvataggio..." : "Salva carta"}
            </button>
            <button
              className="btn btn-outline-secondary w-50"
              onClick={() => setStep("choose_card")}
              disabled={loadingCreateCard}
            >
              Annulla
            </button>
          </div>
        </>
      )}
    </div>
  );
}