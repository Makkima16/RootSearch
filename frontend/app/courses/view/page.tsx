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
import { FaBook, FaUser, FaCalendar, FaFileAlt, FaArrowLeft, FaDownload, FaFilePdf, FaUpload, FaUserPlus, FaUserMinus, FaTimes } from 'react-icons/fa';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';

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
            h1 { color: #6356E5; border-bottom: 3px solid #6356E5; padding-bottom: 10px; }
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
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#040418] text-white">
        <div className="text-center">
          <AiOutlineLoading3Quarters className="animate-spin text-4xl text-[#6356E5] mx-auto mb-4" />
          <span className="text-lg">Cargando curso...</span>
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#040418] text-white">
        <div className="text-center">
          <h1 className="text-2xl font-semibold mb-2">⚠️ Error</h1>
          <p className="text-zinc-300 mb-4">{error || "No se pudo cargar el curso"}</p>
          <a
            href="/courses/list"
            className="inline-block bg-[#6356E5] hover:bg-[#4f48c7] text-white px-6 py-3 rounded-lg transition font-semibold cursor-pointer"
          >
            Volver a la lista
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#040418] text-white font-sans">
      <SideBar user={user ?? undefined} />
      
      <main className="flex-1 p-6 md:p-8">
        {/* Header con botón de volver */}
        <div className="mb-6">
          <button
            onClick={() => window.location.href = '/courses/list'}
            className="flex items-center gap-2 text-zinc-400 hover:text-white transition mb-4 cursor-pointer"
          >
            <FaArrowLeft />
            <span>Volver a la lista</span>
          </button>
          
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 bg-[#6356E5] text-white rounded-full flex items-center justify-center text-2xl font-bold">
              {course.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl md:text-4xl font-bold">
                  {course.name}
                </h1>
                {(user?.role.toLowerCase() === "docente" || user?.role.toLowerCase() === "administrador") && (
                  <button
                    onClick={() => setShowEditCourseModal(true)}
                    className="bg-[#ffc107] hover:bg-[#e0a800] text-black px-4 py-2 rounded-lg transition font-semibold cursor-pointer flex items-center gap-2 text-sm"
                    title="Editar curso"
                  >
                    <span className=" sm:inline">Editar</span>
                  </button>
                )}
              </div>
              <p className="text-zinc-400 text-sm mt-1">
                Creado el {new Date(course.createdAt).toLocaleDateString('es-ES', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Grid de información */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Descripción */}
          <div className="bg-[#101434] p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <FaFileAlt className="text-[#6356E5]" />
              Descripción
            </h2>
            <p className="text-zinc-300 leading-relaxed">{course.description}</p>
          </div>

          {/* Profesor */}
          <div className="bg-[#101434] p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <FaUser className="text-[#6356E5]" />
              Profesor
            </h2>
            <div className="space-y-2">
              <p className="text-white font-medium text-lg">{course.teacher.name}</p>
              <p className="text-zinc-400 text-sm">{course.teacher.email}</p>
            </div>
          </div>
        </div>

        {/* PIAA Syllabus */}
        {course.piaa_syllabus && (
          <div className="bg-[#101434] p-6 rounded-lg shadow-lg mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <FaBook className="text-[#6356E5]" />
                PIAA - Programa de la Asignatura
              </h2>
              <button
                onClick={handleExportPiaaToPdf}
                className="bg-[#dc3545] hover:bg-[#c82333] text-white px-4 py-2 rounded-lg transition font-semibold cursor-pointer flex items-center gap-2 text-sm"
                title="Exportar PIAA a PDF"
              >
                <FaFilePdf />
                <span className="hidden sm:inline">Exportar PDF</span>
              </button>
            </div>
            <div className="bg-[#1a1a2e] p-6 rounded-lg">
              <div 
                className="text-zinc-300 leading-relaxed"
                style={{
                  fontSize: '0.95rem',
                  lineHeight: '1.8'
                }}
                dangerouslySetInnerHTML={{
                  __html: course.piaa_syllabus
                    // Títulos principales (sin bullets, en mayúsculas o frases interrogativas)
                    .replace(/^([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ\s]+)$/gm, '<h2 style="color: #6356E5; font-size: 1.3rem; font-weight: bold; margin-top: 2rem; margin-bottom: 1rem; border-bottom: 2px solid #6356E5; padding-bottom: 0.5rem;">$1</h2>')
                    .replace(/^(¿[^?]+\?)$/gm, '<h3 style="color: #6356E5; font-size: 1.2rem; font-weight: bold; margin-top: 1.5rem; margin-bottom: 0.8rem;">$1</h3>')
                    
                    // Subtítulos (comienzan con mayúscula y terminan con :)
                    .replace(/^([A-Z][^:]+:)$/gm, '<h4 style="color: #8b7ff5; font-size: 1.05rem; font-weight: 600; margin-top: 1.2rem; margin-bottom: 0.5rem;">$1</h4>')
                    
                    // Items con bullets (•) - mantener como están
                    .replace(/^•(.+)$/gm, '<div style="display: flex; margin-left: 1.5rem; margin-bottom: 0.4rem;"><span style="color: #6356E5; margin-right: 0.5rem;">•</span><span>$1</span></div>')
                    
                    // Items con números (R1., R2., etc) - destacar
                    .replace(/^•?(R\d+\.)(.+)$/gm, '<div style="display: flex; margin-left: 1.5rem; margin-bottom: 0.5rem;"><span style="color: #28a745; font-weight: bold; margin-right: 0.5rem;">$1</span><span>$2</span></div>')
                    
                    // Objetivos específicos como subtítulo especial
                    .replace(/(Objetivos específicos)/g, '<p style="color: #ffc107; font-weight: bold; margin-top: 1rem; margin-bottom: 0.5rem; font-size: 1rem;">$1</p>')
                    
                    // Información del profesor
                    .replace(/^([A-Z][a-z]+.*\d{4})$/gm, '<p style="color: #8b7ff5; font-style: italic; margin-bottom: 0.3rem;">$1</p>')
                    .replace(/([a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,})/gi, '<a href="mailto:$1" style="color: #6356E5; text-decoration: underline;">$1</a>')
                    
                    // Porcentajes de evaluación - destacar
                    .replace(/^•([^:]+:\s*\d+\s*%)$/gm, '<div style="display: flex; justify-content: space-between; margin-left: 1.5rem; margin-bottom: 0.3rem; padding: 0.3rem; background: rgba(99, 86, 229, 0.1); border-radius: 4px;"><span>$1</span></div>')
                    
                    // Notas importantes (entre paréntesis o con "Tener en cuenta")
                    .replace(/(Tener en cuenta:?|Nota:?)/gi, '<strong style="color: #ffc107; display: block; margin-top: 1rem;">⚠️ $1</strong>')
                    
                    // Saltos de línea dobles para párrafos
                    .replace(/\n\n+/g, '</p><p style="margin-top: 0.8rem;">')
                    // Saltos de línea simples
                    .replace(/\n/g, '<br />')
                    
                    // Wrap en párrafo
                    .replace(/^(.)/gm, '<p>$1')
                    .replace(/$/gm, '</p>')
                }}
              />
            </div>
          </div>
        )}

        {/* Botones de acción (solo para docentes) */}
        {user?.role.toLowerCase() === "docente" && (
          <div className="bg-[#101434] p-6 rounded-lg shadow-lg mb-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <FaFileAlt className="text-[#6356E5]" />
              Acciones del Docente
            </h2>
            <div className="flex gap-3 flex-wrap">
              <button
                onClick={handleGenerateWithAI}
                className="bg-[#28a745] hover:bg-[#218838] text-white px-4 py-2 sm:px-6 sm:py-3 rounded-lg transition font-semibold cursor-pointer flex items-center gap-2 text-sm sm:text-base"
              >
                <span>🤖</span> 
                <span className="hidden sm:inline">Generar Material con IA</span>
                <span className="sm:hidden">IA Audio</span>
              </button>
              <button
                onClick={() => setShowUploadModal(true)}
                className="bg-[#6356E5] hover:bg-[#4f48c7] text-white px-4 py-2 sm:px-6 sm:py-3 rounded-lg transition font-semibold cursor-pointer flex items-center gap-2 text-sm sm:text-base"
              >
                <FaUpload />
                <span className="hidden sm:inline">Subir Materiales (PDF)</span>
                <span className="sm:hidden">Subir PDF</span>
              </button>
              <button
                onClick={handleDownloadMaterialClick}
                className="bg-[#17a2b8] hover:bg-[#138496] text-white px-4 py-2 sm:px-6 sm:py-3 rounded-lg transition font-semibold cursor-pointer flex items-center gap-2 text-sm sm:text-base"
              >
                <FaDownload />
                <span className="hidden sm:inline">Descargar Material</span>
                <span className="sm:hidden">Descargar</span>
              </button>
              <button
                onClick={handleExportToPdfClick}
                className="bg-[#dc3545] hover:bg-[#c82333] text-white px-4 py-2 sm:px-6 sm:py-3 rounded-lg transition font-semibold cursor-pointer flex items-center gap-2 text-sm sm:text-base"
              >
                <FaFilePdf />
                <span className="hidden sm:inline">Exportar a PDF</span>
                <span className="sm:hidden">Exportar</span>
              </button>
            </div>
          </div>
        )}

        {/* Materiales Generados (visible para todos) */}
        <div className="bg-[#101434] p-6 rounded-lg shadow-lg mb-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <FaBook className="text-[#6356E5]" />
            Materiales Generados
          </h2>
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={handleShowGeneratedContent}
              disabled={loadingGeneratedContent}
              className="bg-[#fd7e14] hover:bg-[#e06c00] disabled:bg-[#999] disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg transition font-semibold cursor-pointer"
            >
              {loadingGeneratedContent ? (
                <span className="flex items-center justify-center gap-2">
                  <AiOutlineLoading3Quarters className="animate-spin" />
                  Cargando...
                </span>
              ) : (
                'Ver Contenido Generado'
              )}
            </button>
            <button
              onClick={handleShowMaterialsList}
              disabled={loadingMaterials}
              className="bg-[#28a745] hover:bg-[#218838] disabled:bg-[#999] disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg transition font-semibold cursor-pointer flex items-center gap-2"
            >
              {loadingMaterials ? (
                <>
                  <AiOutlineLoading3Quarters className="animate-spin" />
                  <span>Cargando...</span>
                </>
              ) : (
                <>
                  <FaFileAlt />
                  <span>Lista de Materiales</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Lista de Estudiantes */}
        <div className="bg-[#101434] p-6 rounded-lg shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <FaUser className="text-[#6356E5]" />
              Estudiantes Inscritos
              <span className="ml-2 bg-[#6356E5] text-white text-sm px-3 py-1 rounded-full">
                {course.students.length}
              </span>
            </h2>
            
            {/* Botón para agregar estudiantes (solo docentes y administradores) */}
            {(user?.role.toLowerCase() === "docente" || user?.role.toLowerCase() === "administrador") && (
              <button
                onClick={handleOpenAddStudentsModal}
                className="bg-[#6356E5] hover:bg-[#4f48c7] text-white px-4 py-2 rounded-lg transition font-semibold cursor-pointer flex items-center gap-2"
              >
                <FaUserPlus />
                <span>Agregar Estudiantes</span>
              </button>
            )}
          </div>
          
          {course.students.length === 0 ? (
            <p className="text-zinc-400 text-center py-6">
              No hay estudiantes inscritos en este curso.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {course.students.map((student) => (
                <div
                  key={student._id}
                  className="bg-[#1a1a2e] p-4 rounded-lg hover:bg-[#2a2a3a] transition group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#6356E5] text-white rounded-full flex items-center justify-center font-semibold">
                      {student.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-medium">{student.name}</p>
                      <p className="text-zinc-400 text-sm">{student.email}</p>
                    </div>
                    {(user?.role.toLowerCase() === "docente" || user?.role.toLowerCase() === "administrador") && (
                      <button
                        onClick={() => handleOpenRemoveStudentModal(student)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg cursor-pointer"
                        title="Eliminar estudiante del curso"
                      >
                        <FaTimes />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Información adicional */}
        <div className="mt-6 bg-[#101434] p-4 rounded-lg shadow-lg">
          <div className="flex items-center justify-between text-sm text-zinc-400">
            <div className="flex items-center gap-2">
              <FaCalendar className="text-[#6356E5]" />
              <span>Última actualización: {new Date(course.updatedAt).toLocaleDateString('es-ES')}</span>
            </div>
            <div>
              <span>ID: {course._id}</span>
            </div>
          </div>
        </div>
      </main>

      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Modal Lista de Contenidos Generados */}
      {showGeneratedContentListModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#101434] rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-auto">
            <div className="sticky top-0 bg-[#0f0f2e] border-b border-[#2a2a4a] px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">Contenidos Generados - {course?.name}</h2>
              <button
                onClick={() => {
                  setShowGeneratedContentListModal(false);
                  setGeneratedContentsList([]);
                }}
                className="text-white/60 hover:text-white text-2xl transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6">
              {generatedContentsList.length > 0 ? (
                <div className="space-y-3">
                  {generatedContentsList.map((content: any, index: number) => (
                    <div
                      key={content._id}
                      onClick={() => handleSelectGeneratedContent(content, index)}
                      className="bg-[#0a0a1f] rounded-lg px-4 py-4 border border-[#2a2a4a] hover:border-[#6356E5] cursor-pointer transition flex items-center justify-between group"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="bg-[#6356E5] text-white font-bold px-3 py-1 rounded-full text-sm">
                            #{index + 1}
                          </span>
                          <span className={`text-sm font-semibold px-3 py-1 rounded-full ${
                            content.estado === 'PUBLICADO'
                              ? 'bg-[#28a745] text-white'
                              : content.estado === 'PENDIENTE_REVISION'
                              ? 'bg-[#ffc107] text-black'
                              : 'bg-[#6c757d] text-white'
                          }`}>
                            {content.estado}
                          </span>
                        </div>
                        <p className="text-white/80 text-sm">
                          Generado: {new Date(content.createdAt).toLocaleDateString('es-ES', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                        <div className="flex gap-4 mt-2 text-sm text-white/60">
                          <span>📝 Resumen: {content.resumen ? '✓' : '✗'}</span>
                          <span>📚 Glosario: {content.glosario?.length || 0}</span>
                          <span>❓ Quiz: {content.quiz?.length || 0}</span>
                          <span>✓ Checklist: {content.checklist?.length || 0}</span>
                        </div>
                      </div>
                      <div className="text-[#6356E5] group-hover:translate-x-1 transition">
                        →
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-white/60 text-center py-8">
                  No hay contenido por este momento
                </div>
              )}
            </div>

            <div className="bg-[#0f0f2e] border-t border-[#2a2a4a] px-6 py-4 flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowGeneratedContentListModal(false);
                  setGeneratedContentsList([]);
                }}
                className="bg-[#35448e] hover:bg-[#2a3670] text-white px-4 py-2 rounded-lg transition font-medium cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Contenido Generado */}
      {showGeneratedContentModal && selectedGeneratedContent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#101434] rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
            <div className="sticky top-0 bg-[#0f0f2e] border-b border-[#2a2a4a] px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="bg-[#6356E5] text-white font-bold px-3 py-1 rounded-full text-sm">
                  #{selectedGeneratedContent.index}
                </span>
                <h2 className="text-xl font-semibold text-white">{selectedGeneratedContent.name}</h2>
              </div>
              <button
                onClick={() => {
                  setShowGeneratedContentModal(false);
                  setSelectedGeneratedContent(null);
                }}
                className="text-white/60 hover:text-white text-2xl transition cursor-pointer"
              >
                ✕
              </button>
            </div>
            
            {/* Tabs */}
            <div className="sticky top-0 bg-[#0f0f2e] border-b border-[#2a2a4a] px-6 flex gap-2 overflow-x-auto">
              <button
                onClick={() => setSelectedTab("resumen")}
                className={`px-4 py-3 font-medium transition border-b-2 whitespace-nowrap ${
                  selectedTab === "resumen"
                    ? "border-[#6356E5] text-[#6356E5]"
                    : "border-transparent text-white/60 hover:text-white"
                }`}
              >
                Resumen
              </button>
              <button
                onClick={() => setSelectedTab("glosario")}
                className={`px-4 py-3 font-medium transition border-b-2 whitespace-nowrap ${
                  selectedTab === "glosario"
                    ? "border-[#6356E5] text-[#6356E5]"
                    : "border-transparent text-white/60 hover:text-white"
                }`}
              >
                Glosario ({selectedGeneratedContent.glosario.length})
              </button>
              <button
                onClick={() => setSelectedTab("quiz")}
                className={`px-4 py-3 font-medium transition border-b-2 whitespace-nowrap ${
                  selectedTab === "quiz"
                    ? "border-[#6356E5] text-[#6356E5]"
                    : "border-transparent text-white/60 hover:text-white"
                }`}
              >
                Quiz ({selectedGeneratedContent.quiz.length})
              </button>
              <button
                onClick={() => setSelectedTab("checklist")}
                className={`px-4 py-3 font-medium transition border-b-2 whitespace-nowrap ${
                  selectedTab === "checklist"
                    ? "border-[#6356E5] text-[#6356E5]"
                    : "border-transparent text-white/60 hover:text-white"
                }`}
              >
                Checklist ({selectedGeneratedContent.checklist.length})
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {selectedTab === "resumen" && (
                <div className="text-white whitespace-pre-wrap break-words bg-[#0a0a1f] rounded px-4 py-3 border border-[#2a2a4a]">
                  {selectedGeneratedContent.resumen}
                </div>
              )}
              
              {selectedTab === "glosario" && (
                <div>
                  {selectedGeneratedContent.glosario.length > 0 ? (
                    <div className="space-y-3">
                      {selectedGeneratedContent.glosario.map((item: any, index: number) => (
                        <div key={index} className="bg-[#0a0a1f] rounded px-4 py-3 border border-[#2a2a4a]">
                          <p className="text-white font-semibold">{item.term || item.termino || `Término ${index + 1}`}</p>
                          <p className="text-white/80 text-sm mt-1">{item.definition || item.definicion || item.description || "Sin definición"}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-white/60 text-center py-8">No hay elementos en el glosario</div>
                  )}
                </div>
              )}
              
              {selectedTab === "quiz" && (
                <div>
                  {selectedGeneratedContent.quiz.length > 0 ? (
                    <div className="space-y-4">
                      {selectedGeneratedContent.quiz.map((item: any, index: number) => (
                        <div key={index} className="bg-[#0a0a1f] rounded px-4 py-3 border border-[#2a2a4a]">
                          <p className="text-white font-semibold mb-2">{index + 1}. {item.pregunta || item.question || `Pregunta ${index + 1}`}</p>
                          {item.opciones && Array.isArray(item.opciones) && (
                            <div className="space-y-2 ml-4">
                              {item.opciones.map((opcion: string, optIndex: number) => (
                                <div key={optIndex} className="text-white/80 text-sm">
                                  <span className="text-[#6356E5]">{"ABCD"[optIndex]}</span> - {opcion}
                                </div>
                              ))}
                            </div>
                          )}
                          {item.respuesta && (
                            <p className="text-[#28a745] text-sm mt-2">Respuesta: {item.respuesta}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-white/60 text-center py-8">No hay preguntas en el quiz</div>
                  )}
                </div>
              )}
              
              {selectedTab === "checklist" && (
                <div>
                  {selectedGeneratedContent.checklist.length > 0 ? (
                    <div className="space-y-2">
                      {selectedGeneratedContent.checklist.map((item: any, index: number) => (
                        <div key={index} className="bg-[#0a0a1f] rounded px-4 py-3 border border-[#2a2a4a] flex items-start gap-3">
                          <input
                            type="checkbox"
                            disabled
                            defaultChecked={item.completado || item.completed || false}
                            className="mt-1 cursor-not-allowed"
                          />
                          <div>
                            <p className="text-white">{item.tarea || item.item || `Tarea ${index + 1}`}</p>
                            {item.descripcion && (
                              <p className="text-white/60 text-sm">{item.descripcion}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-white/60 text-center py-8">No hay elementos en el checklist</div>
                  )}
                </div>
              )}
            </div>

            <div className="bg-[#0f0f2e] border-t border-[#2a2a4a] px-6 py-4 flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowGeneratedContentModal(false);
                  setSelectedGeneratedContent(null);
                }}
                className="bg-[#35448e] hover:bg-[#2a3670] text-white px-4 py-2 rounded-lg transition font-medium cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Subir Material */}
      {courseId && (
        <UploadMaterialModal
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          onSuccess={handleUploadSuccess}
          courseId={courseId}
        />
      )}

      {/* Modal: Lista General de Materiales */}
      {showMaterialsListModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#101434] p-6 rounded-lg shadow-xl max-w-3xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <FaFileAlt className="text-[#6356E5]" />
                Lista de Materiales
              </h2>
              <button
                onClick={() => setShowMaterialsListModal(false)}
                className="text-white/60 hover:text-white text-2xl transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {loadingMaterials ? (
              <div className="flex justify-center py-8">
                <AiOutlineLoading3Quarters className="animate-spin text-4xl text-[#6356E5]" />
              </div>
            ) : materialsForCourse.length > 0 ? (
              <div className="space-y-3">
                {materialsForCourse.map((material, index) => {
                  const materialId = material._id?.toString() || material._id || String(material._id) || material.id;
                  return (
                  <div
                    key={materialId || `material-${index}`}
                    className="bg-[#1a1a2e] p-4 rounded-lg border border-[#333] hover:border-[#6356E5] transition"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <span className="bg-[#6356E5] text-white font-bold px-3 py-1 rounded-full text-sm">
                            #{index + 1}
                          </span>
                          <span className={`text-sm font-semibold px-3 py-1 rounded-full ${
                            material.status === 'READY'
                              ? 'bg-[#28a745] text-white'
                              : material.status === 'PENDING'
                              ? 'bg-[#ffc107] text-black'
                              : 'bg-[#6c757d] text-white'
                          }`}>
                            {material.status || 'N/A'}
                          </span>
                          <span className="text-xs bg-[#1a1a3e] text-white/70 px-2 py-1 rounded">
                            {material.type || 'PDF'}
                          </span>
                        </div>
                        <p className="text-white font-medium text-base mb-2">
                          📄 {material.filename || material.originalName || `Material ${index + 1}`}
                        </p>
                        {material.description && (
                          <p className="text-white/70 text-sm mb-2">
                            {material.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-white/60">
                          <span>📦 Tamaño: {material.size ? `${(material.size / 1024).toFixed(2)} KB` : 'N/A'}</span>
                          <span>☁️ {material.storageProvider || 'N/A'}</span>
                          <span>📅 {new Date(material.createdAt).toLocaleDateString('es-ES')}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-zinc-400 text-center py-8">
                No hay materiales disponibles para este curso.
              </p>
            )}

            <button
              onClick={() => setShowMaterialsListModal(false)}
              className="mt-6 bg-[#6356E5] hover:bg-[#4f48c7] text-white px-6 py-2 rounded-lg transition font-semibold cursor-pointer w-full"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* Modal: Seleccionar Material para Descargar */}
      {showDownloadMaterialModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#101434] p-6 rounded-lg shadow-xl max-w-3xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <FaDownload className="text-[#17a2b8]" />
                Seleccionar Material para Descargar
              </h2>
              <button
                onClick={() => setShowDownloadMaterialModal(false)}
                className="text-white/60 hover:text-white text-2xl transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {loadingMaterials ? (
              <div className="flex justify-center py-8">
                <AiOutlineLoading3Quarters className="animate-spin text-4xl text-[#6356E5]" />
              </div>
            ) : materialsForCourse.length > 0 ? (
              <div className="space-y-3">
                {materialsForCourse.map((material, index) => {
                  // Intentar obtener el _id de diferentes maneras (Mongoose puede tenerlo como getter)
                  const materialId = material._id?.toString() || material._id || String(material._id) || material.id;
                  console.log('Material en descarga:', { 
                    id: materialId, 
                    _id: material._id,
                    _idType: typeof material._id,
                    keys: Object.keys(material),
                    material 
                  });
                  return (
                  <div
                    key={materialId || `download-material-${index}`}
                    onClick={() => {
                      console.log('Click en material:', materialId);
                      handleDownloadMaterial(materialId, material.filename || material.originalName || `Material-${index + 1}`);
                    }}
                    className="bg-[#1a1a2e] p-4 rounded-lg border border-[#333] hover:border-[#17a2b8] transition cursor-pointer group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <span className="bg-[#6356E5] text-white font-bold px-3 py-1 rounded-full text-sm">
                            #{index + 1}
                          </span>
                          <span className={`text-sm font-semibold px-3 py-1 rounded-full ${
                            material.status === 'READY'
                              ? 'bg-[#28a745] text-white'
                              : material.status === 'PENDING'
                              ? 'bg-[#ffc107] text-black'
                              : 'bg-[#6c757d] text-white'
                          }`}>
                            {material.status || 'N/A'}
                          </span>
                          <span className="text-xs bg-[#1a1a3e] text-white/70 px-2 py-1 rounded">
                            {material.type || 'PDF'}
                          </span>
                        </div>
                        <p className="text-white font-medium text-base mb-2">
                          📄 {material.filename || material.originalName || `Material ${index + 1}`}
                        </p>
                        {material.description && (
                          <p className="text-white/70 text-sm mb-2">
                            {material.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-white/60">
                          <span>📦 {material.size ? `${(material.size / 1024).toFixed(2)} KB` : 'N/A'}</span>
                          <span>☁️ {material.storageProvider || 'N/A'}</span>
                        </div>
                      </div>
                      <FaDownload className="text-[#17a2b8] text-xl group-hover:scale-110 transition" />
                    </div>
                  </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-zinc-400 text-center py-8">
                No hay materiales disponibles para descargar.
              </p>
            )}

            <button
              onClick={() => setShowDownloadMaterialModal(false)}
              className="mt-6 bg-zinc-700 hover:bg-zinc-600 text-white px-6 py-2 rounded-lg transition font-semibold cursor-pointer w-full"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Modal: Confirmar Eliminación de Estudiante */}
      {showRemoveStudentModal && studentToRemove && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#101434] p-6 rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <FaUserMinus className="text-red-500" />
                Eliminar Estudiante
              </h2>
              <button
                onClick={() => {
                  setShowRemoveStudentModal(false);
                  setStudentToRemove(null);
                }}
                disabled={removingStudent}
                className="text-white/60 hover:text-white text-2xl transition cursor-pointer disabled:opacity-50"
              >
                ✕
              </button>
            </div>

            <div className="mb-6">
              <p className="text-white/80 mb-4">
                ¿Estás seguro de que deseas eliminar a este estudiante del curso?
              </p>
              <div className="bg-[#1a1a2e] p-4 rounded-lg border border-red-500/30">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-[#6356E5] text-white rounded-full flex items-center justify-center font-semibold text-lg">
                    {studentToRemove.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-white font-medium">{studentToRemove.name}</p>
                    <p className="text-white/60 text-sm">{studentToRemove.email}</p>
                  </div>
                </div>
              </div>
              <p className="text-yellow-400 text-sm mt-4">
                ⚠️ Esta acción eliminará al estudiante del curso pero no eliminará su cuenta.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleRemoveStudent}
                disabled={removingStudent}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-zinc-700 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg transition font-semibold cursor-pointer flex items-center justify-center gap-2"
              >
                {removingStudent ? (
                  <>
                    <AiOutlineLoading3Quarters className="animate-spin" />
                    <span>Eliminando...</span>
                  </>
                ) : (
                  <>
                    <FaUserMinus />
                    <span>Eliminar</span>
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  setShowRemoveStudentModal(false);
                  setStudentToRemove(null);
                }}
                disabled={removingStudent}
                className="bg-zinc-700 hover:bg-zinc-600 disabled:opacity-50 text-white px-6 py-3 rounded-lg transition font-semibold cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Agregar Estudiantes */}
      {showAddStudentsModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#101434] p-6 rounded-lg shadow-xl max-w-3xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <FaUserPlus className="text-[#6356E5]" />
                Agregar Estudiantes al Curso
              </h2>
              <button
                onClick={() => {
                  setShowAddStudentsModal(false);
                  setSelectedStudents([]);
                  setAvailableStudents([]);
                }}
                className="text-white/60 hover:text-white text-2xl transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {loadingStudents ? (
              <div className="flex justify-center py-8">
                <AiOutlineLoading3Quarters className="animate-spin text-4xl text-[#6356E5]" />
              </div>
            ) : availableStudents.length > 0 ? (
              <>
                <div className="mb-4 p-3 bg-[#1a1a2e] rounded-lg">
                  <p className="text-white/80 text-sm">
                    Selecciona los estudiantes que deseas agregar al curso.
                    <span className="ml-2 text-[#6356E5] font-semibold">
                      {selectedStudents.length} seleccionado(s)
                    </span>
                  </p>
                </div>

                <div className="space-y-2 mb-4">
                  {availableStudents.map((student) => (
                    <div
                      key={student._id}
                      onClick={() => handleToggleStudent(student._id)}
                      className={`p-4 rounded-lg border-2 transition cursor-pointer ${
                        selectedStudents.includes(student._id)
                          ? 'border-[#6356E5] bg-[#6356E5]/10'
                          : 'border-[#333] bg-[#1a1a2e] hover:border-[#6356E5]/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={selectedStudents.includes(student._id)}
                          onChange={() => {}}
                          className="w-5 h-5 cursor-pointer accent-[#6356E5]"
                        />
                        <div className="w-10 h-10 bg-[#6356E5] text-white rounded-full flex items-center justify-center font-semibold">
                          {student.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <p className="text-white font-medium">{student.name}</p>
                          <p className="text-white/60 text-sm">{student.email}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleAddStudents}
                    disabled={addingStudents || selectedStudents.length === 0}
                    className="flex-1 bg-[#6356E5] hover:bg-[#4f48c7] disabled:bg-zinc-700 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg transition font-semibold cursor-pointer flex items-center justify-center gap-2"
                  >
                    {addingStudents ? (
                      <>
                        <AiOutlineLoading3Quarters className="animate-spin" />
                        <span>Agregando...</span>
                      </>
                    ) : (
                      <>
                        <FaUserPlus />
                        <span>Agregar {selectedStudents.length > 0 ? `(${selectedStudents.length})` : ''}</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setShowAddStudentsModal(false);
                      setSelectedStudents([]);
                      setAvailableStudents([]);
                    }}
                    disabled={addingStudents}
                    className="bg-zinc-700 hover:bg-zinc-600 disabled:opacity-50 text-white px-6 py-3 rounded-lg transition font-semibold cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-zinc-400 mb-4">
                  No hay estudiantes disponibles para agregar a este curso.
                </p>
                <p className="text-zinc-500 text-sm">
                  Todos los estudiantes ya están inscritos o no hay estudiantes registrados en el sistema.
                </p>
                <button
                  onClick={() => {
                    setShowAddStudentsModal(false);
                    setSelectedStudents([]);
                    setAvailableStudents([]);
                  }}
                  className="mt-4 bg-zinc-700 hover:bg-zinc-600 text-white px-6 py-2 rounded-lg transition font-semibold cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: Seleccionar Material para Exportar a PDF */}
      {showExportMaterialModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#101434] p-6 rounded-lg shadow-xl max-w-3xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <FaFilePdf className="text-[#dc3545]" />
                Seleccionar Material para Exportar a PDF
              </h2>
              <button
                onClick={() => setShowExportMaterialModal(false)}
                className="text-white/60 hover:text-white text-2xl transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {loadingMaterials ? (
              <div className="flex justify-center py-8">
                <AiOutlineLoading3Quarters className="animate-spin text-4xl text-[#6356E5]" />
              </div>
            ) : materialsForCourse.length > 0 ? (
              <div className="space-y-3">
                {materialsForCourse.map((material, index) => {
                  // Intentar obtener el _id de diferentes maneras (Mongoose puede tenerlo como getter)
                  const materialId = material._id?.toString() || material._id || String(material._id) || material.id;
                  console.log('Material en exportar:', { 
                    id: materialId, 
                    _id: material._id,
                    _idType: typeof material._id,
                    keys: Object.keys(material),
                    material 
                  });
                  return (
                  <div
                    key={materialId || `export-material-${index}`}
                    onClick={() => {
                      console.log('Click en exportar:', materialId);
                      handleExportToPdf(materialId, material.filename || material.originalName || `Material-${index + 1}`);
                    }}
                    className="bg-[#1a1a2e] p-4 rounded-lg border border-[#333] hover:border-[#dc3545] transition cursor-pointer group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <span className="bg-[#6356E5] text-white font-bold px-3 py-1 rounded-full text-sm">
                            #{index + 1}
                          </span>
                          <span className={`text-sm font-semibold px-3 py-1 rounded-full ${
                            material.status === 'READY'
                              ? 'bg-[#28a745] text-white'
                              : material.status === 'PENDING'
                              ? 'bg-[#ffc107] text-black'
                              : 'bg-[#6c757d] text-white'
                          }`}>
                            {material.status || 'N/A'}
                          </span>
                          <span className="text-xs bg-[#1a1a3e] text-white/70 px-2 py-1 rounded">
                            {material.type || 'PDF'}
                          </span>
                        </div>
                        <p className="text-white font-medium text-base mb-2">
                          📄 {material.filename || material.originalName || `Material ${index + 1}`}
                        </p>
                        {material.description && (
                          <p className="text-white/70 text-sm mb-2">
                            {material.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-white/60">
                          <span>📦 {material.size ? `${(material.size / 1024).toFixed(2)} KB` : 'N/A'}</span>
                          <span>☁️ {material.storageProvider || 'N/A'}</span>
                        </div>
                      </div>
                      <FaFilePdf className="text-[#dc3545] text-xl group-hover:scale-110 transition" />
                    </div>
                  </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-zinc-400 text-center py-8">
                No hay materiales disponibles para exportar.
              </p>
            )}

            <button
              onClick={() => setShowExportMaterialModal(false)}
              className="mt-6 bg-zinc-700 hover:bg-zinc-600 text-white px-6 py-2 rounded-lg transition font-semibold cursor-pointer w-full"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Modal de Editar Curso */}
      {courseId && (
        <EditCourseModal
          isOpen={showEditCourseModal}
          onClose={() => setShowEditCourseModal(false)}
          onSuccess={async () => {
            setToast({ message: 'Curso actualizado exitosamente', type: 'success' });
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
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#050214] text-white">
          Cargando curso...
        </div>
      }
    >
      <CourseViewPageContent />
    </Suspense>
  );
}
