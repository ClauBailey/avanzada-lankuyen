# Constitución del Proyecto — Avanzada Lankuyen

**Versión:** 1.0
**Vigente desde:** 30 de octubre de 2026
**Estado del producto:** v1.3.1
**Ámbito:** todo el repositorio `avanzada-lankuyen`

---

## Preámbulo

Esta constitución define las reglas permanentes que gobiernan el diseño, la
construcción, la operación y la evolución de la plataforma de la **Avanzada
Lankuyen**. Su objetivo es proteger tres cosas por encima de cualquier
funcionalidad nueva:

1. **La privacidad y seguridad de los jóvenes** que usan la plataforma.
2. **La integridad de los datos** de la unidad y su trazabilidad.
3. **La coherencia técnica** para que el proyecto siga siendo mantenible por
   una persona o un equipo pequeño.

El `README.md` describe *qué hace* la plataforma. `AGENTS.md` contiene las
reglas específicas de la versión de Next.js. Este documento establece *cómo se
trabaja y qué no se negocia*.

Toda contribución —humana o asistida por IA— se considera aceptada solo si
cumple esta constitución.

---

## Artículo I — Propósito y dominio

La plataforma es una herramienta interna de gestión para una unidad de
Pioneros. No es una red social pública ni un producto de consumo masivo.

**Dominio funcional:**

- Comunidades, cuentas y roles (`AA`, `PP`, `COORDINADOR`).
- Progresión personal: insignias, etapas, competencias, Promesa y reflexiones.
- Calendario semestral, actividades, RSVP, asistencia y ratificación.
- Hojas de ruta con versionado, moderación y recordatorios.
- Evaluaciones posteriores en seis áreas scout.
- Material digital de la unidad.
- La Bitácora interactiva y el cargo de Guardián.
- Logros y rareza, directorio social de jóvenes, notificaciones y auditoría.

**Regla de oro del dominio:** toda funcionalidad debe responder a una
necesidad real de acompañamiento scout. Si una función incentiva competencia
individual, exposición innecesaria o vigilancia sobre los jóvenes, **no se
implementa**.

---

## Artículo II — Principios irrenunciables

### 1. Privacidad y minimización de datos

- Solo se recopila lo necesario para operar la unidad.
- Los datos de contacto, justificaciones y fotos son **privados por defecto**.
- Los perfiles sociales muestran únicamente información pública del perfil.
- Los Adultos Acompañantes **no** tienen perfil social, insignias de progresión
  ni logros personales. No aparecen en `/miembros` y su perfil responde `404`.
- Los identificadores internos no se exponen si no son necesarios.

### 2. Seguridad en el servidor, no en la interfaz

- Ocultar un botón **no es autorización**.
- Toda mutación revalida sesión, rol y permiso en el servidor.
- Toda lectura sensible revalida el alcance del usuario (autor, AA, encargado,
  Guardián, miembro activo).
- Los archivos privados responden `404` —no `403`— cuando el solicitante no
  tiene acceso, para no revelar su existencia.

### 3. RBAC centralizado

- Ninguna vista, acción o consulta compara roles directamente para decidir
  acceso. Se usa `can()` / `requirePermission()` con permisos del catálogo
  `src/server/rbac/permissions.ts`.
- `COORDINADOR` mantiene un conjunto explícito de permisos. En v1 es idéntico
  al de `PP`; habilitar permisos intermedios debe ser un cambio local en ese
  archivo.
- El cargo de Guardián de la Bitácora es **acumulable**: no reemplaza el rol.
- `AA` es el único rol con acceso al panel `/admin` (`admin:access`).

### 4. Auditoría obligatoria

Toda operación sensible deja rastro en `audit_logs`, dentro de la misma
transacción que la mutación cuando sea posible:

- Otorgar, revocar o eliminar logros e insignias.
- Aprobar o rechazar hojas de ruta y páginas de La Bitácora.
- Ratificar asistencia.
- Crear, editar, publicar o despublicar material.
- Crear, editar, desactivar o eliminar cuentas.
- Cambiar ajustes operativos.

La auditoría registra `before`/`after` cuando aporta contexto y **nunca**
contraseñas, tokens ni datos secretos.

### 5. Tiempo y zona horaria

- La unidad opera en `America/Santiago` (`APP_TIMEZONE`).
- Se almacena en UTC con `timestamptz(3)`; las columnas de fecha pura usan
  `date`.
- Toda conversión de `datetime-local` o `date` pasa por `src/lib/dates.ts`.
- Ningún cálculo de fechas, semanas ISO o guards de cron usa la zona horaria
  del servidor o del navegador.

### 6. Accesibilidad y mobile-first

- La experiencia principal es el teléfono.
- Todo control interactivo tiene etiqueta accesible, foco visible y navegación
  por teclado cuando corresponde.
- Las imágenes informativas tienen `alt`; las decorativas se ocultan a lectores
  de pantalla.
- Los formularios muestran errores en texto, no solo con color.
- Los diálogos destructivos confirman la acción y muestran estado de carga.

### 7. Idioma y tono

- La interfaz, los mensajes de error, la documentación y los commits se
  escriben en **español de Chile**, con tono claro y respetuoso.
- Los identificadores del código (variables, funciones, tipos, tablas) se
  escriben en inglés.
- Los mensajes al usuario no exponen errores técnicos ni detalles de la base de
  datos.

### 8. Simplicidad deliberada

- Se prefiere la solución más pequeña que resuelva el problema real.
- No se agregan dependencias sin justificar su costo de mantenimiento.
- No se construyen abstracciones para casos hipotéticos.
- La lógica pura y testeable se separa de Prisma y de Next.js.

---

## Artículo III — Stack y restricciones técnicas

| Capa | Tecnología obligatoria |
|---|---|
| Framework | Next.js 16 (App Router) + React 19 |
| Lenguaje | TypeScript en modo `strict` |
| Estilos | Tailwind CSS v4 + componentes propios estilo shadcn/ui |
| Base de datos | PostgreSQL 17+ (verificado en 18.6) |
| ORM | Prisma 7 con driver adapter `pg` |
| Autenticación | Auth.js v5 (Credentials) + Argon2id |
| Validación | Zod 4 |
| Fechas | `Intl` con `America/Santiago` |
| Archivos | `StorageAdapter` local o S3/R2 |
| PWA | `@ducanh2912/next-pwa` |

**Restricciones:**

- No se usa Pages Router ni APIs en desuso de Next.js.
- Antes de escribir código de Next.js se consulta la documentación local en
  `node_modules/next/dist/docs/` (ver `AGENTS.md`).
- No se accede a la base de datos desde componentes de cliente.
- No se usa `any` sin un comentario que justifique la excepción.
- No se mezcla lógica de dominio con JSX si puede vivir en `features/` o
  `lib/`.
- No se modifica `src/generated/**` a mano; se regenera con Prisma.
- No se editan migraciones ya aplicadas. Se crea una nueva.

---

## Artículo IV — Arquitectura y capas

### Mapa de responsabilidades

```text
src/app/            Rutas, layouts y composición de páginas (Server Components)
src/components/     UI reutilizable y componentes de dominio con estado de cliente
src/features/       Lógica de dominio: schemas, actions, queries, helpers puros
src/lib/            Utilidades transversales sin estado (fechas, slugs, constantes)
src/server/         Infraestructura de servidor: auth, RBAC, DB, auditoría,
                    notificaciones, storage y cron
prisma/             Esquema, migraciones y seed
tests/              Pruebas con node:test ejecutadas por tsx
scripts/            Utilidades operativas locales
```

### Dirección de dependencias

```text
app → components → features → lib
app → features → server → generated
components (cliente) → lib
```

Reglas:

- `app/` compone; no implementa reglas de negocio complejas.
- `components/` puede usar `features/` solo para tipos y Server Actions.
- `features/` no importa componentes de React.
- `lib/` no importa Prisma, Next.js ni módulos `server-only`.
- `server/` puede importar `lib/` y `generated/`; nunca `components/`.
- Los módulos puros usados por tests no deben depender de alias `@/` ni de
  `server-only`.

### Convenciones de nombres

| Elemento | Convención | Ejemplo |
|---|---|---|
| Archivos | `kebab-case.ts(x)` | `create-achievement-dialog.tsx` |
| Componentes | `PascalCase` | `AchievementCard` |
| Hooks | `useCamelCase` | `useActionState` |
| Funciones | `camelCase` | `getAchievementRarity` |
| Tipos/interfaces | `PascalCase` | `AchievementView` |
| Constantes | `SCREAMING_SNAKE_CASE` | `RARITY_OPTIONS` |
| Acciones | `verboEntidadAction` | `deleteAchievementAction` |
| Consultas | `getVerboEntidad` | `getMembersDirectory` |
| Tablas SQL | `snake_case` plural | `user_achievements` |
| Columnas SQL | `snake_case` | `achievement_id` |

---

## Artículo V — Modelo de datos

### Identificadores

- **Toda clave primaria usa UUID:** `String @id @default(uuid()) @db.Uuid`.
- **Toda clave foránea que referencia un UUID es `@db.Uuid`.**
- Los campos `Notification.entityId` y `AuditLog.entityId` son UUID: cualquier
  valor que se les pase debe ser un UUID válido.
- Los esquemas Zod que reciben IDs deben usar `.uuid()`.
- No se introducen CUID, ULID ni IDs numéricos sin una decisión registrada.

### Tipos y columnas

- Textos acotados: `@db.VarChar(n)`; textos largos: `@db.Text`.
- Marcas de tiempo: `@db.Timestamptz(3)`.
- Fechas sin hora: `@db.Date`.
- Booleanos con nombre explícito y `@map` en `snake_case`.
- Enums de PostgreSQL para estados cerrados; no strings libres.
- `createdAt`/`updatedAt` según corresponda; `updatedAt` con `@updatedAt`.

### Integridad

- Relaciones con `onDelete` explícito (`Cascade` o `SetNull`), nunca implícito.
- Restricciones que Prisma no puede expresar se agregan en migraciones SQL:
  - una sola concesión activa por insignia y usuario;
  - una sola hoja aprobada por actividad;
  - un solo semestre activo;
  - una sola evaluación por actividad y evaluador;
  - notas de evaluación entre 1 y 7;
  - un solo Guardián activo;
  - numeración publicada sin repetición.
- Los índices deben cubrir los filtros y ordenamientos reales de las consultas.

### Bajas lógicas

- Las entidades históricas usan `isActive` y/o `deletedAt` en lugar de borrado
  físico.
- Toda consulta de listado filtra `isActive: true` y `deletedAt: null` cuando
  corresponda.
- El borrado físico solo se permite en acciones administrativas explícitas,
  auditadas y con cascada revisada.

### Migraciones y seed

- Toda migración es versionada, inmutable y con nombre descriptivo.
- Las migraciones que cambian tipos deben **preservar datos** o documentar
  explícitamente por qué no pueden hacerlo.
- El seed es idempotente (`upsert` por clave natural) y no destructivo.
- Un cambio de esquema se entrega junto con: migración, cliente regenerado,
  seed actualizado si aplica y pruebas ajustadas.

---

## Artículo VI — Autenticación y autorización

- **No existe registro público.** Las cuentas las crea un AA.
- Login con `username` o `email`, normalizados a minúsculas.
- Contraseñas con Argon2id; nunca en texto plano ni en logs.
- Auth.js usa JWT, pero `getCurrentUser()` **revalida contra PostgreSQL en cada
  request**. Una cuenta desactivada, eliminada o con rol cambiado pierde acceso
  de inmediato.
- `must_change_password` obliga a pasar por `/cambiar-password` antes de
  cualquier vista de la aplicación.
- Cookies `httpOnly`, `sameSite=lax`, expiración de 8 horas.
- Los layouts protegidos son la primera barrera; **cada Server Action vuelve a
  validar el permiso**.
- `requireUser`, `requireReadyUser`, `requirePermission` y `requireAA` son las
  únicas puertas de entrada a sesión y permisos.

**Prohibido:**

- Comparar `role === "PP" || role === "COORDINADOR"` para autorizar.
- Confiar en parámetros ocultos del formulario para decidir alcance.
- Devolver datos privados completos y ocultarlos en el cliente.

---

## Artículo VII — Server Actions y validación

Toda Server Action sigue este contrato:

1. Archivo con `"use server"` en `src/features/<dominio>/actions.ts`.
2. Obtener actor con `requirePermission(...)` o `requireUser()`.
3. Validar la entrada con un esquema Zod de `schemas.ts` usando `safeParse`.
4. Devolver el primer error legible con `firstIssue(parsed.error)`.
5. Verificar existencia, estado y alcance del recurso antes de mutar.
6. Ejecutar la mutación dentro de `prisma.$transaction`.
7. Registrar auditoría con `recordAudit` dentro de la misma transacción.
8. Crear notificaciones con `notifyUser` dentro de la transacción cuando
   corresponda.
9. Revalidar **todas** las rutas afectadas con `revalidatePath`.
10. Retornar `{ success: "mensaje" }` o `{ error: "mensaje" }` (`ActionState`).

**Reglas adicionales:**

- Los errores esperables se devuelven; no se lanzan para controlar el flujo.
- Los formularios usan `useActionState` y `SubmitButton` con etiqueta de
  pendiente en español.
- Las acciones no reciben objetos del cliente: reciben `FormData`.
- Los IDs se validan con `.uuid()`.
- Las fechas se parsean con los helpers de `src/lib/dates.ts`.
- Los textos de error no revelan detalles internos.

---

## Artículo VIII — Notificaciones y auditoría

### Notificaciones

- Se crean con `notifyUser` (`src/server/notifications.ts`), nunca con
  `prisma.notification.create` disperso en el dominio.
- El tipo pertenece al enum `NotificationType`.
- `entityType` + `entityId` deben apuntar a una entidad real y usar UUID.
- `actionUrl` debe ser una ruta interna válida.
- `dedupeKey` es obligatorio en procesos reintentables o periódicos.
- La campana y la navegación móvil muestran el número real de no leídas.

### Auditoría

- Formato de acción: `<dominio>.<verbo>` (`achievement.grant`,
  `logbook.approve`, `route_sheet.reject`).
- `entityType` identifica el modelo; `entityId` es su UUID.
- `before` y `after` son objetos serializables, sin secretos.
- La auditoría se escribe en la misma transacción que el cambio.
- Los eventos visibles en `/admin/configuracion` son de solo lectura.

---

## Artículo IX — Archivos y privacidad

- Todo archivo pasa por `StorageAdapter`; el dominio no conoce el driver.
- `STORAGE_DRIVER="local"` para desarrollo; `r2` para producción.
- `/api/files/[fileId]` es el único punto de descarga y **siempre** valida
  sesión y alcance.
- Reglas de visibilidad:
  - justificaciones: autor y AA;
  - hojas de ruta aprobadas: cualquier miembro activo;
  - hojas pendientes o rechazadas: AA, autor y encargados;
  - fotos de Bitácora publicadas: cualquier miembro activo;
  - fotos pendientes o rechazadas: autor, AA y Guardián;
  - imágenes de material publicado: cualquier miembro activo.
- Sin sesión: `401`. Sin permiso: `404`.
- Límites y formatos se validan en servidor, no solo en el navegador.
- Los SVG se validan y se sirven con CSP restrictiva.
- El Service Worker **nunca** cachea `/api/*` (`NetworkOnly`).

---

## Artículo X — Interfaz y experiencia

- Paleta oficial definida en `src/app/globals.css`: Añil (`anil-*`), lienzo
  (`canvas`), superficie (`surface`), tinta (`ink`), línea (`line`), lavanda y
  dorado (`gold`).
- Tipografías: Inter para texto, Fraunces para títulos (`font-display`).
- No se usan colores, sombras o radios hardcodeados fuera de los tokens.
- Los componentes base viven en `src/components/ui/`.
- Los componentes de dominio viven en `src/components/<dominio>/`.
- Se usan iconos de `lucide-react` con `aria-hidden` cuando son decorativos.
- Los estados vacíos explican qué hacer, no solo que no hay datos.
- Los formularios muestran ayuda, validación y resultado.
- Las acciones destructivas usan confirmación, texto de advertencia claro,
  botón rojo, ícono `Trash2` cuando aplica y estado `"Eliminando..."`.
- **No se muestran puntajes acumulables por usuario.** El antiguo campo
  `points` es el índice de rareza del logro, no un marcador competitivo.
- La rareza se muestra como etiqueta estética, nunca como ranking.
- Un logro `SECRET` bloqueado oculta título, descripción, ícono y rareza real
  (`"???"`), salvo para AA.

---

## Artículo XI — Pruebas y puertas de calidad

### Principios

- Se prueba la **lógica pura** y las **reglas de autorización**, no la
  implementación de React.
- Todo bug corregido agrega una prueba de regresión.
- Los módulos probados deben poder importarse sin Prisma, Next.js ni
  `server-only`.
- Los tests usan `node:test` + `node:assert/strict` y se ejecutan con `tsx`.

### Cobertura mínima exigida

- Rangos y reglas de negocio (rareza, promedios, semanas ISO, guards de cron).
- Validación Zod de entradas críticas, incluidos UUID.
- Permisos por rol y cargos acumulables.
- Privacidad: un logro secreto bloqueado no filtra su contenido ni su rareza.
- Filtros de consultas que excluyen roles (por ejemplo, AA fuera del directorio).
- Cálculos de fechas con cambios de horario de verano/invierno.

### Puertas de calidad

Antes de dar por terminado cualquier cambio, en este orden:

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

- Las cuatro deben pasar.
- No se acepta un cambio con advertencias nuevas de TypeScript o ESLint.
- Si se agrega un archivo de test, **debe** añadirse a la lista explícita del
  script `test` en `package.json`.
- No se desactivan reglas de ESLint ni se usa `@ts-ignore` para ocultar un
  problema real.

---

## Artículo XII — Flujo de trabajo y Git

### Ramas

- `main` es la rama estable.
- Trabajo nuevo: `feature/<alcance>`.
- Correcciones: `fix/<alcance>`.
- Mantenimiento: `chore/<alcance>`.

### Commits

Se usa Conventional Commits, con descripción en español:

```text
feat(v1.3): directorio social y sistema de logros por rareza
fix(achievements): unifica IDs de logros a UUID
chore: actualiza dependencias de desarrollo
```

- Un commit debe contar **una** intención coherente.
- No se mezclan refactors masivos con cambios funcionales.
- No se commitean secretos, `.env`, artefactos de build ni archivos temporales.
- No se hace `push` forzado sobre `main`.
- No se hace commit ni push sin que la persona lo haya pedido explícitamente.

### Documentación

- Un cambio de comportamiento actualiza `README.md`.
- Un cambio de esquema actualiza migración + seed y se refleja en la
  documentación.
- Un cambio de reglas de trabajo se refleja en esta constitución.
- El bloque generado de `AGENTS.md` no se elimina: Next.js lo vuelve a crear.

---

## Artículo XIII — Definición de Terminado (DoD)

Un cambio está terminado solo si:

- [ ] Resuelve el problema pedido sin ampliar el alcance.
- [ ] Revalida permisos y alcance en el servidor.
- [ ] Valida entradas con Zod, incluidos UUID cuando aplica.
- [ ] Usa transacción para mutaciones compuestas.
- [ ] Registra auditoría cuando la operación es sensible.
- [ ] Notifica cuando el flujo lo requiere, con `dedupeKey` si es reintentable.
- [ ] Revalida las rutas afectadas.
- [ ] Mantiene privacidad y reglas de acceso a archivos.
- [ ] Respeta tokens visuales, accesibilidad y mobile-first.
- [ ] Agrega o actualiza pruebas de las reglas nuevas.
- [ ] Pasa `typecheck`, `lint`, `test` y `build`.
- [ ] Incluye migración y seed si cambió el esquema.
- [ ] Actualiza documentación si cambió el comportamiento.
- [ ] No introduce secretos ni datos reales en el repositorio.

---

## Artículo XIV — Seguridad operativa

- `.env` nunca se versiona. `.env.example` debe contener **solo placeholders**,
  jamás credenciales reales.
- `AUTH_SECRET` y `CRON_SECRET` deben ser distintos, aleatorios y rotables.
- El bucket de archivos es privado; el acceso se sirve exclusivamente por la
  API autorizada.
- HTTPS obligatorio en producción; `AUTH_URL` con el dominio real.
- La cuenta inicial del seed debe cambiar su contraseña en el primer ingreso.
- La base de datos usa el principio de menor privilegio.
- Se revisan copias de seguridad de PostgreSQL y del almacenamiento.
- Antes de exponer la instancia a Internet se agrega rate limiting al login.
- Las dependencias se actualizan de forma deliberada y con las cuatro puertas
  de calidad ejecutadas.

---

## Artículo XV — Gobernanza y enmiendas

1. Esta constitución prevalece sobre preferencias personales, modas de
   framework y sugerencias de herramientas automáticas.
2. Una excepción debe justificarse en el Pull Request, acotarse y registrar su
   deuda.
3. Toda enmienda se propone mediante PR, indicando:
   - artículo afectado;
   - motivo;
   - impacto en código, datos y operación;
   - fecha de vigencia.
4. La versión se incrementa:
   - **MAJOR:** cambia un principio irrenunciable;
   - **MINOR:** se agrega o precisa una regla;
   - **PATCH:** correcciones editoriales.
5. Las decisiones técnicas relevantes se registran en el Anexo C.

---

## Anexo A — Mapa rápido del repositorio

```text
prisma/
  schema.prisma          # 23 modelos, enums y relaciones
  migrations/            # migraciones versionadas e inmutables
  seed.ts                # seed idempotente
src/
  app/
    (auth)/              # login y cambio de contraseña
    (app)/               # vistas PP y COORDINADOR
    (admin)/admin/       # panel AA
    api/auth/            # handlers de Auth.js
    api/files/           # descarga autorizada
  components/
    ui/                  # base visual
    layout/              # shell, sidebar, navegación
    <dominio>/           # componentes de dominio
  features/
    <dominio>/           # schemas, actions, queries y helpers puros
  lib/                   # fechas, constantes, slugs, utilidades
  server/
    auth/                # Auth.js, Argon2, sesión revalidada
    rbac/                # catálogo de permisos y can()
    cron/                # jobs programados
    storage/             # adaptadores LOCAL y R2
  generated/prisma/      # cliente generado (no editar)
tests/                   # node:test + tsx
scripts/                 # utilidades locales
```

---

## Anexo B — Comandos canónicos

| Comando | Uso |
|---|---|
| `npm run dev` | Desarrollo |
| `npm run typecheck` | Verificación TypeScript |
| `npm run lint` | ESLint |
| `npm test` | Pruebas |
| `npm run build` | Build de producción |
| `npm run db:migrate` | Nueva migración en desarrollo |
| `npm run db:seed` | Datos iniciales idempotentes |
| `npm run db:studio` | Explorar la base |
| `npm run db:reset` | Reiniciar base y seed |
| `npm run cron:local -- --bypass` | Probar el cron fuera de ventana |

---

## Anexo C — Registro de decisiones

| ID | Decisión | Fundamento |
|---|---|---|
| AD-001 | JWT de Auth.js con revalidación en cada request | Credentials no soporta sesiones en base; la revalidación mantiene revocación inmediata |
| AD-002 | Catálogo central de permisos y `can()` | Evita comparaciones de rol dispersas y permite permisos intermedios |
| AD-003 | Bajas lógicas con `isActive`/`deletedAt` | Conserva historial y relaciones |
| AD-004 | UUID en todas las claves | Compatibilidad con `Notification.entityId` y `AuditLog.entityId`; evita P2007 |
| AD-005 | `points` como índice de rareza, no como marcador | Evita competencia individual y refuerza el enfoque formativo |
| AD-006 | AA excluidos del directorio social | No tienen progresión ni logros personales que mostrar |
| AD-007 | `StorageAdapter` con drivers LOCAL/R2 | Desarrollo simple y producción desacoplada |
| AD-008 | Service Worker con `NetworkOnly` para `/api/*` | Evita cachear datos privados y respuestas dependientes de sesión |

---

## Anexo D — Riesgos y deuda conocida

Estos puntos no forman parte del comportamiento deseado; se registran para no
normalizarlos:

- **Crítico:** `.env.example` contiene credenciales reales de Neon. Debe
  reemplazarse por placeholders y rotarse la contraseña expuesta.
- Rate limiting de login aún pendiente antes de producción.
- El `README.md` puede quedar desfasado respecto del número de modelos y
  versiones; la fuente de verdad del esquema es `prisma/schema.prisma`.
- La suite de tests se ejecuta con una lista explícita de archivos; olvidar
  agregar un test nuevo a `package.json` lo deja fuera de la puerta de calidad.

---

*Fin de la constitución.*
