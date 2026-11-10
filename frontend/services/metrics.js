const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

const EMPTY_COURSE_STATS = {
  averageStudents: 0,
  courseWithMostStudents: null,
  courseWithLeastStudents: null,
};

function calcularEstadisticasCursos(courses) {
  if (!Array.isArray(courses) || courses.length === 0) {
    return { ...EMPTY_COURSE_STATS };
  }

  const coursesWithStudentCount = courses.map((course) => ({
    ...course,
    studentCount: Array.isArray(course.students) ? course.students.length : 0,
  }));

  const totalStudents = coursesWithStudentCount.reduce(
    (sum, course) => sum + course.studentCount,
    0
  );
  const averageStudents = totalStudents / coursesWithStudentCount.length;

  const courseWithMostStudents = coursesWithStudentCount.reduce((max, course) =>
    course.studentCount > max.studentCount ? course : max
  );
  const courseWithLeastStudents = coursesWithStudentCount.reduce((min, course) =>
    course.studentCount < min.studentCount ? course : min
  );

  return {
    averageStudents: parseFloat(averageStudents.toFixed(1)),
    courseWithMostStudents: {
      name: courseWithMostStudents.name,
      studentCount: courseWithMostStudents.studentCount,
    },
    courseWithLeastStudents: {
      name: courseWithLeastStudents.name,
      studentCount: courseWithLeastStudents.studentCount,
    },
  };
}

/**
 * Obtiene el total de estudiantes del sistema (solo administradores)
 */
export async function getTotalStudentsCount() {
  try {
    const token = localStorage.getItem('access_token');
    
    const response = await fetch(`${API_URL}/users?role=estudiante`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Error fetching students');
    }

    const students = await response.json();
    return Array.isArray(students) ? students.length : 0;
  } catch (error) {
    console.error('Error in getTotalStudentsCount:', error);
    return 0;
  }
}

/**
 * Obtiene el total de docentes del sistema (solo administradores)
 */
export async function getTotalTeachersCount() {
  try {
    const token = localStorage.getItem('access_token');
    
    const response = await fetch(`${API_URL}/users?role=docente`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Error fetching teachers');
    }

    const teachers = await response.json();
    return Array.isArray(teachers) ? teachers.length : 0;
  } catch (error) {
    console.error('Error in getTotalTeachersCount:', error);
    return 0;
  }
}

/**
 * Obtiene el total de cursos activos del sistema (solo administradores)
 */
export async function getTotalCoursesCount() {
  try {
    const token = localStorage.getItem('access_token');
    
    const response = await fetch(`${API_URL}/courses`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Error fetching courses');
    }

    const courses = await response.json();
    return Array.isArray(courses) ? courses.length : 0;
  } catch (error) {
    console.error('Error in getTotalCoursesCount:', error);
    return 0;
  }
}

/**
 * Obtiene estadísticas globales de todos los cursos del sistema (solo administradores)
 * Incluye: promedio de estudiantes, curso con más/menos estudiantes
 */
export async function getGlobalCourseStatistics() {
  try {
    const token = localStorage.getItem('access_token');
    
    const response = await fetch(`${API_URL}/courses`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Error fetching courses');
    }

    return calcularEstadisticasCursos(await response.json());
  } catch (error) {
    console.error('Error in getGlobalCourseStatistics:', error);
    return {
      averageStudents: 0,
      courseWithMostStudents: null,
      courseWithLeastStudents: null,
    };
  }
}

/**
 * Obtiene la cantidad de cursos que un profesor está impartiendo
 */
export async function getTeacherCoursesCount(teacherId) {
  try {
    const token = localStorage.getItem('access_token');
    
    const response = await fetch(`${API_URL}/courses/by-teacher/${encodeURIComponent(teacherId)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Error fetching teacher courses');
    }

    const courses = await response.json();
    return Array.isArray(courses) ? courses.length : 0;
  } catch (error) {
    console.error('Error in getTeacherCoursesCount:', error);
    return 0;
  }
}

/**
 * Obtiene la cantidad de estudiantes únicos a los que un profesor está dando clase
 */
export async function getTeacherUniqueStudentsCount(teacherId) {
  try {
    const token = localStorage.getItem('access_token');
    
    const response = await fetch(`${API_URL}/courses/by-teacher/${encodeURIComponent(teacherId)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Error fetching teacher courses');
    }

    const courses = await response.json();
    
    if (!Array.isArray(courses)) {
      return 0;
    }

    // Recopilar todos los estudiantes únicos de todos los cursos
    const uniqueStudents = new Set();
    courses.forEach(course => {
      if (Array.isArray(course.students)) {
        course.students.forEach(student => {
          // Usar el ID del estudiante para asegurar unicidad
          if (student._id) {
            uniqueStudents.add(student._id);
          } else if (typeof student === 'string') {
            uniqueStudents.add(student);
          }
        });
      }
    });

    return uniqueStudents.size;
  } catch (error) {
    console.error('Error in getTeacherUniqueStudentsCount:', error);
    return 0;
  }
}

/**
 * Obtiene las estadísticas de materiales generados por IA agrupados por estado
 * Solo para administradores
 */
export async function getGeneratedMaterialsStats() {
  try {
    const token = localStorage.getItem('access_token');
    
    const response = await fetch(`${API_URL}/materials`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Error fetching materials');
    }

    const materials = await response.json();
    
    if (!Array.isArray(materials)) {
      return {
        PENDIENTE_REVISION: 0,
        ERROR_GENERACION: 0,
        PUBLICADO: 0,
        total: 0
      };
    }

    // Contar materiales por estado
    const stats = {
      PENDIENTE_REVISION: 0,
      ERROR_GENERACION: 0,
      PUBLICADO: 0,
      total: materials.length
    };

    materials.forEach(material => {
      if (material.estado === 'PENDIENTE_REVISION') {
        stats.PENDIENTE_REVISION++;
      } else if (material.estado === 'ERROR_GENERACION') {
        stats.ERROR_GENERACION++;
      } else if (material.estado === 'PUBLICADO') {
        stats.PUBLICADO++;
      }
    });

    return stats;
  } catch (error) {
    console.error('Error in getGeneratedMaterialsStats:', error);
    return {
      PENDIENTE_REVISION: 0,
      ERROR_GENERACION: 0,
      PUBLICADO: 0,
      total: 0
    };
  }
}

/**
 * Obtiene estadísticas avanzadas de los cursos de un profesor
 * Incluye: promedio de estudiantes, curso con más/menos estudiantes
 */
export async function getCourseStatistics(teacherId) {
  try {
    const token = localStorage.getItem('access_token');
    
    const response = await fetch(`${API_URL}/courses/by-teacher/${encodeURIComponent(teacherId)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Error fetching teacher courses');
    }

    return calcularEstadisticasCursos(await response.json());
  } catch (error) {
    console.error('Error in getCourseStatistics:', error);
    return {
      averageStudents: 0,
      courseWithMostStudents: null,
      courseWithLeastStudents: null,
    };
  }
}

/**
 * Obtiene los cursos sin material generado (solo para docentes)
 * Retorna lista de cursos que aún no tienen contenido generado por IA
 */
export async function getCoursesWithoutMaterial(teacherId) {
  try {
    const token = localStorage.getItem('access_token');
    
    // Obtener todos los cursos del profesor
    const coursesResponse = await fetch(`${API_URL}/courses/by-teacher/${encodeURIComponent(teacherId)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!coursesResponse.ok) {
      throw new Error('Error fetching teacher courses');
    }

    const courses = await coursesResponse.json();
    
    if (!Array.isArray(courses)) {
      return [];
    }

    // Obtener todos los materiales
    const materialsResponse = await fetch(`${API_URL}/materials`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!materialsResponse.ok) {
      throw new Error('Error fetching materials');
    }

    const materials = await materialsResponse.json();
    
    if (!Array.isArray(materials)) {
      return courses;
    }

    // Crear un Set de IDs de cursos que tienen materiales
    const coursesWithMaterials = new Set(
      materials.map(material => material.courseId?.toString())
    );

    // Filtrar cursos sin materiales
    const coursesWithoutMaterial = courses.filter(course => 
      !coursesWithMaterials.has(course._id?.toString())
    );

    return coursesWithoutMaterial.map(course => ({
      _id: course._id,
      name: course.name,
      description: course.description,
      studentCount: Array.isArray(course.students) ? course.students.length : 0,
    }));
  } catch (error) {
    console.error('Error in getCoursesWithoutMaterial:', error);
    return [];
  }
}
