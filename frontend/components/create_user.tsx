"use client";

import { useState, useEffect } from 'react';
import { LuLoaderCircle, LuUserPlus, LuX } from 'react-icons/lu';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface Role {
  _id: string;
  name: string;
}

export default function CreateUserModal({ isOpen, onClose, onSuccess }: CreateUserModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    address: '',
    birthDate: '',
    roleId: '',
  });
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar roles disponibles
  useEffect(() => {
    async function fetchRoles() {
      if (!isOpen) return;
      
      setLoadingRoles(true);
      try {
        const token = localStorage.getItem("access_token");
        if (!token) {
          throw new Error("No se encontró un token de acceso.");
        }

        // Obtener roles desde los usuarios existentes
        const [studentsRes, teachersRes] = await Promise.all([
          fetch(`${API_URL}/users?role=estudiante`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_URL}/users?role=docente`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        const students = studentsRes.ok ? await studentsRes.json() : [];
        const teachers = teachersRes.ok ? await teachersRes.json() : [];
        
        // Extraer roles únicos
        const rolesMap = new Map();
        [...students, ...teachers].forEach(user => {
          if (user.roles && user.roles.length > 0) {
            const role = user.roles[0];
            if (role._id && role.name && !rolesMap.has(role._id)) {
              rolesMap.set(role._id, {
                _id: role._id,
                name: role.name
              });
            }
          }
        });
        
        const uniqueRoles = Array.from(rolesMap.values());
        setRoles(uniqueRoles);
        
        // Seleccionar el primer rol por defecto
        if (uniqueRoles.length > 0 && !formData.roleId) {
          setFormData(prev => ({ ...prev, roleId: uniqueRoles[0]._id }));
        }
      } catch (err) {
        console.error('Error fetching roles:', err);
        setError('Error al cargar los roles disponibles.');
      } finally {
        setLoadingRoles(false);
      }
    }
    
    fetchRoles();
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        throw new Error("No se encontró un token de acceso.");
      }

      // Formatear fecha al formato esperado por el backend (DD/MM/YYYY)
      let formattedBirthDate = formData.birthDate;
      if (formData.birthDate) {
        const dateObj = new Date(formData.birthDate);
        const day = String(dateObj.getDate()).padStart(2, '0');
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const year = dateObj.getFullYear();
        formattedBirthDate = `${day}/${month}/${year}`;
      }

      const body = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone || undefined,
        address: formData.address || undefined,
        birthDate: formattedBirthDate || undefined,
        roleId: formData.roleId,
      };

      const res = await fetch(`${API_URL}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Error al crear el usuario');
      }

      // Limpiar formulario
      setFormData({
        name: '',
        email: '',
        password: '',
        phone: '',
        address: '',
        birthDate: '',
        roleId: roles.length > 0 ? roles[0]._id : '',
      });
      
      // Llamar al callback de éxito
      onSuccess();
      
      // Cerrar modal
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear el usuario. Por favor, intenta de nuevo.');
      console.error('Error creating user:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({
        name: '',
        email: '',
        password: '',
        phone: '',
        address: '',
        birthDate: '',
        roleId: roles.length > 0 ? roles[0]._id : '',
      });
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
            <LuUserPlus className="text-rs-700" />
            Crear Usuario
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Name Field */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-rs-ink mb-2">
                Nombre Completo <span className="text-rs-error">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                disabled={loading}
                className="w-full px-4 py-3 bg-white border border-rs-input rounded-lg text-rs-ink placeholder-rs-muted/70 focus:outline-none focus:ring-2 focus:ring-rs-700 focus:border-transparent transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="Ej: Juan Pérez"
              />
            </div>

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-rs-ink mb-2">
                Correo Electrónico <span className="text-rs-error">*</span>
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={loading}
                className="w-full px-4 py-3 bg-white border border-rs-input rounded-lg text-rs-ink placeholder-rs-muted/70 focus:outline-none focus:ring-2 focus:ring-rs-700 focus:border-transparent transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="usuario@ejemplo.com"
              />
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-rs-ink mb-2">
                Contraseña <span className="text-rs-error">*</span>
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                disabled={loading}
                minLength={6}
                className="w-full px-4 py-3 bg-white border border-rs-input rounded-lg text-rs-ink placeholder-rs-muted/70 focus:outline-none focus:ring-2 focus:ring-rs-700 focus:border-transparent transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="Mínimo 6 caracteres"
              />
            </div>

            {/* Role Field */}
            <div>
              <label htmlFor="roleId" className="block text-sm font-medium text-rs-ink mb-2">
                Rol <span className="text-rs-error">*</span>
              </label>
              {loadingRoles ? (
                <div className="w-full px-4 py-3 bg-white border border-rs-input rounded-lg text-rs-muted flex items-center gap-2">
                  <LuLoaderCircle className="animate-spin" />
                  Cargando roles...
                </div>
              ) : (
                <select
                  id="roleId"
                  name="roleId"
                  value={formData.roleId}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  className="w-full px-4 py-3 bg-white border border-rs-input rounded-lg text-rs-ink focus:outline-none focus:ring-2 focus:ring-rs-700 focus:border-transparent transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <option value="">Selecciona un rol</option>
                  {roles.map((role) => (
                    <option key={role._id} value={role._id}>
                      {role.name.charAt(0).toUpperCase() + role.name.slice(1)}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Phone Field */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-rs-ink mb-2">
                Teléfono <span className="text-rs-muted">(opcional)</span>
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                disabled={loading}
                className="w-full px-4 py-3 bg-white border border-rs-input rounded-lg text-rs-ink placeholder-rs-muted/70 focus:outline-none focus:ring-2 focus:ring-rs-700 focus:border-transparent transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="+57 300 123 4567"
              />
            </div>

            {/* Birth Date Field */}
            <div>
              <label htmlFor="birthDate" className="block text-sm font-medium text-rs-ink mb-2">
                Fecha de Nacimiento <span className="text-rs-muted">(opcional)</span>
              </label>
              <input
                type="date"
                id="birthDate"
                name="birthDate"
                value={formData.birthDate}
                onChange={handleChange}
                disabled={loading}
                className="w-full px-4 py-3 bg-white border border-rs-input rounded-lg text-rs-ink placeholder-rs-muted/70 focus:outline-none focus:ring-2 focus:ring-rs-700 focus:border-transparent transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          {/* Address Field */}
          <div>
            <label htmlFor="address" className="block text-sm font-medium text-rs-ink mb-2">
              Dirección <span className="text-rs-muted">(opcional)</span>
            </label>
            <input
              type="text"
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              disabled={loading}
              className="w-full px-4 py-3 bg-white border border-rs-input rounded-lg text-rs-ink placeholder-rs-muted/70 focus:outline-none focus:ring-2 focus:ring-rs-700 focus:border-transparent transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="Calle 123 # 45-67"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="flex-1 px-4 py-3 bg-rs-100 hover:bg-rs-200 text-rs-ink font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !formData.name.trim() || !formData.email.trim() || !formData.password.trim() || !formData.roleId || loadingRoles}
              className="flex-1 px-4 py-3 bg-rs-700 hover:bg-rs-800 text-white font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <LuLoaderCircle className="animate-spin text-lg" />
                  Creando...
                </>
              ) : (
                'Crear Usuario'
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
