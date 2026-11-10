"use client";

import { useState } from 'react';
import { uploadMaterials } from '../services/materials';
import { FaTimes, FaUpload } from 'react-icons/fa';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';

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
    switch (extension) {
      case 'pdf':
        return '📄';
      case 'doc':
      case 'docx':
        return '📝';
      case 'ppt':
      case 'pptx':
        return '📊';
      case 'xls':
      case 'xlsx':
        return '📈';
      default:
        return '📎';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-60 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="relative bg-gradient-to-br from-[#1a1a2e] to-[#16213e] rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto p-6 sm:p-8 animate-slideUp">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
            <FaUpload className="text-[#6356E5]" />
            Subir Material
          </h2>
          <button
            onClick={handleClose}
            disabled={loading}
            className="text-gray-400 hover:text-white transition-colors duration-200 disabled:opacity-50 cursor-pointer"
            aria-label="Cerrar modal"
          >
            <FaTimes className="text-2xl" />
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-500 bg-opacity-20 border border-red-500 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Title Field */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-2">
              Título del Material <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              disabled={loading}
              className="w-full px-4 py-3 bg-[#0f0f1e] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#6356E5] focus:border-transparent transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="Ej: Clase 1 - Introducción"
            />
          </div>

          {/* Description Field */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-2">
              Descripción <span className="text-gray-500">(opcional)</span>
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              disabled={loading}
              rows={3}
              className="w-full px-4 py-3 bg-[#0f0f1e] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#6356E5] focus:border-transparent transition-all duration-200 resize-none disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="Describe brevemente el contenido del material..."
            />
          </div>

          {/* File Upload Field */}
          <div>
            <label htmlFor="files" className="block text-sm font-medium text-gray-300 mb-2">
              Archivos <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <input
                type="file"
                id="files"
                onChange={handleFileChange}
                disabled={loading}
                multiple
                accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
                className="w-full px-4 py-3 bg-[#0f0f1e] border border-gray-700 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-[#6356E5] file:text-white hover:file:bg-[#4f48c7] file:cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#6356E5] focus:border-transparent transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
            <p className="mt-2 text-xs text-gray-400">
              Formatos aceptados: PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX
            </p>
          </div>

          {/* Selected Files List */}
          {files.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-300">
                Archivos seleccionados ({files.length})
              </p>
              <div className="max-h-40 overflow-y-auto space-y-2">
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-[#0f0f1e] border border-gray-700 rounded-lg p-3 group hover:border-[#6356E5] transition-all duration-200"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className="text-2xl">{getFileIcon(file.name)}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm truncate">{file.name}</p>
                        <p className="text-gray-400 text-xs">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(index)}
                      disabled={loading}
                      className="ml-2 text-red-400 hover:text-red-300 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label="Eliminar archivo"
                    >
                      <FaTimes className="text-lg" />
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
              className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !formData.title.trim() || files.length === 0}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-[#6356E5] to-[#4f48c7] hover:from-[#4f48c7] hover:to-[#6356E5] text-white font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <AiOutlineLoading3Quarters className="animate-spin text-lg" />
                  Subiendo...
                </>
              ) : (
                <>
                  <FaUpload />
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
