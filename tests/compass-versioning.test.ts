import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  COMPASS_AREAS,
  COMPASS_OBJECTIVE_CATALOG,
  compassAreaDefinition,
  groupTemplatesByArea,
  templatesByArea,
  validateCompassCatalog,
  type CompassTemplate,
} from "../src/features/compass/catalog.ts";
import {
  COMPASS_STATUSES,
  versionsToAppend,
} from "../src/features/compass/rules.ts";

/**
 * Artículo I (la Brújula pertenece al joven) y RF-BRU-02 / RF-BRU-04.
 *
 * Dos invariantes se prueban aquí:
 *  1. El historial de redacciones es inmutable: cada reformulación agrega una
 *     versión nueva y jamás reescribe ni elimina una anterior.
 *  2. Toda la malla de objetivos está disponible desde el ingreso: seis áreas
 *     cubiertas, al menos tres objetivos representativos por área y ningún
 *     campo de etapa, edad, antigüedad o prerrequisito.
 */

describe("RF-BRU-04 · historial inmutable de versiones", () => {
  it("guarda la primera redacción como versión inicial", () => {
    assert.deepEqual(versionsToAppend([], "Quiero cuidar mi cuerpo"), [
      "Quiero cuidar mi cuerpo",
    ]);
  });

  it("agrega una versión nueva en cada reformulación", () => {
    const history = [{ text: "Quiero cuidar mi cuerpo" }];

    assert.deepEqual(
      versionsToAppend(history, "Quiero cuidar mi cuerpo y descansar mejor"),
      ["Quiero cuidar mi cuerpo y descansar mejor"],
    );

    // La versión anterior permanece exactamente igual.
    assert.equal(history.length, 1);
    assert.equal(history[0].text, "Quiero cuidar mi cuerpo");
  });

  it("no inserta una versión cuando la redacción no cambió", () => {
    const history = [{ text: "Quiero cuidar mi cuerpo" }];

    assert.deepEqual(versionsToAppend(history, "Quiero cuidar mi cuerpo"), []);
    assert.deepEqual(versionsToAppend(history, "  Quiero cuidar mi cuerpo  "), []);
  });

  it("ignora redacciones vacías o en blanco", () => {
    assert.deepEqual(versionsToAppend([], ""), []);
    assert.deepEqual(versionsToAppend([], "   \n\t "), []);
    assert.deepEqual(versionsToAppend([{ text: "Algo" }], "  "), []);
  });

  it("normaliza los espacios externos del texto guardado", () => {
    assert.deepEqual(versionsToAppend([], "  Escribir mi propio camino  "), [
      "Escribir mi propio camino",
    ]);
  });

  it("acumula versiones sin perder ninguna a lo largo de un ciclo", () => {
    const escrituras = [
      "Explorar mi corporalidad",
      "Explorar mi corporalidad y mis límites",
      "Explorar mi corporalidad, mis límites y mi descanso",
    ];

    const historial: { text: string }[] = [];
    for (const texto of escrituras) {
      const nuevas = versionsToAppend(historial, texto);
      if (nuevas.length > 0) {
        historial.push(...nuevas.map((text) => ({ text })));
      }
    }

    assert.deepEqual(
      historial.map((version) => version.text),
      escrituras,
    );
  });

  it("no muta el arreglo de versiones existentes", () => {
    const original = Object.freeze([
      Object.freeze({ text: "Primera redacción" }),
      Object.freeze({ text: "Segunda redacción" }),
    ]);

    versionsToAppend(original, "Tercera redacción");

    assert.equal(original.length, 2);
    assert.deepEqual(
      original.map((version) => version.text),
      ["Primera redacción", "Segunda redacción"],
    );
  });

  it("el estado del objetivo no produce versiones: solo cambia la autoevaluación", () => {
    const historial = [{ text: "Objetivo estable" }];

    assert.deepEqual(versionsToAppend(historial, "Objetivo estable"), []);
    assert.deepEqual(
      COMPASS_STATUSES.map((status) => status.key),
      ["EXPLORANDO", "LOGRADO_EN_VIDA_COTIDIANA"],
    );
  });
});

describe("RF-BRU-02 · la malla completa está disponible desde el ingreso", () => {
  it("cubre las seis áreas oficiales", () => {
    const validation = validateCompassCatalog();

    assert.equal(validation.valid, true, validation.problems.join(" | "));
    assert.deepEqual(validation.missingAreas, []);
    assert.deepEqual(validation.duplicateCodes, []);
    assert.deepEqual(
      COMPASS_AREAS.map((area) => area.key),
      [
        "CORPORALIDAD",
        "CREATIVIDAD",
        "CARACTER",
        "AFECTIVIDAD",
        "SOCIABILIDAD",
        "ESPIRITUALIDAD",
      ],
    );
    assert.equal(validation.areasCovered.length, 6);
  });

  it("ofrece al menos tres objetivos representativos por área", () => {
    const grouped = groupTemplatesByArea();

    for (const area of COMPASS_AREAS) {
      const templates = grouped[area.key];
      assert.ok(
        templates.length >= 3,
        `${area.label} tiene ${templates.length} objetivo(s)`,
      );
      assert.deepEqual(templatesByArea(area.key).length, templates.length);
    }
  });

  it("cada objetivo declara línea intermedia y horizonte terminal", () => {
    for (const template of COMPASS_OBJECTIVE_CATALOG) {
      assert.ok(template.code.length > 0, "código vacío");
      assert.ok(
        template.terminalObjective.trim().length > 0,
        `objetivo terminal vacío en ${template.code}`,
      );
      assert.ok(
        template.intermediateObjective.trim().length > 0,
        `objetivo intermedio vacío en ${template.code}`,
      );
      assert.equal(
        compassAreaDefinition(template.area).key,
        template.area,
        `área desconocida en ${template.code}`,
      );
    }
  });

  it("el catálogo no admite campos de etapa, edad ni antigüedad", () => {
    const allowedKeys = [
      "area",
      "code",
      "intermediateObjective",
      "sortOrder",
      "terminalObjective",
    ];
    const forbidden = /(etapa|stage|edad|\bage\b|antig|min_years|minYears|prereq|requisit|required|gate|bloque)/i;

    for (const template of COMPASS_OBJECTIVE_CATALOG) {
      const keys = Object.keys(template as CompassTemplate);

      assert.deepEqual(
        [...keys].sort(),
        allowedKeys,
        `campos inesperados en ${template.code}`,
      );

      for (const key of keys) {
        assert.equal(
          forbidden.test(key),
          false,
          `campo bloqueante «${key}» en ${template.code}`,
        );
      }
    }
  });

  it("la disponibilidad no depende de la etapa del camino simbólico", () => {
    // No existe ninguna función de catálogo que reciba usuario, etapa o edad:
    // el catálogo completo se entrega siempre. Se verifica estructuralmente.
    assert.equal(groupTemplatesByArea !== undefined, true);
    assert.equal(
      Object.keys(groupTemplatesByArea()).length,
      COMPASS_AREAS.length,
    );
    assert.equal(
      Object.values(groupTemplatesByArea()).flat().length,
      COMPASS_OBJECTIVE_CATALOG.length,
    );
  });

  it("la validación detecta un catálogo incompleto", () => {
    const incompleto: CompassTemplate[] = [
      {
        code: "COR-01",
        area: "CORPORALIDAD",
        terminalObjective: "Horizonte terminal",
        intermediateObjective: "Objetivo intermedio",
        sortOrder: 10,
      },
      {
        code: "COR-01",
        area: "CORPORALIDAD",
        terminalObjective: "Horizonte terminal",
        intermediateObjective: "Objetivo intermedio",
        sortOrder: 20,
      },
    ];

    const validation = validateCompassCatalog(incompleto);

    assert.equal(validation.valid, false);
    assert.deepEqual(validation.duplicateCodes, ["COR-01"]);
    assert.equal(validation.missingAreas.length, 5);
    assert.match(validation.problems.join(" | "), /al menos 3/i);
  });
});
