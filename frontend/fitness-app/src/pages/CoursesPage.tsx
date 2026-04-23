import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.tsx";
import { useCreateCourse } from "../hooks/courses/useCreateCourse.tsx";
import { useGetCourses } from "../hooks/courses/useGetCourse.tsx";
import { useDeleteCourse } from "../hooks/courses/useDeleteCourse.tsx";
import { useUpdateCourse } from "../hooks/courses/useUpdateCourse.tsx";
import { useGetCoursesByUser } from "../hooks/courses/useGetCoursesByUser.tsx";
import { useDeleteCourseByUser } from "../hooks/courses/useDeleteCourseByUser.tsx";
import type { CourseIn, CourseOut } from "../types/courses.ts";
import type { CourseUserCardOut } from "../types/course_user_card.ts";
import CourseCard from "../components/CourseCard.tsx";
import AdminCreateCourseForm from "../components/AdminCreateCourseForm.tsx";
import Footer from "../components/Footer.tsx";

interface EditForm {
  type: string;
  description: string;
  n_accesses: number;
  cost: number;
  duration_month: number;
  require_subscription: boolean;
}

const emptyEditForm: EditForm = {
  type: "",
  description: "",
  n_accesses: 0,
  cost: 0,
  duration_month: 0,
  require_subscription: false,
};

const emptyCreateForm = {
  type: "",
  description: "",
  n_accesses: 0,
  cost: 0,
  duration_month: 0,
  require_subscription: false,
};

export default function CoursesPage() {
  const [courses, setCourses] = useState<CourseOut[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<EditForm>(emptyEditForm);
  const [form, setForm] = useState(emptyCreateForm);
  const [formatError, setFormatError] = useState("");
  const [userCoursesMap, setUserCoursesMap] = useState<Map<number, CourseUserCardOut>>(new Map());

  const navigate = useNavigate();
  const { user } = useAuth();

  const { createCourse, loading: loadingCreate, error: createError } = useCreateCourse();
  const { getCourses, loading: loadingCourses, error: coursesError } = useGetCourses();
  const { deleteCourse, loading: loadingDelete, error: deleteError } = useDeleteCourse();
  const { updateCourse, loading: loadingUpdate, error: updateError } = useUpdateCourse();
  const { getCoursesByUser } = useGetCoursesByUser();
  const { deleteCourseByUser, loading: loadingCancel, error: cancelError } = useDeleteCourseByUser();

  const isAdmin = user?.role === "ADMIN";

  useEffect(() => {
    (async () => {
      const data = await getCourses(0);
      if (data) setCourses(data);
    })();
  }, []);

  useEffect(() => {
    if (!user?.id || isAdmin) return;
    (async () => {
      const data = await getCoursesByUser(user.id);
      if (data) {
        const map = new Map<number, CourseUserCardOut>();
        data.forEach((c) => map.set(c.course_id, c));
        setUserCoursesMap(map);
      }
    })();
  }, [user?.id, isAdmin]);

  // Handlers form creazione
  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const target = e.target as HTMLInputElement;
    const value = target.type === "checkbox" ? target.checked : target.value;
    setForm({ ...form, [target.name]: value });
    setFormatError("");
  };

  const addCourse = async () => {
    if (!form.type || !form.cost || !form.duration_month) {
      setFormatError("Tipo, costo e durata sono obbligatori.");
      return;
    }
    const payload: CourseIn = {
      type: form.type,
      description: form.description,
      n_accesses: Number(form.n_accesses),
      cost: Number(form.cost),
      duration_month: Number(form.duration_month),
      require_subscription: Boolean(form.require_subscription),
    };
    const created = await createCourse(payload);
    if (created) {
      setCourses((prev) => [...prev, created]);
      setForm(emptyCreateForm);
    }
  };

  // Handlers card
  const handleDelete = async (id: number) => {
    if (!window.confirm("Sei sicuro di voler eliminare questo corso?")) return;
    const ok = await deleteCourse(id);
    if (ok) setCourses((prev) => prev.filter((c) => c.id !== id));
  };

  const handleCancelEnrollment = async (courseId: number) => {
    const userCourse = userCoursesMap.get(courseId);
    if (!userCourse) return;
    if (!window.confirm("Sei sicuro di voler annullare l'iscrizione a questo corso?")) return;
    const ok = await deleteCourseByUser(userCourse.id);
    if (ok)
      setUserCoursesMap((prev) => {
        const next = new Map(prev);
        next.delete(courseId);
        return next;
      });
  };

  const startEdit = (course: CourseOut) => {
    setEditingId(course.id);
    setEditForm({
      type: course.type,
      description: course.description,
      n_accesses: course.n_accesses,
      cost: course.cost,
      duration_month: course.duration_month,
      require_subscription: course.require_subscription,
    });
  };

  const cancelEdit = () => setEditingId(null);

  const confirmEdit = async (course: CourseOut) => {
    const payload: CourseIn = {
      type: editForm.type,
      description: editForm.description,
      n_accesses: Number(editForm.n_accesses),
      cost: Number(editForm.cost),
      duration_month: Number(editForm.duration_month),
      require_subscription: Boolean(editForm.require_subscription),
    };
    const updated = await updateCourse(course.id, payload);
    if (updated) {
      setCourses((prev) =>
        prev.map((c) => (c.id === course.id ? { ...c, ...updated } : c))
      );
      setEditingId(null);
    }
  };

  const handleEditChange = (
    field: keyof EditForm,
    value: string | number | boolean
  ) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="d-flex flex-column min-vh-100">
      <main className="flex-grow-1">
        <div className="container py-4">


            <h1 className="h3 mb-1">Corsi Palestra</h1>
            <p className="text-muted mb-4">Scegli il corso più adatto a te</p>
          

          {loadingCourses && (
            <p className="text-center text-muted">Caricamento corsi...</p>
          )}
          {coursesError && (
            <p className="text-center text-danger">{coursesError}</p>
          )}

          {/* Griglia card */}
          <div className="row g-4 align-items-stretch">
            {courses.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                isAdmin={isAdmin}
                isEditing={editingId === course.id}
                editForm={editForm}
                updateError={updateError}
                loadingUpdate={loadingUpdate}
                loadingDelete={loadingDelete}
                loadingCancel={loadingCancel}
                cancelError={cancelError}
                deleteError={deleteError}
                userCourse={userCoursesMap.get(course.id)}
                onStartEdit={startEdit}
                onCancelEdit={cancelEdit}
                onConfirmEdit={confirmEdit}
                onEditFormChange={handleEditChange}
                onDelete={handleDelete}
                onSubscribe={(c) =>
                  navigate(`/subscribe-course/${c.id}`, { state: { course: c } })
                }
                onCancelEnrollment={handleCancelEnrollment}
              />
            ))}
          </div>

          {/* Form creazione admin */}
          {isAdmin && (
            <AdminCreateCourseForm
              form={form}
              loading={loadingCreate}
              error={createError}
              formatError={formatError}
              onChange={handleFormChange}
              onSubmit={addCourse}
            />
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}