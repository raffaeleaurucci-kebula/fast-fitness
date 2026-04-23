import React from "react";

interface FormState {
  type: string;
  description: string;
  n_accesses: number;
  cost: number;
  duration_month: number;
  require_subscription: boolean;
}

interface Props {
  form: FormState;
  loading: boolean;
  error: string | null;
  formatError: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onSubmit: () => void;
}

interface FieldConfig {
  name: keyof FormState;
  label: string;
  type: string;
  placeholder: string;
  hint: string;
  icon: string;
  colClass: string;
  min?: number;
}

const fields: FieldConfig[] = [
  {
    name: "type",
    label: "Tipo corso",
    type: "text",
    placeholder: "es. Yoga, Pilates, Spinning…",
    hint: "Il nome del corso che vedranno gli utenti.",
    icon: "🏋️",
    colClass: "col-12 col-md-6",
  },
  {
    name: "cost",
    label: "Costo (€)",
    type: "number",
    placeholder: "es. 49.90",
    hint: "Importo in euro per l'iscrizione al corso.",
    icon: "💶",
    colClass: "col-12 col-md-6",
    min: 0,
  },
  {
    name: "duration_month",
    label: "Durata (mesi)",
    type: "number",
    placeholder: "es. 1, 3, 6",
    hint: "Per quanti mesi è valida l'iscrizione al corso.",
    icon: "📅",
    colClass: "col-12 col-md-6",
    min: 1,
  },
  {
    name: "n_accesses",
    label: "N° accessi totali",
    type: "number",
    placeholder: "es. 12 (0 = illimitati)",
    hint: "Quante volte l'utente può partecipare al corso.",
    icon: "🔁",
    colClass: "col-12 col-md-6",
    min: 0,
  },
];

const inputStyle: React.CSSProperties = {
  borderRadius: "8px",
  border: "1.5px solid #dee2e6",
  padding: "10px 14px",
  fontSize: "0.92rem",
  transition: "border-color 0.15s, box-shadow 0.15s",
};

const focusStyle = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
  e.target.style.borderColor = "#198754";
  e.target.style.boxShadow = "0 0 0 3px rgba(25,135,84,0.12)";
};

const blurStyle = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
  e.target.style.borderColor = "#dee2e6";
  e.target.style.boxShadow = "none";
};

export default function AdminCreateCourseForm({
  form,
  loading,
  error,
  formatError,
  onChange,
  onSubmit,
}: Props) {
  return (
    <div
      className="mt-5 border border-1"
      style={{
        background: "#fff",
        borderRadius: "16px",
        boxShadow: "0 4px 24px rgba(0,0,0,0.09)",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          background: "#198754",
          padding: "22px 32px",
          display: "flex",
          alignItems: "center",
          gap: "12px",
        }}
      >
        <div>
          <h4 className="mb-0 text-white fw-bold" style={{ letterSpacing: "0.2px" }}>
            Crea nuovo corso
          </h4>
          <p className="mb-0 text-white-50" style={{ fontSize: "0.85rem", marginTop: "2px" }}>
            Compila i campi per aggiungere un nuovo corso
          </p>
        </div>
      </div>

      {/* Corpo */}
      <div style={{ padding: "28px 32px" }}>
        <div className="row g-4">
          {fields.map((field) => (
            <div key={field.name} className={field.colClass}>
              <label
                className="form-label fw-semibold mb-1"
                style={{ fontSize: "0.875rem", color: "#212529" }}
              >
                <span className="me-1">{field.icon}</span>
                {field.label}
              </label>
              <input
                className="form-control"
                style={inputStyle}
                name={field.name}
                type={field.type}
                value={form[field.name] as string | number}
                placeholder={field.placeholder}
                min={field.min}
                onChange={onChange}
                onFocus={focusStyle}
                onBlur={blurStyle}
              />
              <small className="text-muted" style={{ fontSize: "0.78rem", marginTop: "4px", display: "block" }}>
                {field.hint}
              </small>
            </div>
          ))}

          {/* Descrizione */}
          <div className="col-12">
            <label
              className="form-label fw-semibold mb-1"
              style={{ fontSize: "0.875rem", color: "#212529" }}
            >
              <span className="me-1">📋</span>
              Descrizione
            </label>
            <input
              className="form-control"
              style={inputStyle}
              name="description"
              type="text"
              value={form.description}
              placeholder="Breve descrizione del corso"
              onChange={onChange}
              onFocus={focusStyle}
              onBlur={blurStyle}
            />
            <small className="text-muted" style={{ fontSize: "0.78rem", marginTop: "4px", display: "block" }}>
              Una breve descrizione visibile nella card del corso.
            </small>
            {formatError && (
              <small className="text-danger d-block mt-1">⚠️ {formatError}</small>
            )}
          </div>

          {/* Checkbox require_subscription */}
          <div className="col-12">
            <div
              className="d-flex align-items-center gap-3 p-3 rounded"
              style={{ background: "#f8f9fa", border: "1.5px solid #dee2e6" }}
            >
              <input
                type="checkbox"
                className="form-check-input mt-0"
                id="require_subscription"
                name="require_subscription"
                checked={Boolean(form.require_subscription)}
                onChange={onChange}
                style={{ width: "1.2em", height: "1.2em", cursor: "pointer" }}
              />
              <label htmlFor="require_subscription" style={{ cursor: "pointer" }}>
                <span className="fw-semibold" style={{ fontSize: "0.875rem" }}>
                  Richiede abbonamento attivo in palestra
                </span>
                <small className="d-block text-muted" style={{ fontSize: "0.78rem" }}>
                  Se attivo, solo gli utenti con un abbonamento valido potranno iscriversi.
                </small>
              </label>
            </div>
          </div>
        </div>

        {/* Feedback stato */}
        {(loading || error) && (
          <div
            className="mt-4 p-3 rounded"
            style={{
              background: error ? "#fff3f3" : "#f0faf4",
              border: `1px solid ${error ? "#f5c2c7" : "#b2dfdb"}`,
            }}
          >
            {loading && (
              <p className="mb-0 text-success" style={{ fontSize: "0.875rem" }}>
                Creazione in corso...
              </p>
            )}
            {error && (
              <p className="mb-0 text-danger" style={{ fontSize: "0.875rem" }}>
                  {error}
              </p>
            )}
          </div>
        )}

        {/* Submit */}
        <div className="d-grid mt-4">
          <button
            className="btn btn-success py-2 fw-semibold"
            style={{
              borderRadius: "10px",
              fontSize: "0.95rem",
              letterSpacing: "0.3px",
            }}
            onClick={onSubmit}
            disabled={loading}
          >
            {loading ? "Creazione in corso..." : "Aggiungi corso"}
          </button>
        </div>
      </div>
    </div>
  );
}