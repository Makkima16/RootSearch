"use client";

import { useState } from 'react';
import { uploadMaterials } from '../services/materials';
import { LuFileSpreadsheet, LuFileText, LuFileType, LuLoaderCircle, LuPaperclip, LuPresentation, LuUpload, LuX } from 'react-icons/lu';

interface UploadMaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  courseId: string;
}

export default function UploadMaterialModal({ isOpen, onClose, onSuccess, courseId }: UploadMaterialModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
  });
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (files.length === 0) {
        setError('Por favor, selecciona al menos un archivo');
        setLoading(false);
        return;
      }

      await uploadMaterials(courseId, files, formData.title, formData.description);
      
      // Limpiar formulario
      setFormData({ title: '', description: '' });
      setFiles([]);
      
      // Llamar al callback de éxito
      onSuccess();
      
      // Cerrar modal
      onClose();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(`Error al subir materiales: ${errorMessage}`);
      console.error('Error uploading materials:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      setFiles(selectedFiles);
    }
  };

  const handleRemoveFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({ title: '', description: '' });
      setFiles([]);
      setError(null);
      onClose();
    }
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    const cls = 'size-6 text-rs-700';
    switch (extension) {
      case 'pdf':
        return <LuFileText className={cls} aria-hidden="true" />;
      case 'doc':
      case 'docx':
        return <LuFileType className={cls} aria-hidden="true" />;
      case 'ppt':
      case 'pptx':
        return <LuPresentation className={cls} aria-hidden="true" />;
      case 'xls':
      case 'xlsx':
        return <LuFileSpreadsheet className={cls} aria-hidden="true" />;
      default:
        return <LuPaperclip className={cls} aria-hidden="true" />;
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
      <div className="relative bg-rs-surface border border-rs-line rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto p-6 sm:p-8 animate-slideUp">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-rs-ink flex items-center gap-3">
            <LuUpload className="text-rs-700" />
            Subir Material
          </h2>
          <button
            onClick={handleClose}
            disabled={loading}
            className="text-rs-muted hover:text-rs-900 transition-colors duration-200 disabled:opacity-50 cursor-pointer"
            aria-label="Cerrar modal"
          >
            <LuX className="text-2xl" />
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-rs-error-bg border border-rs-error/30 rounded-lg text-rs-error text-sm">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Title Field */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-rs-ink mb-2">
              Título del Material <span className="text-rs-error">*</span>
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              disabled={loading}
              className="w-full px-4 py-3 bg-white border border-rs-input rounded-lg text-rs-ink placeholder-rs-muted/70 focus:outline-none focus:ring-2 focus:ring-rs-700 focus:border-transparent transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="Ej: Clase 1 - Introducción"
            />
          </div>

          {/* Description Field */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-rs-ink mb-2">
              Descripción <span className="text-rs-muted">(opcional)</span>
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              disabled={loading}
              rows={3}
              className="w-full px-4 py-3 bg-white border border-rs-input rounded-lg text-rs-ink placeholder-rs-muted/70 focus:outline-none focus:ring-2 focus:ring-rs-700 focus:border-transparent transition-all duration-200 resize-none disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="Describe brevemente el contenido del material..."
            />
          </div>

          {/* File Upload Field */}
          <div>
            <label htmlFor="files" className="block text-sm font-medium text-rs-ink mb-2">
              Archivos <span className="text-rs-error">*</span>
            </label>
            <div className="relative">
              <input
                type="file"
                id="files"
                onChange={handleFileChange}
                disabled={loading}
                multiple
                accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
                className="w-full px-4 py-3 bg-white border border-rs-input rounded-lg text-rs-ink file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-rs-700 file:text-white hover:file:bg-rs-800 file:cursor-pointer focus:outline-none focus:ring-2 focus:ring-rs-700 focus:border-transparent transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
            <p className="mt-2 text-xs text-rs-muted">
              Formatos aceptados: PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX
            </p>
          </div>

          {/* Selected Files List */}
          {files.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-rs-ink">
                Archivos seleccionados ({files.length})
              </p>
              <div className="max-h-40 overflow-y-auto space-y-2">
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-white border border-rs-input rounded-lg p-3 group hover:border-rs-600 transition-all duration-200"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className="shrink-0">{getFileIcon(file.name)}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-rs-ink text-sm truncate">{file.name}</p>
                        <p className="text-rs-muted text-xs">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(index)}
                      disabled={loading}
                      className="ml-2 text-rs-error hover:text-[#7f1e10] transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label="Eliminar archivo"
                    >
                      <LuX className="text-lg" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="flex-1 px-4 py-3 bg-rs-100 hover:bg-rs-200 text-rs-ink font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !formData.title.trim() || files.length === 0}
              className="flex-1 px-4 py-3 bg-rs-700 hover:bg-rs-800 text-white font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <LuLoaderCircle className="animate-spin text-lg" />
                  Subiendo...
                </>
              ) : (
                <>
                  <LuUpload />
                  Subir Material
                </>
              )}
            </button>
          </div>
        </form>
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
