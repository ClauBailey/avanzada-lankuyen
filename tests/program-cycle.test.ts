import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  canCreateActivityForScope,
  canEditCommunityDiagnosis,
  canManageProgramCycle,
  canProposeActivity,
  canSelectProposalsForCalendar,
  canTransitionProgramCyclePhase,
  isProgramCyclePhase,
  nextProgramCyclePhase,
  PROGRAM_CYCLE_PHASES,
  type CycleActor,
  type ProgramCyclePhaseKey,
} from "../src/features/cycle/rules.ts";
import { permissionsFor } from "../src/server/rbac/permissions.ts";

/**
 * RF-CIC-01 a RF-CIC-05 · Ciclo de Programa democrático.
 *
 * El ciclo avanza una fase a la vez, cada Comunidad diagnostica lo suyo y la
 * programación del calendario respeta el alcance de cada rol.
 */

const COMMUNITY_A = "11111111-1111-4111-8111-111111111111";
const COMMUNITY_B = "22222222-2222-4222-8222-222222222222";

const youthA: CycleActor = {
  id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  role: "PP",
  communityId: COMMUNITY_A,
  isActive: true,
};

const coordinatorA: CycleActor = {
  id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  role: "COORDINADOR",
  communityId: COMMUNITY_A,
  isActive: true,
};

const adult: CycleActor = {
  id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
  role: "AA",
  communityId: null,
  isActive: true,
};

describe("RF-CIC-01 · fases secuenciales del ciclo de programa", () => {
  it("declara las cinco fases en orden", () => {
    assert.deepEqual(
      PROGRAM_CYCLE_PHASES.map((phase) => phase.key),
      [
        "DIAGNOSTICO_Y_ENFASIS",
        "PROPUESTA_Y_SELECCION",
        "ORGANIZACION_Y_PREPARACION",
        "DESARROLLO_Y_EVALUACION",
        "FINALIZADO",
      ],
    );
  });

  it("avanza una fase a la vez", () => {
    assert.equal(
      nextProgramCyclePhase("DIAGNOSTICO_Y_ENFASIS"),
      "PROPUESTA_Y_SELECCION",
    );
    assert.equal(
      nextProgramCyclePhase("PROPUESTA_Y_SELECCION"),
      "ORGANIZACION_Y_PREPARACION",
    );
    assert.equal(
      nextProgramCyclePhase("ORGANIZACION_Y_PREPARACION"),
      "DESARROLLO_Y_EVALUACION",
    );
    assert.equal(nextProgramCyclePhase("DESARROLLO_Y_EVALUACION"), "FINALIZADO");
  });

  it("FINALIZADO es terminal", () => {
    assert.equal(nextProgramCyclePhase("FINALIZADO"), null);
  });

  it("no permite saltar ni retroceder, pero sí confirmar la fase actual", () => {
    assert.equal(
      canTransitionProgramCyclePhase(
        "DIAGNOSTICO_Y_ENFASIS",
        "PROPUESTA_Y_SELECCION",
      ),
      true,
    );
    assert.equal(
      canTransitionProgramCyclePhase(
        "DIAGNOSTICO_Y_ENFASIS",
        "ORGANIZACION_Y_PREPARACION",
      ),
      false,
    );
    assert.equal(
      canTransitionProgramCyclePhase(
        "PROPUESTA_Y_SELECCION",
        "DIAGNOSTICO_Y_ENFASIS",
      ),
      false,
    );
    assert.equal(
      canTransitionProgramCyclePhase(
        "ORGANIZACION_Y_PREPARACION",
        "ORGANIZACION_Y_PREPARACION",
      ),
      true,
    );
    assert.equal(
      canTransitionProgramCyclePhase("FINALIZADO", "DIAGNOSTICO_Y_ENFASIS"),
      false,
    );
  });

  it("valida los nombres de fase", () => {
    assert.equal(isProgramCyclePhase("PROPUESTA_Y_SELECCION"), true);
    assert.equal(isProgramCyclePhase("FASE_INVENTADA"), false);
  });
});

describe("RF-CIC-02 · cada Comunidad escribe su propio diagnóstico", () => {
  it("un joven escribe el diagnóstico de su Comunidad", () => {
    assert.equal(canEditCommunityDiagnosis(youthA, COMMUNITY_A), true);
  });

  it("la coordinación de la Comunidad también puede escribirlo", () => {
    assert.equal(canEditCommunityDiagnosis(coordinatorA, COMMUNITY_A), true);
  });

  it("nadie escribe el diagnóstico de otra Comunidad", () => {
    assert.equal(canEditCommunityDiagnosis(youthA, COMMUNITY_B), false);
  });

  it("el Equipo Adulto no redacta diagnósticos de Comunidad", () => {
    assert.equal(canEditCommunityDiagnosis(adult, COMMUNITY_A), false);
  });

  it("sin Comunidad asignada no hay diagnóstico posible", () => {
    assert.equal(
      canEditCommunityDiagnosis({ ...youthA, communityId: null }, COMMUNITY_A),
      false,
    );
    assert.equal(canEditCommunityDiagnosis(youthA, null), false);
  });

  it("una cuenta inactiva no diagnostica", () => {
    assert.equal(
      canEditCommunityDiagnosis({ ...youthA, isActive: false }, COMMUNITY_A),
      false,
    );
  });

  it("mantiene los permisos de diagnóstico en jóvenes y coordinación, no en AA", () => {
    assert.equal(permissionsFor("PP").has("cycle:diagnose"), true);
    assert.equal(permissionsFor("COORDINADOR").has("cycle:diagnose"), true);
    assert.equal(permissionsFor("AA").has("cycle:diagnose"), false);
  });
});

describe("RF-CIC-03 y RF-CIC-05 · propuestas y gestión de la Asamblea", () => {
  it("los jóvenes proponen actividades; el AA no", () => {
    assert.equal(canProposeActivity(youthA), true);
    assert.equal(canProposeActivity(coordinatorA), true);
    assert.equal(canProposeActivity(adult), false);
  });

  it("la Reunión de Coordinadores gestiona el ciclo", () => {
    assert.equal(canManageProgramCycle(adult), true);
    assert.equal(canManageProgramCycle(coordinatorA), true);
    assert.equal(canManageProgramCycle(youthA), false);
    assert.equal(
      canManageProgramCycle({ ...coordinatorA, isActive: false }),
      false,
    );
  });

  it("solo la Reunión de Coordinadores selecciona propuestas para el calendario", () => {
    assert.equal(canSelectProposalsForCalendar(adult), true);
    assert.equal(canSelectProposalsForCalendar(coordinatorA), true);
    assert.equal(canSelectProposalsForCalendar(youthA), false);
  });

  it("el permiso de gestión no llega al rol PP", () => {
    assert.equal(permissionsFor("AA").has("cycle:manage"), true);
    assert.equal(permissionsFor("COORDINADOR").has("cycle:manage"), true);
    assert.equal(permissionsFor("PP").has("cycle:manage"), false);
  });
});

describe("RF-CAL-02 · alcance de las actividades del calendario", () => {
  it("el AA programa cualquier alcance", () => {
    for (const scope of ["COMUNIDAD", "AVANZADA", "GRUPO_DE_TRABAJO"] as const) {
      assert.equal(
        canCreateActivityForScope(adult, { scope, communityId: null }),
        true,
      );
    }
  });

  it("la coordinación solo programa actividades de su propia Comunidad", () => {
    assert.equal(
      canCreateActivityForScope(coordinatorA, {
        scope: "COMUNIDAD",
        communityId: COMMUNITY_A,
      }),
      true,
    );
    assert.equal(
      canCreateActivityForScope(coordinatorA, {
        scope: "COMUNIDAD",
        communityId: COMMUNITY_B,
      }),
      false,
    );
    assert.equal(
      canCreateActivityForScope(coordinatorA, {
        scope: "AVANZADA",
        communityId: COMMUNITY_A,
      }),
      false,
    );
    assert.equal(
      canCreateActivityForScope(coordinatorA, {
        scope: "GRUPO_DE_TRABAJO",
        communityId: COMMUNITY_A,
      }),
      false,
    );
  });

  it("un joven no programa el calendario", () => {
    assert.equal(
      canCreateActivityForScope(youthA, {
        scope: "COMUNIDAD",
        communityId: COMMUNITY_A,
      }),
      false,
    );
  });

  it("una coordinación sin Comunidad no programa actividades", () => {
    assert.equal(
      canCreateActivityForScope(
        { ...coordinatorA, communityId: null },
        { scope: "COMUNIDAD", communityId: COMMUNITY_A },
      ),
      false,
    );
  });
});

describe("permisos de fase 4 en el catálogo RBAC", () => {
  it("todos los roles activos pueden ver el ciclo", () => {
    assert.equal(permissionsFor("PP").has("cycle:view"), true);
    assert.equal(permissionsFor("COORDINADOR").has("cycle:view"), true);
    assert.equal(permissionsFor("AA").has("cycle:view"), true);
  });

  it("solo la coordinación administra actividades de Comunidad", () => {
    assert.equal(permissionsFor("COORDINADOR").has("activity:manage_community"), true);
    assert.equal(permissionsFor("PP").has("activity:manage_community"), false);
    assert.equal(permissionsFor("AA").has("activity:manage_community"), false);
  });
});

describe("tipos de fase exportados", () => {
  it("las claves de fase son asignables al tipo público", () => {
    const phase: ProgramCyclePhaseKey = "PROPUESTA_Y_SELECCION";
    assert.equal(isProgramCyclePhase(phase), true);
  });
});
