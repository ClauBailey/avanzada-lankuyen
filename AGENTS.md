<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Avanzada Lankuyen — guía para agentes

## Comandos

- Verificación completa, en este orden: `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`. El build es Next 16 con webpack y además compila la PWA.
- `npm test` ejecuta una lista explícita de archivos en `package.json`. Un test nuevo que no se agregue allí no corre.
- Test enfocado: `npx tsx --test tests/communities-and-workgroups.test.ts`. Los tests importan módulos de `src` por ruta relativa con extensión `.ts` explícita (`node:test` + `assert`).
- `npm run dev` usa `next dev --webpack`. `public/sw.js` lo genera la PWA: no editarlo a mano.
- El `README.md` está desactualizado (habla de v1.1 y 21 modelos). La fuente de verdad es `prisma/schema.prisma`, `package.json` y el código.

## Base de datos y Prisma

- PostgreSQL local en `postgresql://lankuyen@localhost:5433/lankuyen` (instancia en `%TEMP%\lankuyen-pgdata`). Exportar siempre `DATABASE_URL` y `DIRECT_URL` con ese valor antes de comandos Prisma.
- El cliente se genera en `src/generated/prisma`; no editar archivos generados.
- `prisma migrate dev` falla en modo no interactivo. Crear la migración con:
  `npx prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --script --output prisma/migrations/<timestamp>_<nombre>/migration.sql`
  y luego `npx prisma migrate deploy` + `npx prisma generate`.
- Verificar drift con el mismo `migrate diff` sin `--output`: debe imprimir `This is an empty migration.`
- IDs: UUID (`@default(uuid()) @db.Uuid`). Fechas: `Timestamptz(3)`; visualización en `America/Santiago`.

## Arquitectura

- App Router con route groups: `src/app/(app)` para jóvenes (PP/COORDINADOR) y `src/app/(admin)/admin` para el panel. El layout de `(admin)` permite también a COORDINADOR cuando tiene `support_network:view`; cada página del panel debe exigir su propio permiso.
- Patrón de dominio: `src/features/<área>/{schemas,actions,rules}.ts`. `rules.ts` debe quedar libre de Prisma/Next para poder probarse con `node --test`.
- Autorización centralizada: `src/server/rbac/permissions.ts` + `can()`. Usar `requireUser`, `requireReadyUser` o `requirePermission` de `src/server/auth/session.ts`; nunca comparar el rol directamente.
- Prisma singleton en `src/server/db.ts` (importa `server-only` y exige `DATABASE_URL` al cargarse). Evitar importarlo desde módulos que los tests cargan sin base de datos.
- Descargas de archivos privados pasan por `src/app/api/files/[fileId]/route.ts`; el storage se resuelve con `src/server/storage`.
- Server Actions devuelven `ActionState` (`src/lib/action-state.ts`: `error`, `success`, `status?`). FormData se lee con `readField`/`firstIssue` de `src/lib/form-data.ts`.

## Convenciones y trampas

- Todo el texto de interfaz y dominio está en español de Chile; conservar términos del Manual: Paso al Clan, La Peña, Sendero, Cumbre, Grupo de Trabajo.
- Los archivos fuente usan UTF-8 con BOM. Preferir las herramientas de edición; no reescribir en masa con `Set-Content` de PowerShell.
- `RouteSheet.fileId` es nullable (hojas de ruta estructuradas). Todo enlace a `/api/files/...` debe comprobar `fileId`; renderizar `structuredData` con `RouteSheetStructuredView`.
- `UnitResource` es el modelo Prisma detrás de «material digital»; la publicación la controla `isPublished` y las propuestas de coordinación usan `proposedById`.
- La identidad visible se obtiene con `getDisplayName`: `preferredName` + apellido registral.
- El historial de La Brújula es append-only. Cualquier sincronización offline debe conservar ambas redacciones (`reconcileOfflineObjectiveEdit`), nunca sobrescribir versiones.
- No introducir notas, promedios ni prerrequisitos entre etapas simbólicas; es una restricción constitucional del proyecto.
