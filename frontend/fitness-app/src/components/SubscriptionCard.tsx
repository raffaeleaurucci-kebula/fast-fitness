import type { SubscriptionOut } from "../types/subscriptions.ts";
import type { SubscriptionUserCardOut } from "../types/subscription_user_card.ts";

interface EditForm {
  cost: number;
  weekly_accesses: number;
  description: string;
}

interface Props {
  plan: SubscriptionOut;
  isAdmin: boolean;
  isEditing: boolean;
  editForm: EditForm;
  editFormatError: string;
  updateError: string | null;
  loadingUpdate: boolean;
  loadingDelete: boolean;
  loadingCancelSub: boolean;
  cancelSubError: string | null;
  deleteError: string | null;
  userSub: SubscriptionUserCardOut | undefined;
  onStartEdit: (plan: SubscriptionOut) => void;
  onCancelEdit: () => void;
  onConfirmEdit: (plan: SubscriptionOut) => void;
  onEditFormChange: (field: keyof EditForm, value: string | number) => void;
  onDelete: (id: number) => void;
  onSubscribe: (plan: SubscriptionOut) => void;
  onCancelSub: (planId: number) => void;
}

const parseDescriptions = (desc: string) =>
  desc ? desc.split(/\s*,\s*/).filter((d) => d.length > 0) : [];

export default function SubscriptionCard({
  plan,
  isAdmin,
  isEditing,
  editForm,
  editFormatError,
  updateError,
  loadingUpdate,
  loadingDelete,
  loadingCancelSub,
  cancelSubError,
  deleteError,
  userSub,
  onStartEdit,
  onCancelEdit,
  onConfirmEdit,
  onEditFormChange,
  onDelete,
  onSubscribe,
  onCancelSub,
}: Props) {
  const isSubscribed = !!userSub;

  return (
    <div className="col-md-4 d-flex">
      <div
        className="card w-100 h-100 d-flex flex-column border-0"
        style={{
          minHeight: "320px",
          boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
          borderRadius: "14px",
          overflow: "hidden",
          transition: "box-shadow 0.2s",
        }}
      >
        {/* Header colorato */}
        <div
          style={{
            background: "#0d6efd",
            padding: "18px 20px 14px",
            color: "#fff",
          }}
        >
          <h5 className="mb-0 fw-bold" style={{ letterSpacing: "0.3px" }}>
            {plan.title}
          </h5>
          {!isEditing && (
            <p className="mb-0 mt-1" style={{ opacity: 0.88, fontSize: "0.93rem" }}>
              €{plan.cost}{" "}
              <span style={{ opacity: 0.7, fontWeight: 400 }}>
                / {plan.duration_month} mese/i
              </span>
            </p>
          )}
        </div>

        <div className="card-body d-flex flex-column" style={{ padding: "18px 20px" }}>
          {/* VISTA NORMALE */}
          {!isEditing && (
            <>
              <p className="text-muted small mb-2">
                <span
                  className="badge bg-light text-dark border me-1"
                  style={{ fontWeight: 500 }}
                >
                  🗓 {plan.weekly_accesses} accessi/sett.
                </span>
              </p>

              <ul className="list-unstyled mb-0 flex-grow-1">
                {parseDescriptions(plan.description).map((d, i) => (
                  <li key={i} className="d-flex align-items-start mb-1">
                    <span className="text-success me-2 mt-1" style={{ fontSize: "0.8rem" }}>
                      ✓
                    </span>
                    <span className="text-muted" style={{ fontSize: "0.875rem" }}>
                      {d}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="mt-3 d-flex flex-column gap-2">
                {/* Bottoni UTENTE */}
                {!isAdmin &&
                  (isSubscribed ? (
                    <>
                      <span
                        className="text-center py-2 rounded"
                        style={{
                          background: "#d1e7dd",
                          color: "#0a3622",
                          fontSize: "0.85rem",
                          fontWeight: 600,
                        }}
                      >
                        ✓ Abbonamento attivo
                      </span>
                      <button
                        className="btn btn-outline-danger btn-sm w-100"
                        onClick={() => onCancelSub(plan.id)}
                        disabled={loadingCancelSub}
                      >
                        {loadingCancelSub ? "Annullamento..." : "Annulla abbonamento"}
                      </button>
                      {cancelSubError && (
                        <small className="text-danger">{cancelSubError}</small>
                      )}
                    </>
                  ) : (
                    <button
                      className="btn btn-outline-primary btn-sm w-100"
                      onClick={() => onSubscribe(plan)}
                    >
                      Sottoscrivi
                    </button>
                  ))}

                {/* Bottoni ADMIN */}
                {isAdmin && (
                  <div className="d-flex gap-2">
                    <button
                      className="btn btn-outline-primary btn-sm w-50"
                      onClick={() => onStartEdit(plan)}
                    >
                      Modifica
                    </button>
                    <button
                      className="btn btn-outline-danger btn-sm w-50"
                      onClick={() => onDelete(plan.id)}
                      disabled={loadingDelete}
                    >
                      Elimina
                    </button>
                  </div>
                )}

                {deleteError && (
                  <small className="text-danger d-block">{deleteError}</small>
                )}
              </div>
            </>
          )}

          {/* VISTA MODIFICA */}
          {isEditing && (
            <div className="d-flex flex-column gap-3 flex-grow-1">
              <div>
                <label className="form-label small fw-semibold mb-1">Costo (€)</label>
                <input
                  className="form-control form-control-sm"
                  type="number"
                  value={editForm.cost}
                  min={0}
                  placeholder="es. 49.90"
                  onChange={(e) => onEditFormChange("cost", Number(e.target.value))}
                />
              </div>
              <div>
                <label className="form-label small fw-semibold mb-1">
                  Accessi settimanali
                </label>
                <input
                  className="form-control form-control-sm"
                  type="number"
                  value={editForm.weekly_accesses}
                  min={1}
                  placeholder="es. 3"
                  onChange={(e) =>
                    onEditFormChange("weekly_accesses", Number(e.target.value))
                  }
                />
              </div>
              <div>
                <label className="form-label small fw-semibold mb-1">
                  Servizi inclusi
                </label>
                <input
                  className="form-control form-control-sm"
                  value={editForm.description}
                  placeholder="es. Sala pesi, Cardio, Spogliatoio"
                  onChange={(e) => onEditFormChange("description", e.target.value)}
                />
                <small className="text-muted">Separati da virgola</small>
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
                  onClick={() => onConfirmEdit(plan)}
                  disabled={loadingUpdate}
                >
                  {loadingUpdate ? "Salvataggio..." : "✓ Salva"}
                </button>
                <button
                  className="btn btn-outline-secondary btn-sm w-50"
                  onClick={onCancelEdit}
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
}