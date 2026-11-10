"use client";

import React, { useState, useEffect } from 'react';
import SideBar from '@/components/SideBar';
import { getUserProfile } from '@/services/users';
import { getAllCourses, getAllCoursesForAdmin } from '@/services/courses';
import { getMaterialsByCourse, uploadAudioAndGenerate, updateMaterial, publishMaterial } from '@/services/materials';
import {
  LuCheck,
  LuEye,
  LuFileAudio,
  LuLoaderCircle,
  LuPencil,
  LuPlus,
  LuSave,
  LuSparkles,
  LuSquare,
  LuTrash2,
  LuUpload,
} from 'react-icons/lu';
import { EmptyState, LoadingScreen, Modal, PageHeader, StatusChip, Tabs } from '@/components/ui';
import Toast from "@/components/Toast";

export default function MaterialsPage() {
  const [user, setUser] = useState<any>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "info" | "success" | "error" } | null>(null);
  
  // Modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentMaterial, setCurrentMaterial] = useState<any>(null);
  const [editFormData, setEditFormData] = useState({
    resumen: '',
    glosario: [] as Array<{ term: string; definition: string }>,
    quiz: [] as Array<{ pregunta: string; opciones: string[]; respuestaCorrecta: string; justificacion: string }>,
    checklist: [] as string[],
    estado: 'PENDIENTE_REVISION'
  });
  const [selectedTab, setSelectedTab] = useState<'resumen' | 'glosario' | 'quiz' | 'checklist'>('resumen');

  useEffect(() => {
    async function init() {
      try {
        const userData = await getUserProfile();
        const role = userData.roles?.[0]?.name || "";
        setUser({ ...userData, role });

        // Si es administrador, obtener TODOS los cursos del sistema
        let coursesData;
        if (role.toLowerCase() === 'administrador') {
          coursesData = await getAllCoursesForAdmin();
        } else {
          coursesData = await getAllCourses(userData._id);
        }
        
        setCourses(coursesData);
        
        if (coursesData.length > 0) {
          setSelectedCourse(coursesData[0]._id);
        }
      } catch (error) {
        console.error(error);
        setToast({ message: "Error al cargar datos iniciales", type: "error" });
      }
    }
    init();
  }, []);

  useEffect(() => {
    if (selectedCourse) {
      fetchMaterials(selectedCourse);
    }
  }, [selectedCourse]);

  async function fetchMaterials(courseId: string) {
    setLoading(true);
    try {
      const data = await getMaterialsByCourse(courseId);
      setMaterials(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      setToast({ message: "Error al cargar materiales", type: "error" });
    } finally {
      setLoading(false);
    }
  }

  const handleUploadAudio = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    
    const file = e.target.files[0];
    setUploading(true);
    setToast({ message: "Subiendo audio y generando contenido... Esto puede tardar unos minutos.", type: "info" });

    try {
      await uploadAudioAndGenerate(selectedCourse, file);
      setToast({ message: "Material generado exitosamente. Revisa el borrador.", type: "success" });
      fetchMaterials(selectedCourse);
    } catch (error: any) {
      console.error('Error uploading audio:', error);
      const errorMessage = error?.message || "Error al generar material";
      setToast({ message: errorMessage, type: "error" });
    } finally {
      setUploading(false);
      // Reset input
      e.target.value = '';
    }
  };

  const handlePublish = async (materialId: string) => {
    if (!confirm("¿Estás seguro de publicar este material? Se enviará una notificación y será visible para los estudiantes.")) return;
    
    try {
      await publishMaterial(materialId);
      setToast({ message: "Material publicado exitosamente", type: "success" });
      fetchMaterials(selectedCourse);
    } catch (error) {
      console.error(error);
      setToast({ message: "Error al publicar material", type: "error" });
    }
  };

  const openEditModal = (material: any) => {
    setCurrentMaterial(material);
    setEditFormData({
      resumen: material.resumen || '',
      glosario: material.glosario || [],
      quiz: material.quiz || [],
      checklist: material.checklist || [],
      estado: material.estado || 'PENDIENTE_REVISION'
    });
    setSelectedTab('resumen');
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!currentMaterial) return;
    
    try {
      // Validar que el resumen no esté vacío
      if (!editFormData.resumen.trim()) {
        setToast({ message: "El resumen no puede estar vacío", type: "error" });
        return;
      }
      
      // No enviar el estado en la actualización, solo el contenido
      const { estado, ...dataToUpdate } = editFormData;
      
      await updateMaterial(currentMaterial._id, dataToUpdate);
      setToast({ message: "Material actualizado exitosamente", type: "success" });
      setIsEditModalOpen(false);
      fetchMaterials(selectedCourse);
    } catch (error: any) {
      console.error(error);
      setToast({ message: error.message || "Error al actualizar material", type: "error" });
    }
  };


  if (!user) return <LoadingScreen />;

  const canEdit = user.role === 'docente' || user.role === 'administrador';
  const fieldClass =
    'w-full rounded-lg border border-rs-input bg-white px-3 py-2 text-rs-ink focus:border-rs-700 focus:outline-2 focus:outline-rs-700';
  const removeButton = (onClick: () => void, label: string) => (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="grid size-9 shrink-0 cursor-pointer place-items-center rounded-lg text-rs-error hover:bg-rs-error-bg"
    >
      <LuTrash2 className="size-4" aria-hidden="true" />
    </button>
  );

  return (
    <div className="flex min-h-screen flex-col bg-rs-50 font-sans text-rs-ink lg:flex-row">
      <SideBar user={user} />
      <main className="min-w-0 flex-1 px-4 py-8 sm:px-6 lg:px-10">
        <PageHeader
          icon={LuSparkles}
          title="Materiales generados con IA"
          subtitle="Revisa, edita y publica el contenido generado a partir de las clases."
        />

        <div className="rs-card mb-8 flex flex-col items-stretch gap-4 p-4 md:flex-row md:items-end md:justify-between">
          <div className="w-full md:w-1/3">
            <label htmlFor="course-select" className="rs-label">
              Seleccionar curso
            </label>
            <select
              id="course-select"
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="rs-input cursor-pointer"
            >
              {courses.map(course => (
                <option key={course._id} value={course._id}>{course.name}</option>
              ))}
            </select>
          </div>

          {canEdit && (
            <label
              className={`rs-btn w-full md:w-auto ${
                uploading ? 'cursor-not-allowed bg-rs-400 text-white' : 'bg-rs-900 text-white hover:bg-rs-950'
              }`}
            >
              {uploading ? (
                <LuLoaderCircle className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <LuUpload className="size-4 text-rs-lime" aria-hidden="true" />
              )}
              <span>{uploading ? 'Procesando...' : 'Subir audio de clase'}</span>
              <input
                type="file"
                accept="audio/*"
                className="hidden"
                onChange={handleUploadAudio}
                disabled={uploading}
              />
            </label>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <LuLoaderCircle className="size-10 animate-spin text-rs-700" aria-hidden="true" />
          </div>
        ) : materials.length === 0 ? (
          <EmptyState icon={LuFileAudio}>No hay materiales generados para este curso.</EmptyState>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {materials.map((material) => (
              <article
                key={material._id}
                className="rs-card flex flex-col p-5 transition-colors hover:border-rs-400"
              >
                <div className="mb-4 flex items-start justify-between gap-2">
                  <StatusChip estado={material.estado} />
                  <span className="text-xs text-rs-muted">
                    {new Date(material.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <h3 className="rs-title mb-2 line-clamp-1 text-lg">Material de clase</h3>
                <p className="mb-5 line-clamp-3 text-sm text-rs-muted">
                  {material.resumen || "Sin resumen disponible..."}
                </p>

                <div className="mt-auto flex gap-2">
                  <button
                    type="button"
                    onClick={() => openEditModal(material)}
                    className="rs-btn-secondary flex-1"
                  >
                    {canEdit ? (
                      <LuPencil className="size-4" aria-hidden="true" />
                    ) : (
                      <LuEye className="size-4" aria-hidden="true" />
                    )}
                    <span>{canEdit ? 'Editar / Ver' : 'Ver'}</span>
                  </button>

                  {canEdit && material.estado !== 'PUBLICADO' && (
                    <button
                      type="button"
                      onClick={() => handlePublish(material._id)}
                      className="rs-btn-accent"
                      title="Publicar"
                    >
                      <LuCheck className="size-4" aria-hidden="true" /> Publicar
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}

        {/* Modal de edición */}
        {isEditModalOpen && currentMaterial && (
          <Modal
            size="xl"
            title={
              <span className="flex items-center gap-3">
                {canEdit ? 'Editar material' : 'Ver material'}
                <StatusChip estado={editFormData.estado} />
              </span>
            }
            onClose={() => setIsEditModalOpen(false)}
            toolbar={
              <Tabs<'resumen' | 'glosario' | 'quiz' | 'checklist'>
                className="border-b border-rs-line bg-rs-50 px-4 py-2 sm:px-6"
                value={selectedTab}
                onChange={setSelectedTab}
                tabs={[
                  { id: 'resumen', label: 'Resumen' },
                  { id: 'glosario', label: `Glosario (${editFormData.glosario.length})` },
                  { id: 'quiz', label: `Quiz (${editFormData.quiz.length})` },
                  { id: 'checklist', label: `Checklist (${editFormData.checklist.length})` },
                ]}
              />
            }
            footer={
              <>
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="rs-btn-ghost">
                  Cerrar
                </button>
                {canEdit && (
                  <button type="button" onClick={handleSaveEdit} className="rs-btn-primary">
                    <LuSave className="size-4" aria-hidden="true" /> Guardar cambios
                  </button>
                )}
              </>
            }
          >
            {/* Resumen */}
            {selectedTab === 'resumen' && (
              <div>
                <label htmlFor="resumen" className="rs-label text-rs-700">Resumen generado</label>
                {canEdit ? (
                  <textarea
                    id="resumen"
                    value={editFormData.resumen}
                    onChange={(e) => setEditFormData({ ...editFormData, resumen: e.target.value })}
                    className={`${fieldClass} h-96 resize-y p-4`}
                    placeholder="Escribe el resumen aquí..."
                  />
                ) : (
                  <div className="whitespace-pre-wrap rounded-xl border border-rs-line bg-white p-4 leading-relaxed text-rs-ink">
                    {currentMaterial.resumen}
                  </div>
                )}
              </div>
            )}

            {/* Glosario */}
            {selectedTab === 'glosario' && (
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="rs-title text-base">Glosario</h3>
                  {canEdit && (
                    <button
                      type="button"
                      onClick={() => setEditFormData({
                        ...editFormData,
                        glosario: [...editFormData.glosario, { term: '', definition: '' }]
                      })}
                      className="rs-btn-secondary"
                    >
                      <LuPlus className="size-4" aria-hidden="true" /> Agregar término
                    </button>
                  )}
                </div>
                <div className={canEdit ? 'space-y-3' : 'grid grid-cols-1 gap-3 sm:grid-cols-2'}>
                  {editFormData.glosario.map((item, idx) => (
                    <div
                      key={idx}
                      className={canEdit ? 'rounded-xl border border-rs-line bg-white p-4' : 'rounded-xl bg-rs-100 p-4'}
                    >
                      {canEdit ? (
                        <>
                          <div className="mb-2 flex items-start gap-2">
                            <input
                              type="text"
                              aria-label={`Término ${idx + 1}`}
                              value={item.term}
                              onChange={(e) => {
                                const newGlosario = [...editFormData.glosario];
                                newGlosario[idx].term = e.target.value;
                                setEditFormData({ ...editFormData, glosario: newGlosario });
                              }}
                              className={`${fieldClass} font-semibold`}
                              placeholder="Término"
                            />
                            {removeButton(() => {
                              const newGlosario = editFormData.glosario.filter((_, i) => i !== idx);
                              setEditFormData({ ...editFormData, glosario: newGlosario });
                            }, 'Eliminar término')}
                          </div>
                          <textarea
                            aria-label={`Definición ${idx + 1}`}
                            value={item.definition}
                            onChange={(e) => {
                              const newGlosario = [...editFormData.glosario];
                              newGlosario[idx].definition = e.target.value;
                              setEditFormData({ ...editFormData, glosario: newGlosario });
                            }}
                            className={`${fieldClass} resize-y`}
                            rows={2}
                            placeholder="Definición"
                          />
                        </>
                      ) : (
                        <>
                          <p className="mb-1 font-semibold text-rs-900">{item.term}</p>
                          <p className="text-sm text-[#2f4a3e]">{item.definition}</p>
                        </>
                      )}
                    </div>
                  ))}
                  {editFormData.glosario.length === 0 && (
                    <p className="py-8 text-center text-rs-muted">No hay términos en el glosario</p>
                  )}
                </div>
              </div>
            )}

            {/* Quiz */}
            {selectedTab === 'quiz' && (
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="rs-title text-base">Quiz</h3>
                  {canEdit && (
                    <button
                      type="button"
                      onClick={() => setEditFormData({
                        ...editFormData,
                        quiz: [...editFormData.quiz, { pregunta: '', opciones: ['', '', '', ''], respuestaCorrecta: '', justificacion: '' }]
                      })}
                      className="rs-btn-secondary"
                    >
                      <LuPlus className="size-4" aria-hidden="true" /> Agregar pregunta
                    </button>
                  )}
                </div>
                <div className="space-y-4">
                  {editFormData.quiz.map((q, idx) => (
                    <div key={idx} className="rounded-xl border border-rs-line bg-white p-4">
                      {canEdit ? (
                        <>
                          <div className="mb-3 flex items-center justify-between">
                            <span className="rounded-full bg-rs-900 px-2.5 py-1 text-xs font-bold text-rs-lime">#{idx + 1}</span>
                            {removeButton(() => {
                              const newQuiz = editFormData.quiz.filter((_, i) => i !== idx);
                              setEditFormData({ ...editFormData, quiz: newQuiz });
                            }, 'Eliminar pregunta')}
                          </div>
                          <textarea
                            aria-label={`Pregunta ${idx + 1}`}
                            value={q.pregunta}
                            onChange={(e) => {
                              const newQuiz = [...editFormData.quiz];
                              newQuiz[idx].pregunta = e.target.value;
                              setEditFormData({ ...editFormData, quiz: newQuiz });
                            }}
                            className={`${fieldClass} mb-3 resize-y`}
                            rows={2}
                            placeholder="Pregunta"
                          />
                          <div className="mb-3 space-y-2">
                            {q.opciones.map((opt, optIdx) => (
                              <input
                                key={optIdx}
                                type="text"
                                aria-label={`Opción ${String.fromCharCode(65 + optIdx)}`}
                                value={opt}
                                onChange={(e) => {
                                  const newQuiz = [...editFormData.quiz];
                                  newQuiz[idx].opciones[optIdx] = e.target.value;
                                  setEditFormData({ ...editFormData, quiz: newQuiz });
                                }}
                                className={fieldClass}
                                placeholder={`Opción ${String.fromCharCode(65 + optIdx)}`}
                              />
                            ))}
                          </div>
                          <input
                            type="text"
                            aria-label="Respuesta correcta"
                            value={q.respuestaCorrecta}
                            onChange={(e) => {
                              const newQuiz = [...editFormData.quiz];
                              newQuiz[idx].respuestaCorrecta = e.target.value;
                              setEditFormData({ ...editFormData, quiz: newQuiz });
                            }}
                            className={`${fieldClass} mb-2 border-rs-600 bg-rs-100`}
                            placeholder="Respuesta correcta (debe coincidir con una opción)"
                          />
                          <textarea
                            aria-label="Justificación"
                            value={q.justificacion}
                            onChange={(e) => {
                              const newQuiz = [...editFormData.quiz];
                              newQuiz[idx].justificacion = e.target.value;
                              setEditFormData({ ...editFormData, quiz: newQuiz });
                            }}
                            className={`${fieldClass} resize-y`}
                            rows={2}
                            placeholder="Justificación de la respuesta"
                          />
                        </>
                      ) : (
                        <>
                          <p className="mb-3 font-semibold text-rs-ink">{idx + 1}. {q.pregunta}</p>
                          <ul className="mb-2 space-y-2">
                            {q.opciones.map((opt, i) => {
                              const correct = opt === q.respuestaCorrecta;
                              return (
                                <li
                                  key={i}
                                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
                                    correct
                                      ? 'border-[1.5px] border-rs-700 bg-rs-100 font-semibold text-rs-900'
                                      : 'border border-rs-line-soft text-rs-ink'
                                  }`}
                                >
                                  {correct && <LuCheck className="size-4" aria-hidden="true" />}
                                  {opt}
                                  {correct && <span className="ml-auto text-xs">Respuesta correcta</span>}
                                </li>
                              );
                            })}
                          </ul>
                          {q.justificacion && (
                            <p className="text-sm text-rs-muted">
                              <strong className="text-rs-900">Justificación:</strong> {q.justificacion}
                            </p>
                          )}
                        </>
                      )}
                    </div>
                  ))}
                  {editFormData.quiz.length === 0 && (
                    <p className="py-8 text-center text-rs-muted">No hay preguntas en el quiz</p>
                  )}
                </div>
              </div>
            )}

            {/* Checklist */}
            {selectedTab === 'checklist' && (
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="rs-title text-base">Checklist</h3>
                  {canEdit && (
                    <button
                      type="button"
                      onClick={() => setEditFormData({
                        ...editFormData,
                        checklist: [...editFormData.checklist, '']
                      })}
                      className="rs-btn-secondary"
                    >
                      <LuPlus className="size-4" aria-hidden="true" /> Agregar ítem
                    </button>
                  )}
                </div>
                <div className="space-y-2">
                  {editFormData.checklist.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 rounded-xl border border-rs-line bg-white p-3">
                      <LuSquare className="size-5 shrink-0 text-rs-600" aria-hidden="true" />
                      {canEdit ? (
                        <>
                          <input
                            type="text"
                            aria-label={`Ítem ${idx + 1}`}
                            value={item}
                            onChange={(e) => {
                              const newChecklist = [...editFormData.checklist];
                              newChecklist[idx] = e.target.value;
                              setEditFormData({ ...editFormData, checklist: newChecklist });
                            }}
                            className={fieldClass}
                            placeholder="Ítem del checklist"
                          />
                          {removeButton(() => {
                            const newChecklist = editFormData.checklist.filter((_, i) => i !== idx);
                            setEditFormData({ ...editFormData, checklist: newChecklist });
                          }, 'Eliminar ítem')}
                        </>
                      ) : (
                        <span className="text-rs-ink">{item}</span>
                      )}
                    </div>
                  ))}
                  {editFormData.checklist.length === 0 && (
                    <p className="py-8 text-center text-rs-muted">No hay items en el checklist</p>
                  )}
                </div>
              </div>
            )}
          </Modal>
        )}

        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </main>
    </div>
  );
}
