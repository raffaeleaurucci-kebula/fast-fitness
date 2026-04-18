import { useAuth } from "../context/AuthContext";
import { useLogin } from "../hooks/user/useLogin.tsx";
import { LoginForm } from "../components/LoginForm";
import Footer from "../components/Footer.tsx";

export function LoginPage() {
  const { login } = useAuth();
  const { loading, error, performLogin } = useLogin();

  const handleSubmit = async (username: string, password: string) => {
    const token = await performLogin({ username, password });
    if (token) {
      login(token);
    }
  };

  return (
    <div className="min-vh-100 d-flex flex-column">
      <div className="flex-grow-1 d-flex align-items-center justify-content-center bg-light">
        <div className="card shadow-sm border-1 p-4" style={{ width: "100%", maxWidth: "420px" }}>
          <div className="text-center mb-4">
            <div className="bg-primary text-white rounded-3 d-inline-flex align-items-center justify-content-center mb-3"
                 style={{ width: 52, height: 52 }}>
              <svg width="26" height="26" viewBox="0 0 36 36" fill="none">
                <path d="M8 18h4m12 0h4M12 18v-4m0 4v4M24 18v-4m0 4v4" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M12 18h12" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </div>
            <h1 className="h4 fw-semibold mb-1">Benvenuto</h1>
            <p className="text-muted small mb-0">Accedi al tuo account palestra</p>
          </div>

          <LoginForm
            onSubmit={handleSubmit}
            loading={loading}
            error={error}
          />

          <p className="text-center text-muted small mt-4 mb-0">
            Non hai un account?{" "}
            <a href="/register" className="text-primary text-decoration-none fw-medium">
              Registrati
            </a>
          </p>
        </div>
      </div>
      <Footer/>
    </div>
  );
}