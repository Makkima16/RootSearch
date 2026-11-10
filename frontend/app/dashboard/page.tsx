"use client";
import { useEffect, useState } from "react";
import React from "react";
import SideBar from "@/components/SideBar";
import { getUserProfile } from "@/services/users";
import { getAllStudents } from "@/services/students";
import { getCoursesByTeacher, getCourseById, getAllCoursesForAdmin, getAllCourses } from "@/services/courses";
import { uploadAudio } from "@/services/audio";
import { getGeneratedContentByCourse, publishMaterial, updateMaterial } from "@/services/generated-content";
import {
  getTeacherCoursesCount,
  getTeacherUniqueStudentsCount,
  getTotalCoursesCount,
  getTotalStudentsCount,
} from "@/services/metrics";
import Toast from "@/components/Toast";
import {
  LuBookOpen,
  LuUsers,
  LuSparkles,
  LuArrowRight,
  LuChevronRight,
  LuFileText,
  LuMic,
  LuSave,
  LuCheck,
  LuPencil,
} from "react-icons/lu";
import { Modal, StatusChip, StatCard, EmptyState, LoadingScreen, MessageScreen } from "@/components/ui";
import {
  GeneratedContentList,
  GeneratedContentTabs,
  GeneratedContentBody,
} from "@/components/GeneratedContent";

type Student = {
  _id: string;
  name: string;
  email?: string;
};

type Course = {
  _id: string;
  name: string;
  description?: string;
  teacher: string | { _id: string; name?: string; email?: string };
  students?: Student[] | string[];
};

export default function Dashboard() {
  const [user, setUser] = useState<{ id: string; name: string; role: string } | null>(null);
  const [students, setStudents] = useState([]);
  const [teacherCourses, setTeacherCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "info" | "success" | "error" } | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [expandedCourses, setExpandedCourses] = useState<Set<string>>(new Set());
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
    checklist: string[];
    estado: string;
    index: number;
  } | null>(null);
  const [loadingGeneratedContent, setLoadingGeneratedContent] = useState(false);
  const [selectedTab, setSelectedTab] = useState<"resumen" | "glosario" | "quiz" | "checklist">("resumen");
  const [selectedCourseForContent, setSelectedCourseForContent] = useState<{ id: string; name: string } | null>(null);
  const [isEditingContent, setIsEditingContent] = useState(false);
  const [editedContent, setEditedContent] = useState<{
    resumen: string;
    glosario: any[];
    checklist: string[];
  } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [metrics, setMetrics] = useState<{ coursesCount: number; studentsCount: number }>({ coursesCount: 0, studentsCount: 0 });

  useEffect(() => {
    async function fetchData() {
      try {
        const userData = await getUserProfile();
        const role = userData.roles?.[0]?.name || null;

        if (!role || !["docente", "estudiante", "administrador"].includes(role.toLowerCase())) {
          setError("No tienes permisos para acceder a esta sección.");
          setLoading(false);
          return;
        }

        setUser({ id: userData._id, name: userData.name, role });

        // Cargar cursos según el rol
        if (role.toLowerCase() === "docente" || role.toLowerCase() === "administrador") {
          const studentsData = await getAllStudents();
          setStudents(studentsData);
          
          // Cargar cursos y métricas
          let courses: Course[] = [];
          
          if (role.toLowerCase() === "administrador") {
            // Para administradores: obtener todos los cursos del sistema
            courses = await getAllCoursesForAdmin();
            
            // Métricas globales para administradores
            const [coursesCount, studentsCount] = await Promise.all([
              getTotalCoursesCount(),
              getTotalStudentsCount(),
            ]);
            
            setMetrics({
              coursesCount,
              studentsCount,
            });
          } else {
            // Para docentes: obtener solo sus cursos
            courses = await getCoursesByTeacher(userData._id);
            
            // Métricas personales para docentes
            const [coursesCount, studentsCount] = await Promise.all([
              getTeacherCoursesCount(userData._id),
              getTeacherUniqueStudentsCount(userData._id),
            ]);
            
            setMetrics({
              coursesCount,
              studentsCount,
            });
          }
          
          // Ordenar por fecha de creación (más recientes primero)
          const sortedCourses = courses.sort((a: any, b: any) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          
          setTeacherCourses(sortedCourses);
        } else if (role.toLowerCase() === "estudiante") {
          // Para estudiantes: obtener cursos en los que está inscrito (solo con parámetro student)
          const courses = await getAllCourses(userData._id, 'student');
          
          // Ordenar por fecha de creación (más recientes primero)
          const sortedCourses = courses.sort((a: any, b: any) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          
          setTeacherCourses(sortedCourses);
          
          // Métricas para estudiantes
          // Por ahora solo contamos cursos, el conteo de materiales se implementará después
          setMetrics({
            coursesCount: courses.length,
            studentsCount: 0, // Este campo no aplica para estudiantes pero lo dejamos para mantener la estructura
          });
        }
        
        // Solo cuando TODO esté listo, quitar el loading
        setLoading(false);
      } catch (err) {
        const errorMessage =
          typeof err === "object" && err !== null && "message" in err
            ? (err as { message?: string }).message ?? "Error desconocido"
            : "Error desconocido";

        setToast({ message: "Error al cargar datos: " + errorMessage, type: "error" });
        setError("Error al obtener los datos del usuario o estudiantes.");
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const toggleCourseExpansion = (courseId: string) => {
    setExpandedCourses((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(courseId)) {
        newSet.delete(courseId);
      } else {
        newSet.add(courseId);
      }
      return newSet;
    });
  };

  if (loading) {
    return <LoadingScreen />;
  }
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
    setIsEditingContent(false);
    setEditedContent(null);
  };

  const handleValidateMaterial = async () => {
    if (!selectedGeneratedContent?._id) return;
    
    try {
      setIsSaving(true);
      await publishMaterial(selectedGeneratedContent._id);
      
      // Actualizar el estado local
      setSelectedGeneratedContent(prev => 
        prev ? { ...prev, estado: 'PUBLICADO' } : null
      );
      
      setToast({
        message: 'Material validado y publicado exitosamente',
        type: 'success',
      });
      
      // Recargar la lista de contenidos
      const response = await getGeneratedContentByCourse(selectedCourseForContent?.id || '');
      setGeneratedContentsList(response);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      setToast({ message: `Error al validar el material: ${errorMessage}`, type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleStartEdit = () => {
    if (selectedGeneratedContent) {
      setEditedContent({
        resumen: selectedGeneratedContent.resumen,
        glosario: JSON.parse(JSON.stringify(selectedGeneratedContent.glosario)),
        checklist: JSON.parse(JSON.stringify(selectedGeneratedContent.checklist)),
      });
      setIsEditingContent(true);
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedGeneratedContent?._id || !editedContent) return;
    
    try {
      setIsSaving(true);
      const updatedMaterial = await updateMaterial(selectedGeneratedContent._id, {
        resumen: editedContent.resumen,
        glosario: editedContent.glosario,
        checklist: editedContent.checklist,
      });
      
      // Actualizar el estado local
      setSelectedGeneratedContent(prev => 
        prev ? {
          ...prev,
          resumen: editedContent.resumen,
          glosario: editedContent.glosario,
          checklist: editedContent.checklist,
        } : null
      );
      
      setToast({
        message: 'Material actualizado exitosamente',
        type: 'success',
      });
      
      setIsEditingContent(false);
      setEditedContent(null);
      
      // Recargar la lista de contenidos
      const response = await getGeneratedContentByCourse(selectedCourseForContent?.id || '');
      setGeneratedContentsList(response);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      setToast({ message: `Error al guardar los cambios: ${errorMessage}`, type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditingContent(false);
    setEditedContent(null);
  };

  if (error) {
    return (
      <MessageScreen
        title="Acceso denegado"
        message={error}
        action={
          <a href="/" className="rs-btn-primary">
            Volver al inicio
          </a>
        }
      />
    );
  }

  const isStaff = user?.role.toLowerCase() === "docente" || user?.role.toLowerCase() === "administrador";
  const isAdmin = user?.role.toLowerCase() === "administrador";
  const firstName = user?.name?.split(" ")[0] ?? "";
  const today = new Date().toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" });
  const bandColors = ["bg-rs-700", "bg-rs-600", "bg-rs-900"];

  const closeContentModal = () => {
    setShowGeneratedContentModal(false);
    setSelectedGeneratedContent(null);
    setIsEditingContent(false);
    setEditedContent(null);
  };

  return (
    <div className="flex min-h-screen flex-col bg-rs-50 text-rs-ink lg:flex-row">
      <SideBar user={user!} />

      <main className="flex min-w-0 flex-1 flex-col gap-8 px-4 py-8 sm:px-6 lg:px-10">
        <header>
          <p className="text-sm capitalize text-rs-muted">{today}</p>
          <h1 className="rs-title mt-1 text-3xl">Hola, {firstName}</h1>
        </header>

        {/* Métricas */}
        <section aria-label="Resumen" className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {isStaff ? (
            <>
              <StatCard
                tone="deep"
                icon={LuBookOpen}
                label="Cursos activos"
                value={metrics.coursesCount}
                hint={isAdmin ? "Total de cursos activos en el sistema" : "Total de cursos que estás impartiendo"}
              />
              <StatCard
                tone="mint"
                icon={LuUsers}
                label={isAdmin ? "Estudiantes totales" : "Estudiantes únicos"}
                value={metrics.studentsCount}
                hint={
                  isAdmin
                    ? "Total de estudiantes inscritos en el sistema"
                    : "Estudiantes diferentes a los que impartes clase"
                }
              />
            </>
          ) : (
            <>
              <StatCard
                tone="deep"
                icon={LuBookOpen}
                label="Cursos inscritos"
                value={metrics.coursesCount}
                hint="Total de cursos en los que estás matriculado"
              />
              <StatCard
                tone="lime"
                icon={LuSparkles}
                label="Materiales disponibles"
                // Por implementar: conteo de materiales
                value={0}
                hint="Materiales de estudio generados en tus cursos"
              />
            </>
          )}
        </section>

        {/* Cursos */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="rs-title text-xl">Mis cursos</h2>
            <a href="/courses/list" className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-rs-700 hover:text-rs-800">
              Ver todos <LuArrowRight className="size-4" aria-hidden="true" />
            </a>
          </div>

          {teacherCourses.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
              {teacherCourses.slice(0, 5).map((course, i) => {
                const studentCount = Array.isArray(course.students) ? course.students.length : 0;
                const isExpanded = expandedCourses.has(course._id);
                return (
                  <article key={course._id} className="rs-card flex flex-col overflow-hidden">
                    <div className={`flex h-16 items-start px-5 pt-4 ${bandColors[i % bandColors.length]}`}>
                      <span className="grid size-10 place-items-center rounded-[10px] bg-rs-lime text-rs-900">
                        <LuBookOpen className="size-5" aria-hidden="true" />
                      </span>
                    </div>
                    <div className="flex flex-1 flex-col gap-4 p-5">
                      <div>
                        <h3 className="text-base font-semibold text-rs-ink">{course.name}</h3>
                        {course.description && (
                          <p className="mt-1 line-clamp-2 text-sm text-rs-muted">{course.description}</p>
                        )}
                      </div>

                      {isStaff && (
                        <div className="border-t border-rs-line-soft pt-3">
                          <button
                            type="button"
                            onClick={() => toggleCourseExpansion(course._id)}
                            aria-expanded={isExpanded}
                            disabled={studentCount === 0}
                            className="inline-flex cursor-pointer items-center gap-1.5 text-sm font-medium text-rs-700 hover:text-rs-800 disabled:cursor-default disabled:text-rs-muted"
                          >
                            <LuChevronRight
                              className={`size-4 transition-transform ${isExpanded ? "rotate-90" : ""}`}
                              aria-hidden="true"
                            />
                            {studentCount > 0
                              ? `${studentCount} estudiante${studentCount > 1 ? "s" : ""}`
                              : "Sin estudiantes"}
                          </button>
                          {isExpanded && studentCount > 0 && (
                            <ul className="mt-3 space-y-1.5">
                              {(course.students as (Student | string)[]).map((student) => (
                                <li
                                  key={typeof student === "string" ? student : student._id}
                                  className="flex flex-wrap items-center justify-between gap-x-3 rounded-lg bg-rs-50 px-3 py-2 text-sm"
                                >
                                  <span className="text-rs-ink">
                                    {typeof student === "string" ? "ID: " + student : student.name || "Estudiante"}
                                  </span>
                                  {typeof student !== "string" && student.email && (
                                    <span className="text-xs text-rs-muted">{student.email}</span>
                                  )}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      )}

                      <div className="mt-auto flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => handleShowPiaa(course._id, course.name)}
                          className="rs-btn-secondary"
                        >
                          <LuFileText className="size-4" aria-hidden="true" /> PIAA
                        </button>
                        {isStaff && (
                          <button
                            type="button"
                            onClick={() => handleGenerateWithAI(course._id, course.name)}
                            className="rs-btn-primary"
                          >
                            <LuMic className="size-4" aria-hidden="true" /> Generar con IA
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleShowGeneratedContent(course._id, course.name)}
                          disabled={loadingGeneratedContent}
                          className="rs-btn-ghost"
                        >
                          <LuSparkles className="size-4" aria-hidden="true" />
                          {loadingGeneratedContent ? "Cargando..." : "Contenido generado"}
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <EmptyState icon={LuBookOpen}>
              {isStaff ? "No tienes cursos asignados." : "No estás inscrito en ningún curso."}
            </EmptyState>
          )}
        </section>
      </main>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Modal PIAA */}
      {showPiaaModal && selectedCoursePiaa && (
        <Modal
          title={`PIAA · ${selectedCoursePiaa.name}`}
          onClose={() => {
            setShowPiaaModal(false);
            setSelectedCoursePiaa(null);
          }}
          footer={
            <button
              type="button"
              onClick={() => {
                setShowPiaaModal(false);
                setSelectedCoursePiaa(null);
              }}
              className="rs-btn-secondary ml-auto"
            >
              Cerrar
            </button>
          }
        >
          <div className="whitespace-pre-wrap break-words rounded-xl border border-rs-line bg-white px-4 py-3 text-rs-ink">
            {selectedCoursePiaa.content}
          </div>
        </Modal>
      )}

      {/* Modal lista de contenidos generados */}
      {showGeneratedContentListModal && (
        <Modal
          size="md"
          title={`Contenidos generados · ${selectedCourseForContent?.name ?? ""}`}
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
          onClose={closeContentModal}
          closeDisabled={isSaving}
          toolbar={
            <GeneratedContentTabs content={selectedGeneratedContent} tab={selectedTab} onTabChange={setSelectedTab} />
          }
          footer={
            <>
              <div className="flex flex-wrap gap-2">
                {isEditingContent ? (
                  <>
                    <button type="button" onClick={handleSaveEdit} disabled={isSaving} className="rs-btn-primary">
                      <LuSave className="size-4" aria-hidden="true" />
                      {isSaving ? "Guardando..." : "Guardar cambios"}
                    </button>
                    <button type="button" onClick={handleCancelEdit} disabled={isSaving} className="rs-btn-ghost">
                      Cancelar
                    </button>
                  </>
                ) : (
                  <>
                    {selectedGeneratedContent?.estado === "PENDIENTE_REVISION" && (
                      <button type="button" onClick={handleValidateMaterial} disabled={isSaving} className="rs-btn-accent">
                        <LuCheck className="size-4" aria-hidden="true" />
                        {isSaving ? "Validando..." : "Validar y publicar"}
                      </button>
                    )}
                    <button type="button" onClick={handleStartEdit} disabled={isSaving} className="rs-btn-secondary">
                      <LuPencil className="size-4" aria-hidden="true" /> Editar
                    </button>
                  </>
                )}
              </div>
              <button type="button" onClick={closeContentModal} disabled={isSaving} className="rs-btn-ghost">
                Cerrar
              </button>
            </>
          }
        >
          <GeneratedContentBody
            content={selectedGeneratedContent}
            tab={selectedTab}
            editing={
              isEditingContent && editedContent ? { value: editedContent, onChange: setEditedContent } : undefined
            }
          />
        </Modal>
      )}
    </div>
  );
}
