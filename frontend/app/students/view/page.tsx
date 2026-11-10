"use client";

import { getUserById, getUserProfile } from '@/services/users';
import SideBar from '@/components/SideBar';
import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from 'next/navigation';
import { LuLoaderCircle } from 'react-icons/lu';

function StudentProfileContent() {
  const searchParams = useSearchParams();
  const studentId = searchParams.get('studentId');

  const [currentUser, setCurrentUser] = useState<{ id: string; name: string; role: string } | null>(null);
  const [studentInfo, setStudentInfo] = useState<{
    name: string;
    email: string;
    role: string;
    createdAt: string;
    phone: string;
    address: string;
    birthDate: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        if (!studentId) {
          setError("ID de estudiante no proporcionado");
          setLoading(false);
          return;
        }

        // Obtener usuario actual (para el sidebar y permisos)
        const currentUserData = await getUserProfile();
        const currentRole = currentUserData.roles?.[0]?.name || "";
        setCurrentUser({ id: currentUserData._id, name: currentUserData.name, role: currentRole });

        // Verificar permisos
        if (!["docente", "administrador"].includes(currentRole.toLowerCase())) {
          setError("No tienes permisos para acceder a esta sección.");
          setLoading(false);
          return;
        }

        // Obtener información del estudiante
        const studentData = await getUserById(studentId);
        const studentRole = studentData.roles?.[0]?.name || "estudiante";
        
        // Formatear fecha de creación
        const createdDate = new Date(studentData.createdAt);
        const formattedDate = createdDate.toLocaleDateString('es-ES', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        });

        setStudentInfo({
          name: studentData.name,
          email: studentData.email,
          role: studentRole.charAt(0).toUpperCase() + studentRole.slice(1),
          createdAt: formattedDate,
          phone: studentData.phone || 'No especificado',
          address: studentData.address || 'No especificado',
          birthDate: studentData.birthDate || 'No especificado',
        });
      } catch (error: any) {
        console.error('Error fetching user info:', error);
        setError(error.message || "Error al cargar la información del estudiante");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [studentId]);

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
    <div className="flex flex-col lg:flex-row min-h-screen bg-rs-50 text-rs-ink">
      
      {/* Sidebar */}
      <SideBar user={currentUser!} />

      {/* Contenido principal */}
      <main className="min-w-0 flex-1 flex justify-center items-start px-4 py-8 sm:px-6 lg:px-10">

        <div className="bg-rs-surface border border-rs-line rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 w-full max-w-3xl shadow-2xl">

          <div className="bg-rs-50 rounded-xl p-4 sm:p-6">

            {/* Avatar y nombre */}
            <div className="flex flex-col items-center mb-6 sm:mb-8">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-rs-700 text-rs-lime flex items-center justify-center text-3xl sm:text-4xl font-bold">
                {studentInfo?.name.charAt(0).toUpperCase()}
              </div>
              <p className="mt-3 sm:mt-4 text-xl sm:text-2xl font-bold text-center px-2">{studentInfo?.name}</p>
              <span className="mt-1 px-3 py-1 bg-rs-100 text-rs-800 font-semibold rounded-full text-xs sm:text-sm">
                {studentInfo?.role}
              </span>
            </div>

            {/* Tabla de información */}
            <div className="grid grid-cols-1 sm:grid-cols-2 border border-rs-input rounded-lg overflow-hidden">

              <div className="border-b border-rs-input p-3 sm:p-4 font-medium bg-white text-sm sm:text-base">Correo</div>
              <div className="border-b border-rs-input p-3 sm:p-4 text-rs-info break-words text-sm sm:text-base">
                {studentInfo?.email}
              </div>
              
              <div className="border-b border-rs-input p-3 sm:p-4 font-medium bg-white text-sm sm:text-base">Fecha de registro</div>
              <div className="border-b border-rs-input p-3 sm:p-4 text-sm sm:text-base">{studentInfo?.createdAt}</div>

              <div className="border-b border-rs-input p-3 sm:p-4 font-medium bg-white text-sm sm:text-base">Teléfono</div>
              <div className="border-b border-rs-input p-3 sm:p-4 break-words text-sm sm:text-base">{studentInfo?.phone}</div>

              <div className="border-b border-rs-input p-3 sm:p-4 font-medium bg-white text-sm sm:text-base">Dirección</div>
              <div className="border-b border-rs-input p-3 sm:p-4 break-words text-sm sm:text-base">{studentInfo?.address}</div>

              <div className="p-3 sm:p-4 font-medium bg-white text-sm sm:text-base">Fecha de nacimiento</div>
              <div className="p-3 sm:p-4 text-sm sm:text-base">{studentInfo?.birthDate}</div>

            </div>
          </div>
        </div>

      </main>
    </div>
  );
}

export default function StudentProfile() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-rs-50 text-rs-ink">
          Cargando estudiante...
        </div>
      }
    >
      <StudentProfileContent />
    </Suspense>
  );
}
