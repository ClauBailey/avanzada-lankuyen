# Avanzada Lankuyen

Plataforma web de gestión para la **Avanzada Lankuyen** (unidad de Pioneros).
Estado actual: **Módulo 6 — Evaluaciones posteriores de actividades.**

---

## Stack

| Capa | Tecnología |
|---|---|
| Frontend + Backend | Next.js 16 (App Router), React 19, TypeScript |
| Estilos | Tailwind CSS v4, componentes propios estilo shadcn/ui |
| Base de datos | PostgreSQL 17 + Prisma ORM 7 (driver adapter `pg`) |
| Autenticación | Auth.js v5 (Credentials) + Argon2id |
| Archivos | Adaptador local o Cloudflare R2/S3 compatible (`STORAGE_DRIVER`) |
| Fechas | `America/Santiago`, almacenamiento en UTC (`timestamptz`) |

## Requisitos

- Node.js 20 o superior (probado con Node 24).
- Docker Desktop **o** una instalación local de PostgreSQL 17.
- npm 10 o superior.

## Puesta en marcha

```bash
# 1. Dependencias
npm install

# 2. Variables de entorno
cp .env.example .env
#    Edita AUTH_SECRET, CRON_SECRET y las credenciales del AA inicial.

# 3. Base de datos local
docker compose up -d

# 4. Migraciones y datos iniciales
npx prisma migrate deploy   # aplica las migraciones versionadas
npm run db:seed             # insignias, material, semestre actual y AA inicial

# 5. Desarrollo
npm run dev
```

Abrir <http://localhost:3000>.

> **Puerto 5433:** el `docker-compose.yml` expone PostgreSQL en `5433` para no
> chocar con una instalación local que ya use `5432`. El `DATABASE_URL` de
> `.env.example` ya apunta a ese puerto.

### Credenciales iniciales

Se crean desde el seed (`.env`):

```text
usuario:    aa.lankuyen
contraseña: Lankuyen2026!
```

En el primer inicio de sesión la plataforma obliga a cambiarla.

> Si tu equipo no tiene Docker, puedes apuntar `DATABASE_URL` a cualquier
> PostgreSQL 17 local y ejecutar las migraciones normalmente. La única
> condición es que el usuario tenga permiso `CREATEDB` (Prisma lo necesita
> para la shadow database).

## Comandos

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run typecheck` | Verificación de TypeScript |
| `npm run lint` | ESLint |
| `npm test` | Pruebas del cron, promedios de evaluación y permisos por rol |
| `npm run cron:local` | Invoca el cron local; agrega `-- --bypass` para probarlo fuera de la ventana |
| `npm run db:migrate` | Crea/aplica migraciones en desarrollo |
| `npm run db:seed` | Insignias, material, semestre actual y AA inicial (idempotente) |
| `npm run db:studio` | Prisma Studio |
| `npm run db:reset` | Reinicia la base y vuelve a sembrar |

## Estructura

```text
prisma/
  schema.prisma        # 20 modelos, enums y relaciones
  seed.ts              # insignias, recursos, semestre actual, comunidad base y AA
src/
  app/
    (auth)/            # login y cambio de contraseña
    (app)/             # vistas PP y COORDINADOR (idénticas en v1)
    (admin)/admin/     # panel exclusivo AA
    api/auth/          # handlers de Auth.js
    api/files/         # descarga autorizada de archivos privados
  components/
    activities/        # calendario, formularios y selector de encargados
    attendance/        # RSVP, ratificador y resumen de asistencia
    evaluations/       # formulario PP y lectura de respuestas por los AA
    route-sheets/      # subida, moderación, filtros y estado de hojas de ruta
    brand/             # logo, etiqueta de comunidad
    layout/            # shell, sidebar y navegación móvil
    shared/            # page header, stats, progress, placeholders
    ui/                # botones, inputs, cards, badges, alerts
  features/
    activities/        # esquemas y acciones de semestres y actividades
    attendance/        # RSVP, justificaciones, ratificación y estadísticas
    evaluations/       # esquema y acción de evaluación posterior
    route-sheets/      # esquemas y acciones de subida, aprobación y rechazo
    auth/              # esquemas, acciones y formularios
  lib/                 # utilidades, fechas, navegación, constantes
  server/
    auth/              # Auth.js, Argon2 y sesión revalidada
    rbac/              # permissions.ts + can.ts
    cron/              # job semanal de recordatorios de hoja de ruta
    storage/           # adaptador LOCAL (R2 pendiente)
  types/               # augmentación de tipos de Auth.js
public/
  brand/               # logo placeholder reemplazable
  badges/              # 10 insignias placeholder
  textures/            # topografía y montañas
```

## Roles y RBAC

Los roles viven en la base de datos como enum (`AA`, `PP`, `COORDINADOR`) y
toda decisión pasa por `can(actor, permission)`:

```ts
import { can } from "@/server/rbac/can";

if (!can(user, "route_sheet:review")) {
  throw new ForbiddenError("route_sheet:review");
}
```

`COORDINADOR` tiene su propio conjunto de permisos explícito y, en v1, son
exactamente los mismos que los de `PP`: un coordinador es un Pionero/a con
idénticas vistas y permisos, incluida la evaluación posterior de actividades.
Las evaluaciones las responden `PP` y `COORDINADOR`; solo los AA leen todas las
respuestas. No se usa `role === "PP" || role === "COORDINADOR"` en ninguna parte:
habilitar permisos intermedios futuros solo requiere editar
`src/server/rbac/permissions.ts`.

Los layouts protegidos son:

- `src/app/(app)/layout.tsx` → requiere sesión y contraseña ya cambiada.
- `src/app/(admin)/admin/layout.tsx` → requiere `admin:access` (AA).

Cada Server Action debe volver a validar el permiso; la UI solo oculta.

## Autenticación

- **Sin registro público.** Las cuentas se crean desde el panel AA (Módulo 2).
- Login con `username` **o** `email` (ambos normalizados a minúsculas).
- Contraseñas con **Argon2id** (`memoryCost: 19456`, `timeCost: 2`).
- Auth.js usa JWT porque el proveedor Credentials no soporta sesiones en base
  de datos. Para compensar, `getCurrentUser()` **revalida contra PostgreSQL en
  cada request**: una cuenta desactivada o eliminada pierde acceso de inmediato,
  y los cambios de rol se reflejan sin esperar al token.
- `must_change_password` desvía al usuario a `/cambiar-password` antes de
  entrar a cualquier vista de la aplicación.
- Cookies `httpOnly`, `sameSite=lax`, expiración de 8 horas.

> **Datos de prueba locales:** la base de desarrollo conserva la cuenta
> `pp.prueba` (Pionero/a, comunidad «Comunidad Cumbre») para probar la
> progresión y la asistencia. No forma parte del seed reproducible.

## Módulo 2 — Comunidades, usuarios y progresión

- `/admin/comunidades`: crear y editar nombre, descripción y color de la
  etiqueta; desactivar (soft delete) y ver el conteo de miembros.
- `/admin/usuarios`: crear cuentas PP/COORDINADOR/AA con credenciales
  temporales copiables, filtros por comunidad/rol/estado, cambio rápido de
  comunidad, alternancia PP ↔ COORDINADOR, activación/desactivación y reseteo
  de contraseña.
- `/admin/usuarios/[id]`: ficha del miembro con acciones rápidas, reflexiones de
  etapa en solo lectura e insignias con nota/revocación.
- `/admin/insignias`: matriz por miembro con búsqueda y filtro por comunidad;
  otorgar o revocar insignias con una nota opcional y editar el título y la
  descripción de las 7 competencias sin tocar código.
- `/perfil`: cabecera con comunidad, contador de insignias, Promesa, etapas en
  `StageTimeline`, reflexiones editables y grilla de competencias. Las insignias
  no obtenidas se muestran en gris, con opacidad reducida y candado.
- `/inicio` y `/perfil`: contadores de insignias obtenidas **sin barra ni
  denominador**. Las cuentas AA no tienen bloque de progresión.
- `/notificaciones`: bandeja in-app con lectura individual o total; la campana
  del topbar y la navegación móvil muestran el número real de no leídas.
- Cada otorgamiento/revocación escribe en `audit_logs` (`badge.grant` /
  `badge.revoke`) y, al otorgar, se crea la notificación `INSIGNIA_OTORGADA`.

## Módulo 3 — Calendario, asistencia y ratificación

- `/admin/actividades`: crea semestres `YYYY-S1/S2` con fechas y un único
  semestre activo; CRUD de actividades con título, tipo, inicio/término en hora
  de Chile, ubicación, descripción, visibilidad, soft delete y multi-select de
  encargados PP/COORDINADOR. Los AA no se asignan como encargados.
- `/calendario` y `/calendario/[activityId]`: filtros por mes, tipo y
  próximas/pasadas; fecha y hora, tipo, ubicación, encargados con su comunidad,
  etiqueta «Eres encargado», hoja de ruta aprobada descargable o
  «Hoja de ruta: Pendiente», RSVP propio y asistencia final ratificada.
- **Fase 1 · RSVP:** solo mientras la actividad es futura y no está ratificada.
  `CONFIRMADO` no requiere justificación; `NO_ASISTE` exige texto y/o un archivo
  (PDF, JPG, PNG o WEBP, máximo 10 MB). Los adjuntos se guardan en
  `files`/`justification_files` con el adaptador local de desarrollo.
- **Acceso a archivos:** `/api/files/[fileId]` valida la sesión. Las
  justificaciones solo las ven su autor y los AA; las hojas de ruta aprobadas,
  cualquier miembro autenticado. Un archivo ajeno responde `404` para no revelar
  su existencia.
- **Notificaciones:** al confirmar se avisa a los AA de la comunidad del miembro
  (o a todos los AA activos si esa comunidad no tiene ninguno) con
  `RSVP_CONFIRMADO`; una inasistencia justificada genera
  `INASISTENCIA_JUSTIFICADA` con prioridad y enlace directo al panel de
  asistencia.
- `/admin/asistencia/[activityId]`: resumen en vivo de RSVP, filtros por
  comunidad, respuesta y búsqueda; «Pre-rellenar según RSVP» mapea
  `CONFIRMADO → PRESENTE`, `NO_ASISTE → JUSTIFICADO` y sin respuesta → `AUSENTE`.
  Cada estado y nota es editable; al guardar se registran `attendance_records`
  con `ratified_by_id`/`ratified_at` y auditoría `attendance.ratify`. Se puede
  volver a ratificar y cada cambio conserva el antes/después.
- `/inicio`, `/perfil` y `/admin/usuarios/[id]`: la próxima actividad enlaza
  directo a confirmar asistencia y el porcentaje de asistencia efectiva del
  semestre activo se calcula sobre los registros ratificados.

## Módulo 4 — Hojas de ruta, storage y recordatorios

- `/hojas-de-ruta` (PP, COORDINADOR y AA): bloque destacado «Mis asignaciones»
  con las actividades futuras donde la persona es encargada y el estado de su
  hoja (falta subir, en revisión, rechazada con motivo o aprobada). El formulario
  solo aparece cuando no hay una versión pendiente ni aprobada; cada tarjeta
  conserva el historial completo de versiones.
- **Repositorio del semestre:** lista todas las hojas `APROBADA`, enlazadas a su
  actividad y descargables. Las mismas aparecen en `/calendario` («Hoja de ruta
  disponible · vN») y en el detalle de la actividad.
- **Subida y versionado:** pueden subir los AA, los encargados de la actividad y
  cualquier PP/COORDINADOR si `route_sheet.allowAnyPpUpload` está activo. Se
  aceptan PDF, DOC, DOCX, JPG, PNG y WEBP de hasta 10 MB, guardados con el
  adaptador de storage (`LOCAL` en desarrollo). La v1 nace
  `PENDIENTE_AUTORIZACION`; mientras haya una pendiente o aprobada no se admite
  otra versión; tras un rechazo se sube v2+ conservando historial y motivo.
- `/admin/hojas-de-ruta`: bandeja de moderación con contadores y filtros por
  estado, semestre y actividad. Muestra vista previa/descarga del archivo y los
  datos del envío (autor, rol, comunidad, versión, fecha y nota). Autorizar fija
  `reviewed_by_id`/`reviewed_at` y desmarca cualquier aprobación previa; rechazar
  exige un motivo de al menos 10 caracteres.
- **Notificaciones y auditoría:** `HOJA_ENVIADA` a los AA activos;
  `HOJA_APROBADA` y `HOJA_RECHAZADA` a encargados y a quien subió, con el motivo
  en el rechazo. Cada operación registra `route_sheet.upload`,
  `route_sheet.approve` o `route_sheet.reject` con antes/después.
- **Acceso a archivos:** una hoja `APROBADA` de una actividad publicada responde
  `200` a cualquier miembro activo. `PENDIENTE_AUTORIZACION` y `RECHAZADA` solo
  son visibles para AA, quien la subió y los encargados de la actividad; el resto
  recibe `404`. Sin sesión, `401`.
- **Recordatorio semanal:** `/api/cron/route-sheet-reminder` (Bearer
  `CRON_SECRET`) corre el miércoles a las 11:00 en `America/Santiago` y lee
  `cron.enabled`, `cron.hour` y `reminder.leadDays` (7 por defecto) desde
  `app_settings`. Busca actividades publicadas y futuras dentro de la ventana sin
  hoja aprobada ni pendiente, avisa a sus encargados
  (`RECORDATORIO_HOJA_FALTANTE`) o a los AA si no hay encargados, y es idempotente
  mediante `job_runs` y `notifications.dedupe_key` por semana.
- **Prueba manual:** el botón «Ejecutar verificación ahora» del panel AA y
  `npm run cron:local -- --bypass` omiten la ventana horaria sin consumir el
  `run_key` semanal. `npm test` valida el guard de miércoles 11:00 y el cálculo
  de semana ISO, incluidos los cambios de horario de verano e invierno.

## Módulo 5 — Material digital, ajustes y auditoría

- `/material` (PP, COORDINADOR y AA): lector **mobile-first** con estética Añil y
  Blanco. Solo muestra recursos `is_published = true`, ordenados por `sort_order`.
  El encabezado resume cuántos recursos están publicados para la unidad.
- **Cuatro pilares con diseño propio:**
  - **El Grito**: bloque oscuro de alto impacto tipográfico. Los encabezados
    `Llamado` y `Respuesta` permiten distinguir las voces del grito.
  - **La Oración**: texto centrado, versos espaciados y ornamentos dorados.
  - **El Himno**: estrofas y coro con saltos de línea preservados, pensado para
    leer o cantar desde el teléfono y para sumar enlaces de audio/acordes.
  - **La Bandera**: vista dividida con imagen prominente, lightbox al tocar y
    descarga. Si no hay foto oficial se usa
    `public/material/bandera-placeholder.svg`, un SVG limpio de referencia.
- **Biblioteca de la unidad**: recursos adicionales creados por los AA
  (`manuales`, historia de Lankuyen, guías de etapa, cantos) con su propia
  tarjeta desplegable.
- **Navegación rápida**: anclas pegajosas por sección, buscador y filtro por
  sección calculados en el servidor (`?q=`, `?seccion=`) para no enviar todos los
  cuerpos al cliente. El botón **Copiar texto** aparece en Grito, Oración, Himno
  y Bandera.
- `/admin/material`: los AA editan los cinco recursos sembrados y crean nuevos.
  Campos `title`, `summary`, `bodyMd` y `sort_order`, con **vista previa Markdown
  en vivo**; la publicación se cambia con un botón separado. La imagen se sube
  por el adaptador de storage (`image_file_id → files`) y acepta PNG, JPG, WEBP y
  SVG de hasta 5 MB. Los SVG se validan y se sirven con CSP restrictiva.
- **Auditoría:** `material.create`, `material.update` (con `before`/`after`) y
  `material.toggle_publish`; además `settings.update` al cambiar parámetros.
- `/admin/configuracion`: edición en caliente de `reminder.leadDays` y
  `route_sheet.allowAnyPpUpload`, contexto del cron/hojas de ruta y tabla de solo
  lectura con los últimos 30 eventos de `audit_logs`.
- **Acceso a imágenes:** `/api/files/[fileId]` responde `200` a cualquier usuario
  activo cuando la imagen pertenece a un `unit_resource` publicado. Un AA también
  puede previsualizar imágenes de borradores; para el resto son `404`.
- **Storage:** `STORAGE_DRIVER="local"` guarda en `LOCAL_STORAGE_DIR` (desarrollo);
  `STORAGE_DRIVER="r2"` usa `@aws-sdk/client-s3` contra Cloudflare R2 o cualquier
  endpoint S3 compatible (`R2_ACCOUNT_ID` o `R2_ENDPOINT`, credenciales, bucket,
  `R2_REGION`, `R2_FORCE_PATH_STYLE`). La capa de dominio solo conoce
  `StorageAdapter`, así que Hojas de Ruta y Material comparten el mismo driver.
- `/inicio`: acceso directo a `/material` con el conteo real de recursos
  publicados. El tablero AA enlaza a Material y Configuración.

## Módulo 6 — Evaluaciones posteriores de actividades

- **Cuándo se habilita:** en `/calendario/[activityId]` aparece el bloque
  «Evaluación posterior» únicamente cuando `ends_at` ya pasó. Antes de eso los
  PP y coordinadores solo ven la actividad y su asistencia.
- **Quién responde:** cuentas `PP` y `COORDINADOR` con el permiso
  `activity:evaluate` (en v1 ambos roles tienen los mismos permisos). `AA` no ve
  el formulario ni puede invocar la Server Action; la acción revalida el permiso
  y vuelve a comprobar que la actividad terminó.
- **Qué se evalúa:** las seis áreas de desarrollo scout —Afectividad,
  Corporalidad, Espiritualidad, Carácter, Creatividad y Sociabilidad— en una
  escala entera de **1 a 7**. El comentario escrito es opcional (máximo 2000
  caracteres). Una persona puede corregir su propia evaluación: el modelo tiene
  una sola fila por actividad y evaluador (`activity_id`, `user_id`).
- **Dónde se leen:** `/admin/evaluaciones` lista las actividades terminadas del
  semestre con respuestas, evaluadores esperados (PP y coordinadores), pendientes
  y promedio general.
  `/admin/evaluaciones/[activityId]` muestra los promedios por área y todas las
  respuestas con nombre, comunidad, notas por área, comentario y fecha de
  actualización. El detalle AA de la actividad enlaza a esta vista.
- **Descubrimiento:** las tarjetas de actividades pasadas muestran «Evaluación
  pendiente» o «Evaluada», y el botón principal lleva directo al formulario.
  El panel AA incorpora «Evaluaciones» en el sidebar y en sus atajos.
- **Integridad:** una migración agrega la tabla `activity_evaluations`, su
  unicidad por actividad/evaluador y un `CHECK` de base de datos para las seis
  notas entre 1 y 7. Cada envío o corrección registra
  `activity.evaluation_submit` / `activity.evaluation_update` en auditoría con
  las notas anteriores y nuevas.

## Modelo de datos

20 modelos en `prisma/schema.prisma`:

- **Usuarios:** `User`, `Community`
- **Progresión:** `Badge`, `UserBadge`, `StageReflection`
- **Calendario y evaluaciones:** `Semester`, `Activity`, `ActivityLeader`,
  `ActivityEvaluation`
- **Asistencia:** `AttendanceResponse`, `JustificationFile`, `AttendanceRecord`
- **Documentos:** `File`, `RouteSheet`
- **Notificaciones:** `Notification`, `NotificationDelivery`, `JobRun`
- **Contenido y soporte:** `UnitResource`, `AppSetting`, `AuditLog`

Restricciones destacadas (migración SQL adicional):

- Un usuario no puede tener dos concesiones activas de la misma insignia.
- Solo puede existir **una hoja aprobada** por actividad.
- Un solo semestre activo a la vez.
- Una sola evaluación por actividad y evaluador; las seis notas deben estar entre 1 y 7.
- Username/email únicos sin distinguir mayúsculas.
- `PP`, `COORDINADOR` y `AA` deben tener comunidad; varias cuentas AA pueden
  compartir la misma comunidad.
- `ends_at > starts_at` en actividades y semestres.

## Imágenes reemplazables

Los placeholders están en:

- `public/brand/logo-lankuyen.svg` → insignia de la unidad.
- `public/badges/*.svg` → 10 insignias (2 etapas, 7 competencias, promesa).
- `public/material/bandera-placeholder.svg` → referencia de la Bandera hasta que
  los AA suban la imagen oficial desde `/admin/material` (queda en `files` y se
  sirve por `/api/files/[fileId]`).

Para reemplazar los SVG, basta con sobrescribir el archivo manteniendo el nombre,
o actualizar `Badge.imagePath` / la ruta del logo. No hay rutas codificadas en los
componentes más allá de esos paths.

## Cronjob

`/api/cron/route-sheet-reminder` está implementado y se invoca por `GET` o
`POST` con `Authorization: Bearer <CRON_SECRET>`:

1. Un scheduler (por ejemplo, cron de Vercel, Railway o un contenedor) lo llama
   cada hora.
2. Solo ejecuta si en `America/Santiago` es miércoles entre 11:00 y 11:59
   (`cron.hour` configurable en `app_settings`).
3. Usa `job_runs (job_name, run_key)` para garantizar una ejecución semanal
   incluso con reintentos o múltiples invocaciones.
4. Busca actividades publicadas y futuras dentro de `reminder.leadDays` días
   (7 por defecto) sin hoja `PENDIENTE_AUTORIZACION` ni `APROBADA`.
5. Notifica a los encargados; si no hay encargados, a todos los AA activos.
6. `notifications.dedupe_key` evita avisos repetidos por actividad y semana.
7. `?bypassScheduleCheck=1` y el botón del panel AA permiten probarlo en
   cualquier momento; el `run_key` manual no consume la ejecución semanal.

Variables relevantes: `CRON_SECRET`, `STORAGE_DRIVER` y `LOCAL_STORAGE_DIR`.
Ajustes en `app_settings`: `timezone`, `cron.enabled`, `cron.hour`,
`reminder.leadDays` y `route_sheet.allowAnyPpUpload`.

```bash
# Prueba local contra el servidor de desarrollo
npm run cron:local             # respeta el guard de miércoles 11:00
npm run cron:local -- --bypass # fuerza la ejecución ahora
```

## Roadmap

- [x] Módulo 1: base, datos, seed, RBAC, autenticación, layouts y tema visual.
- [x] Módulo 2: comunidades, usuarios, perfil, insignias, reflexiones y
  notificaciones in-app.
- [x] Módulo 3: calendario semestral, asistencia en dos fases, ratificación y
  estadísticas de asistencia.
- [x] Módulo 4: hojas de ruta, storage, moderación AA y cron de recordatorios.
- [x] Módulo 5: material digital editable, ajustes operativos, auditoría y
  cierre del adaptador R2.
- [x] Módulo 6: evaluación posterior de actividades en seis áreas por PP y
  coordinadores, con lectura agregada y por respuesta para los AA.

## Seguridad antes de producción

1. Generar un `AUTH_SECRET` y un `CRON_SECRET` nuevos.
2. Cambiar la contraseña del AA inicial (el flujo ya lo exige).
3. Configurar `STORAGE_DRIVER="r2"` con credenciales propias y mantener el bucket
   privado; el adaptador R2 ya está implementado.
4. Configurar HTTPS y `AUTH_URL` con el dominio real.
5. Agregar rate limiting al login (recomendado: Upstash Ratelimit o middleware
   propio) antes de exponer la instancia a Internet.
6. Revisar la política de copias de seguridad de PostgreSQL y del bucket.
