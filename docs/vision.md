# Visión del Proyecto RootSearch

## Propósito

RootSearch es una plataforma educativa desarrollada para la asignatura de
Ingeniería de Software III. Su objetivo es centralizar la gestión de cursos,
materiales de estudio y contenido adaptativo generado con inteligencia
artificial, tanto para docentes como para estudiantes.

## Objetivos

- Facilitar a los docentes la creación y publicación de materiales de estudio.
- Permitir a los estudiantes acceder a contenido adaptado a sus cursos.
- Generar automáticamente resúmenes, quizzes, glosarios y checklists a partir de
  transcripciones de clase.
- Ofrecer métricas de cursos, materiales y usuarios.
- Mantener una arquitectura mantenible y escalable mediante un monorepo.

## Alcance

- Backend en NestJS con API REST documentada con Swagger.
- Frontend en Next.js con App Router y Tailwind CSS.
- Base de datos MongoDB.
- Autenticación con JWT, verificación por correo y control de roles/permisos.
- Procesamiento de audio y generación de contenido con adaptadores locales o en
  la nube.
- Contenerización con Docker y verificación automática en GitHub Actions.

## Valor agregado

- **Educación:** herramientas que apoyan el estudio y la preparación de clases.
- **Automatización:** contenido de refuerzo generado a partir de audio real.
- **Flexibilidad:** funcionamiento local sin coste o en la nube según el entorno.
- **Accesibilidad:** interfaz web responsive para estudiantes y docentes.
