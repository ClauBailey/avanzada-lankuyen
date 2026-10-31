# Especificación de Requerimientos — Avanzada Lankuyen

**Versión del documento:** 1.0
**Fecha:** 30 de octubre de 2026
**Versión especificada:** v1.3.1
**Estado:** implementada y verificada
**Documentos relacionados:** `README.md`, `CONSTITUTION.md`, `AGENTS.md`, `prisma/schema.prisma`

---

## 1. Propósito y alcance

Este documento especifica los requerimientos funcionales, reglas de negocio y
requerimientos no funcionales de la plataforma **Avanzada Lankuyen**, tal como
está construida a la fecha. Sirve como contrato de referencia para mantener,
auditar y extender el sistema sin desviarse de su comportamiento actual.

### 1.1 Alcance incluido

- Autenticación y gestión de sesión.
- Administración de comunidades y cuentas.
- Progresión personal: insignias, etapas, competencias y Promesa.
- Calendario semestral y actividades.
- RSVP, asistencia y ratificación.
- Hojas de ruta, moderación y recordatorios automáticos.
- Evaluaciones posteriores de actividades.
- Material digital de la unidad.
- La Bitácora interactiva y el cargo de Guardián.
- Logros, rareza y directorio social de jóvenes.
- Notificaciones in-app, auditoría y ajustes operativos.
- PWA instalable con fallback offline.

### 1.2 Fuera de alcance

- Registro público de cuentas.
- Uso por personas externas a la unidad.
- Mensajería instantánea entre miembros.
- Envío real de correos o push: el modelo contempla canales, pero la entrega
  implementada es **solo in-app**.
- Integraciones con redes sociales o calendarios externos.
- Facturación, planes o multi-unidad.
- Aplicaciones móviles nativas.

---

## 2. Actores

| Actor | Descripción |
|---|---|
| **AA** | Adulto Acompañante. Administra la unidad, modera, otorga insignias y logros, gestiona cuentas y configuración. |
| **PP** | Pionero/a. Participa en actividades, confirma asistencia, sube hojas de ruta, evalúa actividades y propone páginas de Bitácora. |
| **COORDINADOR** | Pionero/a con permisos equivalentes a PP en v1. Puede asumir tareas de coordinación sin permisos administrativos. |
| **Guardián de la Bitácora** | Cargo acumulable sobre PP/COORDINADOR/AA. Puede revisar y moderar páginas de La Bitácora. |
| **Visitante** | Persona sin sesión. Solo accede a login y recursos públicos del flujo de autenticación. |
| **Scheduler** | Servicio externo que invoca el cron con `CRON_SECRET`. |

---

## 3. Glosario

| Término | Definición |
|---|---|
| **Comunidad** | Agrupación interna a la que pertenece una cuenta. |
| **Insignia** | Reconocimiento de etapa, competencia o Promesa. |
| **Logro** | Reconocimiento del catálogo RPG, con categoría, visibilidad y rareza. |
| **Rareza** | Clasificación estética derivada del valor numérico `points` del logro. No es un puntaje acumulable. |
| **RSVP** | Respuesta anticipada de asistencia a una actividad. |
| **Ratificación** | Registro final de asistencia realizado por un AA. |
| **Hoja de ruta** | Documento de planificación de una actividad, versionado y sujeto a aprobación. |
| **Bitácora** | Libro digital de la unidad con páginas propuestas, moderadas y publicadas. |
| **MUST / DEBE** | Requerimiento obligatorio. |
| **SHOULD / DEBERÍA** | Requerimiento recomendado; su omisión debe justificarse. |

---

## 4. Requerimientos funcionales

### 4.1 Autenticación y sesión (RF-AUT)

| ID | Requerimiento |
|---|---|
| RF-AUT-01 | El sistema DEBE permitir iniciar sesión con `username` **o** correo, sin distinguir mayúsculas. |
| RF-AUT-02 | El sistema NO DEBE ofrecer registro público. Las cuentas solo las crea un AA. |
| RF-AUT-03 | Las contraseñas DEBEN almacenarse con Argon2id y nunca mostrarse ni registrarse en logs. |
| RF-AUT-04 | La sesión DEBE usar cookies `httpOnly`, `sameSite=lax`, con expiración de 8 horas. |
| RF-AUT-05 | Si la cuenta está inactiva, eliminada o cambió de rol, la sesión DEBE reflejarlo en la siguiente petición. |
| RF-AUT-06 | Si `must_change_password` está activo, el usuario DEBE ser redirigido a `/cambiar-password` antes de cualquier vista de la aplicación. |
| RF-AUT-07 | El cambio de contraseña DEBE exigir contraseña actual, mínimo 10 caracteres, al menos una letra, al menos un número y confirmación coincidente. |
| RF-AUT-08 | La nueva contraseña NO DEBE ser igual a la actual. |
| RF-AUT-09 | El cierre de sesión DEBE estar disponible en la navegación de escritorio y móvil. |
| RF-AUT-10 | Un usuario autenticado que visita login DEBE ser redirigido a `/admin` si es AA o a `/inicio` si es PP/COORDINADOR. |

**Criterios de aceptación**

- Credenciales inválidas muestran un error genérico sin revelar si el usuario
  existe.
- Una cuenta desactivada pierde acceso inmediatamente, sin esperar expiración
  del token.
- El primer ingreso del AA inicial obliga al cambio de contraseña.

---

### 4.2 Comunidades y cuentas (RF-COM, RF-USU)

#### Comunidades

| ID | Requerimiento |
|---|---|
| RF-COM-01 | El AA DEBE poder crear y editar comunidades con nombre (3–80 caracteres), descripción (máx. 300) y color hexadecimal `#RRGGBB`. |
| RF-COM-02 | El AA DEBE poder desactivar una comunidad sin borrar su historial. |
| RF-COM-03 | La vista de comunidades DEBE mostrar el conteo de miembros asociados. |
| RF-COM-04 | Toda cuenta DEBE tener una comunidad asignada. |
| RF-COM-05 | Varias cuentas AA PUEDEN compartir la misma comunidad. |

#### Cuentas

| ID | Requerimiento |
|---|---|
| RF-USU-01 | El AA DEBE poder crear cuentas `PP`, `COORDINADOR` o `AA` con nombre, apellido, username, correo opcional, rol y comunidad. |
| RF-USU-02 | El username DEBE cumplir `^[a-z0-9][a-z0-9._-]{2,39}$` y ser único sin distinguir mayúsculas. |
| RF-USU-03 | El correo DEBE ser válido cuando se informa y único sin distinguir mayúsculas. |
| RF-USU-04 | La contraseña temporal PUEDE generarse automáticamente o definirse manualmente; si es manual, DEBE tener mínimo 10 caracteres, al menos una letra y al menos un número. |
| RF-USU-05 | La contraseña temporal DEBE poder copiarse y DEBE marcar `must_change_password`. |
| RF-USU-06 | El listado de usuarios DEBE permitir filtrar por comunidad, rol y estado, y buscar por nombre o username. |
| RF-USU-07 | El AA DEBE poder cambiar la comunidad de una cuenta a una comunidad activa. |
| RF-USU-08 | El AA DEBE poder alternar el rol solo entre `PP` y `COORDINADOR`. |
| RF-USU-09 | El rol `AA` NO DEBE cambiarse desde la vista de usuarios. |
| RF-USU-10 | Un AA NO DEBE poder cambiar su propio rol ni desactivar su propia cuenta. |
| RF-USU-11 | El AA DEBE poder activar o desactivar cuentas. |
| RF-USU-12 | El AA DEBE poder restablecer una contraseña, generando una temporal y notificando al titular. |
| RF-USU-13 | El AA DEBE poder eliminar una cuenta, salvo su propia cuenta o el último AA activo restante. |
| RF-USU-14 | La ficha de miembro DEBE mostrar sus datos, comunidad, insignias, reflexiones y acciones rápidas. |
| RF-USU-15 | Toda creación, cambio de rol, comunidad, estado, reseteo o eliminación DEBE registrarse en auditoría. |

**Criterios de aceptación**

- Crear un username o correo duplicado devuelve un error legible.
- Asignar una comunidad inactiva es rechazado.
- La eliminación del último AA activo responde con conflicto y no borra.
- Un PP no puede ejecutar acciones de gestión de usuarios ni invocando la
  Server Action directamente.

---

### 4.3 Progresión personal (RF-PRO)

| ID | Requerimiento |
|---|---|
| RF-PRO-01 | El catálogo DEBE contener insignias de etapa (`SENDERO`, `CUMBRE`), competencias y Promesa. |
| RF-PRO-02 | El AA DEBE poder otorgar una insignia con nota opcional, generando notificación `INSIGNIA_OTORGADA` y auditoría `badge.grant`. |
| RF-PRO-03 | El AA DEBE poder revocar una insignia, registrando `revokedAt`/`revokedById` y auditoría `badge.revoke`. |
| RF-PRO-04 | Un usuario NO DEBE tener dos concesiones activas de la misma insignia. |
| RF-PRO-05 | El AA DEBE poder editar título y descripción de las competencias sin tocar código. |
| RF-PRO-06 | El perfil DEBE mostrar comunidad, insignias obtenidas, Promesa, línea de etapas y reflexiones editables. |
| RF-PRO-07 | Las insignias no obtenidas DEBEN mostrarse en gris y con candado, con el texto: «Cuando tu AA la otorgue, la imagen se activará a todo color.» |
| RF-PRO-08 | Los contadores de insignias DEBEN mostrarse sin barra ni denominador. |
| RF-PRO-09 | Las cuentas AA NO DEBEN tener bloque de progresión ni recibir insignias. |
| RF-PRO-10 | Cada insignia obtenida DEBE ofrecer «Compartir insignia» mediante un PNG 1080 × 1920 generado en el cliente. |
| RF-PRO-11 | El PNG DEBE incluir logo, insignia, nombre, `@username`, comunidad, fecha y dedicatoria o lema de respaldo. |
| RF-PRO-12 | El modal DEBE permitir compartir con `navigator.share` cuando esté disponible y descargar como `insignia-[slug]-[username].png`. |

---

### 4.4 Calendario y actividades (RF-CAL)

| ID | Requerimiento |
|---|---|
| RF-CAL-01 | El AA DEBE poder crear semestres con formato `YYYY-S1`/`YYYY-S2`, fecha de inicio y término, con `endsOn > startsOn`. |
| RF-CAL-02 | Solo PUEDE existir un semestre activo a la vez. |
| RF-CAL-03 | El AA DEBE poder crear, editar y desactivar actividades con título (3–160), tipo, inicio, término, ubicación (máx. 160), descripción (máx. 2000), visibilidad y hasta 30 encargados. |
| RF-CAL-04 | Los encargados DEBEN ser cuentas `PP` o `COORDINADOR`; los AA NO DEBEN asignarse como encargados. |
| RF-CAL-05 | `endsAt` DEBE ser posterior a `startsAt`. |
| RF-CAL-06 | Las actividades no publicadas NO DEBEN aparecer en el calendario de los jóvenes. |
| RF-CAL-07 | El calendario DEBE permitir filtrar por mes, tipo y próximas/pasadas. |
| RF-CAL-08 | El detalle DEBE mostrar fecha y hora, tipo, ubicación, encargados con su comunidad, etiqueta «Eres encargado», RSVP y asistencia ratificada. |
| RF-CAL-09 | Si existe una hoja de ruta aprobada, el detalle DEBE ofrecer su descarga; si no, indicar «Hoja de ruta: Pendiente». |
| RF-CAL-10 | Las tarjetas de actividades pasadas DEBEN indicar «Evaluación pendiente» o «Evaluada» según corresponda. |

---

### 4.5 Asistencia y ratificación (RF-ASI)

| ID | Requerimiento |
|---|---|
| RF-ASI-01 | El RSVP DEBE estar disponible solo mientras la actividad es futura y no ha sido ratificada. |
| RF-ASI-02 | El joven DEBE poder responder `CONFIRMADO` o `NO_ASISTE`. |
| RF-ASI-03 | `NO_ASISTE` DEBE exigir justificación escrita y/o un archivo adjunto. |
| RF-ASI-04 | La justificación escrita DEBE tener máximo 1200 caracteres. |
| RF-ASI-05 | El archivo de justificación DEBE ser PDF, JPG, PNG o WEBP y no superar 10 MB. |
| RF-ASI-06 | Al confirmar, el sistema DEBE notificar a los AA de la comunidad del miembro o, si no hay, a todos los AA activos. |
| RF-ASI-07 | Una inasistencia justificada DEBE generar notificación `INASISTENCIA_JUSTIFICADA` con prioridad y enlace al panel de asistencia. |
| RF-ASI-08 | El AA DEBE poder ratificar la asistencia con estados `PRESENTE`, `AUSENTE` o `JUSTIFICADO` y una nota de hasta 500 caracteres. |
| RF-ASI-09 | La ratificación DEBE poder pre-rellenarse desde el RSVP: `CONFIRMADO → PRESENTE`, `NO_ASISTE → JUSTIFICADO`, sin respuesta → `AUSENTE`. |
| RF-ASI-10 | Cada registro ratificado DEBE guardar `ratifiedById` y `ratifiedAt`. |
| RF-ASI-11 | La ratificación DEBE poder repetirse, conservando en auditoría el antes/después. |
| RF-ASI-12 | El porcentaje de asistencia efectiva del semestre activo DEBE calcularse solo con registros ratificados. |
| RF-ASI-13 | Las justificaciones solo DEBEN ser visibles para su autor y los AA. |

---

### 4.6 Hojas de ruta (RF-HDR)

| ID | Requerimiento |
|---|---|
| RF-HDR-01 | DEBEN poder subir hojas de ruta los AA, los encargados de la actividad y cualquier `PP`/`COORDINADOR` cuando `route_sheet.allowAnyPpUpload` esté activo. |
| RF-HDR-02 | El archivo DEBE ser PDF, DOC, DOCX, JPG, PNG o WEBP y no superar 10 MB. |
| RF-HDR-03 | La primera versión DEBE nacer en estado `PENDIENTE_AUTORIZACION`. |
| RF-HDR-04 | NO DEBE admitirse una nueva versión mientras exista una pendiente o aprobada para la misma actividad. |
| RF-HDR-05 | Tras un rechazo, DEBE poder subirse una nueva versión, conservando el historial y el motivo anterior. |
| RF-HDR-06 | El AA DEBE disponer de una bandeja de moderación con filtros por estado, semestre y actividad. |
| RF-HDR-07 | Aprobar DEBE fijar `reviewedById`/`reviewedAt`, dejar la hoja como `APROBADA` y retirar cualquier aprobación anterior de la actividad. |
| RF-HDR-08 | Rechazar DEBE exigir un motivo de entre 10 y 1200 caracteres. |
| RF-HDR-09 | Al subir, aprobar o rechazar DEBEN generarse notificaciones `HOJA_ENVIADA`, `HOJA_APROBADA` o `HOJA_RECHAZADA`. |
| RF-HDR-10 | Cada operación DEBE auditarse como `route_sheet.upload`, `route_sheet.approve` o `route_sheet.reject`. |
| RF-HDR-11 | Una hoja aprobada de una actividad publicada DEBE ser descargable por cualquier miembro activo; pendientes y rechazadas solo por AA, autor y encargados. |
| RF-HDR-12 | DEBE existir un recordatorio semanal los miércoles entre 11:00 y 11:59 en `America/Santiago`. |
| RF-HDR-13 | El recordatorio DEBE avisar a los encargados o, si no hay, a los AA activos, para actividades publicadas y futuras dentro de `reminder.leadDays`. |
| RF-HDR-14 | El recordatorio DEBE ser idempotente mediante `job_runs` y `notifications.dedupe_key`. |
| RF-HDR-15 | DEBE existir una ejecución manual con `?bypassScheduleCheck=1` o `npm run cron:local -- --bypass` que no consuma el `run_key` semanal. |

---

### 4.7 Evaluaciones de actividades (RF-EVA)

| ID | Requerimiento |
|---|---|
| RF-EVA-01 | La evaluación posterior DEBE habilitarse solo cuando `endsAt` ya pasó. |
| RF-EVA-02 | Solo `PP` y `COORDINADOR` con `activity:evaluate` DEBEN poder responder. |
| RF-EVA-03 | El formulario DEBE evaluar seis áreas: Afectividad, Corporalidad, Espiritualidad, Carácter, Creatividad y Sociabilidad. |
| RF-EVA-04 | Cada área DEBE usar una escala entera de 1 a 7. |
| RF-EVA-05 | El comentario escrito DEBE ser opcional y de máximo 2000 caracteres. |
| RF-EVA-06 | DEBE existir una sola evaluación por actividad y evaluador; un nuevo envío la corrige. |
| RF-EVA-07 | Las notas DEBEN validarse también con un `CHECK` en la base de datos. |
| RF-EVA-08 | El AA DEBE ver el listado de actividades terminadas con respuestas, evaluadores esperados, pendientes y promedio general. |
| RF-EVA-09 | El detalle DEBE mostrar promedios por área y todas las respuestas con nombre, comunidad, notas, comentario y fecha de actualización. |
| RF-EVA-10 | Cada envío o corrección DEBE auditarse como `activity.evaluation_submit` o `activity.evaluation_update`. |

---

### 4.8 Material digital (RF-MAT)

| ID | Requerimiento |
|---|---|
| RF-MAT-01 | El lector DEBE mostrar solo recursos publicados, ordenados por `sortOrder`. |
| RF-MAT-02 | DEBE incluir los cuatro pilares: El Grito, La Oración, El Himno y La Bandera. |
| RF-MAT-03 | DEBE incluir una biblioteca de recursos adicionales creados por los AA. |
| RF-MAT-04 | El diseño DEBE ser mobile-first, con anclas por sección, buscador y filtro por sección resueltos en el servidor. |
| RF-MAT-05 | La Bandera DEBE ofrecer imagen prominente, lightbox y descarga; si no hay imagen oficial, usar el placeholder. |
| RF-MAT-06 | Los pilares Grito, Oración, Himno y Bandera DEBEN ofrecer «Copiar texto». |
| RF-MAT-07 | El AA DEBE poder crear y editar recursos con título (3–160), resumen (máx. 300), cuerpo Markdown (máx. 60.000) y orden (0–9999). |
| RF-MAT-08 | El formulario DEBE incluir vista previa Markdown en vivo. |
| RF-MAT-09 | La publicación DEBE cambiarse con una acción separada. |
| RF-MAT-10 | La imagen DEBE ser PNG, JPG, WEBP o SVG de máximo 5 MB; los SVG DEBEN validarse y servirse con CSP restrictiva. |
| RF-MAT-11 | Un recurso publicado DEBE ser visible para cualquier miembro activo; un borrador solo para AA. |
| RF-MAT-12 | Crear, editar y publicar/despublicar DEBEN auditarse como `material.create`, `material.update` y `material.toggle_publish`. |

---

### 4.9 La Bitácora (RF-BIT)

| ID | Requerimiento |
|---|---|
| RF-BIT-01 | Cualquier miembro activo DEBE poder proponer una página con título (3–160), fecha real, relato Markdown (30–20.000 caracteres), actividad opcional y una foto opcional. |
| RF-BIT-02 | La foto DEBE ser JPG, PNG o WEBP, máximo 1.5 MB; el cliente DEBE optimizarla a 1600 px de lado mayor y calidad 0.82. |
| RF-BIT-03 | Las páginas de `PP`/`COORDINADOR` DEBEN nacer en `PENDIENTE_APROBACION`. |
| RF-BIT-04 | AA y Guardián DEBEN poder publicar de inmediato. |
| RF-BIT-05 | Aprobar DEBE asignar el número correlativo siguiente y fijar `publishedAt`, `reviewedById` y `reviewedAt`. |
| RF-BIT-06 | Rechazar DEBE exigir un motivo de al menos 5 caracteres y máximo 1000. |
| RF-BIT-07 | El autor DEBE poder corregir y reenviar una página rechazada. |
| RF-BIT-08 | Solo PUEDE existir un Guardián activo; al asignar uno nuevo se retira el anterior. |
| RF-BIT-09 | El Guardián DEBE poder revisar páginas sin obtener permisos de administración ni gestión del libro. |
| RF-BIT-10 | Una propuesta DEBE notificar a los AA y al Guardián; la decisión DEBE notificar al autor. |
| RF-BIT-11 | Enviar, aprobar, rechazar, asignar Guardián y eliminar DEBEN auditarse. |
| RF-BIT-12 | El libro DEBE mostrar portada con Guardián actual, total de páginas, índice, número, fecha, título, Markdown seguro, polaroid con lightbox y firma del autor. |
| RF-BIT-13 | La navegación DEBE funcionar con botones, teclado y swipe. |
| RF-BIT-14 | Una foto publicada DEBE ser visible para cualquier miembro activo; pendientes y rechazadas solo para autor, AA y Guardián. |

---

### 4.10 Logros y rareza (RF-LOG)

| ID | Requerimiento |
|---|---|
| RF-LOG-01 | El catálogo DEBE incluir código único, título, descripción, pista opcional, ícono, categoría, visibilidad, valor de rareza y estado activo. |
| RF-LOG-02 | Las categorías DEBEN ser `AVANZADA`, `COMUNIDAD`, `ESPECIAL` y `SECRETO`; las visibilidades `PUBLIC`, `HINT` y `SECRET`. |
| RF-LOG-03 | El AA DEBE poder crear logros con título (3–120), descripción (10–2000), pista (máx. 500), ícono, categoría, visibilidad y rareza. |
| RF-LOG-04 | El selector de rareza DEBE asignar internamente: Común = 10, Poco Común = 20, Épico = 30, Legendario = 50. |
| RF-LOG-05 | El AA DEBE poder eliminar un logro del catálogo con confirmación explícita. |
| RF-LOG-06 | La eliminación DEBE advertir que se quitará de los perfiles y no se puede deshacer, mostrar estado «Eliminando...» y auditarse como `achievement.delete`. |
| RF-LOG-07 | La eliminación DEBE limpiar en cascada las asignaciones `UserAchievement`. |
| RF-LOG-08 | El AA DEBE poder otorgar y revocar logros a `PP`/`COORDINADOR`, con nota de máximo 280 caracteres. |
| RF-LOG-09 | Los AA NO DEBEN recibir logros. |
| RF-LOG-10 | Otorgar DEBE generar notificación `LOGRO_DESBLOQUEADO` y auditoría; revocar DEBE auditarse. |
| RF-LOG-11 | La rareza DEBE calcularse por `points`: `<= 15` Común, `16–24` Poco Común, `25–34` Épico, `>= 35` Legendario. |
| RF-LOG-12 | Cada rareza DEBE tener etiqueta y subtítulo scout: Huella de Sendero, Huella de Fogón, Huella de Cumbre y Reliquia de Lankuyen. |
| RF-LOG-13 | Un logro `SECRET` no desbloqueado DEBE ocultar título, descripción, ícono y rareza real, mostrando `"???"`. |
| RF-LOG-14 | Un logro `HINT` bloqueado DEBE mostrar el título real y reemplazar la descripción por la pista. |
| RF-LOG-15 | La cabecera de `/logros` DEBE mostrar «X de Y logros descubiertos», barra de porcentaje y desglose por rareza. |
| RF-LOG-16 | NO DEBEN mostrarse puntos acumulados por usuario en `/logros`, `/miembros` ni perfiles sociales. |
| RF-LOG-17 | Las tarjetas DEBEN mostrar la etiqueta de rareza y aplicar bordes/acentos solo cuando el logro está desbloqueado. |
| RF-LOG-18 | El AA DEBE ver el catálogo sin censura y el número de miembros que desbloquearon cada logro. |

---

### 4.11 Directorio y perfiles sociales (RF-SOC)

| ID | Requerimiento |
|---|---|
| RF-SOC-01 | El directorio DEBE incluir solo cuentas activas con rol `PP` o `COORDINADOR`. |
| RF-SOC-02 | Los AA NO DEBEN aparecer en `/miembros` ni tener perfil social. |
| RF-SOC-03 | El acceso a `/miembros/[username]` de un AA DEBE responder `404`. |
| RF-SOC-04 | El directorio DEBE permitir búsqueda por nombre, apellido o username y filtro por comunidad, incluida «Sin comunidad». |
| RF-SOC-05 | Cada tarjeta DEBE mostrar nombre, username, rol, comunidad, etapa o rol, cantidad de insignias y cantidad de logros. |
| RF-SOC-06 | El perfil DEBE mostrar solo información pública: identidad, comunidad, antigüedad, insignias y logros desbloqueados. |
| RF-SOC-07 | El AA DEBE poder gestionar logros del joven desde su perfil social. |

---

### 4.12 Notificaciones (RF-NOT)

| ID | Requerimiento |
|---|---|
| RF-NOT-01 | El sistema DEBE entregar notificaciones in-app por usuario. |
| RF-NOT-02 | La bandeja DEBE paginar de 10 en 10 y ordenar por fecha descendente, desempatando por `id`. |
| RF-NOT-03 | Una página inválida DEBE normalizarse a la primera; una página fuera de rango DEBE servirse como la última. |
| RF-NOT-04 | El usuario DEBE poder marcar una notificación o todas como leídas. |
| RF-NOT-05 | La campana del topbar y la navegación móvil DEBEN mostrar el número real de no leídas. |
| RF-NOT-06 | Las notificaciones DEBEN incluir tipo del enum, título, cuerpo, enlace interno opcional y prioridad. |
| RF-NOT-07 | Los procesos reintentables DEBEN usar `dedupeKey` para evitar duplicados. |
| RF-NOT-08 | Un usuario NO DEBE poder leer ni marcar notificaciones de otra persona. |

**Tipos implementados:** `RSVP_CONFIRMADO`, `INASISTENCIA_JUSTIFICADA`,
`HOJA_ENVIADA`, `HOJA_APROBADA`, `HOJA_RECHAZADA`,
`RECORDATORIO_HOJA_FALTANTE`, `INSIGNIA_OTORGADA`, `CUENTA_CREADA`,
`PASSWORD_RESETEADA`, `BITACORA_ENVIADA`, `BITACORA_APROBADA`,
`BITACORA_RECHAZADA`, `LOGRO_DESBLOQUEADO`.

---

### 4.13 Administración, ajustes y auditoría (RF-ADM)

| ID | Requerimiento |
|---|---|
| RF-ADM-01 | El panel `/admin` DEBE ser exclusivo de AA y mostrar contadores y atajos. |
| RF-ADM-02 | El AA DEBE poder ajustar `reminder.leadDays` (1–60) y `route_sheet.allowAnyPpUpload`. |
| RF-ADM-03 | La vista de configuración DEBE mostrar contexto del cron y hojas de ruta. |
| RF-ADM-04 | La vista DEBE listar los últimos 30 eventos de `audit_logs` en solo lectura. |
| RF-ADM-05 | Los cambios de ajustes DEBEN auditarse como `settings.update`. |

---

### 4.14 PWA y experiencia offline (RF-PWA)

| ID | Requerimiento |
|---|---|
| RF-PWA-01 | La aplicación DEBE ser instalable como PWA con manifest, iconos y service worker. |
| RF-PWA-02 | DEBE existir una página de fallback `/~offline`. |
| RF-PWA-03 | El service worker NO DEBE cachear respuestas bajo `/api/*`. |
| RF-PWA-04 | El service worker DEBE desactivarse en desarrollo. |

---

## 5. Reglas de negocio transversales

| ID | Regla |
|---|---|
| RN-001 | Toda decisión de acceso pasa por `can()`/`requirePermission()`; no se comparan roles directamente. |
| RN-002 | Las Server Actions revalidan permisos aunque la interfaz oculte el control. |
| RN-003 | Toda mutación compuesta se ejecuta en una transacción. |
| RN-004 | Toda operación sensible deja auditoría con acción `<dominio>.<verbo>` y `entityId` UUID. |
| RN-005 | Las notificaciones y auditorías se crean dentro de la misma transacción que la mutación cuando es posible. |
| RN-006 | Las entidades históricas usan baja lógica; el borrado físico es excepcional y auditado. |
| RN-007 | Todas las claves primarias y foráneas son UUID. |
| RN-008 | Las fechas se almacenan en UTC y se muestran en `America/Santiago`. |
| RN-009 | Los archivos privados responden `401` sin sesión y `404` sin permiso. |
| RN-010 | Los datos privados se filtran en el servidor; la interfaz no es una barrera de seguridad. |
| RN-011 | Un AA no recibe insignias ni logros, no tiene perfil social y no se asigna como encargado. |
| RN-012 | El valor `points` de un logro representa rareza, no un marcador acumulable. |
| RN-013 | Un logro secreto bloqueado no filtra contenido ni rareza. |
| RN-014 | Solo puede existir un Guardián activo y un semestre activo. |
| RN-015 | Una actividad solo admite una hoja aprobada y una evaluación por evaluador. |
| RN-016 | Los procesos periódicos son idempotentes por `run_key` + `dedupe_key`. |
| RN-017 | Los mensajes al usuario son claros, en español y sin detalles técnicos. |

---

## 6. Matriz de permisos

**Leyenda:** ✅ permitido · ❌ denegado · ⚙️ condicionado por regla de negocio.

| Capacidad | AA | PP | COORDINADOR | Guardián |
|---|---|---|---|---|
| Ver calendario y actividades publicadas | ✅ | ✅ | ✅ | ✅ |
| Responder RSVP | ✅ | ✅ | ✅ | ✅ |
| Evaluar actividad terminada | ❌ | ✅ | ✅ | ✅ si es PP/Coord. |
| Subir hoja de ruta | ✅ | ⚙️ | ⚙️ | ⚙️ |
| Revisar hojas de ruta | ✅ | ❌ | ❌ | ❌ |
| Ver insignias propias | ❌ | ✅ | ✅ | ✅ |
| Otorgar/revocar insignias | ✅ | ❌ | ❌ | ❌ |
| Editar catálogo de competencias | ✅ | ❌ | ❌ | ❌ |
| Ver material publicado | ✅ | ✅ | ✅ | ✅ |
| Administrar material | ✅ | ❌ | ❌ | ❌ |
| Proponer página de Bitácora | ✅ | ✅ | ✅ | ✅ |
| Publicar de inmediato en Bitácora | ✅ | ❌ | ❌ | ✅ |
| Revisar Bitácora | ✅ | ❌ | ❌ | ✅ |
| Gestionar Bitácora (borrar/asignar Guardián) | ✅ | ❌ | ❌ | ❌ |
| Ver logros | ✅ | ✅ | ✅ | ✅ |
| Crear/eliminar/otorgar logros | ✅ | ❌ | ❌ | ❌ |
| Ver directorio social | ✅ | ✅ | ✅ | ✅ |
| Tener perfil social | ❌ | ✅ | ✅ | ✅ |
| Ver notificaciones propias | ✅ | ✅ | ✅ | ✅ |
| Acceder a `/admin` | ✅ | ❌ | ❌ | ❌ |
| Ver auditoría | ✅ | ❌ | ❌ | ❌ |
| Gestionar cuentas y comunidades | ✅ | ❌ | ❌ | ❌ |
| Editar ajustes operativos | ✅ | ❌ | ❌ | ❌ |

> El Guardián conserva el rol base (`PP`, `COORDINADOR` o `AA`). La columna
> muestra solo las capacidades adicionales del cargo.

---

## 7. Requerimientos no funcionales

### 7.1 Seguridad (RNF-SEG)

| ID | Requerimiento |
|---|---|
| RNF-SEG-01 | Las contraseñas DEBEN usar Argon2id con parámetros seguros (`memoryCost: 19456`, `timeCost: 2`). |
| RNF-SEG-02 | La sesión DEBE revalidarse contra la base en cada petición. |
| RNF-SEG-03 | Los secretos DEBEN vivir en variables de entorno y nunca en el repositorio. |
| RNF-SEG-04 | Los endpoints de cron DEBEN exigir `Authorization: Bearer <CRON_SECRET>`. |
| RNF-SEG-05 | Los SVG subidos DEBEN validarse y servirse con CSP restrictiva. |
| RNF-SEG-06 | Producción DEBE operar bajo HTTPS y con `AUTH_URL` correcta. |
| RNF-SEG-07 | El login DEBERÍA incorporar rate limiting antes de exposición pública. |

### 7.2 Privacidad (RNF-PRIV)

| ID | Requerimiento |
|---|---|
| RNF-PRIV-01 | Los perfiles sociales NO DEBEN exponer correo, teléfono ni datos privados. |
| RNF-PRIV-02 | Las justificaciones y fotos pendientes NO DEBEN ser accesibles por terceros. |
| RNF-PRIV-03 | Los archivos ajenos DEBEN responder `404`, no `403`. |
| RNF-PRIV-04 | El service worker NO DEBE almacenar respuestas autenticadas de `/api/*`. |
| RNF-PRIV-05 | La auditoría NO DEBE contener contraseñas, tokens ni secretos. |

### 7.3 Rendimiento y escalabilidad (RNF-REN)

| ID | Requerimiento |
|---|---|
| RNF-REN-01 | Los listados DEBEN filtrar y buscar en el servidor. |
| RNF-REN-02 | Las notificaciones DEBEN paginarse en páginas de 10. |
| RNF-REN-03 | Las consultas DEBEN apoyarse en índices para filtros y ordenamientos frecuentes. |
| RNF-REN-04 | El lector de material NO DEBE enviar todos los cuerpos al cliente. |
| RNF-REN-05 | Las operaciones masivas de ratificación DEBEN ejecutarse en una sola transacción. |

### 7.4 Usabilidad y accesibilidad (RNF-USA, RNF-ACC)

| ID | Requerimiento |
|---|---|
| RNF-USA-01 | La interfaz DEBE estar en español de Chile. |
| RNF-USA-02 | El diseño DEBE ser mobile-first y funcional en pantallas pequeñas. |
| RNF-USA-03 | Toda acción asíncrona DEBE mostrar estado de carga con texto en español. |
| RNF-USA-04 | Los estados vacíos DEBEN explicar el siguiente paso. |
| RNF-USA-05 | Las acciones destructivas DEBEN confirmar y advertir consecuencias. |
| RNF-ACC-01 | Todo campo DEBE tener etiqueta asociada. |
| RNF-ACC-02 | El foco DEBE ser visible y la navegación por teclado DEBE funcionar en diálogos y libro. |
| RNF-ACC-03 | Los errores DEBEN comunicarse con texto, no solo con color. |
| RNF-ACC-04 | Los iconos decorativos DEBEN usar `aria-hidden`; los informativos, texto alternativo. |

### 7.5 Fiabilidad e integridad (RNF-FIA)

| ID | Requerimiento |
|---|---|
| RNF-FIA-01 | Las mutaciones compuestas DEBEN ser atómicas. |
| RNF-FIA-02 | Los recordatorios DEBEN ser idempotentes ante reintentos. |
| RNF-FIA-03 | Las restricciones críticas DEBEN existir también en la base de datos. |
| RNF-FIA-04 | Las migraciones DEBEN ser versionadas e inmutables. |
| RNF-FIA-05 | El seed DEBE ser idempotente y no destructivo. |
| RNF-FIA-06 | Las fechas DEBEN manejar correctamente horario de verano e invierno. |

### 7.6 Mantenibilidad (RNF-MAN)

| ID | Requerimiento |
|---|---|
| RNF-MAN-01 | TypeScript DEBE compilar en modo `strict` sin errores. |
| RNF-MAN-02 | ESLint DEBE pasar sin advertencias nuevas. |
| RNF-MAN-03 | La lógica pura DEBE separarse en módulos testeables sin Prisma ni Next.js. |
| RNF-MAN-04 | Los nombres DEBEN seguir las convenciones del Artículo IV de la constitución. |
| RNF-MAN-05 | Todo cambio DEBE pasar `typecheck`, `lint`, `test` y `build`. |
| RNF-MAN-06 | Todo bug corregido DEBE agregar una prueba de regresión. |

### 7.7 Compatibilidad y operación (RNF-OPE)

| ID | Requerimiento |
|---|---|
| RNF-OPE-01 | La app DEBE funcionar en navegadores modernos con soporte PWA. |
| RNF-OPE-02 | El almacenamiento DEBE abstraerse en `StorageAdapter` (`local`/`r2`). |
| RNF-OPE-03 | La base DEBE ser PostgreSQL 17 o superior. |
| RNF-OPE-04 | El cron DEBE poder invocarse por `GET` o `POST` autenticado. |
| RNF-OPE-05 | DEBEN existir copias de seguridad de base de datos y archivos. |
| RNF-OPE-06 | La aplicación DEBE registrar auditoría suficiente para reconstruir operaciones sensibles. |

---

## 8. Requerimientos de datos

### 8.1 Entidades principales

- **Usuarios:** `User`, `Community`.
- **Progresión:** `Badge`, `UserBadge`, `StageReflection`.
- **Logros:** `Achievement`, `UserAchievement`.
- **Calendario y evaluaciones:** `Semester`, `Activity`, `ActivityLeader`,
  `ActivityEvaluation`.
- **Asistencia:** `AttendanceResponse`, `JustificationFile`, `AttendanceRecord`.
- **Documentos:** `File`, `RouteSheet`.
- **Bitácora:** `LogbookEntry`.
- **Notificaciones:** `Notification`, `NotificationDelivery`, `JobRun`.
- **Contenido y soporte:** `UnitResource`, `AppSetting`, `AuditLog`.

### 8.2 Reglas de datos

| ID | Regla |
|---|---|
| RD-01 | Toda PK es UUID con `@db.Uuid`. |
| RD-02 | Toda FK a UUID es `@db.Uuid`. |
| RD-03 | `Notification.entityId` y `AuditLog.entityId` solo aceptan UUID. |
| RD-04 | Fechas y horas usan `timestamptz(3)`; fechas puras usan `date`. |
| RD-05 | Los textos tienen límites en base de datos cuando aplica. |
| RD-06 | Los borrados lógicos usan `isActive` y/o `deletedAt`. |
| RD-07 | Las cascadas y `SetNull` son explícitas en el esquema. |
| RD-08 | Las restricciones no expresables en Prisma viven en migraciones SQL. |
| RD-09 | Username y correo son únicos sin distinguir mayúsculas. |
| RD-10 | Un usuario no puede tener dos insignias activas iguales. |
| RD-11 | Una actividad no puede tener dos hojas aprobadas. |
| RD-12 | Un semestre activo como máximo. |
| RD-13 | Una evaluación por actividad y evaluador. |
| RD-14 | Un Guardián activo como máximo. |
| RD-15 | `endsAt > startsAt` en actividades y semestres. |

---

## 9. Interfaces

### 9.1 Rutas de aplicación

| Ruta | Acceso | Propósito |
|---|---|---|
| `/login` | Visitante | Inicio de sesión |
| `/cambiar-password` | Autenticado | Cambio obligatorio o voluntario |
| `/inicio` | PP/COORD/AA | Tablero personal |
| `/perfil` | Autenticado | Perfil y progresión |
| `/calendario` | Autenticado | Calendario de actividades |
| `/calendario/[activityId]` | Autenticado | Detalle, RSVP y evaluación |
| `/hojas-de-ruta` | Autenticado | Mis asignaciones y repositorio |
| `/material` | Autenticado | Lector de material |
| `/bitacora` | Autenticado | Libro interactivo |
| `/bitacora/nueva` | Autenticado | Proponer página |
| `/bitacora/[entryId]/editar` | Autor/AA/Guardián | Editar y reenviar |
| `/bitacora/revision` | AA/Guardián | Moderación |
| `/notificaciones` | Autenticado | Bandeja paginada |
| `/miembros` | Autenticado | Directorio de jóvenes |
| `/miembros/[username]` | Autenticado | Perfil social (404 para AA) |
| `/logros` | Autenticado | Catálogo y progreso |
| `/admin` | AA | Tablero administrativo |
| `/admin/usuarios` | AA | Gestión de cuentas |
| `/admin/usuarios/nuevo` | AA | Crear cuenta |
| `/admin/usuarios/[id]` | AA | Ficha de miembro |
| `/admin/comunidades` | AA | Comunidades |
| `/admin/insignias` | AA | Matriz de insignias |
| `/admin/actividades` | AA | Semestres y actividades |
| `/admin/asistencia` | AA | Resumen de asistencia |
| `/admin/asistencia/[activityId]` | AA | Ratificación |
| `/admin/hojas-de-ruta` | AA | Moderación |
| `/admin/evaluaciones` | AA | Listado de evaluaciones |
| `/admin/evaluaciones/[activityId]` | AA | Detalle agregado |
| `/admin/material` | AA | Edición de material |
| `/admin/bitacora` | AA | Gestión de Bitácora |
| `/admin/configuracion` | AA | Ajustes y auditoría |
| `/~offline` | Público | Fallback PWA |

### 9.2 Endpoints

| Endpoint | Método | Autenticación | Propósito |
|---|---|---|---|
| `/api/auth/[...nextauth]` | GET/POST | — | Handlers de Auth.js |
| `/api/files/[fileId]` | GET | Sesión + regla de alcance | Descarga autorizada |
| `/api/cron/route-sheet-reminder` | GET/POST | Bearer `CRON_SECRET` | Recordatorio semanal |

### 9.3 Ajustes en base de datos

| Clave | Valores | Efecto |
|---|---|---|
| `timezone` | `America/Santiago` | Zona de la unidad |
| `cron.enabled` | booleano | Activa/desactiva recordatorios |
| `cron.hour` | 0–23 | Hora local del recordatorio |
| `reminder.leadDays` | 1–60 | Ventana de anticipación |
| `route_sheet.allowAnyPpUpload` | booleano | Habilita subida a cualquier PP/Coord. |

---

## 10. Restricciones y dependencias

- Next.js 16 App Router, React 19, TypeScript `strict`.
- Prisma 7 con `@prisma/adapter-pg`.
- Auth.js v5 con proveedor Credentials y JWT.
- PostgreSQL 17+; en desarrollo puede usarse Docker en puerto 5433.
- Almacenamiento local en desarrollo; R2/S3 en producción.
- El cron requiere un scheduler externo que invoque el endpoint cada hora.
- La app no envía correos: las notificaciones son in-app.
- El navegador debe soportar `Intl`, `Canvas` y, para compartir, Web Share API.

---

## 11. Criterios de verificación

### 11.1 Pruebas automatizadas existentes

| Archivo | Cubre |
|---|---|
| `tests/route-sheet-schedule.test.ts` | Guard de miércoles 11:00, semana ISO y horarios de verano/invierno. |
| `tests/evaluations.test.ts` | Áreas, promedios y permisos de evaluación. |
| `tests/logbook.test.ts` | Permisos, validaciones, fotos, numeración y textos de Bitácora. |
| `tests/notifications.test.ts` | Orden y paginación de notificaciones. |
| `tests/achievements.test.ts` | Niebla de guerra, rareza, UUID, permisos de borrado y exclusión de AA. |
| `tests/user-deletion.test.ts` | Reglas de eliminación de cuentas y mínimo de AA activos. |

### 11.2 Puertas de calidad

Toda entrega DEBE ejecutar, en orden:

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

### 11.3 Verificación manual mínima

- Login, cambio obligatorio de contraseña y cierre de sesión.
- Crear comunidad, crear PP y otorgar insignia.
- Crear actividad, confirmar RSVP y ratificar asistencia.
- Subir, aprobar y rechazar una hoja de ruta.
- Responder una evaluación y leerla como AA.
- Publicar material y verlo como PP.
- Proponer, aprobar y leer una página de Bitácora.
- Crear, otorgar y eliminar un logro.
- Verificar que un AA no aparece en `/miembros` y su perfil da `404`.
- Verificar que un logro secreto bloqueado muestra `"???"` sin rareza real.
- Instalar la PWA y comprobar el fallback offline.

---

## 12. Estado y evolución

### 12.1 Implementado

Todos los requerimientos marcados en este documento están implementados en la
versión v1.3.1, incluyendo:

- v1: base, RBAC, autenticación y módulos 1–6.
- v1.1: insignias compartibles, La Bitácora y Guardián.
- v1.3: directorio social, logros por rareza, notificaciones paginadas,
  borrado de cuentas y herramientas de administración.
- v1.3.1: unificación de IDs de logros a UUID.

### 12.2 Pendiente o recomendado

| Prioridad | Elemento |
|---|---|
| Crítica | Rotar credenciales expuestas en `.env.example` y reemplazarlas por placeholders. |
| Alta | Rate limiting en login antes de exponer la instancia a Internet. |
| Media | Envío real de notificaciones por correo o push usando `NotificationDelivery`. |
| Media | Copias de seguridad automatizadas de PostgreSQL y del bucket. |
| Baja | Actualizar el `README.md` para reflejar el número actual de modelos y versiones. |

---

*Fin de la especificación.*
