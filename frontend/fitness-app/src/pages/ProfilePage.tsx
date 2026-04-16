import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.tsx";
import { useUser } from "../hooks/useUser.tsx";
import { useUpdateUser } from "../hooks/useUpdateUser.tsx";
import type { UserOut, UpdateUserData } from "../types/auth.ts";
import Footer from "../components/Footer.tsx";

export function ProfilePage() {
  const {
    user,
    userData: contextUserData,
    setUserData: setContextUserData,
  } = useAuth();

  const { getUserById, loading: loadingUser, error: errorUser } = useUser();
  const {
    updateUserById,
    loading: loadingUpdate,
    error: errorUpdate,
  } = useUpdateUser();

  const [userData, setUserData] = useState<UserOut | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<UpdateUserData | null>(null);
  const [confirmPassword, setConfirmPassword] = useState("");

  // password toggle
  const [showPasswords, setShowPasswords] = useState(false);

  // build form helper
  function buildFormData(data: UserOut): UpdateUserData {
    return {
      name: data.name || "",
      surname: data.surname || "",
      date_of_birth: data.date_of_birth || "",
      location_of_birth: data.location_of_birth || "",
      country: data.country || "",
      street_address: data.street_address || "",
      street_number: Number(data.street_number) || 0,
      city: data.city || "",
      zip_code: data.zip_code || "",
      phone_number: data.phone_number || "",
      username: data.username || "",
      email: data.email || "",
      password: "",
      old_password: "",
    };
  }

  // 1. context first
  useEffect(() => {
    if (contextUserData) {
      setUserData(contextUserData);
      setFormData(buildFormData(contextUserData));
    }
  }, [contextUserData]);

  // 2. fallback API
  useEffect(() => {
    if (contextUserData || !user?.id) return;

    getUserById(user.id).then((data) => {
      if (!data) return;
      setUserData(data);
      setFormData(buildFormData(data));
    });
  }, [user?.id, contextUserData]);

  const handleChange = (field: keyof UpdateUserData, value: any) => {
    setFormData((prev) =>
      prev ? { ...prev, [field]: value } : prev
    );
  };

  const handleSave = async () => {
    if (!user?.id || !formData) return;

    if (
      formData.password &&
      formData.password !== confirmPassword
    ) {
      return;
    }

    const res = await updateUserById(user.id, formData);

    if (res) {
      setUserData(res);
      setContextUserData(res);
      setIsEditing(false);
      setConfirmPassword("");
      setShowPasswords(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setConfirmPassword("");
    setShowPasswords(false);

    if (!userData) return;
    setFormData(buildFormData(userData));
  };

  return (
    <div className="d-flex flex-column min-vh-100">

      {/* CONTENT */}
      <div className="flex-grow-1 d-flex align-items-center justify-content-center bg-light py-4">

        <div className="col-12 col-md-7 col-lg-5">

          <div className="card shadow-sm p-4">

            {/* AVATAR */}
            <div className="d-flex flex-column align-items-center mb-4">
              <div
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: "50%",
                  backgroundColor: "#ddd",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "2rem",
                  fontWeight: "bold",
                }}
              >
                {userData?.username?.charAt(0)?.toUpperCase() || "U"}
              </div>

              {userData?.role === "ADMIN" && (
                <span className="badge bg-dark mt-2">
                  ADMIN
                </span>
              )}

              <h4 className="mt-3 mb-0">
                {userData?.username || "Utente"}
              </h4>
            </div>

            {/* STATUS */}
            {loadingUser && <p>Loading...</p>}
            {errorUser && (
              <p className="text-danger">{errorUser}</p>
            )}
            {errorUpdate && (
              <p className="text-danger">{errorUpdate}</p>
            )}

            {/* USER DATA */}
            <div className="mb-4">
              <div className="bg-light fw-semibold p-2 rounded mb-2">
                Dati utente
              </div>

              <div className="list-group">

                {/* Username */}
                <div className="list-group-item d-flex justify-content-between align-items-center">
                  <span className="text-muted">Username</span>
                  {isEditing ? (
                    <input
                      className="form-control form-control-sm w-50"
                      value={formData?.username || ""}
                      onChange={(e) =>
                        handleChange("username", e.target.value)
                      }
                    />
                  ) : (
                    <span>{userData?.username}</span>
                  )}
                </div>

                {/* Email */}
                <div className="list-group-item d-flex justify-content-between align-items-center">
                  <span className="text-muted">Email</span>
                  {isEditing ? (
                    <input
                      className="form-control form-control-sm w-50"
                      value={formData?.email || ""}
                      onChange={(e) =>
                        handleChange("email", e.target.value)
                      }
                    />
                  ) : (
                    <span>{userData?.email}</span>
                  )}
                </div>

                {/* Telefono */}
                <div className="list-group-item d-flex justify-content-between align-items-center">
                  <span className="text-muted">Telefono</span>
                  {isEditing ? (
                    <input
                      className="form-control form-control-sm w-50"
                      value={formData?.phone_number || ""}
                      onChange={(e) =>
                        handleChange("phone_number", e.target.value)
                      }
                    />
                  ) : (
                    <span>{userData?.phone_number || "—"}</span>
                  )}
                </div>

              </div>
            </div>

            {/* PASSWORD */}
            <div className="mb-4">

              <div className="bg-light fw-semibold p-2 rounded mb-2">
                Password
              </div>

              <div className="list-group">

                {isEditing ? (
                  <>

                    {/* Old password */}
                    <div className="list-group-item">
                      <span className="text-muted d-block mb-2">
                        Password attuale
                      </span>
                      <input
                        type={showPasswords ? "text" : "password"}
                        className="form-control form-control-sm"
                        value={formData?.old_password || ""}
                        onChange={(e) =>
                          handleChange(
                            "old_password",
                            e.target.value
                          )
                        }
                      />
                    </div>

                    {/* New password */}
                    <div className="list-group-item">
                      <span className="text-muted d-block mb-2">
                        Nuova password
                      </span>
                      <input
                        type={showPasswords ? "text" : "password"}
                        className="form-control form-control-sm"
                        value={formData?.password || ""}
                        onChange={(e) =>
                          handleChange("password", e.target.value)
                        }
                      />
                    </div>

                    {/* Confirm password */}
                    <div className="list-group-item">
                      <span className="text-muted d-block mb-2">
                        Conferma password
                      </span>
                      <input
                        type={showPasswords ? "text" : "password"}
                        className="form-control form-control-sm"
                        value={confirmPassword}
                        onChange={(e) =>
                          setConfirmPassword(e.target.value)
                        }
                      />
                    </div>

                    {/* Toggle show/hide */}
                    <div className="mb-2">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary w-100"
                        onClick={() =>
                          setShowPasswords((v) => !v)
                        }
                      >
                        {showPasswords
                          ? "Nascondi password"
                          : "Mostra password"}
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="list-group-item text-muted">
                    **********
                  </div>
                )}

              </div>
            </div>

            {/* BUTTONS */}
            <div className="d-flex justify-content-between">

              {!isEditing ? (
                <button
                  className="btn btn-primary w-100"
                  onClick={() => setIsEditing(true)}
                >
                  Modifica profilo
                </button>
              ) : (
                <>
                  <button
                    className="btn btn-danger"
                    onClick={handleCancel}
                  >
                    Annulla
                  </button>

                  <button
                    className="btn btn-success"
                    onClick={handleSave}
                    disabled={loadingUpdate}
                  >
                    Salva
                  </button>
                </>
              )}

            </div>

          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}