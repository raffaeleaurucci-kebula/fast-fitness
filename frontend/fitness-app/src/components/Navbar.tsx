import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.tsx";
import { useState, useRef, useEffect } from "react";
import {useUser} from "../hooks/useUser.tsx";
import type {UserOut} from "../types/auth.ts";

const Navbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const { getUserById } = useUser();

  const [userData, setUserData] = useState<UserOut | null>(null);

  useEffect(() => {
    if (user?.id) {
      getUserById(user.id).then(setUserData);
    }
  }, [user]);

  const navItems = [
    { path: "/", label: "Home", roles: ["USER", "ADMIN"] },
    { path: "/subscriptions", label: "Abbonamenti", roles: ["USER", "ADMIN"] },
    { path: "/courses", label: "Corsi", roles: ["USER", "ADMIN"] },
  ];

  const isLoginPage = location.pathname === "/login";
  const isRegisterPage = location.pathname === "/register";

  // Chiude cliccando fuori
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Chiude al cambio pagina
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  return (
    <nav className="navbar navbar-expand-lg background px-3">
      <div
        className="container-fluid d-flex align-items-center position-relative"
        style={{ gap: 0 }}
      >
        {/* LEFT - LOGO */}
        <div style={{ flex: 1, display: "flex", justifyContent: "flex-start" }}>
          <Link className="navbar-brand" to="/">
            <h1 className="brand-text m-0">FastFitness</h1>
          </Link>
        </div>

        {/* CENTER - NAV */}
        <div
          className="d-none d-lg-flex gap-3 align-items-center"
          style={{
            position: "absolute",
            left: "50%",
            transform: "translateX(-50%)",
          }}
        >
          {navItems
            .filter((item) => {
              if (!user)
                return item.roles.includes("USER") && item.roles.includes("ADMIN");
              return item.roles.includes(user.role);
            })
            .map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-link ${
                  location.pathname === item.path ? "fw-bold" : ""
                }`}
              >
                {item.label}
              </Link>
            ))}
        </div>

        {/* RIGHT - HAMBURGER MENU */}
        <div
          style={{ flex: 1, display: "flex", justifyContent: "flex-end" }}
          ref={menuRef}
        >
          {!user ? (
            <>
              {isLoginPage && (
                <Link className="btn btn-light" to="/register">
                  Registrati
                </Link>
              )}
              {isRegisterPage && (
                <Link className="btn btn-light" to="/login">
                  Accedi
                </Link>
              )}
              {!isLoginPage && !isRegisterPage && (
                <Link className="btn btn-light" to="/login">
                  Accedi
                </Link>
              )}
            </>
          ) : (
            <div style={{ position: "relative" }}>
              {/* Hamburger button */}
              <button
                onClick={() => setMenuOpen((prev) => !prev)}
                style={{
                  width: "42px",
                  height: "42px",
                  borderRadius: "8px",
                  backgroundColor: "#1a1a2e",
                  border: "none",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "5px",
                  cursor: "pointer",
                }}
              >
                <span style={{ width: "18px", height: "2px", backgroundColor: "#fff", borderRadius: "2px" }} />
                <span style={{ width: "18px", height: "2px", backgroundColor: "#fff", borderRadius: "2px" }} />
                <span style={{ width: "18px", height: "2px", backgroundColor: "#fff", borderRadius: "2px" }} />
              </button>

              {/* Dropdown menu */}
              {menuOpen && (
                <div
                  style={{
                    position: "absolute",
                    top: "calc(100% + 8px)",
                    right: 0,
                    backgroundColor: "#fff",
                    borderRadius: "8px",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
                    minWidth: "180px",
                    zIndex: 1000,
                    overflow: "hidden",
                  }}
                >
                  {/* Header utente */}
                  <div
                    style={{
                      padding: "12px 16px",
                      borderBottom: "1px solid #f0f0f0",
                      fontSize: "12px",
                      color: "#888",
                    }}
                  >
                    <div style={{ fontWeight: "bold", color: "#333", fontSize: "14px" }}>
                      {userData?.username|| "Utente"}
                    </div>
                    <div>{user?.role}</div>
                  </div>

                  {/* Voci menu */}
                  <Link
                    to="/profile"
                    className="dropdown-item py-2 px-3"
                    style={{ textAlign: "left" }}
                  >
                    👤 Profilo
                  </Link>

                  {user?.role === "USER" && (
                    <>
                      <Link
                        to="/training-cards"
                        className="dropdown-item py-2 px-3"
                        style={{ textAlign: "left" }}
                      >
                        📝 Schede Allenamento
                      </Link>
                      <Link
                        to="/reservations"
                        className="dropdown-item py-2 px-3"
                        style={{ textAlign: "left" }}
                      >
                        📅 Prenotazioni
                      </Link>
                    </>
                  )}

                  {user?.role === "ADMIN" && (
                    <>
                      <Link
                        to="/insights"
                        className="dropdown-item py-2 px-3"
                        style={{ textAlign: "left" }}
                      >
                        📊 Statistiche
                      </Link>
                      <Link
                        to="/management"
                        className="dropdown-item py-2 px-3"
                        style={{ textAlign: "left" }}
                      >
                        ⚙️ Gestione
                      </Link>
                    </>
                  )}

                  <div style={{ borderTop: "1px solid #f0f0f0" }}>
                    <button
                      onClick={logout}
                      className="dropdown-item py-2 px-3"
                      style={{
                        width: "100%",
                        textAlign: "left",
                        color: "#e74c3c",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                      }}
                    >
                      ➡️ Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;