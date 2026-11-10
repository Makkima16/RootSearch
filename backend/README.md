# RootSearch Backend

API REST del proyecto RootSearch, construida con **NestJS 11**, **MongoDB** y
**Mongoose**.

## Requisitos

- Node.js 22+
- MongoDB (local, Atlas o el contenedor de `infra/docker`)

## Configuración

```bash
cp .env.example .env
```

Variables principales:

| Variable | Descripción |
| --- | --- |
| `MONGODB_URI` | Cadena de conexión de MongoDB |
| `JWT_SECRET` | Secreto para firmar los JWT |
| `PORT` | Puerto del backend (por defecto `3001`) |
| `CORS_ORIGIN` | Orígenes permitidos, separados por comas |
| `TRANSCRIPTION_MODE` | `LOCAL` o `CLOUD` |
| `CONTENT_GENERATION_MODE` | `LOCAL` o `CLOUD` |
| `OPENAI_API_KEY` | Requerida solo en modo `CLOUD` |

## Scripts

```bash
npm run dev          # desarrollo con hot reload
npm run start:prod   # producción (requiere build)
npm run build        # compila a dist/
npm run lint         # ESLint
npm run lint:fix     # ESLint con autofix
npm run typecheck    # TypeScript sin emitir
npm run test         # tests unitarios
npm run test:e2e     # tests end-to-end
npm run seed         # carga datos de ejemplo
```

## Módulos

- `auth`: login, registro, 2FA por email, recuperación de contraseña, roles y permisos.
- `users`: gestión de usuarios y docentes del estudiante.
- `courses`: cursos y matrícula.
- `materials`: materiales, publicación y exportación a PDF.
- `audio` / `transcription`: transcripción local o con OpenAI Whisper.
- `content-generation`: resumen, quiz, glosario y checklist con IA.

La documentación Swagger está disponible en `http://localhost:3001/api`.
