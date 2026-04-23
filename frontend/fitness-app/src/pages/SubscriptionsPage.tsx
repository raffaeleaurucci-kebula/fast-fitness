import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.tsx";
import { useCreateSub } from "../hooks/subscriptions/useCreateSub.tsx";
import { useSubscriptions } from "../hooks/subscriptions/useGetSub.tsx";
import { useDeleteSub } from "../hooks/subscriptions/useDeleteSub.tsx";
import { useUpdateSub } from "../hooks/subscriptions/useUpdateSub.tsx";
import { useGetSubsByUser } from "../hooks/subscriptions/useGetSubsByUser.tsx";
import { useDeleteSubByUser } from "../hooks/subscriptions/useDeleteSubByUser.tsx";
import type { SubscriptionIn, SubscriptionOut } from "../types/subscriptions.ts";
import type { SubscriptionUserCardOut } from "../types/subscription_user_card.ts";

import SubscriptionCard from "../components/SubscriptionCard.tsx";
import AdminCreateSubForm from "../components/AdminCreateSubForm.tsx";
import Footer from "../components/Footer.tsx";

interface EditForm {
  cost: number;
  weekly_accesses: number;
  description: string;
}

export default function SubscriptionsPage() {
  const [plans, setPlans] = useState<SubscriptionOut[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({ cost: 0, weekly_accesses: 0, description: "" });
  const [editFormatError, setEditFormatError] = useState("");
  const [userSubsMap, setUserSubsMap] = useState<Map<number, SubscriptionUserCardOut>>(new Map());

  const [form, setForm] = useState({
    title: "",
    cost: 0,
    duration_month: 0,
    weekly_accesses: 0,
    description: "",
  });
  const [formatError, setFormatError] = useState("");

  const navigate = useNavigate();
  const { user } = useAuth();

  const { createSubscription, loading, error } = useCreateSub();
  const { getSubscriptions, loading: loadingSubs, error: subsError } = useSubscriptions();
  const { deleteSubscription, loading: loadingDelete, error: deleteError } = useDeleteSub();
  const { updateSubscription, loading: loadingUpdate, error: updateError } = useUpdateSub();
  const { getSubsByUser } = useGetSubsByUser();
  const { deleteSubByUser, loading: loadingCancelSub, error: cancelSubError } = useDeleteSubByUser();

  const isAdmin = user?.role === "ADMIN";

  useEffect(() => {
    (async () => {
      const data = await getSubscriptions(0);
      if (data) setPlans(data);
    })();
  }, []);

  useEffect(() => {
    if (!user?.id || isAdmin) return;
    (async () => {
      const data = await getSubsByUser(user.id);
      if (data) {
        const map = new Map<number, SubscriptionUserCardOut>();
        data.forEach((s) => map.set(s.subscription_id, s));
        setUserSubsMap(map);
      }
    })();
  }, [user?.id, isAdmin]);

  // Handlers form creazione
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setFormatError("");
  };

  const validateDescriptions = (value: string) =>
    !value.trim() || /^(?:[^,]+(?:,\s*[^,]+)*)$/.test(value.trim());

  const addPlan = async () => {
    if (!form.title || !form.cost || !form.duration_month) return;
    if (!validateDescriptions(form.description)) {
      setFormatError("Formato non valido. Usa: 'A, B, C'");
      return;
    }
    const payload: SubscriptionIn = {
      title: form.title,
      cost: Number(form.cost),
      duration_month: Number(form.duration_month),
      weekly_accesses: Number(form.weekly_accesses),
      description: form.description,
    };
    const created = await createSubscription(payload);
    if (created) {
      setPlans((prev) => [...prev, { ...created, description: created.description ?? "" }]);
      setForm({ title: "", cost: 0, duration_month: 0, weekly_accesses: 0, description: "" });
    }
  };

  // Handlers card
  const handleDelete = async (id: number) => {
    if (!window.confirm("Sei sicuro di voler eliminare questo abbonamento?")) return;
    const ok = await deleteSubscription(id);
    if (ok) setPlans((prev) => prev.filter((p) => p.id !== id));
  };

  const handleCancelSub = async (planId: number) => {
    const userSub = userSubsMap.get(planId);
    if (!userSub) return;
    if (!window.confirm("Sei sicuro di voler annullare questo abbonamento?")) return;
    const ok = await deleteSubByUser(userSub.id);
    if (ok) setUserSubsMap((prev) => { const next = new Map(prev); next.delete(planId); return next; });
  };

  const startEdit = (plan: SubscriptionOut) => {
    setEditingId(plan.id);
    setEditForm({ cost: plan.cost, weekly_accesses: plan.weekly_accesses, description: plan.description ?? "" });
    setEditFormatError("");
  };

  const cancelEdit = () => { setEditingId(null); setEditFormatError(""); };

  const confirmEdit = async (plan: SubscriptionOut) => {
    if (!validateDescriptions(editForm.description)) {
      setEditFormatError("Formato non valido. Usa: 'A, B, C'");
      return;
    }
    const payload: SubscriptionIn = {
      title: plan.title,
      cost: Number(editForm.cost),
      duration_month: plan.duration_month,
      weekly_accesses: Number(editForm.weekly_accesses),
      description: editForm.description,
    };
    const updated = await updateSubscription(plan.id, payload);
    if (updated) {
      setPlans((prev) => prev.map((p) =>
        p.id === plan.id
          ? { ...p, cost: updated.cost, weekly_accesses: updated.weekly_accesses, description: updated.description ?? "" }
          : p
      ));
      setEditingId(null);
    }
  };

  const handleEditFormChange = (field: keyof EditForm, value: string | number) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
    if (field === "description") setEditFormatError("");
  };

  return (
    <div className="d-flex flex-column min-vh-100">
      <main className="flex-grow-1">
        <div className="container py-4">
          
            <h1 className="h3 mb-1">Abbonamenti Palestra</h1>
            <p className="text-muted mb-4">Scegli il piano più adatto alle tue esigenze</p>

          {loadingSubs && (
            <p className="text-center text-muted">Caricamento abbonamenti...</p>
          )}
          {subsError && (
            <p className="text-center text-danger">{subsError}</p>
          )}

          {/* Griglia card */}
          <div className="row g-4 align-items-stretch">
            {plans.map((plan) => (
              <SubscriptionCard
                key={plan.id}
                plan={plan}
                isAdmin={isAdmin}
                isEditing={editingId === plan.id}
                editForm={editForm}
                editFormatError={editFormatError}
                updateError={updateError}
                loadingUpdate={loadingUpdate}
                loadingDelete={loadingDelete}
                loadingCancelSub={loadingCancelSub}
                cancelSubError={cancelSubError}
                deleteError={deleteError}
                userSub={userSubsMap.get(plan.id)}
                onStartEdit={startEdit}
                onCancelEdit={cancelEdit}
                onConfirmEdit={confirmEdit}
                onEditFormChange={handleEditFormChange}
                onDelete={handleDelete}
                onSubscribe={(p) => navigate(`/subscribe/${p.id}`, { state: { plan: p } })}
                onCancelSub={handleCancelSub}
              />
            ))}
          </div>

          {/* Form creazione admin */}
          {isAdmin && (
            <AdminCreateSubForm
              form={form}
              loading={loading}
              error={error}
              formatError={formatError}
              onChange={handleFormChange}
              onSubmit={addPlan}
            />
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}