import assert from "node:assert/strict";
import { describe, it } from "node:test";

import * as evaluationDomain from "../src/lib/evaluations.ts";
import {
  areaFrequency,
  DEVELOPMENT_AREAS,
  formatExperiencedAreas,
  levelDefinition,
  levelDistribution,
  OBJECTIVE_ACHIEVEMENT_LEVELS,
  type QualitativeEvaluation,
} from "../src/lib/evaluations.ts";
import { permissionsFor } from "../src/server/rbac/permissions.ts";

const first: QualitativeEvaluation = {
  objectiveAchievementLevel: "LOGRADO_PLENAMENTE",
  experiencedAreas: ["AFECTIVIDAD", "CORPORALIDAD", "ESPIRITUALIDAD"],
};

const second: QualitativeEvaluation = {
  objectiveAchievementLevel: "LOGRADO_PARCIALMENTE",
  experiencedAreas: ["AFECTIVIDAD", "CREATIVIDAD"],
};

const third: QualitativeEvaluation = {
  objectiveAchievementLevel: "NO_LOGRADO_REPLANTEAR",
  experiencedAreas: [],
};

describe("evaluación cualitativa de actividades", () => {
  it("usa exactamente tres niveles de logro, sin escalas numéricas", () => {
    assert.deepEqual(
      OBJECTIVE_ACHIEVEMENT_LEVELS.map((level) => level.key),
      [
        "LOGRADO_PLENAMENTE",
        "LOGRADO_PARCIALMENTE",
        "NO_LOGRADO_REPLANTEAR",
      ],
    );
  });

  it("mantiene las seis áreas de desarrollo scout", () => {
    assert.deepEqual(
      DEVELOPMENT_AREAS.map((area) => area.label),
      [
        "Corporalidad",
        "Creatividad",
        "Carácter",
        "Afectividad",
        "Sociabilidad",
        "Espiritualidad",
      ],
    );
  });

  it("cuenta la distribución de niveles sin promediar", () => {
    const distribution = levelDistribution([first, second, third, first]);

    assert.deepEqual(
      distribution.map((level) => [level.key, level.count]),
      [
        ["LOGRADO_PLENAMENTE", 2],
        ["LOGRADO_PARCIALMENTE", 1],
        ["NO_LOGRADO_REPLANTEAR", 1],
      ],
    );
  });

  it("devuelve cero en todos los niveles cuando no hay observaciones", () => {
    assert.deepEqual(
      levelDistribution([]).map((level) => level.count),
      [0, 0, 0],
    );
  });

  it("cuenta la frecuencia de cada área y conserva las seis", () => {
    const frequency = areaFrequency([first, second]);

    assert.equal(frequency.length, 6);
    assert.equal(
      frequency.find((area) => area.key === "AFECTIVIDAD")?.count,
      2,
    );
    assert.equal(
      frequency.find((area) => area.key === "CORPORALIDAD")?.count,
      1,
    );
    assert.equal(
      frequency.find((area) => area.key === "SOCIABILIDAD")?.count,
      0,
    );
  });

  it("describe las áreas con palabras, no con puntajes", () => {
    assert.equal(
      formatExperiencedAreas(["AFECTIVIDAD", "CREATIVIDAD"]),
      "Afectividad · Creatividad",
    );
    assert.equal(formatExperiencedAreas([]), "Sin áreas marcadas");
  });

  it("encuentra la definición de cada nivel", () => {
    assert.equal(
      levelDefinition("LOGRADO_PARCIALMENTE").shortLabel,
      "Parcialmente",
    );
  });

  it("no expone ninguna función de promedio ni de nota", () => {
    const exported = Object.keys(evaluationDomain);

    assert.equal(exported.includes("average"), false);
    assert.equal(exported.includes("formatEvaluationScore"), false);
    assert.equal(exported.includes("overallEvaluationAverage"), false);
    assert.equal(exported.includes("areaAverages"), false);
  });
});

describe("permisos de evaluación", () => {
  it("PP, COORDINADOR y AA pueden dejar su observación", () => {
    assert.equal(permissionsFor("PP").has("activity:evaluate"), true);
    assert.equal(permissionsFor("COORDINADOR").has("activity:evaluate"), true);
    assert.equal(permissionsFor("AA").has("activity:evaluate"), true);
  });

  it("COORDINADOR conserva los permisos juveniles y suma la coordinación de su comunidad", () => {
    const ppPermissions = permissionsFor("PP");
    const coordinatorPermissions = permissionsFor("COORDINADOR");

    for (const permission of ppPermissions) {
      assert.equal(
        coordinatorPermissions.has(permission),
        true,
        `COORDINADOR debería conservar ${permission}`,
      );
    }

    assert.equal(
      coordinatorPermissions.has("community:identity_edit"),
      true,
    );
    assert.equal(coordinatorPermissions.has("community:roles_manage"), true);
    assert.equal(ppPermissions.has("community:identity_edit"), false);
    assert.equal(ppPermissions.has("community:roles_manage"), false);
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
