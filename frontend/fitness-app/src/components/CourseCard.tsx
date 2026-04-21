import type { CourseOut } from "../types/courses.ts";
import type { CourseUserCardOut } from "../types/course_user_card.ts";

interface EditForm {
  type: string;
  description: string;
  n_accesses: number;
  cost: number;
  duration_month: number;
  require_subscription: boolean;
}

interface Props {
  course: CourseOut;
  isAdmin: boolean;
  isEditing: boolean;
  editForm: EditForm;
  updateError: string | null;
  loadingUpdate: boolean;
  loadingDelete: boolean;
  loadingCancel: boolean;
  cancelError: string | null;
  deleteError: string | null;
  userCourse: CourseUserCardOut | undefined;
  onStartEdit: (course: CourseOut) => void;
  onCancelEdit: () => void;
  onConfirmEdit: (course: CourseOut) => void;
  onEditFormChange: (
    field: keyof EditForm,
    value: string | number | boolean
  ) => void;
  onDelete: (id: number) => void;
  onSubscribe: (course: CourseOut) => void;
  onCancelEnrollment: (courseId: number) => void;
}

export default function CourseCard({
  course,
  isAdmin,
  isEditing,
  editForm,
  updateError,
  loadingUpdate,
  loadingDelete,
  loadingCancel,
  cancelError,
  deleteError,
  userCourse,
  onStartEdit,
  onCancelEdit,
  onConfirmEdit,
  onEditFormChange,
  onDelete,
  onSubscribe,
  onCancelEnrollment,
}: Props) {
  const isEnrolled = !!userCourse;

  return (
    <div className="col-md-4 d-flex">
      <div
        className="card w-100 h-100 d-flex flex-column border-1"
        style={{
          minHeight: "320px",
          boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
          borderRadius: "14px",
          overflow: "hidden",
          transition: "box-shadow 0.2s",
        }}
      >
        {/* HEADER */}
        <div
          style={{
            background: "#198754",
            padding: "18px 20px 14px",
            color: "#fff",
          }}
        >
          {isEditing ? (
            <input
              className="form-control fw-bold mb-1"
              style={{ borderRadius: "6px", fontWeight: 700 }}
              value={editForm.type}
              onChange={(e) => onEditFormChange("type", e.target.value)}
              placeholder="Tipo corso"
            />
          ) : (
            <>
              <h5 className="mb-0 fw-bold" style={{ letterSpacing: "0.3px" }}>
                {course.type}
              </h5>

              <p
                className="mb-0 mt-1"
                style={{ opacity: 0.88, fontSize: "0.93rem" }}
              >
                €{course.cost}
              </p>
            </>
          )}
        </div>

        <div
          className="card-body d-flex flex-column"
          style={{ padding: "18px 20px" }}
        >
          {/* VISTA NORMALE */}
          {!isEditing && (
            <>
              {/* BADGE VALIDITÀ + ACCESSI */}
              <div className="d-flex flex-wrap gap-2 mb-2 justify-content-center">
                <span
                  className="badge bg-light text-dark border"
                  style={{ fontWeight: 500 }}
                >
                  {course.duration_month} mesi validità
                </span>

                <span
                  className="badge bg-light text-dark border"
                  style={{ fontWeight: 500 }}
                >
                  {course.n_accesses} accessi totali
                </span>
              </div>

              {/* LABEL SOTTO */}
              {course.require_subscription && (
                <div className="d-flex justify-content-center mb-3">
                  <span
                    className="badge bg-warning text-dark"
                    style={{ fontSize: "0.78rem" }}
                  >
                    Richiede abbonamento attivo
                  </span>
                </div>
              )}

              <p className="text-muted small flex-grow-1">
                {course.description || "—"}
              </p>

              <div className="mt-3 d-flex flex-column gap-2">
                {!isAdmin &&
                  (isEnrolled ? (
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
                        ✓ Iscritto
                      </span>

                      <button
                        className="btn btn-outline-danger btn-sm w-100"
                        onClick={() => onCancelEnrollment(course.id)}
                        disabled={loadingCancel}
                      >
                        {loadingCancel
                          ? "Annullamento..."
                          : "Annulla iscrizione"}
                      </button>

                      {cancelError && (
                        <small className="text-danger">{cancelError}</small>
                      )}
                    </>
                  ) : (
                    <button
                      className="btn btn-outline-success btn-sm w-100"
                      onClick={() => onSubscribe(course)}
                    >
                      Iscriviti
                    </button>
                  ))}

                {isAdmin && (
                  <div className="d-flex gap-2">
                    <button
                      className="btn btn-outline-primary btn-sm w-50"
                      onClick={() => onStartEdit(course)}
                    >
                      Modifica
                    </button>

                    <button
                      className="btn btn-outline-danger btn-sm w-50"
                      onClick={() => onDelete(course.id)}
                      disabled={loadingDelete}
                    >
                      {loadingDelete ? "..." : "Elimina"}
                    </button>
                  </div>
                )}

                {deleteError && (
                  <small className="text-danger d-block">
                    {deleteError}
                  </small>
                )}
              </div>
            </>
          )}

          {/* VISTA MODIFICA */}
          {isEditing && (
            <div className="d-flex flex-column gap-3 flex-grow-1">
              <div>
                <label className="form-label small fw-semibold mb-1">
                  Descrizione
                </label>

                <textarea
                  className="form-control form-control-sm"
                  rows={2}
                  value={editForm.description}
                  onChange={(e) =>
                    onEditFormChange("description", e.target.value)
                  }
                  placeholder="Descrizione del corso"
                />
              </div>

              <div className="row g-2">
                <div className="col-6">
                  <label className="form-label small fw-semibold mb-1">
                    Validità (mesi)
                  </label>

                  <input
                    type="number"
                    className="form-control form-control-sm"
                    value={editForm.duration_month}
                    min={1}
                    onChange={(e) =>
                      onEditFormChange("duration_month", e.target.value)
                    }
                  />
                </div>

                <div className="col-6">
                  <label className="form-label small fw-semibold mb-1">
                    Accessi
                  </label>

                  <input
                    type="number"
                    className="form-control form-control-sm"
                    value={editForm.n_accesses}
                    min={0}
                    onChange={(e) =>
                      onEditFormChange("n_accesses", e.target.value)
                    }
                  />
                </div>

                <div className="col-12">
                  <label className="form-label small fw-semibold mb-1">
                    Costo (€)
                  </label>

                  <input
                    type="number"
                    className="form-control form-control-sm"
                    value={editForm.cost}
                    min={0}
                    onChange={(e) =>
                      onEditFormChange("cost", e.target.value)
                    }
                  />
                </div>

                <div className="col-12 d-flex align-items-center gap-2 mt-1">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id={`req-sub-edit-${course.id}`}
                    checked={editForm.require_subscription}
                    onChange={(e) =>
                      onEditFormChange(
                        "require_subscription",
                        e.target.checked
                      )
                    }
                  />

                  <label
                    className="form-check-label small"
                    htmlFor={`req-sub-edit-${course.id}`}
                  >
                    Richiede abbonamento attivo
                  </label>
                </div>
              </div>

              {updateError && (
                <small className="text-danger d-block">
                  {updateError}
                </small>
              )}

              <div className="mt-auto d-flex gap-2">
                <button
                  className="btn btn-success btn-sm w-50"
                  onClick={() => onConfirmEdit(course)}
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