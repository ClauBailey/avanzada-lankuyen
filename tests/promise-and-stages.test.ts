import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { describe, it } from "node:test";

import {
  canStartStage,
  PROMISE_FORMULAS,
  promiseIsIndependent,
  STAGE_MEANINGS,
  SYMBOLIC_MOMENTS,
  symbolicMoment,
} from "../src/lib/symbolic-path.ts";
import { permissionsFor } from "../src/server/rbac/permissions.ts";

/**
 * Artículo IV de la Constitución: el camino es simbólico, no una carrera.
 *
 * Esta prueba protege los cinco hitos, la independencia de la Promesa y la
 * ausencia de requisitos o textos de bloqueo entre etapas.
 */

const JOURNEY_SOURCES = [
  "../src/components/progression/stage-timeline.tsx",
  "../src/components/progression/badge-card.tsx",
  "../src/app/(app)/perfil/page.tsx",
  "../src/app/(app)/camino/page.tsx",
  "../src/app/(admin)/admin/usuarios/[id]/page.tsx",
] as const;

const FORBIDDEN_BLOCKING_COPY = [
  "se activará a todo color",
  "Cuando tu AA la otorgue",
  "Cuando tu AA la otorgue, la imagen",
  "requisito previo",
  "debes completar",
] as const;

async function readSource(relativePath: string) {
  return readFile(new URL(relativePath, import.meta.url), "utf8");
}

describe("Artículo IV · camino simbólico y Promesa", () => {
  it("reconoce exactamente cinco momentos, sin orden obligatorio", () => {
    assert.deepEqual(
      SYMBOLIC_MOMENTS.map((moment) => moment.key),
      [
        "BIENVENIDA_INVESTIDURA",
        "SENDERO",
        "CUMBRE",
        "PROMESA",
        "PASO_AL_CLAN",
      ],
    );
    assert.equal(symbolicMoment("PASO_AL_CLAN")?.title, "Paso al Clan");
  });

  it("permite iniciar directamente la Cumbre sin pasar por el Sendero", () => {
    assert.equal(canStartStage("SENDERO"), true);
    assert.equal(canStartStage("CUMBRE"), true);
  });

  it("declara la Promesa independiente de etapa y antigüedad", () => {
    assert.equal(promiseIsIndependent(), true);
    assert.deepEqual(
      PROMISE_FORMULAS.map((formula) => formula.key),
      ["LEY_GUIA", "LEY_SCOUT", "LEY"],
    );
  });

  it("explica el sentido de cada etapa como comienzo, no como premio", () => {
    assert.equal(STAGE_MEANINGS.SENDERO.motto, "Exploro mis caminos");
    assert.equal(STAGE_MEANINGS.CUMBRE.motto, "Proyecto mi camino");

    for (const meaning of Object.values(STAGE_MEANINGS)) {
      assert.equal(meaning.meaning.length > 80, true);
      assert.equal(meaning.meaning.toLowerCase().includes("bloque"), false);
      assert.equal(meaning.meaning.includes("se activará"), false);
    }
  });

  it("no conserva textos pasivos de activación por otorgamiento", async () => {
    for (const source of JOURNEY_SOURCES) {
      const content = await readSource(source);

      for (const phrase of FORBIDDEN_BLOCKING_COPY) {
        assert.equal(
          content.includes(phrase),
          false,
          `${source} todavía contiene "${phrase}"`,
        );
      }
    }
  });

  it("habilita a la persona y a su AA para registrar hitos y Promesa", () => {
    for (const role of ["PP", "COORDINADOR", "AA"] as const) {
      assert.equal(permissionsFor(role).has("journey:register"), true);
      assert.equal(permissionsFor(role).has("promise:manage"), true);
    }
  });
});
