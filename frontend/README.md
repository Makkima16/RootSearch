# RootSearch Frontend

Interfaz web del proyecto RootSearch, construida con **Next.js 16** (App Router),
**React 19** y **Tailwind CSS 4**.

## Requisitos

- Node.js 22+
- Backend de RootSearch en ejecución

## Configuración

```bash
cp .env.example .env
```

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Scripts

```bash
npm run dev        # servidor de desarrollo en http://localhost:3000
npm run build      # build de producción
npm run start      # servir el build de producción
npm run lint       # ESLint
npm run lint:fix   # ESLint con autofix
npm run typecheck  # TypeScript sin emitir
npm run format     # Prettier
```

## Estructura

```
app/          Páginas y layout (App Router)
components/   Componentes reutilizables (sidebar, modales, formularios)
services/     Clientes fetch para la API del backend
public/       Recursos estáticos
```

Las páginas protegidas leen el token JWT de `localStorage` y lo envían al backend
como `Authorization: Bearer <token>`.
