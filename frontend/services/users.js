// Servicios para usuarios: login y registro

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export async function loginUser({ email, password }) {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });
  if (res.status === 401) {
    return { error: "Credenciales inválidas" };
  }
  if (!res.ok) {
    const errorText = await res.text();
    return { error: errorText || "Error al iniciar sesión" };
  }

  const data = await res.json();

  // Guardar el token en localStorage
  if (data.access_token) {
    localStorage.setItem("access_token", data.access_token);
  }

  return data;
}

export async function registerUser({ name, email, password }) {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name, email, password }),
  });
  if (res.status === 409) {
    return { error: "El email ya está registrado" };
  }
  if (!res.ok) {
    const errorText = await res.text();
    return { error: errorText || "Error al registrar usuario" };
  }
  return res.json();
}

export async function getUserProfile() {
  const token = localStorage.getItem("access_token");
  if (!token) {
    throw new Error("No se encontró un token de acceso. Por favor, inicia sesión.");
  }

  const res = await fetch(`${API_URL}/auth/profile`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (res.status === 401) {
    throw new Error("No autorizado. El token puede haber expirado. Por favor, inicia sesión nuevamente.");
  }

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || "Error al obtener el perfil del usuario");
  }

  return res.json();
}

export async function verifyCode({ email, code }) {
  const res = await fetch(`${API_URL}/auth/verify-code`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, code }),
  });

  if (res.status === 401) {
    return { error: "Código inválido o expirado" };
  }

  if (!res.ok) {
    const errorText = await res.text();
    return { error: errorText || "Error al verificar el código" };
  }

  return res.json();
}

export async function getUserById(userId) {
  const token = localStorage.getItem("access_token");
  if (!token) {
    throw new Error("No se encontró un token de acceso. Por favor, inicia sesión.");
  }

  const res = await fetch(`${API_URL}/users/${userId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (res.status === 404) {
    throw new Error("Usuario no encontrado.");
  }

  if (res.status === 401) {
    throw new Error("No autorizado. El token puede haber expirado. Por favor, inicia sesión nuevamente.");
  }

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || "Error al obtener el usuario");
  }

  return res.json();
}

export async function updateUserProfile(userId, { name, email, phone, address, birthDate, roleId }, isAdmin = false) {
  const token = localStorage.getItem("access_token");
  if (!token) {
    throw new Error("No se encontró un token de acceso. Por favor, inicia sesión.");
  }

  // Construir el body según si es admin o no
  const body = isAdmin 
    ? { name, email, phone, address, birthDate, roleId }
    : { name, email, phone, address, birthDate };

  const res = await fetch(`${API_URL}/users/${userId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  if (res.status === 401) {
    throw new Error("No autorizado. El token puede haber expirado. Por favor, inicia sesión nuevamente.");
  }

  if (res.status === 403) {
    throw new Error("No tienes permiso para actualizar este usuario.");
  }

  if (res.status === 409) {
    throw new Error("El email ya está en uso por otro usuario.");
  }

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || "Error al actualizar el perfil del usuario");
  }

  return res.json();
}

export async function getAllUsers() {
  const token = localStorage.getItem("access_token");
  if (!token) {
    throw new Error("No se encontró un token de acceso. Por favor, inicia sesión.");
  }

  try {
    // Obtener estudiantes y docentes en paralelo
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

    return [...students, ...teachers];
  } catch (error) {
    console.error("Error al obtener usuarios:", error);
    throw new Error("Error al cargar usuarios");
  }
}

/**
 * Obtiene los roles disponibles del sistema extrayéndolos de todos los usuarios
 * Como no existe un endpoint específico para roles, los obtenemos de los usuarios existentes
 */
export async function getAvailableRoles() {
  const token = localStorage.getItem("access_token");
  if (!token) {
    throw new Error("No se encontró un token de acceso. Por favor, inicia sesión.");
  }

  try {
    // Obtener todos los usuarios para extraer sus roles
    const users = await getAllUsers();
    
    // Extraer roles únicos de todos los usuarios
    const rolesMap = new Map();
    users.forEach(user => {
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
    
    return Array.from(rolesMap.values());
  } catch (error) {
    console.error("Error al obtener los roles:", error);
    // Si falla, retornar roles por defecto basados en el sistema
    return [];
  }
}

/**
 * Obtiene los profesores/docentes asignados al estudiante actual
 * Esta función es para uso exclusivo de estudiantes
 */
export async function getMyTeachers() {
  const token = localStorage.getItem("access_token");
  if (!token) {
    throw new Error("No se encontró un token de acceso. Por favor, inicia sesión.");
  }

  const res = await fetch(`${API_URL}/users/my-teachers`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (res.status === 401) {
    throw new Error("No autorizado. El token puede haber expirado. Por favor, inicia sesión nuevamente.");
  }

  if (res.status === 403) {
    throw new Error("No tienes permiso para acceder a esta información.");
  }

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || "Error al obtener los profesores");
  }

  return res.json();
}

/**
 * Elimina un usuario del sistema
 * Esta función es para uso exclusivo de administradores
 */
export async function deleteUser(userId) {
  const token = localStorage.getItem("access_token");
  if (!token) {
    throw new Error("No se encontró un token de acceso. Por favor, inicia sesión.");
  }

  const res = await fetch(`${API_URL}/users/${userId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (res.status === 401) {
    throw new Error("No autorizado. El token puede haber expirado. Por favor, inicia sesión nuevamente.");
  }

  if (res.status === 403) {
    throw new Error("No tienes permiso para eliminar este usuario.");
  }

  if (res.status === 404) {
    throw new Error("Usuario no encontrado.");
  }

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || "Error al eliminar el usuario");
  }

  // Si la respuesta es 204 No Content, no hay JSON que parsear
  if (res.status === 204) {
    return { success: true };
  }

  // Verificar si hay contenido antes de parsear JSON
  const text = await res.text();
  return text ? JSON.parse(text) : { success: true };
}

async function parseError(res, fallback) {
  const data = await res.json().catch(() => null);
  if (!data) return fallback;
  return data.message || fallback;
}

export async function forgotPassword({ email }) {
  const res = await fetch(`${API_URL}/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });

  if (!res.ok) {
    return { error: await parseError(res, "Error al solicitar la recuperación") };
  }

  return res.json();
}

export async function resetPassword({ token, newPassword, confirmPassword }) {
  const res = await fetch(`${API_URL}/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, newPassword, confirmPassword }),
  });

  if (!res.ok) {
    return { error: await parseError(res, "Error al restablecer la contraseña") };
  }

  return res.json();
}
