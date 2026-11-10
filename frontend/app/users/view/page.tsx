"use client";

import { getUserById, getUserProfile, updateUserProfile, getAvailableRoles } from '@/services/users';
import SideBar from '@/components/SideBar';
import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from 'next/navigation';
import { LuLoaderCircle, LuPencil, LuSave, LuX } from 'react-icons/lu';
import Toast from '@/components/Toast';

type Role = {
  _id: string;
  name: string;
};

function UserProfileContent() {
  const searchParams = useSearchParams();
  const userId = searchParams.get('userId');

  const [currentUser, setCurrentUser] = useState<{ id: string; name: string; role: string } | null>(null);
  const [userInfo, setUserInfo] = useState<{
    _id: string;
    name: string;
    email: string;
    role: string;
    roleId: string;
    createdAt: string;
    phone: string;
    address: string;
    birthDate: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);

  // Estados para los campos editables
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    birthDate: '',
    roleId: '',
  });

  useEffect(() => {
    async function fetchData() {
      try {
        if (!userId) {
          setError("ID de usuario no proporcionado");
          setLoading(false);
          return;
        }

        // Obtener usuario actual (para el sidebar y permisos)
        const currentUserData = await getUserProfile();
        const currentRole = currentUserData.roles?.[0]?.name || "";
        setCurrentUser({ id: currentUserData._id, name: currentUserData.name, role: currentRole });

        // Verificar permisos - solo administradores
        if (currentRole.toLowerCase() !== "administrador") {
          setError("No tienes permisos para acceder a esta sección.");
          setLoading(false);
          return;
        }

        // Obtener información del usuario
        const userData = await getUserById(userId);
        const userRole = userData.roles?.[0]?.name || "estudiante";
        const userRoleId = userData.roles?.[0]?._id || "";
        
        // Formatear fecha de creación
        const createdDate = new Date(userData.createdAt);
        const formattedDate = createdDate.toLocaleDateString('es-ES', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        });

        // Formatear fecha de nacimiento si existe
        let formattedBirthDate = 'No especificado';
        if (userData.birthDate) {
          const birthDate = new Date(userData.birthDate);
          formattedBirthDate = birthDate.toISOString().split('T')[0];
        }

        const userInfoData = {
          _id: userData._id,
          name: userData.name,
          email: userData.email,
          role: userRole.charAt(0).toUpperCase() + userRole.slice(1),
          roleId: userRoleId,
          createdAt: formattedDate,
          phone: userData.phone || 'No especificado',
          address: userData.address || 'No especificado',
          birthDate: formattedBirthDate,
        };

        setUserInfo(userInfoData);
        setEditForm({
          name: userData.name,
          email: userData.email,
          phone: userData.phone || '',
          address: userData.address || '',
          birthDate: formattedBirthDate === 'No especificado' ? '' : formattedBirthDate,
          roleId: userRoleId,
        });

        // Obtener roles disponibles
        const roles = await getAvailableRoles();
        setAvailableRoles(roles.length > 0 ? roles : [
          { _id: userRoleId, name: userRole }
        ]);
      } catch (error: any) {
        console.error('Error fetching user info:', error);
        setError(error.message || "Error al cargar la información del usuario");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [userId]);

  const handleSave = async () => {
    if (!userInfo) return;

    setIsSaving(true);
    try {
      await updateUserProfile(
        userInfo._id,
        {
          name: editForm.name,
          email: editForm.email,
          phone: editForm.phone,
          address: editForm.address,
          birthDate: editForm.birthDate,
          roleId: editForm.roleId,
        },
        true // isAdmin
      );

      // Actualizar la información mostrada
      const selectedRole = availableRoles.find(r => r._id === editForm.roleId);
      const newRoleName = selectedRole ? selectedRole.name.charAt(0).toUpperCase() + selectedRole.name.slice(1) : userInfo.role;
      
      setUserInfo({
        ...userInfo,
        name: editForm.name,
        email: editForm.email,
        phone: editForm.phone || 'No especificado',
        address: editForm.address || 'No especificado',
        birthDate: editForm.birthDate || 'No especificado',
        role: newRoleName,
        roleId: editForm.roleId,
      });

      setIsEditing(false);
      setToast({ message: 'Usuario actualizado correctamente', type: 'success' });
    } catch (error: any) {
      console.error('Error updating user:', error);
      setToast({ message: error.message || 'Error al actualizar usuario', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    // Restaurar valores originales
    if (userInfo) {
      setEditForm({
        name: userInfo.name,
        email: userInfo.email,
        phone: userInfo.phone === 'No especificado' ? '' : userInfo.phone,
        address: userInfo.address === 'No especificado' ? '' : userInfo.address,
        birthDate: userInfo.birthDate === 'No especificado' ? '' : userInfo.birthDate,
        roleId: userInfo.roleId,
      });
    }
    setIsEditing(false);
  };

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
    <div className="flex min-h-screen flex-col lg:flex-row bg-rs-50 text-rs-ink">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      
      {/* Sidebar */}
      <SideBar user={currentUser!} />

      {/* Contenido principal */}
      <main className="min-w-0 flex-1 flex justify-center items-start px-4 py-8 sm:px-6 lg:px-10">
        <div className="bg-rs-surface border border-rs-line rounded-2xl p-8 w-full max-w-3xl shadow-2xl">
          <div className="bg-rs-50 rounded-xl p-6">

            {/* Avatar y nombre */}
            <div className="flex flex-col items-center mb-8">
              <div className={`w-24 h-24 rounded-full ${
                userInfo?.role.toLowerCase() === 'docente' 
                  ? 'bg-rs-900 text-rs-lime'
                  : 'bg-rs-700 text-white'
              } flex items-center justify-center text-4xl font-bold`}>
                {userInfo?.name.charAt(0).toUpperCase()}
              </div>
              <p className="mt-4 text-2xl font-bold">{isEditing ? editForm.name : userInfo?.name}</p>
              <span className={`mt-1 px-3 py-1 ${
                userInfo?.role.toLowerCase() === 'docente'
                  ? 'bg-rs-lime text-rs-950'
                  : 'bg-rs-100 text-rs-800'
              } font-semibold capitalize rounded-full text-sm`}>
                {userInfo?.role}
              </span>
            </div>

            {/* Botones de edición */}
            <div className="flex justify-end gap-2 mb-4">
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-rs-700 hover:bg-rs-800 text-white font-semibold rounded-lg transition cursor-pointer"
                >
                  <LuPencil /> Editar
                </button>
              ) : (
                <>
                  <button
                    onClick={handleCancel}
                    className="flex items-center gap-2 px-4 py-2 bg-rs-100 hover:bg-rs-200 rounded-lg transition cursor-pointer disabled:cursor-not-allowed"
                    disabled={isSaving}
                  >
                    <LuX /> Cancelar
                  </button>
                  <button
                    onClick={handleSave}
                    className="flex items-center gap-2 px-4 py-2 bg-rs-700 hover:bg-rs-800 text-white font-semibold rounded-lg transition cursor-pointer disabled:cursor-not-allowed"
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <LuLoaderCircle className="animate-spin" />
                    ) : (
                      <LuSave />
                    )}
                    {isSaving ? 'Guardando...' : 'Guardar'}
                  </button>
                </>
              )}
            </div>

            {/* Tabla de información */}
            <div className="grid grid-cols-1 md:grid-cols-2 border border-rs-input rounded-lg overflow-hidden">

              <div className="border-b border-rs-input p-4 font-medium bg-white">Nombre</div>
              <div className="border-b border-rs-input p-4">
                {isEditing ? (
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full bg-white border border-rs-line rounded px-3 py-1 focus:outline-none focus:ring-2 focus:ring-rs-700"
                  />
                ) : (
                  userInfo?.name
                )}
              </div>

              <div className="border-b border-rs-input p-4 font-medium bg-white">Correo</div>
              <div className="border-b border-rs-input p-4">
                {isEditing ? (
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full bg-white border border-rs-line rounded px-3 py-1 focus:outline-none focus:ring-2 focus:ring-rs-700 text-rs-info"
                  />
                ) : (
                  <span className="text-rs-info">{userInfo?.email}</span>
                )}
              </div>

              <div className="border-b border-rs-input p-4 font-medium bg-white">Rol</div>
              <div className="border-b border-rs-input p-4">
                {isEditing ? (
                  availableRoles.length > 0 ? (
                    <select
                      value={editForm.roleId}
                      onChange={(e) => setEditForm({ ...editForm, roleId: e.target.value })}
                      className="w-full bg-white border border-rs-line rounded px-3 py-1 focus:outline-none focus:ring-2 focus:ring-rs-700"
                    >
                      {availableRoles.map((role) => (
                        <option key={role._id} value={role._id}>
                          {role.name.charAt(0).toUpperCase() + role.name.slice(1)}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="text-rs-muted text-sm">No se pudieron cargar los roles disponibles</span>
                  )
                ) : (
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    userInfo?.role.toLowerCase() === 'docente' 
                      ? 'bg-rs-100 text-rs-700' 
                      : userInfo?.role.toLowerCase() === 'administrador'
                      ? 'bg-rs-warn-bg text-rs-warn'
                      : 'bg-rs-100 text-rs-700'
                  }`}>
                    {userInfo?.role}
                  </span>
                )}
              </div>
              
              <div className="border-b border-rs-input p-4 font-medium bg-white">Fecha de registro</div>
              <div className="border-b border-rs-input p-4">{userInfo?.createdAt}</div>

              <div className="border-b border-rs-input p-4 font-medium bg-white">Teléfono</div>
              <div className="border-b border-rs-input p-4">
                {isEditing ? (
                  <input
                    type="text"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    placeholder="No especificado"
                    className="w-full bg-white border border-rs-line rounded px-3 py-1 focus:outline-none focus:ring-2 focus:ring-rs-700"
                  />
                ) : (
                  userInfo?.phone
                )}
              </div>

              <div className="border-b border-rs-input p-4 font-medium bg-white">Dirección</div>
              <div className="border-b border-rs-input p-4">
                {isEditing ? (
                  <input
                    type="text"
                    value={editForm.address}
                    onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                    placeholder="No especificado"
                    className="w-full bg-white border border-rs-line rounded px-3 py-1 focus:outline-none focus:ring-2 focus:ring-rs-700"
                  />
                ) : (
                  userInfo?.address
                )}
              </div>

              <div className="p-4 font-medium bg-white">Fecha de nacimiento</div>
              <div className="p-4">
                {isEditing ? (
                  <input
                    type="date"
                    value={editForm.birthDate}
                    onChange={(e) => setEditForm({ ...editForm, birthDate: e.target.value })}
                    className="w-full bg-white border border-rs-line rounded px-3 py-1 focus:outline-none focus:ring-2 focus:ring-rs-700"
                  />
                ) : (
                  userInfo?.birthDate
                )}
              </div>

            </div>

            {/* Botón de volver */}
            <div className="mt-6 flex justify-center">
              <a
                href="/users/list"
                className="px-6 py-2 bg-rs-100 hover:bg-rs-200 rounded-lg transition"
              >
                Volver a la lista
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function UserProfile() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-rs-50 text-rs-ink">
          Cargando usuario...
        </div>
      }
    >
      <UserProfileContent />
    </Suspense>
  );
}
