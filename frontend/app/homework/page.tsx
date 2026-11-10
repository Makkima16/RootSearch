"use client";

import { useEffect, useState } from "react";
import { getUserProfile } from "../../services/users";
import { getStudentCourseMaterials } from "../../services/materials";
import SideBar from "@/components/SideBar";
import { LuBookOpen, LuExternalLink, LuLoaderCircle } from 'react-icons/lu';

type Material = {
  courseName: string;
  courseId: string;
  materialId: string;
  title: string;
  description: string;
  type: string;
  originalName: string;
  storageRef: string;
};

export default function HomeWorkPage() {
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string; role: string } | null>(null);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        
        // Intentar cargar los materiales del estudiante
        try {
          const studentMaterials = await getStudentCourseMaterials(userData._id);
          setMaterials(studentMaterials);
        } catch (materialError) {
          console.log("No se pudieron cargar los materiales:", materialError);
          // No mostrar error, solo dejar la lista vacía
        }
      } catch (error) {
        console.error("Error al obtener el perfil del usuario:", error);
        setError("Error al verificar permisos");
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
  }, []);

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
        <div className="mb-6 sm:mb-8">
          <h1 className="rs-title text-2xl sm:text-3xl flex items-center gap-2">
            <LuBookOpen className="text-rs-700 text-xl sm:text-2xl" /> 
            <span>Mis Tareas</span>
          </h1>
          <p className="text-rs-muted mt-2 text-sm sm:text-base">
            Aquí podrás ver todas tus tareas y materiales asignados
          </p>
        </div>

        {/* Contenedor de tareas */}
        <div className="bg-rs-surface rounded-lg p-6 shadow-lg">
          {materials.length === 0 ? (
            <div className="text-center py-12">
              <LuBookOpen className="text-6xl text-rs-muted mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2 text-rs-ink">
                No hay tareas disponibles
              </h2>
              <p className="text-rs-muted">
                Actualmente no tienes tareas asignadas. Cuando tu profesor agregue nuevas tareas, aparecerán aquí.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {materials.map((material) => (
                <div
                  key={material.materialId}
                  className="bg-white rounded-lg p-4 border border-rs-line hover:border-rs-600 transition"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-semibold flex-1">{material.title}</h3>
                    <span className="text-xs bg-rs-700 text-white px-2 py-1 rounded-full ml-2">
                      {material.type}
                    </span>
                  </div>
                  <p className="text-rs-700 text-sm font-medium mb-2">{material.courseName}</p>
                  <p className="text-rs-muted text-sm mb-3">{material.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-rs-muted">{material.originalName}</span>
                    <a
                      href={material.storageRef}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-rs-700 hover:text-rs-800 transition"
                    >
                      <LuExternalLink className="text-sm" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
