"use client";

import { useState, useEffect } from 'react';
import { getCourseById, updateCourseWithFile } from '../services/courses';
import { LuBookOpen, LuLoaderCircle, LuX } from 'react-icons/lu';

interface EditCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  courseId: string;
}

export default function EditCourseModal({ isOpen, onClose, onSuccess, courseId }: EditCourseModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    piaa_syllabus: '',
  });
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCourse() {
      if (!isOpen || !courseId) return;

      try {
        setLoading(true);
        const courseData = await getCourseById(courseId);
        setFormData({
          name: courseData.name || '',
          description: courseData.description || '',
          piaa_syllabus: courseData.piaa_syllabus || '',
        });
      } catch (err) {
        console.error('Error loading course:', err);
        setError('Error al cargar los datos del curso');
      } finally {
        setLoading(false);
      }
    }

    fetchCourse();
  }, [isOpen, courseId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('description', formData.description);
      
      // Solo agregar piaa_syllabus si tiene contenido
      if (formData.piaa_syllabus.trim()) {
        formDataToSend.append('piaa_syllabus', formData.piaa_syllabus);
      }
      
      // Agregar archivo si se proporciona
      if (file) {
        formDataToSend.append('file', file);
      }

      await updateCourseWithFile(courseId, formDataToSend);
      
      // Limpiar archivo
      setFile(null);
      
      // Llamar al callback de éxito
      onSuccess();
      
      // Cerrar modal
      onClose();
    } catch (err) {
      setError('Error al actualizar el curso. Por favor, intenta de nuevo.');
      console.error('Error updating course:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleClose = () => {
    if (!saving) {
      setFile(null);
      setError(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-rs-950/60 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="relative bg-rs-surface border border-rs-line rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 animate-slideUp">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-rs-ink flex items-center gap-3">
            <LuBookOpen className="text-rs-warn" />
            Editar Curso
          </h2>
          <button
            onClick={handleClose}
            disabled={saving}
            className="text-rs-muted hover:text-rs-900 transition-colors duration-200 disabled:opacity-50 cursor-pointer"
            aria-label="Cerrar modal"
          >
            <LuX className="text-2xl" />
          </button>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="text-center">
              <LuLoaderCircle className="animate-spin text-4xl text-rs-warn mx-auto mb-4" />
              <span className="text-rs-muted">Cargando datos del curso...</span>
            </div>
          </div>
        ) : (
          <>
            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-rs-error-bg border border-rs-error/30 rounded-lg text-rs-error text-sm">
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Name Field */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-rs-ink mb-2">
                  Nombre del Curso <span className="text-rs-error">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  disabled={saving}
                  className="w-full px-4 py-3 bg-white border border-rs-input rounded-lg text-rs-ink placeholder-rs-muted/70 focus:outline-none focus:ring-2 focus:ring-rs-700 focus:border-transparent transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="Ej: Programación Web"
                />
              </div>

              {/* Description Field */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-rs-ink mb-2">
                  Descripción <span className="text-rs-error">*</span>
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  disabled={saving}
                  rows={4}
                  className="w-full px-4 py-3 bg-white border border-rs-input rounded-lg text-rs-ink placeholder-rs-muted/70 focus:outline-none focus:ring-2 focus:ring-rs-700 focus:border-transparent transition-all duration-200 resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="Describe el contenido y objetivos del curso..."
                />
              </div>

              {/* PIAA Syllabus Field */}
              <div>
                <label htmlFor="piaa_syllabus" className="block text-sm font-medium text-rs-ink mb-2">
                  PIAA - Programa de la Asignatura <span className="text-rs-muted">(opcional)</span>
                </label>
                <textarea
                  id="piaa_syllabus"
                  name="piaa_syllabus"
                  value={formData.piaa_syllabus}
                  onChange={handleChange}
                  disabled={saving}
                  rows={8}
                  className="w-full px-4 py-3 bg-white border border-rs-input rounded-lg text-rs-ink placeholder-rs-muted/70 focus:outline-none focus:ring-2 focus:ring-rs-700 focus:border-transparent transition-all duration-200 resize-none disabled:opacity-50 disabled:cursor-not-allowed font-mono text-sm"
                  placeholder="Contenido del PIAA del curso..."
                />
                <p className="mt-2 text-xs text-rs-muted">
                  Consejo: el contenido se formateará automáticamente al visualizarlo
                </p>
              </div>

              {/* File Upload Field (Optional) */}
              <div>
                <label htmlFor="file" className="block text-sm font-medium text-rs-ink mb-2">
                  Actualizar PIA (PDF) <span className="text-rs-muted">(opcional)</span>
                </label>
                <input
                  type="file"
                  id="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  disabled={saving}
                  className="w-full px-4 py-3 bg-white border border-rs-input rounded-lg text-rs-ink file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-rs-lime file:text-black hover:file:bg-[#d4e78f] file:cursor-pointer focus:outline-none focus:ring-2 focus:ring-rs-700 focus:border-transparent transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                {file && (
                  <div className="mt-2 flex items-center justify-between p-2 bg-white rounded border border-rs-input">
                    <p className="text-sm text-rs-muted">
                      {file.name}
                    </p>
                    <button
                      type="button"
                      onClick={() => setFile(null)}
                      disabled={saving}
                      className="text-rs-error hover:text-[#7f1e10] transition disabled:opacity-50 cursor-pointer"
                    >
                      <LuX />
                    </button>
                  </div>
                )}
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={saving}
                  className="flex-1 px-4 py-3 bg-rs-100 hover:bg-rs-200 text-rs-ink font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving || !formData.name.trim() || !formData.description.trim()}
                  className="flex-1 px-4 py-3 bg-rs-lime hover:bg-[#d4e78f] text-rs-950 font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <>
                      <LuLoaderCircle className="animate-spin text-lg" />
                      Guardando...
                    </>
                  ) : (
                    'Guardar Cambios'
                  )}
                </button>
              </div>
            </form>
          </>
        )}
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideUp {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }

        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
