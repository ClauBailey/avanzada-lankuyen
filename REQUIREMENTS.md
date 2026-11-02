# Especificación de Requerimientos — Avanzada Lankuyen

**Versión del documento:** 2.0 (Alineada a la Constitución y al Manual de la Rama Pioneras y Pioneros)
**Fecha:** 30 de octubre de 2026
**Versión objetivo del sistema:** v2.0.0 (evolución desde v1.3.1)
**Estado:** Especificación normativa para evolución y auditoría
**Documentos rectores:** `constitution.md` (manda sobre este documento), Manual de la Rama Pioneras y Pioneros (AGSCh, 2019/2020), `prisma/schema.prisma`.

---

## 1. Propósito, alcance y alineación constitucional

Este documento especifica los requerimientos funcionales, reglas de negocio y requerimientos no funcionales de la plataforma web **Avanzada Lankuyen**. Toma como base la arquitectura implementada en la versión `v1.3.1` y la alinea de forma estricta con la **Constitución del proyecto (`constitution.md`)** y el **Manual de la Rama Pioneras y Pioneros**.

### 1.1 Resumen de transformaciones constitucionales (v1.3.1 → v2.0)

Para cumplir con la jerarquía donde **la Constitución y el Manual mandan sobre todo**, esta especificación introduce los siguientes ajustes obligatorios sobre la v1.3.1:

1. **Incorporación de «La Brújula» (Constitución Art. I, II y VIII):** Se añade el módulo central de progresión personal sobre la columna única de objetivos de 15 a 17 años (M p. 175–201), personalizable exclusivamente por la o el joven, con historial inmutable de versiones, autoevaluación y encuentro de consenso con su Adulto Acompañante (AA) encargado.
2. **Acompañamiento 1 a 1 y Privacidad (Constitución Art. VII y VIII):** Cada joven (y su Comunidad) tiene asignado **un** AA encargado de su seguimiento (máximo recomendado de 6 jóvenes por AA, M p. 301). Solo ese AA puede leer la Brújula del joven (cuando está compartida con él/ella) y escribir notas privadas de acompañamiento. Otros AA y el rol administrativo no leen Brújulas ajenas.
3. **Separación de Comunidades y Grupos de Trabajo / Proyectos (Constitución Art. V):**
   - Los `AA` integran el **Equipo Adulto**; no son miembros de una Comunidad juvenil (corrige `RF-COM-04/05` de v1.3.1).
   - La conformación de Comunidades y la elección de su Coordinador(a) y cargos internos (Secretario, Tesorero, Administrador) pertenecen a los jóvenes (M p. 90–94).
   - Se incorpora el módulo de **Proyectos y Grupos de Trabajo temporales** (6 fases: *Soñar, Elegir, Organizar, Realizar, Evaluar, Celebrar*, M p. 261), permitiendo registrar participantes de distintas Comunidades, invitados externos (no scouts/otras avanzadas) y monitores de la Red de Apoyo.
4. **Ciclo de Programa Democrático y Rol real del Coordinador (Constitución Art. VI):** Se reemplaza el concepto meramente administrativo de «Semestre» por el **Ciclo de Programa** (4 a 6 meses, M p. 207) con sus fases metodológicas. El rol `COORDINADOR` adquiere permisos reales en la **Reunión de Coordinadores**, y en las votaciones de la **Asamblea de Avanzada** votan todas y todos los jóvenes mientras el Equipo Adulto participa **sin derecho a voto** (M p. 124).
5. **Eliminación de mediciones escolares y de control (Constitución Art. III y IV):**
   - Se elimina el cálculo y exhibición del «porcentaje de asistencia efectiva» (`RF-ASI-12` de v1.3.1). La asistencia y el RSVP se mantienen únicamente con fines logísticos y de seguridad en terreno.
   - Se reemplaza la escala escolar de notas `1 a 7` en la evaluación de actividades (`RF-EVA-04` de v1.3.1) por **evaluación por observación cualitativa** y cumplimiento de los objetivos propios de la actividad (M p. 237–239).
   - Las etapas (*Sendero* y *Cumbre*), la *Promesa* y las *Competencias* no tienen bloqueos algorítmicos ni textos pasivos («Cuando tu AA la otorgue...»). La Promesa puede ser solicitada y registrada en cualquier momento con independencia absoluta de las etapas (M p. 48, 204).
6. **Doble Bitácora (Constitución Art. V y VIII):** Se distingue entre la **Bitácora de Avanzada** (libro público de la unidad con el Guardián de la Bitácora, ya implementado en v1.3.1, M p. 130) y la **Bitácora de Comunidad** (espacio privado de cada grupo de amigos donde ni siquiera los AA entran salvo invitación expresa, M p. 97).
7. **Nombre Social y Soberanía de Datos (Constitución Art. IX y X):** Se incorpora el campo `preferredName` (nombre social) con prioridad visual absoluta en toda la app y la función de exportación completa de la Brújula/historial del joven.

---

## 2. Actores y Estructura de la Avanzada

| Actor | Código | Descripción según el Manual y la Constitución |
|---|---|---|
| **Pionera / Pionero** | `PP` | Joven de 15 a 17 años. Dueño exclusivo de su **Brújula**, miembro de una Comunidad, integrante de Grupos de Trabajo y miembro con derecho a voto en la **Asamblea de Avanzada** (M p. 124). |
| **Coordinador/a de Comunidad** | `COORDINADOR` | Pionera o pionero elegido por su Comunidad (M p. 96). Conserva todos los derechos de `PP` y además coordina las Reuniones de su Comunidad y la representa con voz y voto en la **Reunión de Coordinadores** (M p. 124). |
| **Responsable de Grupo de Trabajo** | Cargo temporal | Joven designado por la Reunión de Coordinadores para liderar un proyecto o actividad específica (M p. 104). Participa en la Reunión de Coordinadores mientras dura el proyecto. |
| **Guardián de la Bitácora** | Cargo acumulable | Cargo rotativo acumulable sobre `PP`, `COORDINADOR` o `AA`. Modera y publica páginas en la **Bitácora de la Avanzada** (M p. 130). |
| **Adulto Acompañante (Guiadora / Dirigente)** | `AA` | Miembro mayor de edad del **Equipo Adulto** (M p. 127, 154). Actúa como diseñador, guardián de la misión y acompañante del crecimiento personal de una Comunidad (máximo recomendado: 6 jóvenes, M p. 301). Participa en la Asamblea **sin derecho a voto** (M p. 124). |
| **Colaborador Externo / Red de Apoyo** | Sin cuenta (Directorio) | Experto, monitor de competencia, apoderado o joven invitado (no scout o de otra Avanzada) que colabora en un Grupo de Trabajo o Competencia (M p. 104, 159, 277). Se registra como participante/monitor en el proyecto sin tener acceso a los datos internos de la Avanzada. |
| **Scheduler** | Sistema | Servicio externo que invoca endpoints periódicos autenticados con `CRON_SECRET`. |

---

## 3. Glosario Metodológico y Técnico

| Término | Definición |
|---|---|
| **La Brújula** | Instrumento personal y privado de orientación y seguimiento donde cada pionera o pionero adapta la columna única de objetivos educativos, registra sus reflexiones y realiza su autoevaluación (M p. 305). |
| **Columna Única de Objetivos** | Propuesta referencial de objetivos intermedios para 15–17 años organizados en las 6 Áreas de Desarrollo (*Corporalidad, Creatividad, Carácter, Afectividad, Sociabilidad, Espiritualidad*), orientados hacia los Objetivos Terminales (M p. 167, 175). |
| **Comunidad** | Grupo informal y estable de 3 a 6 amigos que comparten afecto, historia, cargos internos, Reunión de Comunidad y una Bitácora privada (M p. 86–97). |
| **Grupo de Trabajo** | Equipo formal y temporal unido por el interés en una tarea o Proyecto. Se disuelve al concluir la iniciativa (M p. 104). |
| **Proyecto** | Conjunto de actividades complementarias (centrales y conexas) de mediana o larga duración que sigue los 6 pasos: *Soñar, Elegir, Organizar, Realizar, Evaluar y Celebrar* (M p. 259–265). |
| **Competencia** | Atributo (conocimientos, habilidades, actitudes, valores) vinculado al desempeño en actividades o proyectos, agrupado en 7 áreas oficiales, que reemplaza a las especialidades (M p. 270–279). |
| **Ciclo de Programa** | Proceso de planificación participativa de 4 a 6 meses que articula el diagnóstico, énfasis, selección democrática, calendario, desarrollo y evaluación (M p. 207–209). |
| **Hoja de Ruta** | Pauta de preparación y diseño de una actividad o proyecto que verifica objetivos de la actividad, lugar, fases, recursos, presupuesto y control de riesgos (M p. 230). |
| **Peña** | Encuentro artístico y recreativo de celebración en la Avanzada con estructura de Apertura, Desarrollo y Cierre (M p. 281–283). |

---

## 4. Requerimientos Funcionales

### 4.1 Autenticación, Sesión e Identidad (RF-AUT)

| ID | Requerimiento | Ref. Constitucional / Manual |
|---|---|---|
| RF-AUT-01 | El sistema DEBE permitir iniciar sesión con `username` **o** correo electrónico, sin distinguir mayúsculas. | Art. XIII |
| RF-AUT-02 | El sistema NO DEBE ofrecer registro público. La red virtual es privada y formal: las cuentas solo las crea un `AA`. | Art. VIII, XIII / M p. 164 |
| RF-AUT-03 | Las contraseñas DEBEN almacenarse con Argon2id y nunca mostrarse ni registrarse en logs. | Art. XIII |
| RF-AUT-04 | La sesión DEBE usar cookies `httpOnly`, `sameSite=lax`, con expiración de 8 horas y revalidación contra la base en cada petición. | Art. XIII |
| RF-AUT-05 | Si `must_change_password` está activo, el usuario DEBE ser redirigido a `/cambiar-password` antes de acceder a cualquier vista. | Art. XIII |
| RF-AUT-06 | El cambio de contraseña DEBE exigir contraseña actual, mínimo 10 caracteres, al menos una letra, al menos un número, confirmación coincidente y ser distinta a la actual. | Art. XIII |
| RF-AUT-07 | Toda cuenta DEBE admitir un campo opcional `preferredName` (**nombre social**). Si está presente, el sistema DEBE mostrar `preferredName` en lugar del nombre registral (`firstName`) en toda interfaz, tarjeta, insignia exportable y listado. El propio usuario DEBE poder editar su `preferredName` desde `/perfil`. | **Art. X** |
| RF-AUT-08 | Cada joven (`PP`/`COORDINADOR`) DEBE poder descargar desde `/perfil` un archivo portable (`.json` y vista imprimible/PDF) con toda su historia en la Avanzada: su Brújula (todas las versiones y reflexiones), hitos simbólicos, competencias y páginas de bitácora escritas. | **Art. IX** |
| RF-AUT-09 | Cada joven DEBE poder solicitar la eliminación total de su cuenta y datos personales, o conservar su archivo exportado al realizar su Paso al Clan. | **Art. II, IX** |

---

### 4.2 Comunidades, Equipo Adulto y Acompañamiento 1 a 1 (RF-COM, RF-USU)

#### Comunidades Juveniles

| ID | Requerimiento | Ref. Constitucional / Manual |
|---|---|---|
| RF-COM-01 | El sistema DEBE permitir registrar y editar Comunidades con nombre (3–80 caracteres), lema/grito opcional (máx. 300), descripción y color hexadecimal `#RRGGBB`. | M p. 97, 131 |
| RF-COM-02 | La identidad de la Comunidad (nombre, grito, descripción y cargos internos) DEBE poder ser editada por el `COORDINADOR` de esa Comunidad (según acuerdo de su Reunión de Comunidad) además de los `AA`. | **Art. V, VI** / M p. 93, 97 |
| RF-COM-03 | El sistema NO DEBE ofrecer ninguna herramienta de sorteo, balanceo ni distribución automática de jóvenes entre Comunidades. El cambio de Comunidad de un joven solo refleja su decisión voluntaria y la aceptación de la Comunidad. | **Art. V** / M p. 87, 90 |
| RF-COM-04 | El sistema DEBE mostrar un aviso informativo (no bloqueante) si una Comunidad tiene menos de 3 o más de 6 integrantes activos, recordando la recomendación del Manual sin impedir su funcionamiento. | M p. 91 |
| RF-COM-05 | Cada Comunidad DEBE poder registrar y rotar en cualquier momento sus cargos internos: **Coordinador/a**, **Secretario/a**, **Tesorero/a** y **Administrador/a**, guardando el historial de rotación por ciclo. | **Art. V** / M p. 94 |
| RF-COM-06 | Los roles de educación entre pares (*mentor, mediador, tutor*) NO DEBEN existir como cargos asignables ni permisos en la base de datos ni en la interfaz. | **Art. V** / M p. 99 |

#### Cuentas y Asignación de Seguimiento Adulto

| ID | Requerimiento | Ref. Constitucional / Manual |
|---|---|---|
| RF-USU-01 | El `AA` DEBE poder crear cuentas `PP`, `COORDINADOR` o `AA` con nombre registral, nombre social opcional (`preferredName`), apellido, fecha de nacimiento, username, correo opcional y rol. | **Art. IX, X** |
| RF-USU-02 | Las cuentas `PP` y `COORDINADOR` pertenecen a una Comunidad juvenil (o pueden estar temporalmente «En período introductorio / Sin comunidad» si ingresan individualmente desde fuera del Grupo mientras crean vínculos). | M p. 89, 290 |
| RF-USU-03 | Las cuentas `AA` integran el **Equipo Adulto** (con cargo *Responsable de Avanzada* o *Asistente de Avanzada*). Un `AA` NO DEBE ser contado como miembro juvenil de una Comunidad. | **Art. V** / M p. 127 |
| RF-USU-04 | Cada cuenta `PP` o `COORDINADOR` (o cada Comunidad completa) DEBE tener asignado **un** `AA` encargado de su seguimiento (`assignedAaId`), junto con la fecha de inicio de dicho acompañamiento (`assignedSince`). | **Art. VII** / M p. 301 |
| RF-USU-05 | Si un `AA` tiene asignados más de **6 jóvenes activos**, la interfaz DEBE mostrar una advertencia visible recordando el límite metodológico de atención personalizada (M p. 301), pero sin bloquear la asignación por si la Avanzada tiene escasez de adultos. | **Art. VII** / M p. 121, 301 |
| RF-USU-06 | Si se intenta cambiar el `assignedAaId` de un joven antes de cumplir 1 año desde `assignedSince`, el sistema DEBE pedir confirmación recordando la recomendación de estabilidad mínima de un año (salvo retiro del adulto). | **Art. VII** / M p. 171, 301 |
| RF-USU-07 | Cuando una Comunidad elige o rota a su Coordinador/a en su Reunión de Comunidad, el sistema DEBE permitir actualizar el rol entre `PP` y `COORDINADOR`. | **Art. V, VI** / M p. 93–96 |
| RF-USU-08 | Se mantienen todas las reglas de seguridad de cuentas de v1.3.1: unicidad case-insensitive de `username` y `email`, imposibilidad de auto-desactivarse o borrar al último `AA` activo, y registro en `audit_logs`. | Art. XIII |

---

### 4.3 La Brújula y el Seguimiento de la Progresión Personal (RF-BRU)

> **Invariante crítica (Constitución Art. I, II y VIII):** Ningún rol distinto del propio joven titular puede crear, editar, marcar ni borrar sus objetivos personales, adaptaciones ni autoevaluaciones en La Brújula.

| ID | Requerimiento | Ref. Constitucional / Manual |
|---|---|---|
| RF-BRU-01 | El sistema DEBE cargar desde archivos de datos desacoplados (`app/data/instrumento-objetivos.json`) la **columna única de objetivos intermedios (15 a 17 años)** y sus respectivos **Objetivos Terminales**, organizados en las 6 Áreas de Desarrollo: *Corporalidad, Creatividad, Carácter, Afectividad, Sociabilidad y Espiritualidad*. | **Art. I, XVI** / M p. 167, 175–201 |
| RF-BRU-02 | Toda la malla de objetivos DEBE estar disponible desde el ingreso del joven (Período Introductorio). El sistema NO DEBE parcelar, ocultar ni bloquear objetivos por edad, año ni etapa (*Sendero* / *Cumbre*). | **Art. II** / M p. 173, 308 |
| RF-BRU-03 | En su vista `/brujula`, solo la pionera o pionero titular DEBE poder personalizar cada objetivo propuesto: **a)** adoptarlo tal cual, **b)** adaptar/modificar su redacción a su realidad personal, o **c)** agregar un objetivo propio nuevo vinculado a la misma línea (Objetivo Terminal). | **Art. I** / M p. 170, 295 |
| RF-BRU-04 | Cada vez que el joven modifica o reformula un objetivo personal en su Brújula, el sistema DEBE guardar una **nueva versión inmutable** (`ObjectiveVersion`) conservando la fecha y el texto anterior. Nunca se sobrescribe ni borra la historia de cambios. | **Art. II** / M p. 308 |
| RF-BRU-05 | Para cada objetivo de su Brújula, solo el joven titular DEBE poder escribir reflexiones o experiencias vividas (dentro o fuera del Movimiento, M p. 171) y marcar su estado de autoevaluación personal (ej. *En exploración / En camino*, *Logrado en mi vida cotidiana*). | **Art. I, III** / M p. 171, 295, 303 |
| RF-BRU-06 | Al cierre de un Ciclo de Programa (o fin del Período Introductorio), el joven DEBE poder registrar su **Autoevaluación de Ciclo** y decidir con un interruptor explícito si desea compartirla temporalmente con su Comunidad para la **Reunión de Comunidad** (evaluación entre pares) y con su `AA` encargado para el **Encuentro de Consenso**. | **Art. I, VIII** / M p. 295, 306–307 |
| RF-BRU-07 | En el **Encuentro de Consenso**, el joven y su `AA` encargado conversan presencialmente. Si hay discrepancia sobre el logro de un objetivo, **la interfaz y el sistema respetan siempre la autoevaluación del joven**: el `AA` no tiene botón de «rechazar objetivo» ni «aprobar objetivo». | **Art. I** / M p. 295, 308 |
| RF-BRU-08 | La interfaz de `/brujula` DEBE mostrar siempre un indicador claro de **Transparencia de Privacidad**: *"Tu Brújula es privada. Solo tú puedes escribir en ella. Actualmente pueden leerla: [Nombre de tu AA encargado] (y tu Comunidad [Nombre] solo si activaste compartir)"*. | **Art. VIII** |
| RF-BRU-09 | El `AA` encargado (`assignedAaId`) DEBE disponer de un espacio privado de **Notas de Acompañamiento** por cada uno de sus jóvenes asignados (máx. 6). Estas notas son recordatorios de observación positiva (M p. 300–303), invisibles para otros `AA` y para el resto de la Avanzada; el `AA` puede marcar notas específicas como «Compartida con el joven». | **Art. III, VII, VIII** / M p. 301–303 |
| RF-BRU-10 | Ningún otro `AA` (que no sea el `assignedAaId` del joven) ni ningún administrador puede leer el contenido de la Brújula ni las notas de seguimiento de ese joven. Si cambia el `AA` encargado, el historial de acompañamiento se transfiere al nuevo encargado dejando registro en `audit_logs`. | **Art. VII, VIII** |

---

### 4.4 Camino Simbólico, Etapas, Promesa y Competencias (RF-PRO)

> **Invariante crítica (Constitución Art. IV):** La app registra los hitos vividos en la realidad; jamás los bloquea, condiciona ni actúa como juez.

| ID | Requerimiento | Ref. Constitucional / Manual |
|---|---|---|
| RF-PRO-01 | El sistema DEBE permitir registrar los hitos del camino en la Avanzada con su fecha, lugar, relato/dedicatoria y quién acompañó el momento: **1) Bienvenida (`CRUZ_DEL_SUR`)**, **2) Etapa `SENDERO` (*Exploro mis caminos*)**, **3) Etapa `CUMBRE` (*Proyecto mi camino*)**, **4) Renovación o formulación de la `PROMESA`**, y **5) `PASO_AL_CLAN`**. | **Art. IV** / M p. 48, 202–204, 284–286 |
| RF-PRO-02 | Las insignias de etapa (`SENDERO` y `CUMBRE`) representan el **inicio** de una etapa como estímulo y no un premio final (M p. 202). La interfaz DEBE describirlas con este sentido y **eliminar** el texto pasivo de v1.3.1 (*«Cuando tu AA la otorgue, la imagen se activará a todo color»*), reemplazándolo por el significado simbólico de la etapa y permitiendo que tanto el joven (tras su consenso) como su `AA` registren la recepción de la insignia. | **Art. IV** / M p. 202–203 |
| RF-PRO-03 | Un joven puede iniciar su progresión directamente en `CUMBRE` al terminar su período introductorio si su madurez o edad (16–17 años) así lo acuerda en el consenso (M p. 203–204). El sistema NO DEBE exigir haber tenido `SENDERO` previamente ni bloquear `CUMBRE` por porcentaje de objetivos. | **Art. IV** / M p. 203–204 |
| RF-PRO-04 | **Independencia total de la Promesa:** En cualquier momento tras su período introductorio, la pionera o pionero DEBE poder activar en la app la solicitud/preparación de su **Ceremonia de Promesa** (eligiendo incluso si dirá *«vivir la Ley Guía»*, *«la Ley Scout»* o *«la Ley»*, M p. 49) y registrar su realización sin ninguna restricción de etapa, antigüedad ni objetivos. Los `AA` reciben notificación para acompañar y organizar la celebración junto al joven y su familia (M p. 50, 284). | **Art. IV** / M p. 48–50, 204 |
| RF-PRO-05 | **Las 7 Áreas de Competencias:** El catálogo de competencias DEBE organizarse en las 7 áreas oficiales del Manual: **1) Cultura, 2) Trabajo en equipo, 3) Innovación, 4) Comunicación, 5) Ciudadanía, 6) Medioambiente, y 7) Vida al aire libre y Deportes** (M p. 278–279). | **Art. IV, XVI** / M p. 278–279 |
| RF-PRO-06 | Se mantiene la funcionalidad de v1.3.1 para generar en el cliente la tarjeta compartible en PNG (`1080 × 1920`) para etapas, Promesa y competencias, utilizando siempre el **nombre social (`preferredName`)** del joven y el lema *«¡Siempre Adelante!»*. | Art. X / RF-PRO-10 a 12 (v1.3.1) |

---

### 4.5 Ciclo de Programa Democrático y Calendario (RF-CIC, RF-CAL)

> **Invariante crítica (Constitución Art. VI):** En la Asamblea de Avanzada votan todas las pioneras y pioneros individualmente; el Equipo Adulto participa sin derecho a voto (M p. 124).

| ID | Requerimiento | Ref. Constitucional / Manual |
|---|---|---|
| RF-CIC-01 | El modelo de «Semestre» (`Semester` de v1.3.1) se amplía a **Ciclo de Programa**, de duración flexible (recomendada de 4 a 6 meses, M p. 207), con 4 estados/fases explícitos: `DIAGNOSTICO_Y_ENFASIS`, `PROPUESTA_Y_SELECCION`, `ORGANIZACION_Y_PREPARACION` y `DESARROLLO_Y_EVALUACION`. | **Art. VI, XVI** / M p. 208–209, 240 |
| RF-CIC-02 | **Fase 1 (Diagnóstico y Énfasis):** Cada Comunidad (a través de su `COORDINADOR` o miembros) DEBE poder registrar el diagnóstico de su Comunidad y sus ideas iniciales de actividades. Luego, la **Reunión de Coordinadores** (`COORDINADOR` + Responsables de Grupos de Trabajo + `AA`) registra el **Diagnóstico General** y fija el **Énfasis Educativo del Ciclo** (M p. 211–215). | **Art. VI** / M p. 211–215 |
| RF-CIC-03 | **Fase 2 (Propuesta y Selección Democrática en Asamblea):** Las Comunidades y la Reunión de Coordinadores publican las propuestas de **Actividades de Avanzada** y **Proyectos** (indicando si son proyectos de intervención social/ambiental, que se deliberan por separado según M p. 218). | **Art. VI** / M p. 216–218 |
| RF-CIC-04 | Durante la **Asamblea de Avanzada**, el sistema DEBE permitir habilitar la votación o priorización de actividades propuestas (soportando dinámicas de *Juegos Democráticos* del Manual: votación directa *«Un día de elecciones»*, ranking de 1 a 5 estrellas *«Creando la Playlist» / «Vamos al cine»*, o asignación de puntos/capital *«¿Quién da más?»*, M p. 219–220). **Solo las cuentas `PP` y `COORDINADOR` pueden emitir voto; las cuentas `AA` tienen prohibido votar por regla de servidor.** | **Art. VI** / M p. 124, 218–221 |
| RF-CIC-05 | **Fase 3 (Organización del Calendario):** La Reunión de Coordinadores organiza en el calendario las actividades seleccionadas por la Asamblea junto con las actividades de cada Comunidad y las actividades fijas (Reuniones, Campamentos, Peñas, Ceremonias), y la Asamblea registra la aprobación del calendario del ciclo (M p. 222–226). | **Art. VI** / M p. 222–226 |
| RF-CAL-01 | El calendario DEBE distinguir el alcance de cada actividad (M p. 246–248): **a) Actividad de Comunidad** (gestionada por la propia Comunidad), **b) Actividad de Avanzada** (común para todos), **c) Actividad de Grupo de Trabajo**, y **d) Proyecto** (conjunto de actividades centrales y conexas), además de su carácter **Fija** o **Variable**. | M p. 246–249 |
| RF-CAL-02 | Las Comunidades (a través de su `COORDINADOR`) y los Responsables de Grupos de Trabajo DEBEN poder crear y gestionar las actividades propias de su Comunidad o Grupo de Trabajo en el calendario, además de los `AA`. | **Art. V, VI** / M p. 223, 250 |

---

### 4.6 Proyectos, Grupos de Trabajo y Red de Apoyo (RF-PRY)

| ID | Requerimiento | Ref. Constitucional / Manual |
|---|---|---|
| RF-PRY-01 | El sistema DEBE contar con un módulo de **Proyectos y Grupos de Trabajo** (`/proyectos`) que implemente los **6 pasos del Ciclo de un Proyecto** definidos en el Manual (p. 261–265): **1) Soñar, 2) Elegir, 3) Organizar, 4) Realizar, 5) Evaluar y 6) Celebrar (¡La Peña!)**. | **Art. V, XVI** / M p. 259–265 |
| RF-PRY-02 | Todo proyecto DEBE incluir la **Pauta de Identificación del Proyecto** oficial del Manual (p. 268): Nombre del proyecto, Responsable(s), Destinatarios, Localización (local/comunal/regional), Duración, Resumen (diagnóstico del problema, objetivo general, objetivos específicos e indicadores observables si es de intervención social/ambiental, M p. 267) y Resumen de financiamiento/presupuesto. | **Art. XVI** / M p. 266–268 |
| RF-PRY-03 | Un proyecto DEBE permitir desglosar sus **Actividades Centrales** (insustituibles) y **Actividades Conexas** (que amplían el alcance, M p. 259), así como las **Competencias** requeridas para llevarlo a cabo (M p. 260). | M p. 259–260 |
| RF-PRY-04 | **Conformación del Grupo de Trabajo:** Para cada proyecto o actividad que lo requiera, la Reunión de Coordinadores designa a un joven como **Responsable del Grupo de Trabajo** (M p. 104) y abre la inscripción voluntaria a cualquier `PP`/`COORDINADOR` de cualquier Comunidad de la Avanzada según su interés en la tarea. | **Art. V** / M p. 84, 104, 226 |
| RF-PRY-05 | **Participantes Externos e Invitados (Regla Constitucional V):** Un Grupo de Trabajo DEBE permitir registrar participantes externos que no tienen cuenta en la Avanzada (jóvenes de otras Avanzadas, amigos no scouts o miembros de la comunidad local beneficiada, M p. 84, 104, 264) y expertos asesores de la **Red de Apoyo**, indicando su nombre, rol en la tarea y contacto opcional. Al finalizar e informar el proyecto, el Grupo de Trabajo pasa a estado histórico/disuelto (M p. 104). | **Art. V, IX** / M p. 84, 104, 264 |
| RF-PRY-06 | **Directorio de la Red de Apoyo:** El Equipo Adulto (`AA`) y la Reunión de Coordinadores DEBEN disponer de un directorio privado (`/admin/red-de-apoyo`) para registrar colaboradores confiables (padres/apoderados, especialistas técnicos, contactos comunitarios, M p. 159–160), indicando las áreas de competencias o proyectos en que pueden apoyar y su historial de colaboración con la Avanzada. | **Art. IX** / M p. 158–160 |

---

### 4.7 Hojas de Ruta y Preparación de Actividades (RF-HDR)

| ID | Requerimiento | Ref. Constitucional / Manual |
|---|---|---|
| RF-HDR-01 | Toda actividad o proyecto relevante cuenta con una **Hoja de Ruta** (M p. 230). El sistema DEBE permitir tanto subir un archivo adjunto (PDF, DOC, DOCX, JPG, PNG, WEBP hasta 10 MB, como en v1.3.1) **como completar el formulario interactivo oficial de la Hoja de Ruta del Manual (p. 230)**: Responsable, Motivación previa, Objetivos escritos de la actividad (*¿Qué queremos lograr?*), Lugar/visita previa/autorizaciones, Fases y variantes, Recursos humanos externos, Materiales y Presupuesto/rendición, más Prevención y control de riesgos (M p. 153). | **Art. XII, XVI** / M p. 153, 227–230 |
| RF-HDR-02 | DEBEN poder crear/subir hojas de ruta los encargados de la actividad, el Responsable del Grupo de Trabajo, el `COORDINADOR` de la Comunidad organizadora, los `AA` y cualquier `PP` cuando `route_sheet.allowAnyPpUpload` esté activo. | RF-HDR-01 (v1.3.1) + Art. VI |
| RF-HDR-03 | Se conserva el flujo de revisión de seguridad y respaldo por parte del Equipo Adulto (`PENDIENTE_AUTORIZACION` → `APROBADA` / `RECHAZADA` con retroalimentación constructiva), las notificaciones y el recordatorio automático idempotente de los miércoles a las 11:00 (`America/Santiago`). | RF-HDR-03 a 15 (v1.3.1) |

---

### 4.8 RSVP Logístico y Registro de Participación (RF-ASI)

> **Corrección Constitucional (Art. III):** Se elimina toda métrica o porcentaje de «asistencia efectiva» como indicador de evaluación o cumplimiento. El RSVP y el registro de presentes existen exclusivamente para la logística (alimentación, transporte, materiales) y la seguridad/responsabilidad legal con menores de edad (M p. 153–154).

| ID | Requerimiento | Ref. Constitucional / Manual |
|---|---|---|
| RF-ASI-01 | Mientras una actividad es futura, las y los jóvenes DEBEN poder confirmar su participación (`CONFIRMADO` o `NO_ASISTE` con aviso/motivo opcional o adjunto) para organizar la logística de la Comunidad o Avanzada. | RF-ASI-01 a 07 (v1.3.1) |
| RF-ASI-02 | El `AA` (o el Coordinador/Responsable en actividades de Comunidad) DEBE poder registrar la lista final de asistentes reales (`PRESENTE`, `AUSENTE`, `AVISO_PREVIO`) con fines de seguridad en terreno y bitácora histórica de la actividad. | M p. 153–154 |
| RF-ASI-03 | **Prohibición de porcentajes y rankings:** El sistema NO DEBE calcular ni mostrar en `/perfil`, `/inicio` ni `/admin` ningún «porcentaje de asistencia semestral» ni semáforos de asistencia por joven. | **Art. III** |
| RF-ASI-04 | Los motivos o archivos de aviso de inasistencia son estrictamente privados: solo visibles para el autor y el Equipo Adulto (`AA`). | **Art. VIII, IX** |

---

### 4.9 Evaluación de Actividades y Proyectos por Observación (RF-EVA)

> **Corrección Constitucional (Art. III y Manual p. 237–239):** «La evaluación por medición, tan propia de la educación formal y que a través de pruebas procura medir con relativa exactitud... es poco aplicable en las actividades de guías y scouts» (M p. 239). Se reemplazan las notas numéricas del 1 al 7 por evaluación cualitativa basada en los objetivos fijados para la actividad.

| ID | Requerimiento | Ref. Constitucional / Manual |
|---|---|---|
| RF-EVA-01 | Al finalizar una actividad o proyecto (`endsAt` cumplido), se habilita su evaluación para todos los participantes (`PP`, `COORDINADOR`, encargados y `AA`, cada uno desde su rol, M p. 238–241). | M p. 237–241 |
| RF-EVA-02 | La evaluación DEBE contrastar los resultados con los **Objetivos de la Actividad** definidos en su diseño/Hoja de Ruta (M p. 227, 237), permitiendo responder: **a)** Nivel de logro percibido de los objetivos de la actividad (cualitativo: *Logrado plenamente*, *Logrado parcialmente*, *No logrado / Por replantear*), **b)** Qué áreas de desarrollo sintió presentes el participante (*Corporalidad, Creatividad, Carácter, Afectividad, Sociabilidad, Espiritualidad*), y **c)** Observaciones abiertas sobre la organización, el ritmo/resonancia emocional (M p. 232) y aprendizajes para la próxima vez. | **Art. III** / M p. 232, 237–239 |
| RF-EVA-03 | Tratándose de un **Proyecto**, el paso 5 (*Evaluar*) DEBE permitir generar el **Informe Final del Proyecto** (M p. 264) que consolida los objetivos, el resumen de preparación y ejecución, las conclusiones de la evaluación y la lista de todos los participantes (internos y externos). | M p. 264 |
| RF-EVA-04 | **Vínculo con la Progresión Personal sin automatismos:** Al enviar su reflexión de la actividad, la app DEBE ofrecer al joven un atajo privado: *«¿Viviste algo en esta actividad que quieras guardar en tu Brújula?»*, permitiéndole copiar su reflexión personal directamente a uno de sus objetivos en `/brujula` (M p. 241, 245). | **Art. I, III** / M p. 241, 245 |

---

### 4.10 Sistema de Doble Bitácora: Bitácora de Comunidad y Bitácora de Avanzada (RF-BIT)

> **Alineación Constitucional (Art. V y VIII):** El Manual distingue entre la **Bitácora de Comunidad** privada de cada pequeño grupo (M p. 97) y la **Bitácora de la Avanzada** donde se registran los acuerdos de la Asamblea y los grandes momentos de la unidad (M p. 130).

#### A. Bitácora de Comunidad (Privada del pequeño grupo — M p. 97)

| ID | Requerimiento | Ref. Constitucional / Manual |
|---|---|---|
| RF-BIT-01 | Cada Comunidad DEBE tener su propia **Bitácora de Comunidad** (`/mi-comunidad/bitacora`), accesible y editable **únicamente por los miembros activos de esa Comunidad** (`PP` y `COORDINADOR` pertenecientes a ella). | **Art. V, VIII** / M p. 97 |
| RF-BIT-02 | En la Bitácora de Comunidad los integrantes registran libremente acuerdos de su Reunión de Comunidad, anécdotas, tradiciones internas, fotos y reflexiones sin moderación previa de ningún adulto ni del Guardián general. | **Art. V, VIII** / M p. 92, 97 |
| RF-BIT-03 | Ningún `AA` ni miembro de otra Comunidad puede leer las entradas de la Bitácora de una Comunidad, salvo que la propia Comunidad marque explícitamente una entrada o acuerdo específico como *«Compartido con nuestro AA encargado»* o *«Compartido con la Reunión de Coordinadores»* (por ejemplo, su diagnóstico o propuesta de actividades para el ciclo, M p. 211). | **Art. VIII** / M p. 97 |

#### B. Bitácora de la Avanzada (Libro común de la Unidad — M p. 130)

| ID | Requerimiento | Ref. Constitucional / Manual |
|---|---|---|
| RF-BIT-04 | Se mantiene íntegro el módulo de **La Bitácora de la Avanzada** (`/bitacora`) implementado en v1.3.1: cualquier miembro activo propone páginas (relatos de campamentos, Peñas, acuerdos de Asamblea, proyectos celebrados) con texto Markdown y foto tipo polaroid optimizada en cliente. | RF-BIT-01 a 14 (v1.3.1) / M p. 130 |
| RF-BIT-05 | Se mantiene el cargo rotativo de **Guardián de la Bitácora** (elegido en la Avanzada) quien, junto a los `AA`, revisa y publica las páginas propuestas asignando numeración correlativa y conservando el lector interactivo con paso de páginas. | RF-BIT-04 a 14 (v1.3.1) |

---

### 4.11 Material Digital e Identidad de la Avanzada (RF-MAT)

| ID | Requerimiento | Ref. Constitucional / Manual |
|---|---|---|
| RF-MAT-01 | Se mantiene el lector mobile-first de **Material Digital** (`/material`) con los pilares de identidad de la Avanzada y de la Rama Pioneros (M p. 43–52, 128–134): **La Ley Guía y Scout** (y sus 10 reflexiones), **La Promesa Pionera**, **El Lema (*¡Siempre Adelante!*)**, **La Oración**, **El Himno (*La Fragua*)**, **El Grito**, **La Bandera**, **El Cayado** y **El Refugio**, además de la biblioteca de recursos y fichas técnicas publicados. | **Art. XVI** / RF-MAT-01 a 12 (v1.3.1) |
| RF-MAT-02 | Tanto los `AA` como la Reunión de Coordinadores (`COORDINADOR`) DEBEN poder proponer recursos o fichas técnicas para la biblioteca de la Avanzada; la publicación final la realiza un `AA`. | Art. VI |

---

### 4.12 Colección de Logros Lúdicos y Directorio de la Avanzada (RF-LOG, RF-SOC)

> **Invariante Constitucional (Art. III):** Los logros son recuerdos lúdicos y conmemorativos de la vida de grupo (anécdotas, campamentos, Peñas), nunca medidores de desarrollo personal ni rankings competitivos.

| ID | Requerimiento | Ref. Constitucional / Manual |
|---|---|---|
| RF-LOG-01 | Se mantiene el catálogo de **Logros conmemorativos** (`/logros`) con sus categorías (`AVANZADA`, `COMUNIDAD`, `ESPECIAL`, `SECRETO`), visibilidades (`PUBLIC`, `HINT`, `SECRET` con niebla `"???"`) y etiquetas estéticas scout (*Huella de Sendero*, *Huella de Fogón*, *Huella de Cumbre* y *Reliquia de Lankuyen*). | RF-LOG-01 a 18 (v1.3.1) |
| RF-LOG-02 | **Prohibición estricta de puntajes y rankings:** El campo interno `points` se usa únicamente para derivar la categoría estética del borde/etiqueta. Queda prohibido sumar puntos por usuario, ordenar el directorio por cantidad de logros/insignias o mostrar tablas de posiciones (*leaderboards*). | **Art. III** / RF-LOG-16 (v1.3.1) |
| RF-SOC-01 | El directorio `/miembros` lista en orden alfabético o agrupado por Comunidad a las cuentas activas `PP` y `COORDINADOR`, mostrando su **nombre social (`preferredName`)**, `@username`, Comunidad, cargo interno (si tiene) e hitos públicos. Los `AA` no aparecen como jóvenes en `/miembros` y su ruta `/miembros/[username]` responde `404`. | **Art. III, X** / RF-SOC-01 a 07 (v1.3.1) |

---

### 4.13 Notificaciones, Configuración, Auditoría y PWA Offline (RF-NOT, RF-ADM, RF-PWA)

| ID | Requerimiento | Ref. Constitucional / Manual |
|---|---|---|
| RF-NOT-01 | Se mantiene el sistema de notificaciones in-app paginadas de 10 en 10 con deduplicación (`dedupeKey`), sumando los eventos nuevos: `PROMESA_SOLICITADA`, `CONSENSO_SOLICITADO`, `CICLO_VOTACION_ABIERTA`, `PROYECTO_CONVOCATORIA` y `COMPETENCIA_RECONOCIDA`. | RF-NOT-01 a 08 (v1.3.1) |
| RF-ADM-01 | El panel `/admin` permite al Equipo Adulto gestionar usuarios, asignaciones de acompañamiento (`assignedAaId`), configuración operativa, catálogo de logros/competencias, Red de Apoyo y lectura de los últimos eventos de `audit_logs`. **Por regla constitucional (Art. VIII), ninguna vista de `/admin` expone ni permite consultar las Brújulas privadas de jóvenes no asignados a ese `AA` ni las Bitácoras privadas de las Comunidades.** | **Art. VII, VIII, IX** |
| RF-PWA-01 | La PWA instalable DEBE mantener en almacenamiento local del navegador (`IndexedDB` / `localStorage`) la copia de lectura de **La Brújula** del usuario autenticado y una **cola de sincronización offline (`offlineQueue`)** para cambios de texto en la Brújula y borradores de páginas de Bitácora realizados en campamento o excursión sin señal. | **Art. XII** |
| RF-PWA-02 | Si al sincronizar la Brújula tras recuperar conexión se detecta que el objetivo fue editado en otro dispositivo, el sistema NO DEBE sobrescribir ni perder texto: DEBE crear una versión adicional en `ObjectiveVersion` conservando ambos textos. | **Art. II, XII** |

---

## 5. Matriz de Permisos Constitucional (`can()`)

**Leyenda:** ✅ permitido · ❌ denegado · 🔒 solo sobre lo propio o asignado · 🗳️ voto juvenil exclusivo.

| Capacidad / Recurso | `PP` | `COORDINADOR` | `AA` (Encargado del joven) | `AA` (Otros) |
|---|---|---|---|---|
| **La Brújula:** Crear, editar, reformular objetivos y autoevaluarse | 🔒 (Solo la suya) | 🔒 (Solo la suya) | ❌ (Jamás edita) | ❌ |
| **La Brújula:** Leer objetivos y autoevaluación del joven | 🔒 (Solo la suya) | 🔒 (Solo la suya) | 🔒 (Solo sus asignados) | ❌ |
| **Notas de Acompañamiento (Hoja de vida):** Escribir y leer | 👁️ (Solo las compartidas) | 👁️ (Solo las compartidas) | 🔒 (Solo sus asignados) | ❌ |
| **Bitácora de Comunidad (M p. 97):** Leer y escribir entradas | 🔒 (Solo su Comunidad) | 🔒 (Solo su Comunidad) | 👁️ (Solo entradas compartidas) | ❌ |
| **Identidad y Cargos de la Comunidad:** Editar nombre, grito y roles | ❌ | 🔒 (Su Comunidad) | ✅ | ✅ |
| **Asamblea de Avanzada:** Votar selección de actividades y proyectos | 🗳️ ✅ | 🗳️ ✅ | ❌ (Sin voto, M p. 124) | ❌ (Sin voto) |
| **Reunión de Coordinadores:** Fijar énfasis, preseleccionar y armar Grupos | ❌ | ✅ | ✅ | ✅ |
| **Proyectos y Grupos de Trabajo:** Crear, inscribirse y actualizar pasos | ✅ (Si participa) | ✅ | ✅ | ✅ |
| **Promesa:** Solicitar/registrar fecha y texto de renovación | 🔒 (La suya) | 🔒 (La suya) | ✅ (Con el joven) | ✅ |
| **Etapas (`SENDERO`/`CUMBRE`) y Competencias:** Registrar hito | 🔒 (Tras consenso) | 🔒 (Tras consenso) | ✅ (Con el joven) | ✅ |
| **Evaluar Actividad o Proyecto finalizado (Observación cualitativa)** | ✅ | ✅ | ✅ | ✅ |
| **Bitácora de Avanzada (M p. 130):** Proponer página | ✅ | ✅ | ✅ | ✅ |
| **Bitácora de Avanzada:** Moderar y publicar | ⚙️ (Si es Guardián) | ⚙️ (Si es Guardián) | ✅ | ✅ |
| **Directorio de Red de Apoyo y Gestión de Cuentas (`/admin`)** | ❌ | 👁️ (Red de apoyo en proyectos) | ✅ | ✅ |

---

## 6. Modelo de Datos Objetivo (Evolución en `prisma/schema.prisma`)

Todas las tablas mantienen claves primarias `UUID` (`@db.Uuid`) y marcas de tiempo `timestamptz(3)` (RD-01 a RD-15 de v1.3.1):

1. **Actualización en `User`:**
   - `preferredName String? @db.VarChar(80)` (Nombre social con prioridad en UI).
   - `birthDate DateTime? @db.Date` (Para contexto de edad 15–17 años).
   - `communityId String? @db.Uuid` (Nullable para `AA` —que pertenecen al Equipo Adulto— y para jóvenes en ingreso individual previo a integrarse a una Comunidad).
   - `communityRole CommunityInternalRole?` (`COORDINADOR`, `SECRETARIO`, `TESORERO`, `ADMINISTRADOR`).
   - `assignedAaId String? @db.Uuid` (FK autorreferencial al `AA` encargado de su seguimiento personal) y `assignedSince DateTime? @db.Timestamptz(3)`.
2. **Nuevos modelos para La Brújula y Acompañamiento (`Art. I, II, VII, VIII`):**
   - `CompassObjectiveTemplate`: Catálogo referencial de la columna única de objetivos de 15–17 años y sus Objetivos Terminales por cada una de las 6 Áreas de Desarrollo (cargado desde JSON).
   - `UserCompassObjective`: Objetivo personal en la Brújula de un joven (`userId`, `area`, `templateId?`, `currentText`, `status`, `sharedWithCommunity Boolean`).
   - `UserCompassObjectiveVersion`: Historial inmutable de formulaciones/adaptaciones de cada objetivo (`objectiveId`, `text`, `createdAt`).
   - `UserCompassReflection`: Reflexiones y autoevaluaciones del joven por objetivo o por cierre de ciclo (`userId`, `cycleId?`, `objectiveId?`, `content`, `createdAt`).
   - `MentoringNote`: Notas privadas de observación del `AA` encargado (`studentId`, `authorAaId`, `content`, `sharedWithStudent Boolean`, `createdAt`).
3. **Nuevos modelos para Proyectos, Grupos de Trabajo y Red de Apoyo (`Art. V, VI, IX`):**
   - `Project`: Iniciativa con sus 6 pasos (`DREAM`, `CHOOSE`, `ORGANIZE`, `EXECUTE`, `EVALUATE`, `CELEBRATE`), datos de la Pauta de Identificación, presupuesto e informe final (`cycleId`, `responsibleUserId`).
   - `WorkGroupMember`: Miembros internos (`userId?`) y **participantes externos invitados** (`externalName?`, `externalRole?`, `externalOrganization?`) que integran el Grupo de Trabajo del proyecto.
   - `SupportNetworkContact`: Directorio de la Red de Apoyo (monitores, expertos, apoderados colaboradores, áreas de competencia que apoyan).
4. **Nuevos modelos para Bitácora de Comunidad y Ciclo Democrático (`Art. V, VI, VIII`):**
   - `CommunityLogEntry`: Entradas privadas de la Bitácora de cada Comunidad (`communityId`, `authorId`, `title`, `content`, `sharedWithAa Boolean`, `sharedWithCoordinators Boolean`).
   - `ProgramCycle` (evolución de `Semester`): Incluye `phase`, `diagnosisSummary`, `educationalEmphasis` y relación con `ActivityProposal` y `AssemblyVote` (donde una restricción verifica que el votante sea `PP` o `COORDINADOR`).
5. **Ajuste en `ActivityEvaluation` (`Art. III`):**
   - Se migran las columnas numéricas de notas `1..7` hacia indicadores de observación cualitativa (`objectiveAchievementLevel`, áreas vivenciadas y retroalimentación abierta).

---

## 7. Criterios de Verificación Constitucional (Tests Obligatorios)

Además de las puertas de calidad existentes (`npm run typecheck`, `npm run lint`, `npm test`, `npm run build`), la suite de pruebas automatizadas DEBE verificar las invariantes de la Constitución:

| Test Suite | Invariantes Constitucionales que verifica |
|---|---|
| `tests/compass-privacy.test.ts` | **Art. I y VIII:** Verifica que un `AA` (incluso el encargado) recibe error de permiso (`403`/`Forbidden`) si intenta crear, editar o cambiar el estado de un objetivo en `UserCompassObjective`; verifica que un `AA` no asignado al joven (`assignedAaId !== aa.id`) recibe `404` al intentar leer su Brújula o sus `MentoringNote`. |
| `tests/compass-versioning.test.ts` | **Art. II:** Verifica que al reformular un objetivo en La Brújula se conserva intacta la versión anterior en `UserCompassObjectiveVersion` y que todos los objetivos de las 6 áreas están disponibles sin bloqueo por etapa. |
| `tests/promise-and-stages.test.ts` | **Art. IV:** Verifica que un joven recién ingresado o en etapa `SENDERO` puede solicitar/registrar su `PROMESA` o iniciar en `CUMBRE` sin que ninguna regla de negocio lo bloquee por conteo de objetivos. |
| `tests/communities-and-workgroups.test.ts` | **Art. V:** Verifica que los `AA` no figuran como integrantes juveniles de una Comunidad; que la Bitácora de Comunidad (`CommunityLogEntry`) rechaza lecturas de miembros de otras Comunidades y de `AA` (salvo entradas marcadas como compartidas); y que un `WorkGroupMember` admite participantes externos sin cuenta de usuario. |
| `tests/democratic-assembly.test.ts` | **Art. VI:** Verifica que en las votaciones de propuestas de la Asamblea (`AssemblyVote`), `PP` y `COORDINADOR` pueden votar una vez por actividad/juego democrático, mientras que cualquier intento de voto desde una cuenta `AA` es rechazado en el servidor. |
| `tests/no-school-grading.test.ts` | **Art. III:** Verifica que las evaluaciones de actividades operan por observación cualitativa sin exigir notas de 1 a 7 y que ningún endpoint o vista devuelve rankings ni porcentajes de asistencia comparativos. |

---

*Fin de la Especificación de Requerimientos v2.0.*