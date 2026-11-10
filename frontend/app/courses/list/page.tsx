"use client";

import { useState, useEffect } from 'react';
import React from 'react';
import { getAllCourses, getAllCoursesForAdmin, getCourseById } from '../../../services/courses';
import { getUserProfile } from '../../../services/users';
import { uploadAudio } from '../../../services/audio';
import { getGeneratedContentByCourse } from '../../../services/generated-content';
import SideBar from '@/components/SideBar';
import CreateCourseModal from '@/components/create_course';
import Toast from '@/components/Toast';
import {
  LuArrowRight,
  LuBookOpen,
  LuChevronLeft,
  LuChevronRight,
  LuFileText,
  LuMic,
  LuPlus,
  LuSparkles,
} from 'react-icons/lu';
import { LoadingScreen, MessageScreen, Modal, PageHeader, StatusChip } from '@/components/ui';
import { GeneratedContentList, GeneratedContentTabs, GeneratedContentBody } from '@/components/GeneratedContent';

type Course = {
  _id?: string;
  name: string;
  description: string;
  createdAt?: string;
};

export default function CoursesListPage() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [direction, setDirection] = useState<'left' | 'right'>('right');
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [user, setUser] = useState<{ id: string; name: string; role: string } | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "info" | "success" | "error" } | null>(null);
  const [showPiaaModal, setShowPiaaModal] = useState(false);
  const [selectedCoursePiaa, setSelectedCoursePiaa] = useState<{ name: string; content: string } | null>(null);
  const [showGeneratedContentModal, setShowGeneratedContentModal] = useState(false);
  const [showGeneratedContentListModal, setShowGeneratedContentListModal] = useState(false);
  const [generatedContentsList, setGeneratedContentsList] = useState<any[]>([]);
  const [selectedGeneratedContent, setSelectedGeneratedContent] = useState<{
    _id: string;
    name: string;
    resumen: string;
    glosario: any[];
    quiz: any[];
    checklist: any[];
    estado: string;
    index: number;
  } | null>(null);
  const [loadingGeneratedContent, setLoadingGeneratedContent] = useState(false);
  const [selectedTab, setSelectedTab] = useState<"resumen" | "glosario" | "quiz" | "checklist">("resumen");
  const [selectedCourseForContent, setSelectedCourseForContent] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    async function fetchUser() {
      try {
        const userData = await getUserProfile();
        const role = userData.roles?.[0]?.name || "";
        setUser({ id: userData._id, name: userData.name, role });
      } catch (error) {
        console.error("Error al obtener el perfil del usuario:", error);
        setError("Error al cargar el perfil del usuario");
      }
    }
    fetchUser();
  }, []);

  const fetchCourses = async () => {
    if (user) {
      try {
        setLoading(true);
        let data;
        
        // Si es administrador, obtener todos los cursos
        if (user.role.toLowerCase() === "administrador") {
          data = await getAllCoursesForAdmin();
        } else if (user.role.toLowerCase() === "docente") {
          // Para docentes, filtrar solo por teacher
          data = await getAllCourses(user.id, 'teacher');
        } else if (user.role.toLowerCase() === "estudiante") {
          // Para estudiantes, filtrar solo por student
          data = await getAllCourses(user.id, 'student');
        } else {
          // Por defecto, usar ambos filtros
          data = await getAllCourses(user.id);
        }
        
        setCourses(data);
      } catch (error) {
        console.error("Error al cargar cursos:", error);
        setError("Error al cargar los cursos");
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchCourses();
  }, [user]);

  const handleModalSuccess = () => {
    fetchCourses(); // Recargar la lista de cursos después de crear uno nuevo
  };

  const handleGenerateWithAI = async (courseId: string, courseName: string) => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'audio/*';
    
    fileInput.onchange = async (e: any) => {
      const file = e.target.files?.[0];
      if (!file) {
        setToast({ message: 'No se seleccionó ningún archivo', type: 'error' });
        return;
      }

      try {
        setToast({ message: 'Cargando audio...', type: 'info' });
        const result = await uploadAudio(courseId, file);
        setToast({ message: `Audio cargado exitosamente para: ${courseName}`, type: 'success' });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
        setToast({ message: `Error al cargar audio: ${errorMessage}`, type: 'error' });
      }
    };

    fileInput.click();
  };

  const handleShowPiaa = async (courseId: string, courseName: string) => {
    try {
      const courseDetails = await getCourseById(courseId);
      if (courseDetails.piaa_syllabus) {
        setSelectedCoursePiaa({
          name: courseName,
          content: courseDetails.piaa_syllabus,
        });
        setShowPiaaModal(true);
      } else {
        setToast({
          message: `No hay contenido PIAA disponible para: ${courseName}`,
          type: 'info',
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      setToast({ message: `Error al obtener PIAA: ${errorMessage}`, type: 'error' });
    }
  };

  const handleShowGeneratedContent = async (courseId: string, courseName: string) => {
    try {
      setLoadingGeneratedContent(true);
      setSelectedTab("resumen");
      setSelectedCourseForContent({ id: courseId, name: courseName });
      
      const response = await getGeneratedContentByCourse(courseId);
      
      if (Array.isArray(response) && response.length > 0) {
        setGeneratedContentsList(response);
        setShowGeneratedContentListModal(true);
      } else {
        setToast({
          message: `No hay contenido generado disponible para: ${courseName}`,
          type: 'info',
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      setToast({ message: `Error al obtener contenido generado: ${errorMessage}`, type: 'error' });
    } finally {
      setLoadingGeneratedContent(false);
    }
  };

  const handleSelectGeneratedContent = (content: any, index: number) => {
    setSelectedGeneratedContent({
      _id: content._id,
      name: selectedCourseForContent?.name || "Curso",
      resumen: content.resumen || "No hay resumen disponible",
      glosario: content.glosario || [],
      quiz: content.quiz || [],
      checklist: content.checklist || [],
      estado: content.estado || "DESCONOCIDO",
      index: index + 1,
    });
    setShowGeneratedContentListModal(false);
    setShowGeneratedContentModal(true);
  };

  // Mínima distancia de swipe requerida (en px)
  const minSwipeDistance = 50;

  const handlePrevious = () => {
    if (isAnimating || courses.length === 0) return;
    setIsAnimating(true);
    setDirection('left');
    setCurrentIndex((prev) => (prev === 0 ? courses.length - 1 : prev - 1));
    setTimeout(() => setIsAnimating(false), 500);
  };

  const handleNext = () => {
    if (isAnimating || courses.length === 0) return;
    setIsAnimating(true);
    setDirection('right');
    setCurrentIndex((prev) => (prev === courses.length - 1 ? 0 : prev + 1));
    setTimeout(() => setIsAnimating(false), 500);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      handleNext();
    } else if (isRightSwipe) {
      handlePrevious();
    }
  };

  const getPreviousIndex = () => {
    return currentIndex === 0 ? courses.length - 1 : currentIndex - 1;
  };

  const getNextIndex = () => {
    return currentIndex === courses.length - 1 ? 0 : currentIndex + 1;
  };

  if (loading) {
    return <LoadingScreen />;
  }

  if (error) {
    return (
      <MessageScreen
        title="Error"
        message={error}
        action={
          <a href="/dashboard" className="rs-btn-primary">
            Volver al inicio
          </a>
        }
      />
    );
  }

  const goToCourse = (id?: string) => {
    if (id) window.location.assign(`/courses/view?courseId=${id}`);
  };

  if (user?.role === 'docente' || user?.role === 'administrador') {
    return (
      <div className="flex min-h-screen flex-col bg-rs-50 font-sans text-rs-ink lg:flex-row">
        <SideBar user={user} />
        <main className="min-w-0 flex-1 px-4 py-8 sm:px-6 lg:px-10">
          <PageHeader
            icon={LuBookOpen}
            title="Listado de cursos"
            subtitle={`${courses.length} curso${courses.length === 1 ? '' : 's'} registrados`}
            actions={
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="rs-btn-primary"
                title="Crear nuevo curso"
              >
                <LuPlus className="size-4" aria-hidden="true" /> Nuevo curso
              </button>
            }
          />

          <div className="rs-card w-full overflow-hidden">
            <div className="overflow-x-auto">
              <table className="rs-table min-w-[640px]">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Descripción</th>
                    <th className="text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {courses.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="py-8 text-center text-rs-muted">
                        No hay cursos registrados.
                      </td>
                    </tr>
                  ) : (
                    courses.map((course, idx) => (
                      <tr key={course._id || idx}>
                        <td className="whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => goToCourse(course._id)}
                            className="flex cursor-pointer items-center gap-3 text-left font-semibold text-rs-ink hover:text-rs-700"
                          >
                            <span className="grid size-9 shrink-0 place-items-center rounded-[10px] bg-rs-700 text-sm font-bold text-rs-lime">
                              {course.name.charAt(0).toUpperCase()}
                            </span>
                            <span className="max-w-[160px] truncate md:max-w-[260px]">{course.name}</span>
                          </button>
                        </td>
                        <td className="cursor-pointer text-rs-muted" onClick={() => goToCourse(course._id)}>
                          <span className="line-clamp-2">{course.description}</span>
                        </td>
                        <td>
                          <div className="flex flex-wrap justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleShowPiaa(course._id!, course.name)}
                              className="rs-btn-secondary min-h-9 px-3 text-[13px]"
                            >
                              <LuFileText className="size-4" aria-hidden="true" /> PIAA
                            </button>
                            <button
                              type="button"
                              onClick={() => handleGenerateWithAI(course._id!, course.name)}
                              className="rs-btn-primary min-h-9 px-3 text-[13px]"
                            >
                              <LuMic className="size-4" aria-hidden="true" /> Generar con IA
                            </button>
                            <button
                              type="button"
                              onClick={() => handleShowGeneratedContent(course._id!, course.name)}
                              disabled={loadingGeneratedContent}
                              className="rs-btn-ghost min-h-9 px-3 text-[13px]"
                            >
                              <LuSparkles className="size-4" aria-hidden="true" /> Contenido
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>

        {/* Modal de crear curso */}
        <CreateCourseModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={handleModalSuccess}
          teacherId={user.id}
        />

        {/* Modal PIAA */}
        {showPiaaModal && (
          <Modal
            size="md"
            title={`PIAA · ${selectedCoursePiaa?.name || ''}`}
            onClose={() => setShowPiaaModal(false)}
            footer={
              <button type="button" onClick={() => setShowPiaaModal(false)} className="rs-btn-secondary ml-auto">
                Cerrar
              </button>
            }
          >
            {selectedCoursePiaa?.content ? (
              <pre className="whitespace-pre-wrap rounded-xl border border-rs-line bg-white p-4 font-sans text-rs-ink">
                {selectedCoursePiaa.content}
              </pre>
            ) : (
              <p className="text-rs-muted">No hay PIAA disponible para este curso.</p>
            )}
          </Modal>
        )}

        {/* Modal lista de contenidos generados */}
        {showGeneratedContentListModal && (
          <Modal
            size="md"
            title={`Contenidos generados · ${selectedCourseForContent?.name ?? ''}`}
            onClose={() => {
              setShowGeneratedContentListModal(false);
              setGeneratedContentsList([]);
            }}
            footer={
              <button
                type="button"
                onClick={() => {
                  setShowGeneratedContentListModal(false);
                  setGeneratedContentsList([]);
                }}
                className="rs-btn-secondary ml-auto"
              >
                Cerrar
              </button>
            }
          >
            <GeneratedContentList items={generatedContentsList} onSelect={handleSelectGeneratedContent} />
          </Modal>
        )}

        {/* Modal contenido generado */}
        {showGeneratedContentModal && selectedGeneratedContent && (
          <Modal
            title={
              <span className="flex items-center gap-3">
                <span className="rounded-full bg-rs-lime px-2.5 py-1 text-xs font-bold text-rs-950">
                  #{selectedGeneratedContent.index}
                </span>
                <span className="truncate">{selectedGeneratedContent.name}</span>
                <StatusChip estado={selectedGeneratedContent.estado} />
              </span>
            }
            onClose={() => {
              setShowGeneratedContentModal(false);
              setSelectedGeneratedContent(null);
            }}
            toolbar={
              <GeneratedContentTabs content={selectedGeneratedContent} tab={selectedTab} onTabChange={setSelectedTab} />
            }
            footer={
              <button
                type="button"
                onClick={() => {
                  setShowGeneratedContentModal(false);
                  setSelectedGeneratedContent(null);
                }}
                className="rs-btn-secondary ml-auto"
              >
                Cerrar
              </button>
            }
          >
            <GeneratedContentBody content={selectedGeneratedContent} tab={selectedTab} />
          </Modal>
        )}

        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </div>
    );
  }

  // Vista del estudiante: carrusel de cursos
  return (
    <div className="flex min-h-screen flex-col bg-rs-50 font-sans text-rs-ink lg:flex-row">
      <SideBar user={user ?? undefined} />

      <main className="flex min-w-0 flex-1 flex-col justify-center px-4 py-8 sm:px-6 lg:px-10">
        <h1 className="rs-title mb-6 text-center text-3xl sm:mb-10 md:text-4xl">Material de todos los cursos</h1>

        {/* Carrusel */}
        <div className="relative flex items-center justify-center gap-2 sm:gap-4 md:gap-6">
          <button
            type="button"
            onClick={handlePrevious}
            disabled={isAnimating}
            className="z-10 hidden size-12 shrink-0 cursor-pointer place-items-center rounded-full bg-rs-700 text-white shadow-lg transition-all duration-300 hover:scale-110 hover:bg-rs-800 disabled:cursor-not-allowed disabled:opacity-50 md:grid"
            aria-label="Curso anterior"
          >
            <LuChevronLeft className="size-6" aria-hidden="true" />
          </button>

          <div className="flex w-full max-w-5xl items-center justify-center gap-2 py-4 sm:gap-4 md:gap-6">
            {courses.length === 0 ? (
              <div className="flex h-72 w-full max-w-lg flex-col items-center justify-center rounded-2xl bg-rs-900 p-8 text-center shadow-2xl">
                <LuBookOpen className="mb-4 size-10 text-rs-lime" aria-hidden="true" />
                <p className="text-xl text-white">No hay cursos disponibles</p>
              </div>
            ) : (
              <>
                {/* Vista previa del curso anterior */}
                <div className="hidden w-48 scale-75 opacity-50 transition-all duration-300 lg:block xl:w-64">
                  <div className="h-56 rounded-2xl bg-rs-200 p-6 xl:h-64">
                    <h2 className="mb-3 font-display text-xl font-semibold text-rs-900">{courses[getPreviousIndex()]?.name}</h2>
                    <p className="line-clamp-4 text-sm text-rs-800">{courses[getPreviousIndex()]?.description}</p>
                  </div>
                </div>

                {/* Curso actual */}
                <div
                  className="w-full max-w-xs touch-pan-y sm:max-w-sm md:max-w-md lg:max-w-lg"
                  onTouchStart={onTouchStart}
                  onTouchMove={onTouchMove}
                  onTouchEnd={onTouchEnd}
                >
                  <button
                    type="button"
                    key={currentIndex}
                    onClick={() => goToCourse(courses[currentIndex]?._id)}
                    className={`flex h-72 w-full cursor-pointer select-none flex-col justify-center rounded-2xl bg-rs-900 p-8 text-left shadow-2xl transition-all duration-500 hover:scale-[1.03] active:scale-95 md:h-80 lg:h-96 lg:p-12 ${
                      isAnimating
                        ? direction === 'right'
                          ? 'animate-slide-from-right'
                          : 'animate-slide-from-left'
                        : ''
                    }`}
                  >
                    <span className="mb-5 grid size-12 place-items-center rounded-xl bg-rs-lime text-rs-900">
                      <LuBookOpen className="size-6" aria-hidden="true" />
                    </span>
                    <span className="mb-4 font-display text-2xl font-semibold text-white md:text-3xl lg:text-4xl">
                      {courses[currentIndex]?.name}
                    </span>
                    <span className="line-clamp-4 text-base leading-relaxed text-rs-150 md:text-lg">
                      {courses[currentIndex]?.description}
                    </span>
                    <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-rs-lime">
                      Ver curso <LuArrowRight className="size-4" aria-hidden="true" />
                    </span>
                  </button>
                </div>

                {/* Vista previa del curso siguiente */}
                <div className="hidden w-48 scale-75 opacity-50 transition-all duration-300 lg:block xl:w-64">
                  <div className="h-56 rounded-2xl bg-rs-200 p-6 xl:h-64">
                    <h2 className="mb-3 font-display text-xl font-semibold text-rs-900">{courses[getNextIndex()]?.name}</h2>
                    <p className="line-clamp-4 text-sm text-rs-800">{courses[getNextIndex()]?.description}</p>
                  </div>
                </div>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={handleNext}
            disabled={isAnimating}
            className="z-10 hidden size-12 shrink-0 cursor-pointer place-items-center rounded-full bg-rs-700 text-white shadow-lg transition-all duration-300 hover:scale-110 hover:bg-rs-800 disabled:cursor-not-allowed disabled:opacity-50 md:grid"
            aria-label="Curso siguiente"
          >
            <LuChevronRight className="size-6" aria-hidden="true" />
          </button>
        </div>

        {/* Indicadores */}
        <div className="mt-8 flex justify-center gap-2">
          {courses.map((_, index) => (
            <button
              type="button"
              key={index}
              onClick={() => {
                if (!isAnimating && index !== currentIndex) {
                  setIsAnimating(true);
                  setDirection(index > currentIndex ? 'right' : 'left');
                  setCurrentIndex(index);
                  setTimeout(() => setIsAnimating(false), 500);
                }
              }}
              className={`h-2 cursor-pointer rounded-full transition-all duration-300 ${
                index === currentIndex ? 'w-8 bg-rs-700' : 'w-2 bg-rs-400 hover:bg-rs-600'
              }`}
              aria-label={`Ir al curso ${index + 1}`}
            />
          ))}
        </div>
      </main>

      <style jsx>{`
        @keyframes slide-from-right {
          from {
            transform: translateX(100%) scale(0.8);
            opacity: 0;
          }
          to {
            transform: translateX(0) scale(1);
            opacity: 1;
          }
        }

        @keyframes slide-from-left {
          from {
            transform: translateX(-100%) scale(0.8);
            opacity: 0;
          }
          to {
            transform: translateX(0) scale(1);
            opacity: 1;
          }
        }

        .animate-slide-from-right {
          animation: slide-from-right 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .animate-slide-from-left {
          animation: slide-from-left 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }
      `}</style>
    </div>
  );
}
