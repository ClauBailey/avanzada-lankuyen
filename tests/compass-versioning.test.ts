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
import { reconcileOfflineObjectiveEdit } from "../src/features/compass/offline-sync.ts";
import {
  buildPortableProfile,
  PORTABLE_PROFILE_FORMAT,
  PORTABLE_PROFILE_VERSION,
} from "../src/features/profile/export.ts";

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

/**
 * Artículos II y XII · sincronización offline sin pérdida de redacciones.
 *
 * Si el objetivo cambió en otro dispositivo mientras la persona estaba sin
 * conexión, la redacción del servidor ya vive en el historial. La edición
 * offline se agrega como versión sucesiva: nunca se sobrescribe ni se pierde
 * ninguna de las dos.
 */
describe("RF-PWA-02 · reconciliación offline de La Brújula", () => {
  const now = new Date("2026-11-02T12:00:00.000Z");

  it("agrega la edición cuando el servidor sigue igual a la base offline", () => {
    const result = reconcileOfflineObjectiveEdit(
      {
        serverCurrentText: "Aprendo a cuidar mi cuerpo",
        serverVersions: [
          { text: "Aprendo a cuidar mi cuerpo", createdAt: "2026-10-01" },
        ],
        offlineBaseText: "Aprendo a cuidar mi cuerpo",
        offlineNewText: "Aprendo a cuidar mi cuerpo y descansar mejor",
      },
      now,
    );

    assert.equal(result.shouldAppend, true);
    assert.equal(result.conflict, false);
    assert.deepEqual(result.versionsToAppend, [
      {
        text: "Aprendo a cuidar mi cuerpo y descansar mejor",
        createdAt: now.toISOString(),
      },
    ]);
    assert.deepEqual(result.resultingHistory, [
      "Aprendo a cuidar mi cuerpo",
      "Aprendo a cuidar mi cuerpo y descansar mejor",
    ]);
  });

  it("conserva ambos textos cuando hubo edición concurrente en otro dispositivo", () => {
    const result = reconcileOfflineObjectiveEdit(
      {
        serverCurrentText: "Versión escrita en el computador",
        serverVersions: [
          { text: "Texto original", createdAt: "2026-10-01" },
          { text: "Versión escrita en el computador", createdAt: "2026-10-20" },
        ],
        offlineBaseText: "Texto original",
        offlineNewText: "Versión escrita en el teléfono sin conexión",
      },
      now,
    );

    assert.equal(result.shouldAppend, true);
    assert.equal(result.conflict, true);
    assert.equal(result.finalText, "Versión escrita en el teléfono sin conexión");
    assert.deepEqual(result.versionsToAppend, [
      {
        text: "Versión escrita en el teléfono sin conexión",
        createdAt: now.toISOString(),
      },
    ]);
    assert.deepEqual(result.resultingHistory, [
      "Texto original",
      "Versión escrita en el computador",
      "Versión escrita en el teléfono sin conexión",
    ]);
  });

  it("no duplica versiones cuando el texto offline ya es el vigente", () => {
    const result = reconcileOfflineObjectiveEdit(
      {
        serverCurrentText: "Mismo texto",
        serverVersions: [{ text: "Mismo texto", createdAt: "2026-10-01" }],
        offlineBaseText: "Otro texto anterior",
        offlineNewText: "Mismo texto",
      },
      now,
    );

    assert.equal(result.shouldAppend, false);
    assert.equal(result.conflict, false);
    assert.deepEqual(result.versionsToAppend, []);
  });

  it("ignora una redacción offline vacía", () => {
    const result = reconcileOfflineObjectiveEdit(
      {
        serverCurrentText: "Texto vigente",
        serverVersions: [{ text: "Texto vigente", createdAt: "2026-10-01" }],
        offlineBaseText: "Texto vigente",
        offlineNewText: "   ",
      },
      now,
    );

    assert.equal(result.shouldAppend, false);
    assert.deepEqual(result.versionsToAppend, []);
    assert.equal(result.finalText, "Texto vigente");
  });
});

/**
 * RF-AUT-08 · exportación portable completa.
 *
 * El documento incluye la identidad visible (nombre social), todas las
 * versiones de cada objetivo, reflexiones, camino simbólico, Promesa,
 * competencias, logros y páginas de bitácora.
 */
describe("RF-AUT-08 · payload portable del recorrido", () => {
  it("incluye el historial completo de versiones de cada objetivo", () => {
    const profile = buildPortableProfile(
      {
        user: {
          id: "user-1",
          username: "pp.prueba",
          email: "pp@example.cl",
          firstName: "Registral",
          lastName: "Apellido",
          preferredName: "Nombre Social",
          role: "PP",
          birthDate: "2009-05-10",
          communityRole: "COORDINADOR",
          createdAt: "2025-03-01T12:00:00.000Z",
          community: { name: "Comunidad Peñihuén" },
        },
        compassObjectives: [
          {
            id: "obj-1",
            area: "CORPORALIDAD",
            terminalObjectiveRef: "Cuidar mi cuerpo",
            currentText: "Tercera redacción",
            status: "EXPLORANDO",
            sharedWithCommunity: true,
            createdAt: "2026-01-01T12:00:00.000Z",
            updatedAt: "2026-03-01T12:00:00.000Z",
            versions: [
              {
                text: "Tercera redacción",
                createdAt: "2026-03-01T12:00:00.000Z",
              },
              {
                text: "Primera redacción",
                createdAt: "2026-01-01T12:00:00.000Z",
              },
              {
                text: "Segunda redacción",
                createdAt: "2026-02-01T12:00:00.000Z",
              },
            ],
          },
        ],
        compassReflections: [
          {
            id: "ref-1",
            objectiveId: "obj-1",
            activityId: null,
            isCycleSelfEvaluation: false,
            cycleLabel: null,
            content: "Me di cuenta de algo importante.",
            sharedWithAa: true,
            sharedWithCommunity: false,
            consensusNote: null,
            createdAt: "2026-03-02T12:00:00.000Z",
          },
        ],
        milestones: [
          {
            id: "mil-1",
            moment: "BIENVENIDA_INVESTIDURA",
            occurredAt: "2025-04-01",
            place: "Sede",
            story: "Mi investidura.",
            accompaniedBy: "AA de la comunidad",
          },
        ],
        promise: {
          formula: "SIEMPRE_LISTO",
          status: "CELEBRADA",
          desiredPlace: "Cerro",
          motivation: "Quiero comprometerme.",
          requestedAt: "2026-04-01T12:00:00.000Z",
          celebratedAt: "2026-05-01",
          celebrationPlace: "Cerro",
          story: "Fue un día especial.",
          accompaniedBy: "Mi AA",
        },
        stageReflections: [
          {
            stageCode: "SENDERO",
            content: "Comienzo mi Sendero.",
            createdAt: "2025-04-02T12:00:00.000Z",
            updatedAt: "2025-04-02T12:00:00.000Z",
          },
        ],
        badges: [
          {
            id: "badge-1",
            code: "COMP-CULTURA",
            name: "Cultura",
            category: "COMPETENCIA",
            competencyArea: "CULTURA",
            stageCode: null,
            grantedAt: "2026-01-15T12:00:00.000Z",
            note: null,
            revokedAt: null,
          },
          {
            id: "badge-2",
            code: "ETAPA_SENDERO",
            name: "Sendero",
            category: "ETAPA",
            competencyArea: null,
            stageCode: "SENDERO",
            grantedAt: "2025-04-02T12:00:00.000Z",
            note: "Inicio del Sendero",
            revokedAt: null,
          },
        ],
        achievements: [
          {
            code: "PRIMER_FUEGO",
            title: "Primer fuego",
            description: "Encendiste tu primer fuego.",
            category: "AVANZADA",
            unlockedAt: "2026-02-10T12:00:00.000Z",
            note: null,
          },
        ],
        logbookEntries: [
          {
            id: "log-1",
            title: "Campamento de invierno",
            pageNumber: 7,
            adventureDate: "2026-07-10",
            contentMd: "Aprendimos a cuidar el fuego.",
            status: "PUBLICADA",
            publishedAt: "2026-07-12T12:00:00.000Z",
            createdAt: "2026-07-11T12:00:00.000Z",
          },
        ],
      },
      new Date("2026-11-02T12:00:00.000Z"),
    );

    assert.equal(profile.format, PORTABLE_PROFILE_FORMAT);
    assert.equal(profile.version, PORTABLE_PROFILE_VERSION);
    assert.equal(profile.exportedAt, "2026-11-02T12:00:00.000Z");
    assert.equal(profile.identity.displayName, "Nombre Social Apellido");
    assert.equal(profile.identity.community, "Comunidad Peñihuén");

    const objective = profile.compass.objectives[0];
    assert.equal(objective.versions.length, 3);
    assert.deepEqual(
      objective.versions.map((version) => version.text),
      ["Primera redacción", "Segunda redacción", "Tercera redacción"],
    );

    assert.equal(profile.compass.reflections.length, 1);
    assert.equal(profile.journey.milestones.length, 1);
    assert.equal(profile.journey.promise?.formula, "SIEMPRE_LISTO");
    assert.equal(profile.journey.stageReflections.length, 1);

    // Solo las insignias de competencia alimentan `competencies`.
    assert.equal(profile.competencies.length, 1);
    assert.equal(profile.competencies[0].competencyArea, "CULTURA");
    assert.equal(profile.badges.length, 2);
    assert.equal(profile.badges[1].stageCode, "SENDERO");

    assert.equal(profile.achievements.length, 1);
    assert.equal(profile.logbook.pages[0].pageNumber, 7);
    assert.equal(profile.logbook.pages[0].contentMd, "Aprendimos a cuidar el fuego.");
  });
});
