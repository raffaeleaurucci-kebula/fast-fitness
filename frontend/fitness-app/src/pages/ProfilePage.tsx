import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.tsx";
import { useUser } from "../hooks/useUser.tsx";
import type { UserOut } from "../types/auth.ts";

export function ProfilePage() {
  const { user } = useAuth();
  const { getUserById, loading, error } = useUser();

  const [userData, setUserData] = useState<UserOut | null>(null);

  useEffect(() => {
    if (user?.id) {
      getUserById(user.id).then(setUserData);
    }
  }, [user]);

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card p-4">

            {/* Avatar */}
            <div className="d-flex flex-column align-items-center mb-4">
              <div
                style={{
                  width: "80px",
                  height: "80px",
                  borderRadius: "50%",
                  backgroundColor: "#ddd",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "2rem",
                  fontWeight: "bold",
                }}
              >
                {userData?.role?.charAt(0)?.toUpperCase() || "U"}
              </div>

              {userData?.role === "ADMIN" && (
                <span className="badge bg-dark mt-2">ADMIN</span>
              )}

              <h4 className="mt-3 mb-0">
                {userData?.username || "Utente"}
              </h4>
            </div>

            {/* Stato */}
            {loading && <p>Loading...</p>}
            {error && <p className="text-danger">{error}</p>}

            {/* Info */}
            <ul className="list-group list-group-flush mb-4">
              <li className="list-group-item d-flex justify-content-between">
                <span className="text-muted">ID</span>
                <span>{userData?.id}</span>
              </li>
              <li className="list-group-item d-flex justify-content-between">
                <span className="text-muted">Email</span>
                <span>{userData?.email || "—"}</span>
              </li>
              <li className="list-group-item d-flex justify-content-between">
                <span className="text-muted">Ruolo</span>
                <span>{userData?.role}</span>
              </li>
            </ul>

          </div>
        </div>
      </div>
    </div>
  );
}