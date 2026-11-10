"use client";

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { getCourseById, enrollStudentsToCourse, unenrollStudentsFromCourse } from '../../../services/courses';
import { getUserProfile } from '../../../services/users';
import { uploadAudio } from '../../../services/audio';
import { getGeneratedContentByCourse } from '../../../services/generated-content';
import { downloadMaterial, exportMaterialToPdf, getMaterialsByCourseCurrent } from '../../../services/materials';
import { getAllStudents } from '../../../services/students';
import SideBar from '@/components/SideBar';
import Toast from '@/components/Toast';
import UploadMaterialModal from '@/components/upload_material';
import EditCourseModal from '@/components/edit_course';
import {
  LuArrowLeft,
  LuBookOpen,
  LuCalendar,
  LuCircleAlert,
  LuDownload,
  LuFileDown,
  LuFileText,
  LuLoaderCircle,
  LuMic,
  LuPencil,
  LuSparkles,
  LuUpload,
  LuUserMinus,
  LuUserPlus,
  LuUsers,
} from 'react-icons/lu';
import { Modal, StatusChip, LoadingScreen, MessageScreen } from '@/components/ui';
import { GeneratedContentList, GeneratedContentTabs, GeneratedContentBody } from '@/components/GeneratedContent';

type Course = {
  _id: string;
  name: string;
  description: string;
  teacher: {
    _id: string;
    name: string;
    email: string;
  };
  students: Array<{
    _id: string;
    name: string;
    email: string;
  }>;
  piaa_syllabus?: string;
  createdAt: string;
  updatedAt: string;
};

function CourseViewPageContent() {
  const searchParams = useSearchParams();
  const courseId = searchParams.get('courseId');
  
  const [user, setUser] = useState<{ id: string; name: string; role: string } | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "info" | "success" | "error" } | null>(null);
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
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showMaterialsListModal, setShowMaterialsListModal] = useState(false);
  const [showDownloadMaterialModal, setShowDownloadMaterialModal] = useState(false);
  const [showExportMaterialModal, setShowExportMaterialModal] = useState(false);
  const [materialsForCourse, setMaterialsForCourse] = useState<any[]>([]);
  const [loadingMaterials, setLoadingMaterials] = useState(false);
  const [showAddStudentsModal, setShowAddStudentsModal] = useState(false);
  const [availableStudents, setAvailableStudents] = useState<any[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [addingStudents, setAddingStudents] = useState(false);
  const [showRemoveStudentModal, setShowRemoveStudentModal] = useState(false);
  const [studentToRemove, setStudentToRemove] = useState<{ _id: string; name: string; email: string } | null>(null);
  const [removingStudent, setRemovingStudent] = useState(false);
  const [showEditCourseModal, setShowEditCourseModal] = useState(false);
  const [courseTab, setCourseTab] = useState<"materiales" | "estudiantes" | "piaa">("materiales");

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

  useEffect(() => {
    async function fetchCourse() {
      if (!courseId) {
        setError("No se proporcionó un ID de curso");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const courseData = await getCourseById(courseId);
        setCourse(courseData);
      } catch (error) {
        console.error("Error al cargar el curso:", error);
        setError("Error al cargar los datos del curso");
      } finally {
        setLoading(false);
      }
    }

    if (user) {
      fetchCourse();
    }
  }, [courseId, user]);

  const handleGenerateWithAI = async () => {
    if (!courseId || !course) return;

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
        await uploadAudio(courseId, file);
        setToast({ message: `Audio cargado exitosamente para: ${course.name}`, type: 'success' });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
        setToast({ message: `Error al cargar audio: ${errorMessage}`, type: 'error' });
      }
    };

    fileInput.click();
  };

  const handleShowGeneratedContent = async () => {
    if (!courseId || !course) return;

    try {
      setLoadingGeneratedContent(true);
      setSelectedTab("resumen");
      
      const response = await getGeneratedContentByCourse(courseId);
      
      if (Array.isArray(response) && response.length > 0) {
        setGeneratedContentsList(response);
        setShowGeneratedContentListModal(true);
      } else {
        setToast({
          message: `No hay contenido generado disponible para este curso`,
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
      name: course?.name || "Curso",
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

  const handleUploadSuccess = () => {
    setToast({ message: 'Materiales subidos exitosamente', type: 'success' });
    // Recargar la lista de materiales
    loadCourseMaterials();
  };

  const loadCourseMaterials = async () => {
    if (!courseId) return;
    
    try {
      setLoadingMaterials(true);
      const response = await getMaterialsByCourseCurrent(courseId);
      if (Array.isArray(response)) {
        console.log('=== MATERIALES CARGADOS ===');
        console.log('Total de materiales:', response.length);
        console.log('Estructura completa:', JSON.stringify(response, null, 2));
        
        // Inspeccionar cada material
        response.forEach((mat, idx) => {
          console.log(`Material ${idx}:`, {
            '_id': mat._id,
            'id': mat.id,
            'todasLasKeys': Object.keys(mat),
            'objetoCompleto': mat
          });
        });
        
        setMaterialsForCourse(response);
      }
    } catch (error) {
      console.error('Error al cargar materiales:', error);
    } finally {
      setLoadingMaterials(false);
    }
  };

  const handleShowMaterialsList = async () => {
    await loadCourseMaterials();
    setShowMaterialsListModal(true);
  };

  const handleDownloadMaterialClick = async () => {
    await loadCourseMaterials();
    setShowDownloadMaterialModal(true);
  };

  const handleExportToPdfClick = async () => {
    await loadCourseMaterials();
    setShowExportMaterialModal(true);
  };

  const handleDownloadMaterial = async (materialId: string, materialTitle: string) => {
    if (!materialId || materialId === 'undefined') {
      setToast({ message: 'ID de material inválido', type: 'error' });
      console.error('Material ID is invalid:', materialId);
      return;
    }

    try {
      setToast({ message: 'Descargando material...', type: 'info' });
      const blob = await downloadMaterial(materialId);
      
      // Crear un enlace temporal para descargar el archivo
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${materialTitle || 'material'}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      setToast({ message: 'Material descargado exitosamente', type: 'success' });
      setShowDownloadMaterialModal(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      setToast({ message: `Error al descargar material: ${errorMessage}`, type: 'error' });
    }
  };

  const handleExportToPdf = async (materialId: string, materialTitle: string) => {
    if (!materialId || materialId === 'undefined') {
      setToast({ message: 'ID de material inválido', type: 'error' });
      console.error('Material ID is invalid:', materialId);
      return;
    }

    try {
      setToast({ message: 'Exportando a PDF...', type: 'info' });
      const blob = await exportMaterialToPdf(materialId);
      
      // Crear un enlace temporal para descargar el PDF
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${materialTitle || 'material'}-export.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      setToast({ message: 'PDF exportado exitosamente', type: 'success' });
      setShowExportMaterialModal(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      setToast({ message: `Error al exportar a PDF: ${errorMessage}`, type: 'error' });
    }
  };

  const handleOpenAddStudentsModal = async () => {
    try {
      setLoadingStudents(true);
      setShowAddStudentsModal(true);
      const students = await getAllStudents();
      
      // Filtrar estudiantes que ya están inscritos en el curso
      const enrolledStudentIds = course?.students.map(s => s._id) || [];
      const notEnrolled = students.filter((student: { _id: string; name: string; email: string }) => !enrolledStudentIds.includes(student._id));
      
      setAvailableStudents(notEnrolled);
    } catch (error) {
      console.error('Error al cargar estudiantes:', error);
      setToast({ message: 'Error al cargar la lista de estudiantes', type: 'error' });
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleToggleStudent = (studentId: string) => {
    setSelectedStudents(prev => {
      if (prev.includes(studentId)) {
        return prev.filter(id => id !== studentId);
      } else {
        return [...prev, studentId];
      }
    });
  };

  const handleAddStudents = async () => {
    if (!courseId || selectedStudents.length === 0) {
      setToast({ message: 'Por favor selecciona al menos un estudiante', type: 'error' });
      return;
    }

    try {
      setAddingStudents(true);
      await enrollStudentsToCourse(courseId, selectedStudents);
      
      setToast({ message: `${selectedStudents.length} estudiante(s) agregado(s) exitosamente`, type: 'success' });
      
      // Recargar el curso para mostrar los nuevos estudiantes
      const updatedCourse = await getCourseById(courseId);
      setCourse(updatedCourse);
      
      // Cerrar modal y limpiar selección
      setShowAddStudentsModal(false);
      setSelectedStudents([]);
      setAvailableStudents([]);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      setToast({ message: `Error al agregar estudiantes: ${errorMessage}`, type: 'error' });
    } finally {
      setAddingStudents(false);
    }
  };

  const handleOpenRemoveStudentModal = (student: { _id: string; name: string; email: string }) => {
    setStudentToRemove(student);
    setShowRemoveStudentModal(true);
  };

  const handleRemoveStudent = async () => {
    if (!courseId || !studentToRemove) return;

    try {
      setRemovingStudent(true);
      await unenrollStudentsFromCourse(courseId, [studentToRemove._id]);
      
      setToast({ message: `Estudiante ${studentToRemove.name} eliminado del curso`, type: 'success' });
      
      // Recargar el curso para actualizar la lista
      const updatedCourse = await getCourseById(courseId);
      setCourse(updatedCourse);
      
      // Cerrar modal
      setShowRemoveStudentModal(false);
      setStudentToRemove(null);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      setToast({ message: `Error al eliminar estudiante: ${errorMessage}`, type: 'error' });
    } finally {
      setRemovingStudent(false);
    }
  };

  const handleExportPiaaToPdf = async () => {
    if (!course?.piaa_syllabus) {
      setToast({ message: 'No hay PIAA para exportar', type: 'error' });
      return;
    }

    try {
      setToast({ message: 'Generando PDF del PIAA...', type: 'info' });
      
      // Crear contenido HTML para el PDF
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
            h1 { color: #12392C; border-bottom: 3px solid #1E6B52; padding-bottom: 10px; }
            .info { margin-bottom: 20px; color: #666; }
            .content { white-space: pre-wrap; margin-top: 20px; }
          </style>
        </head>
        <body>
          <h1>PIAA - Programa de la Asignatura</h1>
          <div class="info">
            <strong>Curso:</strong> ${course.name}<br>
            <strong>Profesor:</strong> ${course.teacher.name}<br>
            <strong>Fecha:</strong> ${new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
          <div class="content">${course.piaa_syllabus}</div>
        </body>
        </html>
      `;

      // Crear un Blob con el HTML
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = window.URL.createObjectURL(blob);
      
      // Abrir en una nueva ventana para que el usuario pueda imprimir como PDF
      const printWindow = window.open(url, '_blank');
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
        };
      }
      
      setToast({ message: 'Abriendo ventana de impresión...', type: 'success' });
      
      // Limpiar la URL después de un tiempo
      setTimeout(() => window.URL.revokeObjectURL(url), 1000);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      setToast({ message: `Error al exportar PIAA: ${errorMessage}`, type: 'error' });
    }
  };


  if (loading) {
    return <LoadingScreen label="Cargando curso..." />;
  }

  if (error || !course) {
    return (
      <MessageScreen
        title="Error"
        message={error || "No se pudo cargar el curso"}
        action={
          <a href="/courses/list" className="rs-btn-primary">
            Volver a la lista
          </a>
        }
      />
    );
  }

  const isStaff = user?.role.toLowerCase() === "docente" || user?.role.toLowerCase() === "administrador";
  const isTeacher = user?.role.toLowerCase() === "docente";
  const materialName = (material: any, index: number) =>
    material.filename || material.originalName || `Material ${index + 1}`;
  const materialId = (material: any) =>
    material._id?.toString() || material._id || String(material._id) || material.id;

  /** Tarjeta de un material subido (lista, descarga y exportación usan la misma). */
  const renderMaterial = (material: any, index: number, action?: { icon: React.ReactNode; onClick: () => void }) => {
    const content = (
      <>
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-rs-900 px-2.5 py-1 text-xs font-bold text-rs-lime">#{index + 1}</span>
            <span
              className={`rs-chip ${
                material.status === "READY"
                  ? "bg-rs-ok-bg text-rs-ok"
                  : material.status === "PENDING"
                  ? "bg-rs-warn-bg text-rs-warn"
                  : "bg-rs-100 text-rs-800"
              }`}
            >
              {material.status || "N/A"}
            </span>
            <span className="rounded-md bg-rs-100 px-2 py-0.5 text-xs font-medium text-rs-800">{material.type || "PDF"}</span>
          </div>
          <p className="flex items-center gap-2 font-medium text-rs-ink">
            <LuFileText className="size-4 shrink-0 text-rs-700" aria-hidden="true" />
            <span className="truncate">{materialName(material, index)}</span>
          </p>
          {material.description && <p className="mt-1 text-sm text-rs-muted">{material.description}</p>}
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-rs-muted">
            <span>Tamaño: {material.size ? `${(material.size / 1024).toFixed(2)} KB` : "N/A"}</span>
            <span>Almacenamiento: {material.storageProvider || "N/A"}</span>
            {material.createdAt && <span>{new Date(material.createdAt).toLocaleDateString("es-ES")}</span>}
          </div>
        </div>
        {action && <span className="shrink-0 text-rs-700 transition-transform group-hover:scale-110">{action.icon}</span>}
      </>
    );

    const key = materialId(material) || `material-${index}`;
    const base = "flex w-full items-center justify-between gap-4 rounded-xl border border-rs-line bg-white p-4 text-left";
    return action ? (
      <li key={key}>
        <button
          type="button"
          onClick={action.onClick}
          className={`${base} group cursor-pointer transition-colors hover:border-rs-600 hover:bg-[#f3f9f5]`}
        >
          {content}
        </button>
      </li>
    ) : (
      <li key={key} className={base}>
        {content}
      </li>
    );
  };

  const renderMaterialsBody = (
    emptyText: string,
    action?: (material: any, index: number) => { icon: React.ReactNode; onClick: () => void },
  ) =>
    loadingMaterials ? (
      <div className="flex justify-center py-8">
        <LuLoaderCircle className="size-10 animate-spin text-rs-700" aria-hidden="true" />
      </div>
    ) : materialsForCourse.length > 0 ? (
      <ul className="space-y-3">
        {materialsForCourse.map((material, index) => renderMaterial(material, index, action?.(material, index)))}
      </ul>
    ) : (
      <p className="py-8 text-center text-rs-muted">{emptyText}</p>
    );

  const courseTabs: { id: "materiales" | "estudiantes" | "piaa"; label: string }[] = [
    { id: "materiales", label: "Materiales" },
    { id: "estudiantes", label: `Estudiantes (${course.students.length})` },
  ];
  if (course.piaa_syllabus) courseTabs.push({ id: "piaa", label: "PIAA" });

  return (
    <div className="flex min-h-screen flex-col bg-rs-50 font-sans text-rs-ink lg:flex-row">
      <SideBar user={user ?? undefined} />

      <main className="flex min-w-0 flex-1 flex-col">
        {/* Encabezado del curso */}
        <div className="bg-rs-700 px-4 pt-6 text-white sm:px-6 lg:px-10">
          <nav aria-label="Ruta" className="mb-5 flex items-center gap-2 text-sm text-rs-150">
            <a href="/courses/list" className="inline-flex items-center gap-1.5 font-medium text-rs-lime hover:text-[#dceba0]">
              <LuArrowLeft className="size-4" aria-hidden="true" /> Cursos
            </a>
            <span aria-hidden="true">/</span>
            <span className="truncate">{course.name}</span>
          </nav>

          <header className="flex flex-wrap items-end justify-between gap-5">
            <div className="flex min-w-0 items-center gap-4">
              <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-rs-lime font-display text-2xl font-bold text-rs-900">
                {course.name.charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0">
                <h1 className="font-display text-3xl font-semibold tracking-tight text-white md:text-4xl">{course.name}</h1>
                <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-rs-150">
                  <span>Docente: {course.teacher.name}</span>
                  <span>
                    Creado el{" "}
                    {new Date(course.createdAt).toLocaleDateString("es-ES", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                  <span>
                    {course.students.length} estudiante{course.students.length === 1 ? "" : "s"}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {isStaff && (
                <button
                  type="button"
                  onClick={() => setShowEditCourseModal(true)}
                  title="Editar curso"
                  className="rs-btn border border-[#5fa383] bg-rs-800 text-white hover:bg-rs-900"
                >
                  <LuPencil className="size-4" aria-hidden="true" /> Editar curso
                </button>
              )}
              {course.piaa_syllabus && (
                <button type="button" onClick={handleExportPiaaToPdf} title="Exportar PIAA a PDF" className="rs-btn-accent">
                  <LuDownload className="size-4" aria-hidden="true" /> Exportar PIAA
                </button>
              )}
            </div>
          </header>

          <div role="tablist" aria-label="Secciones del curso" className="mt-6 flex gap-1 overflow-x-auto">
            {courseTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={courseTab === tab.id}
                onClick={() => setCourseTab(tab.id)}
                className={`min-h-11 cursor-pointer whitespace-nowrap rounded-t-[10px] px-5 text-[15px] transition-colors ${
                  courseTab === tab.id ? "bg-rs-50 font-semibold text-rs-900" : "font-medium text-rs-150 hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-6 px-4 py-6 sm:px-6 lg:px-10">
          {courseTab === "materiales" && (
            <>
              {/* Acciones del docente */}
              {isTeacher && (
                <section aria-labelledby="gen-title" className="flex flex-wrap gap-6 rounded-2xl border border-rs-200 bg-rs-100 p-6">
                  <div className="flex min-w-[260px] flex-1 flex-col gap-3">
                    <span className="inline-flex items-center gap-1.5 self-start rounded-full bg-rs-900 px-2.5 py-1 text-xs font-semibold text-rs-lime">
                      <LuSparkles className="size-3.5" aria-hidden="true" /> Generación con IA
                    </span>
                    <h2 id="gen-title" className="rs-title text-xl">
                      Nuevo material desde una clase
                    </h2>
                    <p className="text-sm leading-relaxed text-[#2f4a3e]">
                      Sube el audio de la clase: se transcribe y la IA genera resumen, quiz, glosario y checklist para que
                      los revises antes de publicarlos.
                    </p>
                  </div>
                  <div className="flex flex-[2] flex-wrap content-center gap-3">
                    <button type="button" onClick={handleGenerateWithAI} className="rs-btn bg-rs-900 text-white hover:bg-rs-950">
                      <LuMic className="size-4 text-rs-lime" aria-hidden="true" /> Generar material con IA
                    </button>
                    <button type="button" onClick={() => setShowUploadModal(true)} className="rs-btn-primary">
                      <LuUpload className="size-4" aria-hidden="true" /> Subir materiales (PDF)
                    </button>
                    <button type="button" onClick={handleDownloadMaterialClick} className="rs-btn-secondary">
                      <LuDownload className="size-4" aria-hidden="true" /> Descargar material
                    </button>
                    <button type="button" onClick={handleExportToPdfClick} className="rs-btn-secondary">
                      <LuFileDown className="size-4" aria-hidden="true" /> Exportar a PDF
                    </button>
                  </div>
                </section>
              )}

              <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                {/* Materiales generados (visible para todos) */}
                <section className="rs-card flex flex-col gap-4 p-6 xl:col-span-2">
                  <h2 className="rs-title flex items-center gap-2 text-lg">
                    <LuBookOpen className="size-5 text-rs-700" aria-hidden="true" /> Materiales generados
                  </h2>
                  <p className="text-sm text-rs-muted">
                    Consulta el contenido generado por la IA o la lista de archivos subidos al curso.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={handleShowGeneratedContent}
                      disabled={loadingGeneratedContent}
                      className="rs-btn-primary"
                    >
                      {loadingGeneratedContent ? (
                        <LuLoaderCircle className="size-4 animate-spin" aria-hidden="true" />
                      ) : (
                        <LuSparkles className="size-4" aria-hidden="true" />
                      )}
                      {loadingGeneratedContent ? "Cargando..." : "Ver contenido generado"}
                    </button>
                    <button
                      type="button"
                      onClick={handleShowMaterialsList}
                      disabled={loadingMaterials}
                      className="rs-btn-secondary"
                    >
                      {loadingMaterials ? (
                        <LuLoaderCircle className="size-4 animate-spin" aria-hidden="true" />
                      ) : (
                        <LuFileText className="size-4" aria-hidden="true" />
                      )}
                      {loadingMaterials ? "Cargando..." : "Lista de materiales"}
                    </button>
                  </div>
                </section>

                {/* Descripción y profesor */}
                <section className="flex flex-col gap-4 rounded-2xl bg-rs-900 p-6 text-white">
                  <h2 className="font-display text-lg font-semibold">Sobre el curso</h2>
                  <p className="text-sm leading-relaxed text-rs-150">{course.description}</p>
                  <div className="mt-auto flex items-center gap-3 rounded-xl bg-rs-950 p-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-full bg-rs-600 font-semibold">
                      {course.teacher.name.charAt(0).toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{course.teacher.name}</p>
                      <p className="truncate text-xs text-rs-300">{course.teacher.email}</p>
                    </div>
                  </div>
                </section>
              </div>
            </>
          )}

          {courseTab === "estudiantes" && (
            <section className="rs-card p-6">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <h2 className="rs-title flex items-center gap-2 text-lg">
                  <LuUsers className="size-5 text-rs-700" aria-hidden="true" /> Estudiantes inscritos
                  <span className="rounded-full bg-rs-700 px-2.5 py-0.5 text-sm text-white">{course.students.length}</span>
                </h2>
                {isStaff && (
                  <button type="button" onClick={handleOpenAddStudentsModal} className="rs-btn-primary">
                    <LuUserPlus className="size-4" aria-hidden="true" /> Agregar estudiantes
                  </button>
                )}
              </div>

              {course.students.length === 0 ? (
                <p className="py-6 text-center text-rs-muted">No hay estudiantes inscritos en este curso.</p>
              ) : (
                <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {course.students.map((student) => (
                    <li
                      key={student._id}
                      className="group flex items-center gap-3 rounded-xl border border-rs-line-soft bg-white p-3 transition-colors hover:border-rs-400"
                    >
                      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-rs-200 font-semibold text-rs-900">
                        {student.name.charAt(0).toUpperCase()}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-rs-ink">{student.name}</p>
                        <p className="truncate text-sm text-rs-muted">{student.email}</p>
                      </div>
                      {isStaff && (
                        <button
                          type="button"
                          onClick={() => handleOpenRemoveStudentModal(student)}
                          title="Eliminar estudiante del curso"
                          aria-label={`Eliminar a ${student.name} del curso`}
                          className="grid size-10 shrink-0 cursor-pointer place-items-center rounded-lg text-rs-muted transition-colors hover:bg-rs-error-bg hover:text-rs-error"
                        >
                          <LuUserMinus className="size-4" aria-hidden="true" />
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}

          {courseTab === "piaa" && course.piaa_syllabus && (
            <section className="rs-card p-6">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h2 className="rs-title flex items-center gap-2 text-lg">
                  <LuBookOpen className="size-5 text-rs-700" aria-hidden="true" /> PIAA · Programa de la asignatura
                </h2>
                <button type="button" onClick={handleExportPiaaToPdf} title="Exportar PIAA a PDF" className="rs-btn-secondary">
                  <LuFileDown className="size-4" aria-hidden="true" /> Exportar PDF
                </button>
              </div>
              <div className="rounded-xl border border-rs-line-soft bg-white p-6">
                <div
                  className="leading-relaxed text-[#23362d]"
                  style={{
                    fontSize: "0.95rem",
                    lineHeight: "1.8",
                  }}
                  dangerouslySetInnerHTML={{
                    __html: course.piaa_syllabus
                      // Títulos principales (sin bullets, en mayúsculas o frases interrogativas)
                      .replace(/^([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ\s]+)$/gm, '<h2 style="color: #12392C; font-size: 1.3rem; font-weight: bold; margin-top: 2rem; margin-bottom: 1rem; border-bottom: 2px solid #1E6B52; padding-bottom: 0.5rem;">$1</h2>')
                      .replace(/^(¿[^?]+\?)$/gm, '<h3 style="color: #1E6B52; font-size: 1.2rem; font-weight: bold; margin-top: 1.5rem; margin-bottom: 0.8rem;">$1</h3>')

                      // Subtítulos (comienzan con mayúscula y terminan con :)
                      .replace(/^([A-Z][^:]+:)$/gm, '<h4 style="color: #3A8A65; font-size: 1.05rem; font-weight: 600; margin-top: 1.2rem; margin-bottom: 0.5rem;">$1</h4>')

                      // Items con bullets (•) - mantener como están
                      .replace(/^•(.+)$/gm, '<div style="display: flex; margin-left: 1.5rem; margin-bottom: 0.4rem;"><span style="color: #1E6B52; margin-right: 0.5rem;">•</span><span>$1</span></div>')

                      // Items con números (R1., R2., etc) - destacar
                      .replace(/^•?(R\d+\.)(.+)$/gm, '<div style="display: flex; margin-left: 1.5rem; margin-bottom: 0.5rem;"><span style="color: #164F3D; font-weight: bold; margin-right: 0.5rem;">$1</span><span>$2</span></div>')

                      // Objetivos específicos como subtítulo especial
                      .replace(/(Objetivos específicos)/g, '<p style="color: #6B4105; font-weight: bold; margin-top: 1rem; margin-bottom: 0.5rem; font-size: 1rem;">$1</p>')

                      // Información del profesor
                      .replace(/^([A-Z][a-z]+.*\d{4})$/gm, '<p style="color: #3A8A65; font-style: italic; margin-bottom: 0.3rem;">$1</p>')
                      .replace(/([a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,})/gi, '<a href="mailto:$1" style="color: #1E6B52; text-decoration: underline;">$1</a>')

                      // Porcentajes de evaluación - destacar
                      .replace(/^•([^:]+:\s*\d+\s*%)$/gm, '<div style="display: flex; justify-content: space-between; margin-left: 1.5rem; margin-bottom: 0.3rem; padding: 0.3rem; background: rgba(30, 107, 82, 0.08); border-radius: 4px;"><span>$1</span></div>')

                      // Notas importantes (entre paréntesis o con "Tener en cuenta")
                      .replace(/(Tener en cuenta:?|Nota:?)/gi, '<strong style="color: #6B4105; display: block; margin-top: 1rem;">$1</strong>')

                      // Saltos de línea dobles para párrafos
                      .replace(/\n\n+/g, '</p><p style="margin-top: 0.8rem;">')
                      // Saltos de línea simples
                      .replace(/\n/g, '<br />')

                      // Wrap en párrafo
                      .replace(/^(.)/gm, '<p>$1')
                      .replace(/$/gm, '</p>'),
                  }}
                />
              </div>
            </section>
          )}

          {/* Información adicional */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-rs-muted">
            <span className="inline-flex items-center gap-2">
              <LuCalendar className="size-4 text-rs-700" aria-hidden="true" />
              Última actualización: {new Date(course.updatedAt).toLocaleDateString("es-ES")}
            </span>
            <span>ID: {course._id}</span>
          </div>
        </div>
      </main>

      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Modal lista de contenidos generados */}
      {showGeneratedContentListModal && (
        <Modal
          size="md"
          title={`Contenidos generados · ${course?.name}`}
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

      {/* Modal de subir material */}
      {courseId && (
        <UploadMaterialModal
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          onSuccess={handleUploadSuccess}
          courseId={courseId}
        />
      )}

      {/* Modal: lista general de materiales */}
      {showMaterialsListModal && (
        <Modal
          title="Lista de materiales"
          onClose={() => setShowMaterialsListModal(false)}
          footer={
            <button type="button" onClick={() => setShowMaterialsListModal(false)} className="rs-btn-secondary ml-auto">
              Cerrar
            </button>
          }
        >
          {renderMaterialsBody("No hay materiales disponibles para este curso.")}
        </Modal>
      )}

      {/* Modal: seleccionar material para descargar */}
      {showDownloadMaterialModal && (
        <Modal
          title="Seleccionar material para descargar"
          onClose={() => setShowDownloadMaterialModal(false)}
          footer={
            <button type="button" onClick={() => setShowDownloadMaterialModal(false)} className="rs-btn-ghost ml-auto">
              Cancelar
            </button>
          }
        >
          {renderMaterialsBody("No hay materiales disponibles para descargar.", (material, index) => ({
            icon: <LuDownload className="size-5" aria-label="Descargar" />,
            onClick: () => handleDownloadMaterial(materialId(material), material.filename || material.originalName || `Material-${index + 1}`),
          }))}
        </Modal>
      )}

      {/* Modal: confirmar eliminación de estudiante */}
      {showRemoveStudentModal && studentToRemove && (
        <Modal
          size="md"
          title="Eliminar estudiante"
          closeDisabled={removingStudent}
          onClose={() => {
            setShowRemoveStudentModal(false);
            setStudentToRemove(null);
          }}
          footer={
            <>
              <button
                type="button"
                onClick={() => {
                  setShowRemoveStudentModal(false);
                  setStudentToRemove(null);
                }}
                disabled={removingStudent}
                className="rs-btn-ghost"
              >
                Cancelar
              </button>
              <button type="button" onClick={handleRemoveStudent} disabled={removingStudent} className="rs-btn-danger">
                {removingStudent ? (
                  <LuLoaderCircle className="size-4 animate-spin" aria-hidden="true" />
                ) : (
                  <LuUserMinus className="size-4" aria-hidden="true" />
                )}
                {removingStudent ? "Eliminando..." : "Eliminar"}
              </button>
            </>
          }
        >
          <p className="mb-4 text-rs-ink">¿Estás seguro de que deseas eliminar a este estudiante del curso?</p>
          <div className="flex items-center gap-3 rounded-xl border border-rs-error/30 bg-white p-4">
            <span className="grid size-12 shrink-0 place-items-center rounded-full bg-rs-200 text-lg font-semibold text-rs-900">
              {studentToRemove.name.charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0">
              <p className="truncate font-medium text-rs-ink">{studentToRemove.name}</p>
              <p className="truncate text-sm text-rs-muted">{studentToRemove.email}</p>
            </div>
          </div>
          <p className="mt-4 flex items-start gap-2 rounded-lg bg-rs-warn-bg px-3 py-2 text-sm text-rs-warn">
            <LuCircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            Esta acción eliminará al estudiante del curso pero no eliminará su cuenta.
          </p>
        </Modal>
      )}

      {/* Modal: agregar estudiantes */}
      {showAddStudentsModal && (
        <Modal
          title="Agregar estudiantes al curso"
          closeDisabled={addingStudents}
          onClose={() => {
            setShowAddStudentsModal(false);
            setSelectedStudents([]);
            setAvailableStudents([]);
          }}
          footer={
            <>
              <button
                type="button"
                onClick={() => {
                  setShowAddStudentsModal(false);
                  setSelectedStudents([]);
                  setAvailableStudents([]);
                }}
                disabled={addingStudents}
                className="rs-btn-ghost"
              >
                {availableStudents.length > 0 ? "Cancelar" : "Cerrar"}
              </button>
              {availableStudents.length > 0 && (
                <button
                  type="button"
                  onClick={handleAddStudents}
                  disabled={addingStudents || selectedStudents.length === 0}
                  className="rs-btn-primary"
                >
                  {addingStudents ? (
                    <LuLoaderCircle className="size-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <LuUserPlus className="size-4" aria-hidden="true" />
                  )}
                  {addingStudents
                    ? "Agregando..."
                    : `Agregar ${selectedStudents.length > 0 ? `(${selectedStudents.length})` : ""}`}
                </button>
              )}
            </>
          }
        >
          {loadingStudents ? (
            <div className="flex justify-center py-8">
              <LuLoaderCircle className="size-10 animate-spin text-rs-700" aria-hidden="true" />
            </div>
          ) : availableStudents.length > 0 ? (
            <>
              <p className="mb-4 rounded-lg bg-rs-100 px-3 py-2 text-sm text-rs-900">
                Selecciona los estudiantes que deseas agregar al curso.
                <span className="ml-2 font-semibold text-rs-700">{selectedStudents.length} seleccionado(s)</span>
              </p>
              <ul className="space-y-2">
                {availableStudents.map((student) => {
                  const checked = selectedStudents.includes(student._id);
                  return (
                    <li key={student._id}>
                      <label
                        className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 p-3 transition-colors ${
                          checked ? "border-rs-700 bg-rs-100" : "border-rs-line bg-white hover:border-rs-400"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => handleToggleStudent(student._id)}
                          className="size-5 cursor-pointer accent-rs-700"
                        />
                        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-rs-200 font-semibold text-rs-900">
                          {student.name.charAt(0).toUpperCase()}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-medium text-rs-ink">{student.name}</span>
                          <span className="block truncate text-sm text-rs-muted">{student.email}</span>
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </>
          ) : (
            <div className="py-8 text-center">
              <p className="mb-2 text-rs-ink">No hay estudiantes disponibles para agregar a este curso.</p>
              <p className="text-sm text-rs-muted">
                Todos los estudiantes ya están inscritos o no hay estudiantes registrados en el sistema.
              </p>
            </div>
          )}
        </Modal>
      )}

      {/* Modal: seleccionar material para exportar a PDF */}
      {showExportMaterialModal && (
        <Modal
          title="Seleccionar material para exportar a PDF"
          onClose={() => setShowExportMaterialModal(false)}
          footer={
            <button type="button" onClick={() => setShowExportMaterialModal(false)} className="rs-btn-ghost ml-auto">
              Cancelar
            </button>
          }
        >
          {renderMaterialsBody("No hay materiales disponibles para exportar.", (material, index) => ({
            icon: <LuFileDown className="size-5" aria-label="Exportar a PDF" />,
            onClick: () => handleExportToPdf(materialId(material), material.filename || material.originalName || `Material-${index + 1}`),
          }))}
        </Modal>
      )}

      {/* Modal de editar curso */}
      {courseId && (
        <EditCourseModal
          isOpen={showEditCourseModal}
          onClose={() => setShowEditCourseModal(false)}
          onSuccess={async () => {
            setToast({ message: "Curso actualizado exitosamente", type: "success" });
            // Recargar el curso para mostrar los cambios
            if (courseId) {
              const updatedCourse = await getCourseById(courseId);
              setCourse(updatedCourse);
            }
          }}
          courseId={courseId}
        />
      )}
    </div>
  );
}

export default function CourseViewPage() {
  return (
    <Suspense fallback={<LoadingScreen label="Cargando curso..." />}>
      <CourseViewPageContent />
    </Suspense>
  );
}
