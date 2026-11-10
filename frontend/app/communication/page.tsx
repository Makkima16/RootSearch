"use client";

import { useEffect, useState } from "react";
import { getUserProfile, getMyTeachers } from "../../services/users";
import SideBar from "@/components/SideBar";
import { LuLoaderCircle, LuPresentation } from 'react-icons/lu';

type Teacher = {
  courseName: string;
  teacherName: string;
  teacherEmail: string;
};

export default function ComunicationPage() {
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string; role: string } | null>(null);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [filteredTeachers, setFilteredTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    async function fetchUser() {
      try {
        const userData = await getUserProfile();
        const role = userData.roles?.[0]?.name || "";

        if (role.toLowerCase() !== "estudiante") {
          setError("No tienes permisos para acceder a esta sección.");
          setLoading(false);
          return;
        }

        setCurrentUser({ id: userData._id, name: userData.name, role });
      } catch (error) {
        console.error("Error al obtener el perfil del usuario:", error);
        setError("Error al verificar permisos");
        setLoading(false);
      }
    }
    fetchUser();
  }, []);

  useEffect(() => {
    async function fetchTeachers() {
      if (currentUser) {
        setLoading(true);
        try {
          const teachersList = await getMyTeachers();
          setTeachers(teachersList);
          setFilteredTeachers(teachersList);
        } catch (error) {
          console.error("Error al obtener docentes:", error);
          setError("Error al cargar docentes");
        } finally {
          setLoading(false);
        }
      }
    }
    fetchTeachers();
  }, [currentUser]);

  // Filtrar docentes por búsqueda de nombre o curso
  useEffect(() => {
    if (searchTerm) {
      const filtered = teachers.filter((teacher) =>
        teacher.teacherName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        teacher.courseName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredTeachers(filtered);
    } else {
      setFilteredTeachers(teachers);
    }
  }, [searchTerm, teachers]);

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
      <SideBar user={currentUser!} />
      <main className="min-w-0 flex-1 px-4 py-8 sm:px-6 lg:px-10">
        <div className="mb-6 sm:mb-8 flex items-center gap-3">
          <h1 className="rs-title text-2xl sm:text-3xl flex items-center gap-2">
            <LuPresentation className="text-rs-700 text-xl sm:text-2xl" /> 
            <span>Lista de Docentes</span>
          </h1>
        </div>

        {/* Filtro de búsqueda */}
        <div className="mb-4 sm:mb-6 bg-rs-surface rounded-lg p-4 sm:p-6 shadow-lg">
          <div className="max-w-md">
            <label htmlFor="search" className="block text-xs sm:text-sm font-medium mb-2 text-rs-muted">
              Buscar por nombre de docente o curso
            </label>
            <input
              id="search"
              type="text"
              placeholder="Escribe un nombre o curso..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 sm:px-4 bg-white border border-rs-line rounded-lg text-sm sm:text-base text-rs-ink placeholder-rs-muted/70 focus:outline-none focus:ring-2 focus:ring-rs-700 transition"
            />
          </div>

          {/* Resumen */}
          <div className="mt-3 sm:mt-4 flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-rs-muted">
            <span>Mostrando {filteredTeachers.length} de {teachers.length} docentes</span>
            {searchTerm && (
              <span className="px-3 py-1 bg-rs-100 rounded-full">
                Búsqueda: "{searchTerm}"
              </span>
            )}
          </div>
        </div>

        {/* Tabla de docentes */}
        <div className="w-full overflow-x-auto rounded-lg shadow-lg bg-rs-surface">
          <table className="min-w-[600px] w-full text-sm text-rs-ink">
            <thead className="bg-white">
              <tr>
                <th className="py-2 sm:py-3 px-2 sm:px-4 text-left whitespace-nowrap text-xs sm:text-sm">Curso</th>
                <th className="py-2 sm:py-3 px-2 sm:px-4 text-left whitespace-nowrap text-xs sm:text-sm">Nombre Docente</th>
                <th className="py-2 sm:py-3 px-2 sm:px-4 text-left whitespace-nowrap text-xs sm:text-sm">Correo Electrónico</th>
              </tr>
            </thead>
            <tbody>
              {filteredTeachers.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-6 px-4 text-center text-rs-muted">
                    {searchTerm
                      ? "No se encontraron docentes con los filtros aplicados."
                      : "No hay docentes asignados."}
                  </td>
                </tr>
              ) : (
                filteredTeachers.map((teacher, idx) => (
                  <tr
                    key={idx}
                    className="border-b border-rs-line hover:bg-rs-50 transition"
                  >
                    <td className="py-2 sm:py-3 px-2 sm:px-4 whitespace-nowrap text-xs sm:text-sm md:text-base">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 sm:w-8 sm:h-8 bg-rs-700 text-white rounded-full flex items-center justify-center text-xs sm:text-base">
                          {teacher.courseName?.charAt(0).toUpperCase() || 'C'}
                        </div>
                        <span className="truncate max-w-[150px] sm:max-w-[200px] md:max-w-none">{teacher.courseName}</span>
                      </div>
                    </td>
                    <td className="py-2 sm:py-3 px-2 sm:px-4 whitespace-nowrap text-xs sm:text-sm md:text-base">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 sm:w-8 sm:h-8 bg-rs-700 text-white rounded-full flex items-center justify-center text-xs sm:text-base">
                          {teacher.teacherName?.charAt(0).toUpperCase() || 'D'}
                        </div>
                        <span className="truncate max-w-[150px] sm:max-w-[200px] md:max-w-none">{teacher.teacherName}</span>
                      </div>
                    </td>
                    <td className="py-2 sm:py-3 px-2 sm:px-4 whitespace-nowrap text-xs sm:text-sm md:text-base">
                      <span className="truncate max-w-[150px] sm:max-w-none inline-block">{teacher.teacherEmail}</span>
                    </td>
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
