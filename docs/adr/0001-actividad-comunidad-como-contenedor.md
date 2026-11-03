# ADR 0001 — Una actividad `COMUNIDAD` es un contenedor de encuentros por Comunidad

- **Estado:** Aceptada
- **Fecha:** 2026-11-03
- **Contexto:** v2.2, Hojas de Ruta por Comunidad

## Contexto

El modelo original de `Activity` tiene un único `startsAt`, `endsAt`, `location` y un conjunto único de encargados. La v2.2 agregó `RouteSheet.communityId` para separar la preparación por Comunidad, pero mantuvo la actividad como un bloque único.

En la operación real, una actividad con `scope === 'COMUNIDAD'` puede agrupar encuentros que ocurren en horarios, lugares o con encargados distintos para cada Comunidad juvenil.

## Decisión

Una `Activity` con `scope === 'COMUNIDAD'` se trata como un **contenedor de encuentros por Comunidad**. Los datos compartidos de la actividad (título, descripción, tipo, ciclo, publicación) viven en la actividad; los datos operativos que varían por Comunidad deben poder vivir en una entidad hija por Comunidad.

La implementación actual de `RouteSheet.communityId` es un primer paso, pero **no es suficiente** para representar horarios, lugares, encargados, asistencia o evaluaciones diferenciadas.

## Consecuencias

- Se necesita modelar explícitamente el encuentro por Comunidad (nombre provisional: `CommunitySession` o `ActivityCommunity`).
- Hay que decidir qué datos cuelgan del encuentro y qué permanece en la actividad contenedora.
- Las hojas de ruta, notificaciones y tableros semáforo deben referirse al encuentro por Comunidad, no solo a `(activityId, communityId)`.
- La migración de datos existentes debe preservar las hojas de ruta ya cargadas.
- La UI de calendario debe distinguir entre la actividad contenedora y los encuentros por Comunidad.

## Preguntas abiertas

- ¿La asistencia, RSVP y evaluación pertenecen al encuentro por Comunidad o a la actividad contenedora?
- ¿La hoja de ruta debe colgar del encuentro (`sessionId`) en lugar de `(activityId, communityId)`?
- ¿Cómo se publica y notifica un contenedor cuando solo algunas Comunidades tienen encuentro confirmado?
