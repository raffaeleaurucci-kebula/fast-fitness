import { AuthProvider, useAuth } from "./context/AuthContext";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import Navbar from "./components/Navbar.tsx";
import {ProfilePage} from "./pages/ProfilePage.tsx";
import {PublicHome} from "./pages/PublicHome.tsx";

function AppRoutes() {
  const { isAuthenticated } = useAuth();
  return (
    <Routes>
      {/* "/" mostra contenuto diverso in base al login */}
      <Route
        path="/"
        element={isAuthenticated ? <Dashboard /> : <PublicHome />}
      />

      {/* se già loggato, /login e /register rimandano alla dashboard */}
      <Route
        path="/login"
        element={!isAuthenticated ? <LoginPage /> : <Navigate to="/" />}
      />
      <Route
        path="/register"
        element={!isAuthenticated ? <RegisterPage /> : <Navigate to="/" />}
      />

      <Route
        path="/profile"
        element={isAuthenticated ? <ProfilePage /> : <Navigate to="/login" />}
      />
    </Routes>
  );
}

function Dashboard() {
  const { user, logout } = useAuth();
  return (
    <div style={{ padding: "2rem" }}>
      <h2>Benvenuto, {user?.role || "utente"}!</h2>
      <p>Ruolo: {user?.role}</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}