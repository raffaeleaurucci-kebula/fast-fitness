import { AuthProvider, useAuth } from "./context/AuthContext";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import Navbar from "./components/Navbar.tsx";
import {ProfilePage} from "./pages/ProfilePage.tsx";
import {PublicHome} from "./pages/PublicHome.tsx";
import SubscriptionsPage from "./pages/SubscriptionsPage.tsx";
import SubscribePage from "./pages/SubscribePage.tsx";

function AppRoutes() {
  const { isAuthenticated } = useAuth();
  return (
    <Routes>

      <Route
        path="/"
        element={<PublicHome />}
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

      <Route
        path="/subscriptions"
        element={<SubscriptionsPage/>}
      />

      <Route
        path="/subscribe/:subscriptionId"
        element={
        isAuthenticated
          ? <SubscribePage />
          : <Navigate to="/login" />
        }
      />
        
    </Routes>
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