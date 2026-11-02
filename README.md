# Avanzada Lankuyen

Plataforma web de gestión y acompañamiento para la **Avanzada de Pioneros y Pioneras Lankuyen** del **Grupo Guía y Scout Alfa Cruz**, Concepción, Chile.

**Estado actual: v2.2.0** — hojas de ruta por Comunidad, rediseño móvil añil/blanco con barra de 4 accesos + «Más», y experiencia diferenciada para el Equipo Adulto y los jóvenes.

---

## Jerarquía normativa

`CONSTITUTION.md` y el **Manual de la Rama Pioneras y Pioneros (AGSCh)** mandan sobre cualquier decisión técnica. Cuando el código, una interfaz o una optimización entren en conflicto con ellos, se corrige el código.

Los principios que estructuran la plataforma son:

1. **La Brújula pertenece a la persona joven.** Solo ella escribe sus objetivos, estados y visibilidad. Ningún adulto aprueba, corrige ni reescribe su Brújula.
2. **El historial es inmutable.** Cada reformulación agrega una versión nueva en `UserCompassObjectiveVersion`; jamás se sobrescribe ni se elimina una redacción anterior.
3. **La lectura es 1 a 1.** El AA encargado acompaña; otro adulto no accede. Los compañeros de comunidad solo ven lo compartido explícitamente.
4. **No hay evaluación escolar.** Se observa cualitativamente en tres niveles y seis áreas; no existen notas, promedios, porcentajes ni rankings de personas.
5. **El camino simbólico no tiene prerrequisitos.** Sendero, Cumbre, Promesa y Paso al Clan son memoria y sentido, no condiciones de acceso.
6. **La soberanía de datos es real.** Cada joven puede exportar todo su recorrido, imprimirlo y solicitar el Paso al Clan con acompañamiento adulto.

---

## Pilares de la versión v2.0 / v2.1

### La Brújula y la columna única de 15–17 años

- Seis Áreas de Desarrollo: **Corporalidad, Creatividad, Carácter, Afectividad, Sociabilidad y Espiritualidad**.
- Catálogo referencial de **24 objetivos** basado en el Manual (pp. 175–201), disponible completo desde el ingreso.
- Redacción en primera persona, sin etapas, edades ni antigüedad como requisitos.
- Historial inmutable de redacciones y estados cualitativos (`EXPLORANDO`, `LOGRADO_EN_VIDA_COTIDIANA`).
- **Gestión del catálogo por el Equipo Adulto** en `/admin/objetivos`: crear, editar y eliminar plantillas con auditoría. Corregir una plantilla **no** modifica los objetivos personales ya adoptados; solo muestra una nota discreta con la propuesta oficial del Manual.
- **Soporte offline**: copia local de lectura y cola de ediciones. Al volver la red, `reconcileOfflineObjectiveEdit` conserva ambas redacciones como versiones sucesivas si hubo edición concurrente en otro dispositivo.

### Acompañamiento 1 a 1 y privacidad estricta

- `assignedAaId` define al AA encargado; se recomienda un máximo de **6 personas jóvenes** por adulto.
- Notas privadas de acompañamiento (`MentoringNote`), compartidas solo si el AA lo decide.
- Prohibición de lectura cruzada entre AA y entre comunidades.
- Registro de auditoría para cada acción sensible.

### Comunidades juveniles, Grupos de Trabajo y Proyectos

- **Hojas de Ruta por Comunidad (v2.2):** en actividades con `scope === 'COMUNIDAD'`, cada Comunidad tiene su propio hilo de hoja de ruta, su propia versión y su propio estado. Ninguna Comunidad puede sobrescribir el hilo de otra.
- **Tablero semáforo por Comunidad:** el Equipo Adulto ve *Sin entregar*, *Pendiente de revisión*, *Con observaciones* o *Aprobada* para cada Comunidad en `/calendario/[activityId]` y `/admin/hojas-de-ruta`.
- **Experiencia móvil (v2.2):** barra inferior de 4 accesos esenciales + cajón «Más» de 5 columnas, con navegación filtrada por rol. El AA nunca ve Mi Brújula, Mi Camino ni Mi Comunidad.
- El **Equipo Adulto no pertenece a las comunidades juveniles**.
- Cargos internos rotativos: coordinación, secretaría, tesorería y otros.
- **Bitácora privada de comunidad** (`/mi-comunidad/bitacora`), con visibilidad acotada y moderación.
- **Proyectos** con los seis pasos del Manual: *Soñar, Elegir, Organizar, Realizar, Evaluar, Celebrar ¡La Peña!*.
- **Grupo de Trabajo abierto y transversal**: cualquier persona joven de cualquier comunidad se inscribe según su interés en la tarea; puede integrar monitores de la Red de Apoyo e invitados externos sin cuenta.
- Disolución del grupo a `HISTORICO_DISUELTO` tras el Informe Final, conservando su memoria.
- **Red de Apoyo** (`/admin/red-de-apoyo`): directorio de colaboradores confiables, editable por AA y consultable por la coordinación.

### Democracia juvenil en el Ciclo de Programa

- Cuatro fases secuenciales: diagnóstico y énfasis, propuesta y selección, organización y preparación, desarrollo y evaluación.
- Reunión de Coordinadores y Asamblea de Avanzada.
- Juegos democráticos: elección directa, ranking de estrellas y asignación de puntos.
- **Voto exclusivo de jóvenes**: el Equipo Adulto recibe `403` y no puede emitir votos.

### Desescolarización y camino simbólico

- Evaluaciones posteriores por observación cualitativa: tres niveles de logro y seis áreas de desarrollo.
- Sin notas 1 a 7, sin promedios, sin porcentajes de asistencia.
- Promesa independiente de la etapa y de la antigüedad; fórmula propia de cada persona.
- Siete áreas oficiales de Competencias.

### Identidad social y soberanía de datos

- `preferredName` tiene prioridad absoluta en toda la interfaz y en los PNG compartibles (`1080×1920`).
- Exportación portable `.json` en `/api/perfil/exportar`.
- Vista imprimible/PDF en `/perfil/imprimir`.
- Solicitud de **Paso al Clan** desde `/perfil`, con aviso al Equipo Adulto y registro en `audit_logs`.

---

## Arquitectura y stack

| Capa | Tecnología |
|---|---|
| Frontend + Backend | Next.js 16 (App Router, Server Actions), React 19, TypeScript estricto |
| Estilos | Tailwind CSS v4, componentes propios estilo shadcn/ui |
| Base de datos | PostgreSQL 17 + Prisma ORM 7 (driver adapter `pg`) |
| Autenticación | Auth.js v5 (Credentials) + Argon2id |
| Archivos | Adaptador local o Cloudflare R2/S3 compatible (`STORAGE_DRIVER`) |
| Fechas | `America/Santiago`, almacenamiento en UTC (`timestamptz`) |
| PWA | `@ducanh2912/next-pwa`, service worker generado en `public/sw.js` |

### Decisiones de arquitectura

- **Dominio puro** en `src/features/<área>/rules.ts`, sin Prisma ni Next.js, para probarlo con `node --test`.
- **Server Actions** en `src/features/<área>/actions.ts`, con validación Zod en `schemas.ts`.
- **RBAC centralizado** en `src/server/rbac/permissions.ts` + `can()`; nunca se compara el rol directamente.
- **Sesión revalidada contra la base** en cada petición (`src/server/auth/session.ts`).
- **Auditoría** de acciones sensibles en `audit_logs`.
- **Route groups**: `(app)` para jóvenes, `(admin)/admin` para el panel adulto, `(auth)` para login y cambio de contraseña.

---

## Estructura del repositorio

```text
prisma/
  schema.prisma              # Modelos, enums y relaciones
  seed.ts                    # Insignias, material, ciclo, comunidad base, AA y catálogo
  migrations/                # Migraciones versionadas e inmutables
src/
  app/
    (auth)/                  # Login y cambio de contraseña
    (app)/                   # Vistas de jóvenes y acompañamiento
    (admin)/admin/           # Panel del Equipo Adulto
    api/auth/                # Handlers de Auth.js
    api/files/               # Descarga autorizada de archivos privados
    api/perfil/exportar/     # Exportación portable del recorrido
    ~offline/                # Fallback de la PWA
  components/
    activities/              # Calendario, formularios y encargados
    admin/                   # Formularios del panel AA
    attendance/              # RSVP, ratificación y resumen
    compass/                 # La Brújula, versiones, notas y sincronización offline
    communities/             # Comunidades, cargos y asignación de AA
    evaluations/             # Observación cualitativa
    logbook/                 # Bitácora de la unidad
    projects/                # Proyectos, grupos de trabajo y Red de Apoyo
    route-sheets/            # Hojas de ruta estructuradas y archivos
    layout/                  # Shell, sidebar y navegación móvil
    shared/                  # Encabezados, estados vacíos, métricas
    ui/                      # Botones, inputs, cards, badges, alerts
  features/
    achievements/ activities/ attendance/ auth/ communities/ compass/
    cycle/ evaluations/ journey/ logbook/ material/ members/
    notifications/ profile/ progression/ projects/ route-sheets/
    settings/ users/
  lib/                       # Utilidades, fechas, navegación, reglas puras auxiliares
  server/
    auth/                    # Auth.js, Argon2 y sesión revalidada
    rbac/                    # permissions.ts + can.ts
    cron/                    # Recordatorios de hojas de ruta
    storage/                 # Adaptador LOCAL/R2
  data/
    instrumento-objetivos.json  # Semilla inicial del catálogo de La Brújula
tests/                       # Suites constitucionales y de regresión
```

---

## Mapa de rutas

### Vistas de jóvenes y acompañamiento — `(app)`

| Ruta | Descripción |
|---|---|
| `/inicio` | Tablero personal |
| `/perfil` | Identidad, insignias, camino, competencias y soberanía de datos |
| `/perfil/imprimir` | Vista imprimible / PDF del recorrido |
| `/brujula` | La Brújula personal con historial y soporte offline |
| `/camino` | Camino simbólico y Promesa |
| `/mi-comunidad` | Comunidad juvenil y cargos |
| `/mi-comunidad/bitacora` | Bitácora privada de la comunidad |
| `/mi-comunidad/asistencia` | Asistencia de la comunidad |
| `/miembros`, `/miembros/[username]` | Directorio social |
| `/logros` | Logros con niebla de guerra |
| `/calendario`, `/calendario/[activityId]` | Calendario y detalle de actividad |
| `/ciclo` | Ciclo de Programa y Asamblea |
| `/proyectos`, `/proyectos/[id]` | Proyectos y Grupos de Trabajo |
| `/hojas-de-ruta` | Presentación y seguimiento de hojas de ruta |
| `/bitacora`, `/bitacora/nueva` | Bitácora de la unidad |
| `/bitacora/[entryId]/editar`, `/bitacora/revision` | Edición y moderación |
| `/material` | Material digital de la unidad |
| `/acompanamiento`, `/acompanamiento/[userId]` | Acompañamiento 1 a 1 del AA |
| `/notificaciones` | Bandeja de notificaciones |

### Panel del Equipo Adulto — `(admin)/admin`

| Ruta | Descripción |
|---|---|
| `/admin` | Tablero general |
| `/admin/usuarios`, `/admin/usuarios/nuevo`, `/admin/usuarios/[id]` | Gestión de cuentas |
| `/admin/comunidades` | Comunidades, cargos y asignación de AA |
| `/admin/objetivos` | Catálogo referencial de objetivos de La Brújula |
| `/admin/actividades` | Programación de actividades |
| `/admin/asistencia`, `/admin/asistencia/[activityId]` | Ratificación de asistencia |
| `/admin/evaluaciones`, `/admin/evaluaciones/[activityId]` | Observación cualitativa |
| `/admin/bitacora` | Moderación de la bitácora |
| `/admin/hojas-de-ruta` | Revisión de hojas de ruta y filtro por Comunidad |
| `/admin/insignias` | Otorgamiento de insignias |
| `/admin/red-de-apoyo` | Directorio de la Red de Apoyo |
| `/admin/material` | Publicación de material digital |
| `/admin/configuracion` | Ajustes de la unidad |

### API

| Ruta | Descripción |
|---|---|
| `/api/auth/[...nextauth]` | Autenticación |
| `/api/files/[fileId]` | Descarga autorizada de archivos privados |
| `/api/perfil/exportar` | Exportación `.json` del recorrido personal |
| `/api/cron/route-sheet-reminder` | Recordatorio semanal de hojas de ruta |

---

## Instalación y desarrollo local

### Requisitos

- Node.js 20 o superior (probado con Node 24).
- Docker Desktop **o** PostgreSQL 17 local.
- npm 10 o superior.

### Puesta en marcha

```bash
# 1. Dependencias
npm install

# 2. Variables de entorno
cp .env.example .env
#    Edita AUTH_SECRET, CRON_SECRET y las credenciales del AA inicial.

# 3. Base de datos local
docker compose up -d

# 4. Migraciones y datos iniciales
npx prisma migrate deploy
npm run db:seed

# 5. Desarrollo
npm run dev
```

Abrir <http://localhost:3000>.

> **Puerto 5433:** `docker-compose.yml` expone PostgreSQL en `5433` para no chocar con una instalación local en `5432`. `.env.example` ya apunta a ese puerto.

### Variables de entorno principales

| Variable | Uso |
|---|---|
| `DATABASE_URL` | Conexión PostgreSQL para la aplicación |
| `DIRECT_URL` | Conexión directa para migraciones (puede ser igual a `DATABASE_URL`) |
| `AUTH_SECRET` | Firma de sesiones de Auth.js |
| `CRON_SECRET` | Autorización `Bearer` del cron |
| `STORAGE_DRIVER` | `local` o `r2` |
| `INITIAL_AA_USERNAME` / `INITIAL_AA_PASSWORD` | Cuenta AA inicial del seed |

### Credenciales iniciales

Se crean desde el seed (`.env`):

```text
usuario:    aa.lankuyen
contraseña: Lankuyen2026!
```

En el primer inicio de sesión la plataforma obliga a cambiarla.

> Si no tienes Docker, apunta `DATABASE_URL` a cualquier PostgreSQL 17 local y ejecuta las migraciones. El usuario debe tener permiso `CREATEDB` para la shadow database de Prisma.

### Migraciones

`prisma migrate dev` no funciona en modo no interactivo. El flujo del proyecto es:

```bash
npx prisma migrate diff \
  --from-config-datasource \
  --to-schema prisma/schema.prisma \
  --script \
  --output prisma/migrations/<timestamp>_<nombre>/migration.sql

npx prisma migrate deploy
npx prisma generate
```

Para verificar que no hay drift:

```bash
npx prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --script
# Debe imprimir: -- This is an empty migration.
```

---

## Comandos

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo (`next dev --webpack`) |
| `npm run build` | Build de producción + PWA |
| `npm run start` | Servidor de producción |
| `npm run typecheck` | TypeScript estricto |
| `npm run lint` | ESLint |
| `npm test` | Suites de pruebas del proyecto |
| `npm run cron:local` | Ejecuta el cron local; `-- --bypass` para probarlo fuera de la ventana |
| `npm run db:generate` | Regenera el cliente Prisma |
| `npm run db:migrate` | Crea/aplica migraciones en desarrollo |
| `npm run db:seed` | Seed idempotente de insignias, material, ciclo, catálogo y AA inicial |
| `npm run db:studio` | Prisma Studio |
| `npm run db:reset` | Reinicia la base y vuelve a sembrar |

### Puertas de calidad

Antes de entregar cualquier cambio:

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

---

## Pruebas

`npm test` ejecuta una lista explícita de archivos definida en `package.json` (hoy **13 archivos de prueba**). Para correr un archivo aislado:

```bash
npx tsx --test tests/communities-and-workgroups.test.ts
```

Los tests importan módulos de `src` por ruta relativa con extensión `.ts` explícita y usan `node:test` + `assert`.

### Suites constitucionales

| Suite | Artículos / foco |
|---|---|
| `no-school-grading.test.ts` | Art. III · evaluación no escolar |
| `promise-and-stages.test.ts` | Art. IV · camino simbólico y Promesa |
| `compass-privacy.test.ts` | Art. I, VII y VIII · La Brújula y privacidad 1 a 1; catálogo de plantillas |
| `compass-versioning.test.ts` | Art. I, II y XII · historial inmutable, offline sin pérdida y exportación |
| `democratic-assembly.test.ts` | Art. VI · voto exclusivo de jóvenes |
| `communities-and-workgroups.test.ts` | Art. V · comunidades, Grupos de Trabajo y Red de Apoyo |

A ellas se suman las suites de regresión para hojas de ruta, evaluaciones, bitácora, notificaciones, logros, eliminación de cuentas y ciclo de programa.

---

## Operación

- **Zona horaria:** todas las fechas se guardan en UTC y se muestran en `America/Santiago`.
- **Cron:** `GET` o `POST` autenticado con `Authorization: Bearer <CRON_SECRET>`.
- **Archivos privados:** cada descarga pasa por `/api/files/[fileId]`, que autoriza según rol, actividad y estado del documento.
- **Service worker:** nunca cachea respuestas autenticadas de `/api/*`.
- **Migraciones:** versionadas e inmutables; el seed es idempotente y no destructivo.

---

## Documentación relacionada

- `CONSTITUTION.md` — principios normativos de la Avanzada.
- `REQUIREMENTS.md` — requisitos funcionales y no funcionales (RF-*, RNF-*).
- `AGENTS.md` — guía operativa para agentes de desarrollo.
