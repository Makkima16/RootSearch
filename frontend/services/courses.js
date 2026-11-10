const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export async function createCourse(courseData) {
  const token = localStorage.getItem('access_token');
  
  const response = await fetch(`${API_URL}/courses`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(courseData),
  });

  if (!response.ok) {
    throw new Error('Error creating course');
  }

  return response.json();
}

export async function createCourseWithFile(formData) {
  const token = localStorage.getItem('access_token');
  
  if (!token) {
    throw new Error('No se encontró un token de acceso. Por favor, inicia sesión.');
  }
  
  const response = await fetch(`${API_URL}/courses`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      // No establecer Content-Type cuando se envía FormData
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Error desconocido');
    throw new Error(errorText || 'Error al crear el curso');
  }

  return response.json();
}

export async function getCoursesByTeacher(teacherId) {
  const token = localStorage.getItem('access_token'); // Usar la clave correcta

  const response = await fetch(`${API_URL}/courses/by-teacher/${encodeURIComponent(teacherId)}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Error fetching courses for teacher');
  }

  return response.json();
}

export async function getAllCourses(userId, filterType = 'both') {
  const token = localStorage.getItem('access_token');
  let url = `${API_URL}/courses`;
  
  // Si se proporciona un userId, agregarlo como parámetro query según el tipo de filtro
  if (userId) {
    if (filterType === 'teacher') {
      url += `?teacher=${userId}`;
    } else if (filterType === 'student') {
      url += `?student=${userId}`;
    } else {
      // Por defecto, buscar en ambos (para compatibilidad con código existente)
      url += `?teacher=${userId}&student=${userId}`;
    }
  }
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Error fetching all courses');
  }

  return response.json();
}

export async function getAllCoursesForAdmin() {
  const token = localStorage.getItem('access_token');

  const response = await fetch(`${API_URL}/courses/all`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.message || `Error fetching all courses for admin (${response.status})`);
  }

  return response.json();
}

export async function getCourseById(courseId) {
  const token = localStorage.getItem('access_token');

  const response = await fetch(`${API_URL}/courses/${encodeURIComponent(courseId)}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Error fetching course details');
  }

  return response.json();
}

export async function enrollStudentsToCourse(courseId, studentIds) {
  const token = localStorage.getItem('access_token');

  const response = await fetch(`${API_URL}/courses/${encodeURIComponent(courseId)}/enroll`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ studentIds }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.message || 'Error al agregar estudiantes al curso');
  }

  return response.json();
}

export async function unenrollStudentsFromCourse(courseId, studentIds) {
  const token = localStorage.getItem('access_token');

  const response = await fetch(`${API_URL}/courses/${encodeURIComponent(courseId)}/unenroll`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ studentIds }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.message || 'Error al eliminar estudiantes del curso');
  }

  return response.json();
}

export async function updateCourseWithFile(courseId, formData) {
  const token = localStorage.getItem('access_token');
  
  if (!token) {
    throw new Error('No se encontró un token de acceso. Por favor, inicia sesión.');
  }
  
  const response = await fetch(`${API_URL}/courses/${encodeURIComponent(courseId)}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      // No establecer Content-Type cuando se envía FormData
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Error desconocido');
    throw new Error(errorText || 'Error al actualizar el curso');
  }

  return response.json();
}