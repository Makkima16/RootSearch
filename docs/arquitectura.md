# Arquitectura del Proyecto RootSearch

## Visión general

RootSearch es un monorepo gestionado con **npm workspaces**. Contiene un backend
REST (NestJS), un frontend web (Next.js) y la infraestructura necesaria para
desarrollo y despliegue.

```
RootSearch/
├── backend/    API REST, autenticación, lógica de negocio y acceso a datos
├── frontend/   Interfaz web (App Router)
├── docs/       Documentación técnica
├── infra/      Dockerfiles y Docker Compose
└── .github/    Workflows de CI (lint, test, build, Docker)
```

## Backend (NestJS 11)

- **Lenguaje:** TypeScript
- **Base de datos:** MongoDB mediante Mongoose
- **Autenticación:** JWT + verificación por código enviado al correo
- **Autorización:** RBAC con roles (`administrador`, `docente`, `estudiante`) y permisos por endpoint
- **Validación:** `class-validator` con `ValidationPipe` global
- **Documentación:** Swagger disponible en `/api`

### Módulos principales

| Módulo | Responsabilidad |
| --- | --- |
| `auth` | Login, registro, verificación 2FA, recuperación de contraseña, roles y permisos |
| `users` | CRUD de usuarios, docentes de un estudiante |
| `courses` | Cursos, matrícula de estudiantes y materiales por curso |
| `materials` | Materiales de estudio, exportación a PDF y publicación |
| `audio` | Carga de audio y transcripción |
| `transcription` | Adaptadores de transcripción (`LOCAL` / `CLOUD`) |
| `content-generation` | Generación de resumen, quiz, glosario y checklist con IA |

### Patrón de adaptadores para IA

Transcripción y generación de contenido usan el patrón **Strategy/Adapter**, con
un token de inyección y una factory que elige la implementación según las
variables de entorno:

- `TRANSCRIPTION_MODE=LOCAL | CLOUD`
- `CONTENT_GENERATION_MODE=LOCAL | CLOUD`

Esto permite desarrollo local sin coste (Whisper/LM Studio) y producción con
OpenAI, sin cambiar el código de los servicios que consumen la IA.

## Frontend (Next.js 16)

- **Framework:** Next.js con App Router
- **UI:** React 19 + Tailwind CSS 4
- **Estado y datos:** hooks de React y servicios `fetch` en `frontend/services/`
- **Autenticación:** token JWT almacenado en `localStorage` y enviado como `Bearer`

### Rutas principales

| Ruta | Descripción |
| --- | --- |
| `/` | Landing pública |
| `/auth/login`, `/auth/register`, `/auth/verify` | Autenticación |
| `/auth/forgot-password`, `/reset-password` | Recuperación de contraseña |
| `/dashboard` | Panel principal |
| `/courses/list`, `/courses/view` | Gestión y detalle de cursos |
| `/materials` | Materiales generados con IA |
| `/students/list`, `/students/view` | Estudiantes |
| `/users/list`, `/users/view` | Usuarios (administración) |
| `/metrics` | Métricas y estadísticas |
| `/homework` | Materiales del estudiante |
| `/communication` | Comunicación |
| `/settings` | Configuración del perfil |

## Infraestructura

- **Docker:** imágenes multi-stage para backend y frontend en `infra/docker/`
- **Docker Compose:** MongoDB + backend + frontend para desarrollo
- **CI/CD:** GitHub Actions en `.github/workflows/`
  - `lint-test.yml`: lint, typecheck, tests y build
  - `docker-build.yml`: validación de las imágenes Docker

## Flujo de una petición

1. El usuario interactúa con una página del frontend.
2. Un servicio de `frontend/services/` llama a la API con el token JWT.
3. El backend valida el DTO, autentica el JWT y comprueba roles/permisos.
4. El servicio de negocio consulta MongoDB y/o invoca un adaptador de IA.
5. La respuesta se devuelve como JSON y la interfaz actualiza el estado.

## Consideraciones de seguridad

- CORS restringido mediante `CORS_ORIGIN`.
- Contraseñas hasheadas con bcrypt.
- Códigos de verificación y tokens de recuperación con expiración.
- Pendiente de mejora: mover el JWT de `localStorage` a cookies `HttpOnly` para
  reducir el riesgo de XSS.
