import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { describe, it } from "node:test";

import {
  DEVELOPMENT_AREAS,
  OBJECTIVE_ACHIEVEMENT_LEVELS,
} from "../src/lib/evaluations.ts";
import { permissionsFor } from "../src/server/rbac/permissions.ts";

/**
 * Artículo III de la Constitución: la evaluación no califica personas.
 *
 * Esta prueba protege el dominio y la interfaz de cualquier regreso a notas
 * 1–7, promedios, tasas o comparaciones.
 */

const EVALUATION_SOURCES = [
  "../src/lib/evaluations.ts",
  "../src/components/evaluations/evaluation-form.tsx",
  "../src/components/evaluations/evaluation-results.tsx",
  "../src/app/(app)/calendario/[activityId]/page.tsx",
  "../src/app/(admin)/admin/evaluaciones/page.tsx",
  "../src/app/(admin)/admin/evaluaciones/[activityId]/page.tsx",
] as const;

const FORBIDDEN_GRADING_TOKENS = [
  "affectivityScore",
  "corporalityScore",
  "spiritualityScore",
  "characterScore",
  "creativityScore",
  "sociabilityScore",
  "overallEvaluationAverage",
  "areaAverages",
  "formatEvaluationScore",
  "Promedio",
  "escala 1",
] as const;

/** La escala 1–7 se mostraba en la interfaz como `>/7<`. */
const SCORE_SCALE_PATTERN = />\s*\/\s*7\s*</;

async function readSource(relativePath: string) {
  return readFile(new URL(relativePath, import.meta.url), "utf8");
}

describe("Artículo III · evaluación no escolar", () => {
  it("no conserva notas, promedios ni escalas 1–7 en el dominio ni en la interfaz", async () => {
    for (const source of EVALUATION_SOURCES) {
      const content = await readSource(source);

      for (const token of FORBIDDEN_GRADING_TOKENS) {
        assert.equal(
          content.includes(token),
          false,
          `${source} todavía contiene "${token}"`,
        );
      }

      assert.equal(
        SCORE_SCALE_PATTERN.test(content),
        false,
        `${source} todavía muestra una escala sobre 7`,
      );
    }
  });

  it("solo admite los tres niveles cualitativos de logro", () => {
    assert.equal(OBJECTIVE_ACHIEVEMENT_LEVELS.length, 3);
    assert.deepEqual(
      OBJECTIVE_ACHIEVEMENT_LEVELS.map((level) => level.key),
      [
        "LOGRADO_PLENAMENTE",
        "LOGRADO_PARCIALMENTE",
        "NO_LOGRADO_REPLANTEAR",
      ],
    );
  });

  it("observa las seis áreas de desarrollo y no rasgos calificables", () => {
    assert.equal(DEVELOPMENT_AREAS.length, 6);
    assert.deepEqual(
      DEVELOPMENT_AREAS.map((area) => area.key).sort(),
      [
        "AFECTIVIDAD",
        "CARACTER",
        "CORPORALIDAD",
        "CREATIVIDAD",
        "ESPIRITUALIDAD",
        "SOCIABILIDAD",
      ],
    );
  });

  it("permite que cualquier participante, incluido AA, deje su observación", () => {
    assert.equal(permissionsFor("PP").has("activity:evaluate"), true);
    assert.equal(permissionsFor("COORDINADOR").has("activity:evaluate"), true);
    assert.equal(permissionsFor("AA").has("activity:evaluate"), true);
  });

  it("no conserva agregados de asistencia en el perfil ni en la ficha de usuario", async () => {
    const sources = [
      "../src/app/(app)/perfil/page.tsx",
      "../src/app/(admin)/admin/usuarios/[id]/page.tsx",
      "../src/app/(app)/inicio/page.tsx",
      "../src/app/(app)/miembros/page.tsx",
    ] as const;

    for (const source of sources) {
      const content = await readSource(source);

      assert.equal(
        content.includes("AttendanceSummaryCard"),
        false,
        `${source} todavía importa la tarjeta de resumen de asistencia`,
      );
      assert.equal(
        content.includes("getAttendanceSummary"),
        false,
        `${source} todavía calcula agregados de asistencia`,
      );
    }
  });
});
