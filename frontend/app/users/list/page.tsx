"use client";

import { useEffect, useState } from "react";
import { getUserProfile, getAllUsers, deleteUser } from "../../../services/users";
import SideBar from "@/components/SideBar";
import CreateUserModal from "@/components/create_user";
import Toast from "@/components/Toast";
import { LuGraduationCap, LuLoaderCircle, LuPlus, LuPresentation, LuTrash2, LuUsers } from 'react-icons/lu';

type User = {
  _id?: string;
  name: string;
  email: string;
  createdAt: string;
  roles?: Array<{ name: string }>;
};

export default function UsersPage() {
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string; role: string } | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [roleFilter, setRoleFilter] = useState<"estudiante" | "docente" | "todos">("todos");
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "info" | "success" | "error" } | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUser() {
      try {
        const userData = await getUserProfile();
        const role = userData.roles?.[0]?.name || "";

        if (role.toLowerCase() !== "administrador") {
          setError("No tienes permisos para acceder a esta sección.");
          setLoading(false);
          return;
        }

        setCurrentUser({ id: userData._id, name: userData.name, role });
      } catch (error) {
        console.error("Error al obtener el perfil del usuario:", error);
        setError("Error al verificar permisos");
        setLoading(false);
      }
    }
    fetchUser();
  }, []);

  useEffect(() => {
    async function fetchUsers() {
      if (currentUser) {
        setLoading(true);
        try {
          const allUsers = await getAllUsers();
          setUsers(allUsers);
          setFilteredUsers(allUsers);
        } catch (error) {
          console.error("Error al obtener usuarios:", error);
          setError("Error al cargar usuarios");
        } finally {
          setLoading(false);
        }
      }
    }
    fetchUsers();
  }, [currentUser]);

  // Filtrar usuarios por rol y búsqueda
  useEffect(() => {
    let filtered = users;

    // Filtrar por rol
    if (roleFilter !== "todos") {
      filtered = filtered.filter((user) => {
        const userRole = user.roles?.[0]?.name?.toLowerCase() || "";
        return userRole === roleFilter;
      });
    }

    // Filtrar por búsqueda de nombre
    if (searchTerm) {
      filtered = filtered.filter((user) =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredUsers(filtered);
  }, [roleFilter, searchTerm, users]);

  const handleCreateUserSuccess = async () => {
    // Recargar la lista de usuarios
    try {
      const allUsers = await getAllUsers();
      setUsers(allUsers);
      setFilteredUsers(allUsers);
    } catch (error) {
      console.error("Error al recargar usuarios:", error);
    }
  };

  const [userToDelete, setUserToDelete] = useState<{ id: string; name: string } | null>(null);

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    setDeletingUserId(userToDelete.id);
    try {
      await deleteUser(userToDelete.id);
      setToast({ message: `Usuario "${userToDelete.name}" eliminado exitosamente`, type: "success" });
      
      // Recargar la lista de usuarios
      const allUsers = await getAllUsers();
      setUsers(allUsers);
      setFilteredUsers(allUsers);
    } catch (error: any) {
      console.error("Error al eliminar usuario:", error);
      setToast({ message: error.message || "Error al eliminar el usuario", type: "error" });
    } finally {
      setDeletingUserId(null);
      setUserToDelete(null);
    }
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
    <div className="flex flex-col lg:flex-row min-h-screen bg-rs-50 text-rs-ink font-sans">
      <SideBar user={currentUser!} />
      <main className="min-w-0 flex-1 px-4 py-8 sm:px-6 lg:px-10">
        <div className="mb-6 sm:mb-8 flex items-center gap-3">
          <h1 className="rs-title text-2xl sm:text-3xl flex items-center gap-2">
            <LuUsers className="text-rs-700 text-xl sm:text-2xl" /> 
            <span className="hidden sm:inline">Gestión de Usuarios</span>
            <span className="sm:hidden">Gestión de Usuarios</span>
          </h1>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-rs-700 hover:bg-rs-800 text-white p-2 rounded-lg transition cursor-pointer"
            title="Crear nuevo usuario"
          >
            <LuPlus className="text-lg" />
          </button>
        </div>

        {/* Filtros */}
        <div className="mb-4 sm:mb-6 bg-rs-surface rounded-lg p-4 sm:p-6 shadow-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            {/* Búsqueda por nombre */}
            <div>
              <label htmlFor="search" className="block text-xs sm:text-sm font-medium mb-2 text-rs-muted">
                Buscar por nombre
              </label>
              <input
                id="search"
                type="text"
                placeholder="Escribe un nombre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 sm:px-4 bg-white border border-rs-line rounded-lg text-sm sm:text-base text-rs-ink placeholder-rs-muted/70 focus:outline-none focus:ring-2 focus:ring-rs-700 transition"
              />
            </div>

            {/* Filtro por rol */}
            <div>
              <label htmlFor="roleFilter" className="block text-xs sm:text-sm font-medium mb-2 text-rs-muted">
                Filtrar por rol
              </label>
              <select
                id="roleFilter"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as "estudiante" | "docente" | "todos")}
                className="w-full px-3 py-2 sm:px-4 bg-white border border-rs-line rounded-lg text-sm sm:text-base text-rs-ink focus:outline-none focus:ring-2 focus:ring-rs-700 transition cursor-pointer"
              >
                <option value="todos">Todos los usuarios</option>
                <option value="estudiante">Estudiantes</option>
                <option value="docente">Docentes</option>
              </select>
            </div>
          </div>

          {/* Resumen de filtros */}
          <div className="mt-3 sm:mt-4 flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-rs-muted">
            <span>Mostrando {filteredUsers.length} de {users.length} usuarios</span>
            {searchTerm && (
              <span className="px-3 py-1 bg-rs-100 rounded-full">
                Búsqueda: "{searchTerm}"
              </span>
            )}
            {roleFilter !== "todos" && (
              <span className="px-3 py-1 bg-rs-100 rounded-full flex items-center gap-2">
                {roleFilter === "estudiante" ? (
                  <>
                    <LuGraduationCap /> Estudiantes
                  </>
                ) : (
                  <>
                    <LuPresentation /> Docentes
                  </>
                )}
              </span>
            )}
          </div>
        </div>

        {/* Tabla de usuarios */}
        <div className="w-full overflow-x-auto rounded-lg shadow-lg bg-rs-surface">
          <table className="min-w-[600px] w-full text-sm text-rs-ink">
            <thead className="bg-white">
              <tr>
                <th className="py-2 sm:py-3 px-2 sm:px-4 text-left whitespace-nowrap text-xs sm:text-sm">Nombre</th>
                <th className="py-2 sm:py-3 px-2 sm:px-4 text-left whitespace-nowrap text-xs sm:text-sm">Correo</th>
                <th className="py-2 sm:py-3 px-2 sm:px-4 text-left whitespace-nowrap text-xs sm:text-sm">Rol</th>
                <th className="py-2 sm:py-3 px-2 sm:px-4 text-left whitespace-nowrap text-xs sm:text-sm">Fecha de registro</th>
                <th className="py-2 sm:py-3 px-2 sm:px-4 text-center whitespace-nowrap text-xs sm:text-sm">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 px-4 text-center text-rs-muted">
                    {searchTerm || roleFilter !== "todos"
                      ? "No se encontraron usuarios con los filtros aplicados."
                      : "No hay usuarios registrados."}
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user, idx) => {
                  const userRole = user.roles?.[0]?.name?.toLowerCase() || "";
                  const isDeleting = deletingUserId === user._id;
                  return (
                    <tr
                      key={user._id || idx}
                      className="border-b border-rs-line hover:bg-rs-50 transition"
                    >
                      <td 
                        className="py-2 sm:py-3 px-2 sm:px-4 whitespace-nowrap text-xs sm:text-sm md:text-base flex items-center gap-2 sm:gap-3 cursor-pointer"
                        onClick={() => {
                          window.location.href = `/users/view?userId=${user._id}`;
                        }}
                      >
                        <div className={`w-6 h-6 sm:w-8 sm:h-8 ${userRole === "docente" ? "bg-rs-900" : "bg-rs-700"} text-white rounded-full flex items-center justify-center text-xs sm:text-base`}>
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="truncate max-w-[100px] sm:max-w-[150px] md:max-w-none">{user.name}</span>
                      </td>
                      <td 
                        className="py-2 sm:py-3 px-2 sm:px-4 whitespace-nowrap text-xs sm:text-sm md:text-base cursor-pointer"
                        onClick={() => {
                          window.location.href = `/users/view?userId=${user._id}`;
                        }}
                      >
                        <span className="truncate max-w-[120px] sm:max-w-none inline-block">{user.email}</span>
                      </td>
                      <td 
                        className="py-2 sm:py-3 px-2 sm:px-4 whitespace-nowrap text-xs sm:text-sm md:text-base cursor-pointer"
                        onClick={() => {
                          window.location.href = `/users/view?userId=${user._id}`;
                        }}
                      >
                        <span className={`px-2 py-1 sm:px-3 rounded-full text-xs font-semibold ${
                          userRole === "docente" 
                            ? "bg-rs-100 text-rs-700" 
                            : "bg-rs-100 text-rs-700"
                        }`}>
                          {userRole === "docente" ? "Docente" : "Estudiante"}
                        </span>
                      </td>
                      <td 
                        className="py-2 sm:py-3 px-2 sm:px-4 whitespace-nowrap text-xs sm:text-sm md:text-base cursor-pointer"
                        onClick={() => {
                          window.location.href = `/users/view?userId=${user._id}`;
                        }}
                      >
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-2 sm:py-3 px-2 sm:px-4 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setUserToDelete({ id: user._id!, name: user.name });
                          }}
                          disabled={isDeleting}
                          className={`${
                            isDeleting 
                              ? 'bg-rs-400 cursor-not-allowed' 
                              : 'bg-rs-error hover:bg-[#7f1e10] cursor-pointer'
                          } text-white px-3 py-1 rounded-lg transition text-xs sm:text-sm flex items-center gap-1 mx-auto`}
                          title="Eliminar usuario"
                        >
                          {isDeleting ? (
                            <LuLoaderCircle className="animate-spin" />
                          ) : (
                            <>
                              <LuTrash2 className="text-xs" />
                              <span className="hidden sm:inline">Eliminar</span>
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </main>

      {/* Modal de Crear Usuario */}
      <CreateUserModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateUserSuccess}
      />

      {/* Modal de confirmación de eliminación */}
      {userToDelete && (
        <div className="fixed inset-0 bg-rs-950/60 flex items-center justify-center z-50 p-4">
          <div className="bg-rs-surface rounded-lg shadow-2xl max-w-md w-full border border-rs-line">
            <div className="p-6">
              <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-rs-error-bg rounded-full">
                <LuTrash2 className="text-3xl text-rs-error" />
              </div>
              <h2 className="text-xl font-bold text-rs-ink text-center mb-2">
                ¿Eliminar usuario?
              </h2>
              <p className="text-rs-muted text-center mb-6">
                ¿Estás seguro de que deseas eliminar al usuario{" "}
                <span className="text-rs-ink font-semibold">"{userToDelete.name}"</span>?
                <br />
                <span className="text-rs-error text-sm">Esta acción no se puede deshacer.</span>
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setUserToDelete(null)}
                  disabled={deletingUserId === userToDelete.id}
                  className="flex-1 bg-rs-line hover:bg-rs-200 text-rs-ink px-4 py-2 rounded-lg transition font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDeleteUser}
                  disabled={deletingUserId === userToDelete.id}
                  className="flex-1 bg-rs-error hover:bg-[#7f1e10] text-white px-4 py-2 rounded-lg transition font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {deletingUserId === userToDelete.id ? (
                    <>
                      <LuLoaderCircle className="animate-spin" />
                      Eliminando...
                    </>
                  ) : (
                    "Eliminar"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast de notificaciones */}
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
