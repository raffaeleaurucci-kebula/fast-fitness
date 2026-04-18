import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { useAuth } from "../context/AuthContext.tsx";
import { useCreateSub } from "../hooks/subscriptions/useCreateSub.tsx";
import { useSubscriptions } from "../hooks/subscriptions/useGetSub.tsx";
import type { SubscriptionIn, SubscriptionOut } from "../types/subscriptions.ts";

export default function SubscriptionsPage() {
  const [plans, setPlans] = useState<SubscriptionOut[]>([]);

  const { user } = useAuth();
  const { createSubscription, loading, error } = useCreateSub();
  const {
    getSubscriptions,
    loading: loadingSubs,
    error: subsError,
  } = useSubscriptions();

  const [form, setForm] = useState({
    title: "",
    cost: 0,
    duration_month: 0,
    weekly_accesses: 0,
    description: "",
  });

  const [formatError, setFormatError] = useState("");

  // LOAD SUBSCRIPTIONS ON PAGE MOUNT
  useEffect(() => {
    const loadSubscriptions = async () => {
      const data = await getSubscriptions(0);
      if (data) {
        setPlans(data);
      }
    };

    loadSubscriptions();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setFormatError("");
  };

  const validateDescriptions = (value: string) => {
    if (!value.trim()) return true;
    return /^(?:[^,]+(?:,\s*[^,]+)*)$/.test(value.trim());
  };

  const addPlan = async () => {
    if (!form.title || !form.cost || !form.duration_month) return;

    if (!validateDescriptions(form.description)) {
      setFormatError("Formato non valido. Usa: 'A, B, C'");
      return;
    }

    const payload: SubscriptionIn = {
      title: form.title,
      cost: Number(form.cost),
      duration_month: Number(form.duration_month),
      weekly_accesses: Number(form.weekly_accesses),
      description: form.description,
    };

    const created = await createSubscription(payload);

    if (created) {
      setPlans((prev) => [
        ...prev,
        {
          id: created.id,
          title: created.title,
          cost: created.cost,
          duration_month: created.duration_month,
          weekly_accesses: created.weekly_accesses,
          description: created.description ?? "",
        },
      ]);

      setForm({
        title: "",
        cost: 0,
        duration_month: 0,
        weekly_accesses: 0,
        description: "",
      });
    }
  };

  const parseDescriptions = (desc: string) =>
    desc ? desc.split(/\s*,\s*/).filter((d) => d.length > 0) : [];

  return (
    <div className="container py-4">
      <h2 className="mb-4 text-center">Abbonamenti Palestra</h2>

      {/* LOADING + ERROR FETCH SUBSCRIPTIONS */}
      {loadingSubs && (
        <p className="text-center text-muted">Caricamento abbonamenti...</p>
      )}

      {subsError && (
        <p className="text-center text-danger">{subsError}</p>
      )}

      <div className="row g-4 align-items-stretch">
        {plans.map((plan) => (
          <div key={plan.id} className="col-md-4 d-flex">
            <div
              className="card shadow-sm border-1 w-100 h-100 d-flex flex-column"
              style={{ minHeight: "320px" }}
            >
              <div className="card-body text-center d-flex flex-column h-100">
                <h5 className="card-title">{plan.title}</h5>

                <h6 className="card-subtitle mb-2 text-muted">
                  €{plan.cost} / {plan.duration_month} mese/i
                </h6>

                <p className="text-muted small">
                  Accessi settimanali: {plan.weekly_accesses}
                </p>

                <ul className="list-unstyled mt-3 mb-0 mx-auto text-center d-table">
                  {parseDescriptions(plan.description).map((d, i) => (
                    <li key={i} className="d-flex align-items-center mb-1">
                      <span className="text-success me-2">✓</span>
                      <span className="text-muted small">{d}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-auto w-100">
                  <button className="btn btn-primary w-100 mt-3" disabled={user?.role == "ADMIN"}>
                    Sottoscrivi
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ADMIN FORM */}
      {user?.role == "ADMIN" && (
        <div className="card mt-5 shadow-sm border-1 w-100">
          <div className="container-fluid px-4 px-md-5 py-4">
            <h4 className="text-center mb-4">Crea nuovo abbonamento</h4>

            <div className="row g-4">
              <div className="col-12 col-md-6 col-lg-3">
                <label className="form-label">Titolo</label>
                <input
                  className="form-control"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                />
              </div>

              <div className="col-12 col-md-6 col-lg-3">
                <label className="form-label">Costo (€)</label>
                <input
                  className="form-control"
                  type="number"
                  name="cost"
                  value={form.cost}
                  onChange={handleChange}
                />
              </div>

              <div className="col-12 col-md-6 col-lg-3">
                <label className="form-label">Durata (mesi)</label>
                <input
                  className="form-control"
                  type="number"
                  name="duration_month"
                  value={form.duration_month}
                  onChange={handleChange}
                />
              </div>

              <div className="col-12 col-md-6 col-lg-3">
                <label className="form-label">Accessi settimanali</label>
                <input
                  className="form-control"
                  type="number"
                  name="weekly_accesses"
                  value={form.weekly_accesses}
                  onChange={handleChange}
                />
              </div>

              <div className="col-12">
                <label className="form-label">
                  Servizi inclusi (separati da virgola)
                </label>
                <input
                  className="form-control"
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                />

                {formatError && (
                  <small className="text-danger d-block mt-2">
                    {formatError}
                  </small>
                )}
              </div>
            </div>

            {(loading || error) && (
              <div className="mt-3 text-center">
                {loading && (
                  <p className="text-muted mb-0">Creazione in corso...</p>
                )}
                {error && <p className="text-danger mb-0">{error}</p>}
              </div>
            )}

            <div className="d-grid mt-4">
              <button className="btn btn-success py-2" onClick={addPlan}>
                Aggiungi abbonamento
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}