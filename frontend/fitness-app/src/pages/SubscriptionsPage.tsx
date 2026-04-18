import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.tsx";
import { useCreateSub } from "../hooks/subscriptions/useCreateSub.tsx";
import { useSubscriptions } from "../hooks/subscriptions/useGetSub.tsx";
import { useDeleteSub } from "../hooks/subscriptions/useDeleteSub.tsx";
import { useUpdateSub } from "../hooks/subscriptions/useUpdateSub.tsx";
import type { SubscriptionIn, SubscriptionOut } from "../types/subscriptions.ts";

interface EditForm {
  cost: number;
  weekly_accesses: number;
  description: string;
}

export default function SubscriptionsPage() {
  const [plans, setPlans] = useState<SubscriptionOut[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({
    cost: 0,
    weekly_accesses: 0,
    description: "",
  });
  const [editFormatError, setEditFormatError] = useState("");

  const navigate = useNavigate();
  const { user } = useAuth();
  const { createSubscription, loading, error } = useCreateSub();
  const { getSubscriptions, loading: loadingSubs, error: subsError } = useSubscriptions();
  const { deleteSubscription, loading: loadingDelete, error: deleteError } = useDeleteSub();
  const { updateSubscription, loading: loadingUpdate, error: updateError } = useUpdateSub();

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
      if (data) setPlans(data);
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

  // ── CREA ABBONAMENTO ──────────────────────────────────────────────────────
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
      setForm({ title: "", cost: 0, duration_month: 0, weekly_accesses: 0, description: "" });
    }
  };

  // ── ELIMINA ABBONAMENTO ───────────────────────────────────────────────────
  const handleDelete = async (id: number) => {
    if (!window.confirm("Sei sicuro di voler eliminare questo abbonamento?")) return;
    const ok = await deleteSubscription(id);
    if (ok) setPlans((prev) => prev.filter((p) => p.id !== id));
  };

  // ── AVVIA MODIFICA ────────────────────────────────────────────────────────
  const startEdit = (plan: SubscriptionOut) => {
    setEditingId(plan.id);
    setEditForm({
      cost: plan.cost,
      weekly_accesses: plan.weekly_accesses,
      description: plan.description ?? "",
    });
    setEditFormatError("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditFormatError("");
  };

  // ── CONFERMA MODIFICA ─────────────────────────────────────────────────────
  const confirmEdit = async (plan: SubscriptionOut) => {
    if (!validateDescriptions(editForm.description)) {
      setEditFormatError("Formato non valido. Usa: 'A, B, C'");
      return;
    }

    const payload: SubscriptionIn = {
      title: plan.title,
      cost: Number(editForm.cost),
      duration_month: plan.duration_month,
      weekly_accesses: Number(editForm.weekly_accesses),
      description: editForm.description,
    };

    const updated = await updateSubscription(plan.id, payload);
    if (updated) {
      setPlans((prev) =>
        prev.map((p) =>
          p.id === plan.id
            ? {
                ...p,
                cost: updated.cost,
                weekly_accesses: updated.weekly_accesses,
                description: updated.description ?? "",
              }
            : p
        )
      );
      setEditingId(null);
    }
  };

  const parseDescriptions = (desc: string) =>
    desc ? desc.split(/\s*,\s*/).filter((d) => d.length > 0) : [];

  const isAdmin = user?.role === "ADMIN";

  return (
    <div className="container py-4">
      <h2 className="mb-4 text-center">Abbonamenti Palestra</h2>

      {loadingSubs && (
        <p className="text-center text-muted">Caricamento abbonamenti...</p>
      )}
      {subsError && <p className="text-center text-danger">{subsError}</p>}

      <div className="row g-4 align-items-stretch">
        {plans.map((plan) => {
          const isEditing = editingId === plan.id;

          return (
            <div key={plan.id} className="col-md-4 d-flex">
              <div
                className="card shadow-sm border-1 w-100 h-100 d-flex flex-column"
                style={{ minHeight: "320px" }}
              >
                <div className="card-body text-center d-flex flex-column h-100">
                  <h5 className="card-title">{plan.title}</h5>

                  {/* ── VISTA NORMALE ──────────────────────────────────── */}
                  {!isEditing && (
                    <>
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

                      <div className="mt-auto w-100 d-flex flex-column gap-2 mt-3">
                        {/* Sottoscrivi: solo per utenti non-admin */}
                        {!isAdmin && (
                          <button
                            className="btn btn-primary w-100"
                            onClick={() =>
                              navigate(`/subscribe/${plan.id}`, { state: { plan } })
                            }
                          >
                            Sottoscrivi
                          </button>
                        )}

                        {/* Modifica / Elimina: solo per admin */}
                        {isAdmin && (
                          <div className="d-flex gap-2">
                            <button
                              className="btn btn-primary w-50"
                              onClick={() => startEdit(plan)}
                            >
                              Modifica
                            </button>
                            <button
                              className="btn btn-danger w-50"
                              onClick={() => handleDelete(plan.id)}
                              disabled={loadingDelete}
                            >
                              Elimina
                            </button>
                          </div>
                        )}
                      </div>

                      {deleteError && (
                        <small className="text-danger d-block mt-2">{deleteError}</small>
                      )}
                    </>
                  )}

                  {/* ── VISTA MODIFICA ─────────────────────────────────── */}
                  {isEditing && (
                    <div className="text-start mt-2 d-flex flex-column gap-3 flex-grow-1">
                      <div>
                        <label className="form-label small fw-semibold">Costo (€)</label>
                        <input
                          className="form-control form-control-sm"
                          type="number"
                          value={editForm.cost}
                          onChange={(e) =>
                            setEditForm({ ...editForm, cost: Number(e.target.value) })
                          }
                        />
                      </div>

                      <div>
                        <label className="form-label small fw-semibold">Accessi settimanali</label>
                        <input
                          className="form-control form-control-sm"
                          type="number"
                          value={editForm.weekly_accesses}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              weekly_accesses: Number(e.target.value),
                            })
                          }
                        />
                      </div>

                      <div>
                        <label className="form-label small fw-semibold">
                          Servizi inclusi (separati da virgola)
                        </label>
                        <input
                          className="form-control form-control-sm"
                          value={editForm.description}
                          onChange={(e) => {
                            setEditForm({ ...editForm, description: e.target.value });
                            setEditFormatError("");
                          }}
                        />
                        {editFormatError && (
                          <small className="text-danger d-block mt-1">{editFormatError}</small>
                        )}
                      </div>

                      {updateError && (
                        <small className="text-danger d-block">{updateError}</small>
                      )}

                      <div className="mt-auto d-flex gap-2">
                        <button
                          className="btn btn-success btn-sm w-50"
                          onClick={() => confirmEdit(plan)}
                          disabled={loadingUpdate}
                        >
                          {loadingUpdate ? "Salvataggio..." : "✓ Salva"}
                        </button>
                        <button
                          className="btn btn-outline-secondary btn-sm w-50"
                          onClick={cancelEdit}
                          disabled={loadingUpdate}
                        >
                          Annulla
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── FORM CREAZIONE (solo admin) ─────────────────────────────────────── */}
      {isAdmin && (
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
                <label className="form-label">Servizi inclusi (separati da virgola)</label>
                <input
                  className="form-control"
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                />
                {formatError && (
                  <small className="text-danger d-block mt-2">{formatError}</small>
                )}
              </div>
            </div>

            {(loading || error) && (
              <div className="mt-3 text-center">
                {loading && <p className="text-muted mb-0">Creazione in corso...</p>}
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