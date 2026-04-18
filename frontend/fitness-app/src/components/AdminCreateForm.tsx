import React from "react";

interface FormState {
  title: string;
  cost: number;
  duration_month: number;
  weekly_accesses: number;
  description: string;
}

interface Props {
  form: FormState;
  loading: boolean;
  error: string | null;
  formatError: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
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
    name: "title",
    label: "Titolo",
    type: "text",
    placeholder: "es. Piano Premium, Basic, Pro…",
    hint: "Il nome del piano che vedranno gli utenti.",
    icon: "🏷️",
    colClass: "col-12 col-md-6",
  },
  {
    name: "cost",
    label: "Costo mensile (€)",
    type: "number",
    placeholder: "es. 29.90",
    hint: "Importo in euro addebitato per durata scelta.",
    icon: "💶",
    colClass: "col-12 col-md-6",
    min: 0,
  },
  {
    name: "duration_month",
    label: "Durata (mesi)",
    type: "number",
    placeholder: "es. 1, 3, 6, 12",
    hint: "Per quanti mesi rimane valido l'abbonamento.",
    icon: "📅",
    colClass: "col-12 col-md-6",
    min: 1,
  },
  {
    name: "weekly_accesses",
    label: "Accessi settimanali",
    type: "number",
    placeholder: "es. 3 (0 = illimitati)",
    hint: "Quante volte a settimana l'utente può accedere.",
    icon: "🔑",
    colClass: "col-12 col-md-6",
    min: 0,
  },
];

export default function AdminCreateForm({
  form,
  loading,
  error,
  formatError,
  onChange,
  onSubmit,
}: Props) {
  return (
    <div
      className="mt-5"
      style={{
        background: "#fff",
        borderRadius: "16px",
        boxShadow: "0 4px 24px rgba(0,0,0,0.09)",
        overflow: "hidden",
      }}
    >
      {/* Header del form */}
      <div
        style={{
          background: "linear-gradient(135deg, #212529 0%, #343a40 100%)",
          padding: "22px 32px",
          display: "flex",
          alignItems: "center",
          gap: "12px",
        }}
      >

        <div>
          <h4 className="mb-0 text-white fw-bold" style={{ letterSpacing: "0.2px" }}>
            Crea nuovo abbonamento
          </h4>
          <p className="mb-0 text-white-50" style={{ fontSize: "0.85rem", marginTop: "2px" }}>
            Compila i campi per aggiungere un nuovo piano
          </p>
        </div>
      </div>

      {/* Corpo del form */}
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
                style={{
                  borderRadius: "8px",
                  border: "1.5px solid #dee2e6",
                  padding: "10px 14px",
                  fontSize: "0.92rem",
                  transition: "border-color 0.15s, box-shadow 0.15s",
                }}
                name={field.name}
                type={field.type}
                value={form[field.name]}
                placeholder={field.placeholder}
                min={field.min}
                onChange={onChange}
                onFocus={(e) => {
                  e.target.style.borderColor = "#0d6efd";
                  e.target.style.boxShadow = "0 0 0 3px rgba(13,110,253,0.12)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "#dee2e6";
                  e.target.style.boxShadow = "none";
                }}
              />
              <small className="text-muted" style={{ fontSize: "0.78rem", marginTop: "4px", display: "block" }}>
                {field.hint}
              </small>
            </div>
          ))}

          {/* Campo descrizione a larghezza piena */}
          <div className="col-12">
            <label
              className="form-label fw-semibold mb-1"
              style={{ fontSize: "0.875rem", color: "#212529" }}
            >
              <span className="me-1">📋</span>
              Servizi inclusi
            </label>
            <input
              className="form-control"
              style={{
                borderRadius: "8px",
                border: "1.5px solid #dee2e6",
                padding: "10px 14px",
                fontSize: "0.92rem",
                transition: "border-color 0.15s, box-shadow 0.15s",
              }}
              name="description"
              type="text"
              value={form.description}
              placeholder="es. Sala pesi, Cardio, Corsi di gruppo, Spogliatoio premium"
              onChange={onChange}
              onFocus={(e) => {
                e.target.style.borderColor = "#0d6efd";
                e.target.style.boxShadow = "0 0 0 3px rgba(13,110,253,0.12)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#dee2e6";
                e.target.style.boxShadow = "none";
              }}
            />
            <small className="text-muted" style={{ fontSize: "0.78rem", marginTop: "4px", display: "block" }}>
              Elenca i servizi separati da virgola. Appariranno come punti elenco nella card.
            </small>
            {formatError && (
              <small className="text-danger d-block mt-1">⚠️ {formatError}</small>
            )}
          </div>
        </div>

        {/* Feedback stato */}
        {(loading || error) && (
          <div
            className="mt-4 p-3 rounded"
            style={{ background: error ? "#fff3f3" : "#f0f4ff", border: `1px solid ${error ? "#f5c2c7" : "#c6d4f9"}` }}
          >
            {loading && (
              <p className="mb-0 text-primary" style={{ fontSize: "0.875rem" }}>
                ⏳ Creazione in corso...
              </p>
            )}
            {error && (
              <p className="mb-0 text-danger" style={{ fontSize: "0.875rem" }}>
                ❌ {error}
              </p>
            )}
          </div>
        )}

        {/* Pulsante submit */}
        <div className="d-grid mt-4">
          <button
            className="btn btn-dark py-2 fw-semibold"
            style={{
              borderRadius: "10px",
              fontSize: "0.95rem",
              letterSpacing: "0.3px",
              transition: "background 0.15s, transform 0.1s",
            }}
            onClick={onSubmit}
            disabled={loading}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.background = "#343a40")
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.background = "")
            }
          >
            {loading ? "Creazione in corso..." : "Aggiungi abbonamento"}
          </button>
        </div>
      </div>
    </div>
  );
}