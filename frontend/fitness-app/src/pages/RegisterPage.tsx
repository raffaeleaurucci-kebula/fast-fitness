import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useRegister } from "../hooks/useRegister";
import { useLogin } from "../hooks/useLogin.tsx";
import { RegisterStep1 } from "../components/RegisterStep1";
import { RegisterStep2 } from "../components/RegisterStep2.tsx";
import { RegisterStep3 } from "../components/RegisterStep3";
import type { RegisterData } from "../types/auth";
import React from "react";
import Footer from "../components/Footer.tsx";

const STEPS = ["Dati personali", "Indirizzo", "Credenziali"];

const initialStep1 = { name: "", surname: "", date_of_birth: "", location_of_birth: "" };
const initialStep2 = { country: "", street_address: "", street_number: "", city: "", zip_code: "", phone_number: "" };
const initialStep3 = { username: "", email: "", password: "", confirmPassword: "" };

export function RegisterPage() {
  const { login } = useAuth();
  const { loading: regLoading, error: regError, performRegister } = useRegister();
  const { performLogin } = useLogin();

  const [step, setStep] = useState(0);
  const [step1, setStep1] = useState(initialStep1);
  const [step2, setStep2] = useState(initialStep2);
  const [step3, setStep3] = useState(initialStep3);

  const handleSubmit = async () => {
    const payload: RegisterData = {
      ...step1,
      ...step2,
      street_number: Number(step2.street_number),
      username: step3.username,
      email: step3.email,
      password: step3.password,
    };

    const ok = await performRegister(payload);
    if (!ok) return;

    // login automatico dopo registrazione
    const token = await performLogin({ username: step3.username, password: step3.password });
    if (token) login(token);
  };

  return (

    <div className="min-vh-100 d-flex flex-column">
      <div className="flex-grow-1 d-flex align-items-center justify-content-center bg-light py-4">
      <div className="card shadow-sm border-1 p-4" style={{ width: "100%", maxWidth: "460px" }}>

        {/* Header */}
        <div className="text-center mb-4">
          <div
            className="bg-primary text-white rounded-3 d-inline-flex align-items-center justify-content-center mb-3"
            style={{ width: 52, height: 52 }}
          >
            <svg width="26" height="26" viewBox="0 0 36 36" fill="none">
              <path d="M8 18h4m12 0h4M12 18v-4m0 4v4M24 18v-4m0 4v4" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M12 18h12" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </div>
          <h1 className="h4 fw-semibold mb-1">Crea un account</h1>
          <p className="text-muted small mb-0">Unisciti alla nostra palestra</p>
        </div>

        {/* Stepper */}
        <div className="d-flex justify-content-between align-items-start mb-4 px-2 px-sm-4">
          {STEPS.map((label, i) => (
            <React.Fragment key={i}>
              {/* Contenitore singolo Step (Circle + Testo) */}
              <div className="d-flex flex-column align-items-center" style={{ width: "70px", zIndex: 2 }}>
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center fw-medium"
                  style={{
                    width: 32,
                    height: 32,
                    fontSize: 13,
                    background: i < step ? "#198754" : i === step ? "#0d6efd" : "#dee2e6",
                    color: i <= step ? "#fff" : "#6c757d",
                    flexShrink: 0,
                  }}
                >
                  {i < step ? "✓" : i + 1}
                </div>
                <span
                  className="mt-1 text-center"
                  style={{ fontSize: 11, color: i === step ? "#0d6efd" : "#6c757d", lineHeight: 1.2 }}
                >
                  {label}
                </span>
              </div>

              {/* Linea di connessione */}
              {i < STEPS.length - 1 && (
                <div
                  className="flex-fill"
                  style={{
                    height: 2,
                    background: i < step ? "#198754" : "#dee2e6",
                    marginTop: 15, // Allinea la linea esattamente al centro del pallino (32px / 2)
                    zIndex: 1
                  }}
                />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Step content */}
        {step === 0 && (
          <RegisterStep1 data={step1} onChange={setStep1} onNext={() => setStep(1)} />
        )}
        {step === 1 && (
          <RegisterStep2 data={step2} onChange={setStep2} onNext={() => setStep(2)} onBack={() => setStep(0)} />
        )}
        {step === 2 && (
          <RegisterStep3
            data={step3}
            onChange={setStep3}
            onSubmit={handleSubmit}
            onBack={() => setStep(1)}
            loading={regLoading}
            error={regError}
          />
        )}

        <p className="text-center text-muted small mt-4 mb-0">
          Hai già un account?{" "}
          <a href="/login" className="text-primary text-decoration-none fw-medium">
            Accedi
          </a>
        </p>
      </div>
    </div>
    <Footer/>
    </div>
  );
}