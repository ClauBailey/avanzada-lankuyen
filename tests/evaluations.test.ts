import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  areaAverages,
  average,
  EVALUATION_AREAS,
  formatEvaluationScore,
  overallEvaluationAverage,
  type EvaluationScores,
} from "../src/lib/evaluations.ts";
import { permissionsFor } from "../src/server/rbac/permissions.ts";

const first: EvaluationScores = {
  affectivityScore: 7,
  corporalityScore: 6,
  spiritualityScore: 5,
  characterScore: 4,
  creativityScore: 3,
  sociabilityScore: 2,
};

const second: EvaluationScores = {
  affectivityScore: 1,
  corporalityScore: 2,
  spiritualityScore: 3,
  characterScore: 4,
  creativityScore: 5,
  sociabilityScore: 6,
};

describe("áreas de evaluación scout", () => {
  it("mantiene las seis áreas en el orden solicitado", () => {
    assert.deepEqual(
      EVALUATION_AREAS.map((area) => area.label),
      [
        "Afectividad",
        "Corporalidad",
        "Espiritualidad",
        "Carácter",
        "Creatividad",
        "Sociabilidad",
      ],
    );
  });
});

describe("promedios de evaluación", () => {
  it("redondea a un decimal", () => {
    assert.equal(average([1, 2, 2]), 1.7);
    assert.equal(average([4, 5]), 4.5);
  });

  it("devuelve null cuando no hay respuestas", () => {
    assert.equal(average([]), null);
    assert.equal(overallEvaluationAverage([]), null);
    assert.equal(formatEvaluationScore(null), "—");
  });

  it("promedia las seis áreas de todas las respuestas", () => {
    assert.equal(overallEvaluationAverage([first, second]), 4);
    assert.equal(overallEvaluationAverage([first]), 4.5);
  });

  it("calcula el promedio independiente de cada área", () => {
    assert.deepEqual(areaAverages([first, second]), {
      affectivityScore: 4,
      corporalityScore: 4,
      spiritualityScore: 4,
      characterScore: 4,
      creativityScore: 4,
      sociabilityScore: 4,
    });
  });

  it("formatea con coma decimal", () => {
    assert.equal(formatEvaluationScore(4.5), "4,5");
    assert.equal(formatEvaluationScore(7), "7,0");
  });
});

describe("permisos de evaluación", () => {
  it("PP y COORDINADOR pueden responder evaluaciones", () => {
    assert.equal(permissionsFor("PP").has("activity:evaluate"), true);
    assert.equal(permissionsFor("COORDINADOR").has("activity:evaluate"), true);
    assert.equal(permissionsFor("AA").has("activity:evaluate"), false);
  });

  it("COORDINADOR conserva los mismos permisos que PP en v1", () => {
    assert.deepEqual(
      [...permissionsFor("COORDINADOR")].sort(),
      [...permissionsFor("PP")].sort(),
    );
  });

  it("solo los AA pueden leer todas las respuestas", () => {
    assert.equal(permissionsFor("AA").has("activity:evaluation_view"), true);
    assert.equal(permissionsFor("PP").has("activity:evaluation_view"), false);
    assert.equal(
      permissionsFor("COORDINADOR").has("activity:evaluation_view"),
      false,
    );
  });
});
