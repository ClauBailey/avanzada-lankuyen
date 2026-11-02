import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  ADULT_VOTE_DENIED_MESSAGE,
  ASSEMBLY_VOTING_PHASE,
  canCastAssemblyVote,
  tallyAssemblyVotes,
  validateAssemblyVote,
  type AssemblyVoteContext,
  type DemocraticVoteDynamicKey,
} from "../src/features/cycle/rules.ts";
import { permissionsFor } from "../src/server/rbac/permissions.ts";

/**
 * Artículo VI de la Constitución y Manual p. 124.
 *
 * La Asamblea es el órgano donde los jóvenes deciden el ciclo de programa. El
 * Equipo Adulto participa acompañando la deliberación, pero nunca vota.
 */

const YOUTH_ID = "11111111-1111-4111-8111-111111111111";
const COORDINADOR_ID = "22222222-2222-4222-8222-222222222222";
const AA_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

const youth = { id: YOUTH_ID, role: "PP", isActive: true };
const coordinator = { id: COORDINADOR_ID, role: "COORDINADOR", isActive: true };
const adult = { id: AA_ID, role: "AA", isActive: true };

function context(
  overrides: Partial<AssemblyVoteContext> = {},
): AssemblyVoteContext {
  return {
    voter: youth,
    session: {
      isOpen: true,
      dynamic: "ELECCION_DIRECTA",
      maxPointsBudget: null,
    },
    cyclePhase: ASSEMBLY_VOTING_PHASE,
    value: 1,
    pointsAlreadySpent: 0,
    ...overrides,
  };
}

describe("Artículo VI · el voto pertenece exclusivamente a los jóvenes", () => {
  it("permite votar a PP y COORDINADOR", () => {
    assert.deepEqual(canCastAssemblyVote(youth), { allowed: true });
    assert.deepEqual(canCastAssemblyVote(coordinator), { allowed: true });
  });

  it("rechaza a cualquier cuenta del Equipo Adulto con 403", () => {
    assert.deepEqual(canCastAssemblyVote(adult), {
      allowed: false,
      status: 403,
      error: ADULT_VOTE_DENIED_MESSAGE,
    });
  });

  it("usa textualmente el mensaje de la Constitución y el Manual", () => {
    assert.equal(
      ADULT_VOTE_DENIED_MESSAGE,
      "El Equipo Adulto participa en la Asamblea sin derecho a voto (Constitución Art. VI y Manual p. 124).",
    );
  });

  it("rechaza el voto adulto sea cual sea la dinámica o el estado de la sesión", () => {
    const dynamics: DemocraticVoteDynamicKey[] = [
      "ELECCION_DIRECTA",
      "RANKING_ESTRELLAS",
      "ASIGNACION_PUNTOS",
    ];

    for (const dynamic of dynamics) {
      for (const isOpen of [true, false]) {
        const result = validateAssemblyVote(
          context({
            voter: adult,
            session: { isOpen, dynamic, maxPointsBudget: 10 },
          }),
        );

        assert.equal(result.allowed, false);
        assert.equal(
          result.allowed === false ? result.status : null,
          403,
        );
        assert.equal(
          result.allowed === false ? result.error : null,
          ADULT_VOTE_DENIED_MESSAGE,
        );
      }
    }
  });

  it("no concede el permiso assembly:vote al rol AA", () => {
    assert.equal(permissionsFor("AA").has("assembly:vote"), false);
    assert.equal(permissionsFor("AA").has("cycle:view"), true);
    assert.equal(permissionsFor("AA").has("cycle:diagnose"), false);
    assert.equal(permissionsFor("AA").has("cycle:propose"), false);
  });

  it("concede el voto a PP y COORDINADOR", () => {
    assert.equal(permissionsFor("PP").has("assembly:vote"), true);
    assert.equal(permissionsFor("COORDINADOR").has("assembly:vote"), true);
  });
});

describe("RF-CIC-04 · la votación exige sesión abierta y fase de propuestas", () => {
  it("acepta un voto válido en sesión abierta y fase de selección", () => {
    assert.deepEqual(validateAssemblyVote(context()), {
      allowed: true,
      value: 1,
    });
  });

  it("rechaza votar con la sesión cerrada", () => {
    const result = validateAssemblyVote(
      context({
        session: {
          isOpen: false,
          dynamic: "ELECCION_DIRECTA",
          maxPointsBudget: null,
        },
      }),
    );

    assert.equal(result.allowed, false);
    assert.equal(result.allowed === false ? result.status : null, 400);
  });

  it("rechaza votar fuera de la fase PROPUESTA_Y_SELECCION", () => {
    const result = validateAssemblyVote(
      context({ cyclePhase: "ORGANIZACION_Y_PREPARACION" }),
    );

    assert.equal(result.allowed, false);
    assert.equal(result.allowed === false ? result.status : null, 400);
  });
});

describe("dinámicas de votación democrática", () => {
  it("elección directa: cada voto vale exactamente 1", () => {
    assert.deepEqual(validateAssemblyVote(context({ value: 1 })), {
      allowed: true,
      value: 1,
    });

    const invalid = validateAssemblyVote(context({ value: 2 }));
    assert.equal(invalid.allowed, false);
    assert.equal(invalid.allowed === false ? invalid.status : null, 400);
  });

  it("ranking de estrellas: admite de 1 a 5", () => {
    const stars = (value: number) =>
      validateAssemblyVote(
        context({
          value,
          session: {
            isOpen: true,
            dynamic: "RANKING_ESTRELLAS",
            maxPointsBudget: null,
          },
        }),
      );

    assert.deepEqual(stars(1), { allowed: true, value: 1 });
    assert.deepEqual(stars(5), { allowed: true, value: 5 });
    assert.equal(stars(0).allowed, false);
    assert.equal(stars(6).allowed, false);
  });

  it("asignación de puntos: respeta el pozo maxPointsBudget", () => {
    const points = (value: number, spent: number) =>
      validateAssemblyVote(
        context({
          value,
          pointsAlreadySpent: spent,
          session: {
            isOpen: true,
            dynamic: "ASIGNACION_PUNTOS",
            maxPointsBudget: 10,
          },
        }),
      );

    assert.deepEqual(points(4, 6), { allowed: true, value: 4 });
    assert.equal(points(5, 6).allowed, false);
    assert.equal(points(-1, 0).allowed, false);
  });

  it("los valores no enteros son rechazados", () => {
    const result = validateAssemblyVote(context({ value: 1.5 }));
    assert.equal(result.allowed, false);
    assert.equal(result.allowed === false ? result.status : null, 400);
  });
});

describe("escrutinio de la Asamblea", () => {
  const proposals = [
    { id: "p1", title: "Peña de talentos" },
    { id: "p2", title: "Salida al cerro" },
  ];

  it("elección directa: cuenta los votos y ordena de mayor a menor", () => {
    const rows = tallyAssemblyVotes(
      proposals,
      [
        { proposalId: "p1", value: 1 },
        { proposalId: "p2", value: 1 },
        { proposalId: "p2", value: 1 },
      ],
      "ELECCION_DIRECTA",
    );

    assert.deepEqual(
      rows.map((row) => [row.proposalId, row.total, row.voters]),
      [
        ["p2", 2, 2],
        ["p1", 1, 1],
      ],
    );
  });

  it("ranking de estrellas: ordena por promedio", () => {
    const rows = tallyAssemblyVotes(
      proposals,
      [
        { proposalId: "p1", value: 5 },
        { proposalId: "p1", value: 5 },
        { proposalId: "p2", value: 3 },
      ],
      "RANKING_ESTRELLAS",
    );

    assert.equal(rows[0].proposalId, "p1");
    assert.equal(rows[0].average, 5);
    assert.equal(rows[1].average, 3);
  });

  it("asignación de puntos: ordena por suma de puntos", () => {
    const rows = tallyAssemblyVotes(
      proposals,
      [
        { proposalId: "p1", value: 3 },
        { proposalId: "p2", value: 7 },
      ],
      "ASIGNACION_PUNTOS",
    );

    assert.equal(rows[0].proposalId, "p2");
    assert.equal(rows[0].total, 7);
  });
});
