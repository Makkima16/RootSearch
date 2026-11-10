"use client";

import { useEffect, useState } from "react";
import { getAllStudents } from "../../../services/students";
import { getUserProfile } from "../../../services/users";
import SideBar from "@/components/SideBar";
import { LuGraduationCap, LuLoaderCircle } from 'react-icons/lu';

type Student = {
  _id?: string;
  name: string;
  email: string;
  createdAt: string;
};

export default function StudentsPage() {
  const [user, setUser] = useState<{ id: string; name: string; role: string } | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUser() {
      try {
        const userData = await getUserProfile();
        const role = userData.roles?.[0]?.name || "";

        if (!["docente", "administrador"].includes(role.toLowerCase())) {
          setError("No tienes permisos para acceder a esta sección.");
          return;
        }

        setUser({ id: userData._id, name: userData.name, role });
      } catch (error) {
        console.error("Error al obtener el perfil del usuario:", error);
      }
    }
    fetchUser();
  }, []);

  useEffect(() => {
    async function fetchStudents() {
      if (user) {
        setLoading(true);
        const data = await getAllStudents();
        setStudents(data);
        setLoading(false);
      }
    }
    fetchStudents();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-rs-50 text-rs-ink">
        <div className="text-center">
          <LuLoaderCircle className="animate-spin text-4xl text-rs-700 mx-auto mb-4" />
          <span className="text-lg">Cargando...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-rs-50 text-rs-ink">
        <div className="text-center">
          <h1 className="rs-title text-2xl mb-2">Acceso Denegado</h1>
          <p className="text-rs-ink">{error}</p>
          <a
            href="/dashboard"
            className="mt-4 inline-block bg-rs-700 hover:bg-rs-800 text-white px-4 py-2 rounded-lg transition"
          >
            Volver al inicio
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-rs-50 text-rs-ink font-sans">
      <SideBar user={user!} />
      <main className="min-w-0 flex-1 px-4 py-8 sm:px-6 lg:px-10">
        <div className="mb-6 sm:mb-8 flex items-center justify-between">
          <h1 className="rs-title text-2xl sm:text-3xl flex items-center gap-2">
            <LuGraduationCap className="text-rs-700 text-xl sm:text-2xl" /> 
            <span className="hidden sm:inline">Listado de Estudiantes</span>
            <span className="sm:hidden">Estudiantes</span>
          </h1>
        </div>
        <div className="w-full overflow-x-auto rounded-lg shadow-lg bg-rs-surface">
          <table className="min-w-[400px] w-full text-sm text-rs-ink">
            <thead className="bg-white">
              <tr>
                <th className="py-2 sm:py-3 px-2 sm:px-4 text-left whitespace-nowrap text-xs sm:text-sm">Nombre</th>
                <th className="py-2 sm:py-3 px-2 sm:px-4 text-left whitespace-nowrap text-xs sm:text-sm">Correo</th>
                <th className="py-2 sm:py-3 px-2 sm:px-4 text-left whitespace-nowrap text-xs sm:text-sm">Fecha de registro</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={3} className="py-6 px-4 text-center">
                    <LuLoaderCircle className="animate-spin text-2xl text-rs-700 mx-auto" />
                    <span className="block mt-2">Cargando...</span>
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-6 px-4 text-center text-rs-muted">
                    No hay estudiantes registrados.
                  </td>
                </tr>
              ) : (
                students.map((student, idx) => (
                  <tr
                    key={student._id || idx}
                    className="border-b border-rs-line cursor-pointer hover:bg-rs-50 transition"
                    onClick={() => window.location.href = `/students/view?studentId=${student._id}`}
                  >
                    <td className="py-2 sm:py-3 px-2 sm:px-4 whitespace-nowrap text-xs sm:text-sm md:text-base flex items-center gap-2 sm:gap-3">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 bg-rs-700 text-white rounded-full flex items-center justify-center text-xs sm:text-base">
                        {student.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="truncate max-w-[120px] sm:max-w-none">{student.name}</span>
                    </td>
                    <td className="py-2 sm:py-3 px-2 sm:px-4 whitespace-nowrap text-xs sm:text-sm md:text-base">
                      <span className="hidden sm:inline">{student.email}</span>
                      <span className="sm:hidden truncate max-w-[100px] inline-block">{student.email}</span>
                    </td>
                    <td className="py-2 sm:py-3 px-2 sm:px-4 whitespace-nowrap text-xs sm:text-sm md:text-base">{new Date(student.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
