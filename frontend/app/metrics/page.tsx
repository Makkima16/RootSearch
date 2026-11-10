"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import SideBar from "@/components/SideBar";
import { getUserProfile } from "@/services/users";
import {
  getTeacherCoursesCount,
  getTeacherUniqueStudentsCount,
  getGeneratedMaterialsStats,
  getCourseStatistics,
  getCoursesWithoutMaterial,
  getTotalStudentsCount,
  getTotalTeachersCount,
  getTotalCoursesCount,
  getGlobalCourseStatistics,
} from "@/services/metrics";
import {
  LuArrowRight,
  LuBadgeCheck,
  LuBookOpen,
  LuChartColumn,
  LuCircleAlert,
  LuGraduationCap,
  LuTrendingDown,
  LuTrophy,
  LuUsers,
} from "react-icons/lu";
import { LoadingScreen, MessageScreen, PageHeader, StatCard } from "@/components/ui";

type MaterialsStats = {
  PENDIENTE_REVISION: number;
  ERROR_GENERACION: number;
  PUBLICADO: number;
  total: number;
};

type CourseStats = {
  averageStudents: number;
  courseWithMostStudents: {
    name: string;
    studentCount: number;
  } | null;
  courseWithLeastStudents: {
    name: string;
    studentCount: number;
  } | null;
};

type CourseWithoutMaterial = {
  _id: string;
  name: string;
  description: string;
  studentCount: number;
};

export default function MetricsPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; name: string; role: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [metrics, setMetrics] = useState<{
    coursesCount: number;
    studentsCount: number;
    teachersCount: number;
    materialsStats: MaterialsStats | null;
    courseStats: CourseStats | null;
    coursesWithoutMaterial: CourseWithoutMaterial[];
  }>({
    coursesCount: 0,
    studentsCount: 0,
    teachersCount: 0,
    materialsStats: null,
    courseStats: null,
    coursesWithoutMaterial: [],
  });

  useEffect(() => {
    const initializePage = async () => {
      try {
        const userData = await getUserProfile();
        const role = userData.roles?.[0]?.name || null;

        if (!role || !["docente", "administrador"].includes(role.toLowerCase())) {
          setError("No tienes permisos para acceder a esta sección.");
          return;
        }

        setUser({ id: userData._id, name: userData.name, role });

        // Cargar métricas según el rol
        if (role.toLowerCase() === "administrador") {
          // Para administradores: métricas globales del sistema
          const [coursesCount, studentsCount, teachersCount, courseStats, materialsStats] = await Promise.all([
            getTotalCoursesCount(),
            getTotalStudentsCount(),
            getTotalTeachersCount(),
            getGlobalCourseStatistics(),
            getGeneratedMaterialsStats(),
          ]);

          setMetrics({
            coursesCount,
            studentsCount,
            teachersCount,
            materialsStats,
            courseStats,
            coursesWithoutMaterial: [],
          });
        } else if (role.toLowerCase() === "docente") {
          // Para docentes: métricas personales
          const [coursesCount, studentsCount, courseStats, coursesWithoutMaterial] = await Promise.all([
            getTeacherCoursesCount(userData._id),
            getTeacherUniqueStudentsCount(userData._id),
            getCourseStatistics(userData._id),
            getCoursesWithoutMaterial(userData._id),
          ]);

          setMetrics({
            coursesCount,
            studentsCount,
            teachersCount: 0,
            materialsStats: null,
            courseStats,
            coursesWithoutMaterial,
          });
        }
      } catch (err) {
        const errorMessage =
          typeof err === "object" && err !== null && "message" in err
            ? (err as { message?: string }).message ?? "Error desconocido"
            : "Error desconocido";

        setError("Error al obtener los datos del usuario: " + errorMessage);
        router.push("/auth/login");
      } finally {
        setLoading(false);
      }
    };

    initializePage();
  }, [router]);

  if (loading) {
    return <LoadingScreen label="Cargando métricas..." />;
  }

  if (error || !user) {
    return (
      <div className="flex min-h-screen flex-col bg-rs-50 lg:flex-row">
        <SideBar user={user ?? undefined} />
        <MessageScreen
          title="Acceso denegado"
          message={error || "No tienes permisos para acceder a esta sección"}
          action={
            <a href="/" className="rs-btn-primary">
              Volver al inicio
            </a>
          }
        />
      </div>
    );
  }

  const renderPieChart = () => {
    if (!metrics.materialsStats) return null;

    const { PENDIENTE_REVISION, ERROR_GENERACION, PUBLICADO, total } =
      metrics.materialsStats;

    // Calcular porcentajes
    const percentages = {
      PENDIENTE_REVISION: total > 0 ? (PENDIENTE_REVISION / total) * 100 : 0,
      ERROR_GENERACION: total > 0 ? (ERROR_GENERACION / total) * 100 : 0,
      PUBLICADO: total > 0 ? (PUBLICADO / total) * 100 : 0,
    };

    // Crear el gráfico SVG
    let currentAngle = 0;
    const radius = 100;
    const centerX = 120;
    const centerY = 120;

    const createSlice = (percentage: number, color: string) => {
      if (percentage === 0) return null;

      // Una porción del 100 % no se puede dibujar como arco: se dibuja un círculo completo
      if (percentage >= 100) {
        return <circle cx={centerX} cy={centerY} r={radius} fill={color} key={color} />;
      }

      const angle = (percentage / 100) * 360;
      const startAngle = currentAngle;
      const endAngle = currentAngle + angle;

      const startX =
        centerX + radius * Math.cos((Math.PI * startAngle) / 180);
      const startY =
        centerY + radius * Math.sin((Math.PI * startAngle) / 180);
      const endX = centerX + radius * Math.cos((Math.PI * endAngle) / 180);
      const endY = centerY + radius * Math.sin((Math.PI * endAngle) / 180);

      const largeArcFlag = angle > 180 ? 1 : 0;

      const pathData = [
        `M ${centerX} ${centerY}`,
        `L ${startX} ${startY}`,
        `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY}`,
        "Z",
      ].join(" ");

      currentAngle = endAngle;

      return <path d={pathData} fill={color} stroke="#F8FBF8" strokeWidth={2} key={color} />;
    };

    // Colores de la paleta, separados también por luminosidad
    const colors = {
      PENDIENTE_REVISION: "#E8B04B", // ámbar
      ERROR_GENERACION: "#C0412B", // terracota
      PUBLICADO: "#12392C", // verde profundo
    };

    const legend = [
      { key: "PENDIENTE_REVISION" as const, label: "Pendiente de revisión", value: PENDIENTE_REVISION },
      { key: "ERROR_GENERACION" as const, label: "Error de generación", value: ERROR_GENERACION },
      { key: "PUBLICADO" as const, label: "Publicado", value: PUBLICADO },
    ];

    return (
      <section className="rs-card mt-6 p-6">
        <h2 className="rs-title mb-6 text-xl">Contenido generado por IA</h2>
        <div className="flex flex-col items-center justify-center gap-8 md:flex-row">
          <svg
            width="240"
            height="240"
            viewBox="0 0 240 240"
            role="img"
            aria-label={`Publicado ${PUBLICADO}, pendiente ${PENDIENTE_REVISION}, error ${ERROR_GENERACION}`}
            className="max-w-full"
          >
            {total === 0 && <circle cx={centerX} cy={centerY} r={radius} fill="#DCEDE3" />}
            {createSlice(percentages.PENDIENTE_REVISION, colors.PENDIENTE_REVISION)}
            {createSlice(percentages.ERROR_GENERACION, colors.ERROR_GENERACION)}
            {createSlice(percentages.PUBLICADO, colors.PUBLICADO)}
          </svg>
          <div className="flex flex-col gap-3">
            {legend.map((item) => (
              <div key={item.key} className="flex items-center gap-3">
                <span className="size-5 shrink-0 rounded" style={{ backgroundColor: colors[item.key] }} />
                <div>
                  <p className="text-sm text-rs-muted">{item.label}</p>
                  <p className="text-lg font-semibold text-rs-ink">
                    {item.value} ({percentages[item.key].toFixed(1)}%)
                  </p>
                </div>
              </div>
            ))}
            <div className="mt-2 border-t border-rs-line pt-3">
              <p className="text-sm text-rs-muted">Total de materiales</p>
              <p className="font-display text-2xl font-semibold text-rs-900">{total}</p>
            </div>
          </div>
        </div>
      </section>
    );
  };

  const isAdmin = user.role.toLowerCase() === "administrador";
  const isTeacher = user.role.toLowerCase() === "docente";

  return (
    <div className="flex min-h-screen flex-col bg-rs-50 text-rs-ink lg:flex-row">
      <SideBar user={user!} />
      <main className="min-w-0 flex-1 px-4 py-8 sm:px-6 lg:px-10">
        <div className="mx-auto max-w-6xl">
          <PageHeader icon={LuChartColumn} title="Métricas de desempeño" />

          {/* Métricas principales */}
          <div className={`mb-6 grid grid-cols-1 gap-4 ${isAdmin ? "md:grid-cols-3" : "md:grid-cols-2"}`}>
            <StatCard
              tone="deep"
              icon={LuBookOpen}
              label="Cursos activos"
              value={metrics.coursesCount}
              hint={isAdmin ? "Total de cursos en el sistema" : "Total de cursos que estás impartiendo"}
            />
            <StatCard
              tone="mint"
              icon={LuUsers}
              label={isTeacher ? "Estudiantes únicos" : "Estudiantes"}
              value={metrics.studentsCount}
              hint={isAdmin ? "Total de estudiantes registrados" : "Estudiantes diferentes a los que impartes clase"}
            />
            {isAdmin && (
              <StatCard
                tone="lime"
                icon={LuGraduationCap}
                label="Docentes activos"
                value={metrics.teachersCount}
                hint="Total de docentes registrados"
              />
            )}
          </div>

          {/* Estadísticas de cursos */}
          {metrics.courseStats && (
            <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rs-card p-5">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-medium text-rs-muted">Promedio de estudiantes</p>
                  <LuChartColumn className="size-5 text-rs-600" aria-hidden="true" />
                </div>
                <p className="font-display text-3xl font-semibold text-rs-900">{metrics.courseStats.averageStudents}</p>
                <p className="mt-2 text-xs text-rs-muted">Por curso {isAdmin && "(global)"}</p>
              </div>

              <div className="rs-card p-5">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-medium text-rs-muted">Curso más poblado</p>
                  <LuTrophy className="size-5 text-rs-600" aria-hidden="true" />
                </div>
                {metrics.courseStats.courseWithMostStudents ? (
                  <>
                    <p className="mb-1 font-display text-2xl font-semibold text-rs-700">
                      {metrics.courseStats.courseWithMostStudents.studentCount} estudiantes
                    </p>
                    <p className="truncate text-sm text-rs-ink" title={metrics.courseStats.courseWithMostStudents.name}>
                      {metrics.courseStats.courseWithMostStudents.name}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-rs-muted">Sin datos</p>
                )}
              </div>

              <div className="rs-card p-5">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-medium text-rs-muted">Curso menos poblado</p>
                  <LuTrendingDown className="size-5 text-rs-600" aria-hidden="true" />
                </div>
                {metrics.courseStats.courseWithLeastStudents ? (
                  <>
                    <p className="mb-1 font-display text-2xl font-semibold text-rs-warn">
                      {metrics.courseStats.courseWithLeastStudents.studentCount} estudiante{metrics.courseStats.courseWithLeastStudents.studentCount !== 1 ? "s" : ""}
                    </p>
                    <p className="truncate text-sm text-rs-ink" title={metrics.courseStats.courseWithLeastStudents.name}>
                      {metrics.courseStats.courseWithLeastStudents.name}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-rs-muted">Sin datos</p>
                )}
              </div>
            </div>
          )}

          {/* Cursos sin material generado (solo docentes) */}
          {isTeacher && metrics.coursesWithoutMaterial.length > 0 && (
            <section className="rs-card mb-6 p-6">
              <div className="mb-4 flex items-center gap-3">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-rs-warn-bg text-rs-warn">
                  <LuCircleAlert className="size-5" aria-hidden="true" />
                </span>
                <div>
                  <h2 className="rs-title text-xl">Cursos sin material generado</h2>
                  <p className="text-sm text-rs-muted">
                    {metrics.coursesWithoutMaterial.length} curso{metrics.coursesWithoutMaterial.length !== 1 ? "s" : ""} sin contenido de IA
                  </p>
                </div>
              </div>
              <ul className="space-y-3">
                {metrics.coursesWithoutMaterial.map((course) => (
                  <li
                    key={course._id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rs-line bg-white px-4 py-3 transition-colors hover:border-rs-400"
                  >
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-rs-ink">{course.name}</h3>
                      <p className="mt-1 text-sm text-rs-muted">{course.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-rs-muted">
                        {course.studentCount} estudiante{course.studentCount !== 1 ? "s" : ""}
                      </p>
                      <a
                        href="/dashboard"
                        className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-rs-700 hover:text-rs-800"
                      >
                        Generar contenido <LuArrowRight className="size-4" aria-hidden="true" />
                      </a>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Mensaje cuando todos los cursos tienen material */}
          {isTeacher && metrics.coursesWithoutMaterial.length === 0 && metrics.coursesCount > 0 && (
            <section className="mb-6 flex items-center gap-3 rounded-2xl bg-rs-900 p-6 text-white">
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-rs-lime text-rs-900">
                <LuBadgeCheck className="size-6" aria-hidden="true" />
              </span>
              <div>
                <h3 className="font-display text-xl font-semibold text-rs-lime">¡Excelente trabajo!</h3>
                <p className="text-sm text-rs-150">Todos tus cursos tienen material generado por IA</p>
              </div>
            </section>
          )}

          {/* Gráfico de pastel para administradores */}
          {user.role === "administrador" && renderPieChart()}
        </div>
      </main>
    </div>
  );
}
