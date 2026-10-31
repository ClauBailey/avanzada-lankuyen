import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  aaLoadAdvisory,
  AA_MIN_STABILITY_DAYS,
  canEditCommunityIdentity,
  canManageCommunityRoles,
  COMMUNITY_INTERNAL_ROLES,
  COMMUNITY_MAX_YOUTH,
  COMMUNITY_MIN_YOUTH,
  communitySizeAdvisory,
  countActiveYouth,
  daysWithAssignedAa,
  earlyReassignmentMessage,
  isEarlyAaReassignment,
  isYouthRole,
  MAX_YOUTH_PER_AA,
  systemRoleForCommunityRole,
  type CommunityActor,
} from "../src/lib/community-rules.ts";
import {
  getDisplayFirstName,
  getDisplayInitials,
  getDisplayName,
} from "../src/lib/user-display.ts";
import { PERMISSIONS } from "../src/server/rbac/permissions.ts";

const NOW = new Date("2026-10-30T12:00:00.000Z");

describe("identidad visible y nombre social", () => {
  it("prioriza el nombre social sobre el nombre registral", () => {
    const person = {
      firstName: "Registral",
      lastName: "Rojas",
      preferredName: "Marti",
    };

    assert.equal(getDisplayName(person), "Marti Rojas");
    assert.equal(getDisplayInitials(person), "MR");
    assert.equal(getDisplayFirstName(person), "Marti");
  });

  it("vuelve al nombre registral cuando no hay nombre social", () => {
    const person = { firstName: "Martina", lastName: "Rojas", preferredName: null };

    assert.equal(getDisplayName(person), "Martina Rojas");
    assert.equal(getDisplayInitials(person), "MR");
    assert.equal(getDisplayFirstName(person), "Martina");
  });

  it("ignora espacios y un nombre social vacío", () => {
    const person = {
      firstName: "  Martina ",
      lastName: " Rojas  Soto ",
      preferredName: "   ",
    };

    assert.equal(getDisplayName(person), "Martina Rojas Soto");
  });
});

describe("comunidades juveniles y Equipo Adulto", () => {
  it("solo PP y COORDINADOR son roles juveniles", () => {
    assert.equal(isYouthRole("PP"), true);
    assert.equal(isYouthRole("COORDINADOR"), true);
    assert.equal(isYouthRole("AA"), false);
  });

  it("cuenta únicamente jóvenes activos y excluye AA", () => {
    const members = [
      { role: "PP", isActive: true },
      { role: "COORDINADOR", isActive: true },
      { role: "PP", isActive: false },
      { role: "AA", isActive: true },
    ];

    assert.equal(countActiveYouth(members), 2);
  });

  it("advierte bajo 3 y sobre 6 jóvenes, sin bloquear el rango 3..6", () => {
    assert.match(communitySizeAdvisory(2) ?? "", /2 jóvenes activos/i);
    assert.equal(communitySizeAdvisory(COMMUNITY_MIN_YOUTH), null);
    assert.equal(communitySizeAdvisory(COMMUNITY_MAX_YOUTH), null);
    assert.match(communitySizeAdvisory(7) ?? "", /supera el máximo recomendado/i);
  });

  it("advierte la carga de un AA sobre 6 jóvenes activos", () => {
    assert.equal(aaLoadAdvisory(MAX_YOUTH_PER_AA), null);
    assert.match(
      aaLoadAdvisory(MAX_YOUTH_PER_AA + 1) ?? "",
      /máximo recomendado de 6/i,
    );
  });
});

describe("acompañamiento personal 1 a 1", () => {
  it("detecta un cambio de AA antes de 365 días", () => {
    const recent = new Date(NOW.getTime() - 100 * 86_400_000);
    const stable = new Date(NOW.getTime() - AA_MIN_STABILITY_DAYS * 86_400_000);

    assert.equal(daysWithAssignedAa(recent, NOW), 100);
    assert.equal(isEarlyAaReassignment(recent, NOW), true);
    assert.equal(isEarlyAaReassignment(stable, NOW), false);
  });

  it("no exige confirmación si nunca hubo asignación", () => {
    assert.equal(isEarlyAaReassignment(null, NOW), false);
    assert.equal(daysWithAssignedAa(null, NOW), null);
    assert.match(earlyReassignmentMessage(30), /30 días/);
  });
});

describe("alcance de coordinación por comunidad", () => {
  const ownCommunity = "11111111-1111-4111-8111-111111111111";
  const otherCommunity = "22222222-2222-4222-8222-222222222222";

  const coordinator: CommunityActor = {
    role: "COORDINADOR",
    communityId: ownCommunity,
  };

  it("un COORDINADOR solo edita su propia comunidad", () => {
    assert.equal(canEditCommunityIdentity(coordinator, ownCommunity), true);
    assert.equal(canEditCommunityIdentity(coordinator, otherCommunity), false);
    assert.equal(canManageCommunityRoles(coordinator, ownCommunity), true);
    assert.equal(canManageCommunityRoles(coordinator, otherCommunity), false);
  });

  it("un AA puede editar cualquier comunidad y un PP ninguna", () => {
    const aa: CommunityActor = { role: "AA", communityId: null };
    const pp: CommunityActor = { role: "PP", communityId: ownCommunity };

    assert.equal(canEditCommunityIdentity(aa, otherCommunity), true);
    assert.equal(canManageCommunityRoles(aa, ownCommunity), true);
    assert.equal(canEditCommunityIdentity(pp, ownCommunity), false);
  });

  it("sincroniza el cargo interno COORDINADOR con el rol de sistema", () => {
    assert.equal(systemRoleForCommunityRole("COORDINADOR"), "COORDINADOR");
    assert.equal(systemRoleForCommunityRole("SECRETARIO"), "PP");
    assert.equal(systemRoleForCommunityRole(null), "PP");
  });
});

describe("ausencia de roles de educación entre pares", () => {
  it("no existen roles internos de mentor, mediador o tutor", () => {
    const forbidden = ["mentor", "mediador", "tutor", "mentora"];
    const roles = COMMUNITY_INTERNAL_ROLES.map((role) => role.toLowerCase());

    for (const word of forbidden) {
      assert.equal(roles.includes(word), false, `rol inesperado: ${word}`);
    }
  });

  it("no existen permisos de educación entre pares", () => {
    const forbidden = ["mentor", "mediador", "tutor"];
    const permissions = PERMISSIONS.map((permission) => permission.toLowerCase());

    for (const word of forbidden) {
      assert.equal(
        permissions.some((permission) => permission.includes(word)),
        false,
        `permiso inesperado: ${word}`,
      );
    }
  });

  it("expone permisos de identidad y cargos para coordinación", () => {
    assert.equal(PERMISSIONS.includes("community:identity_edit"), true);
    assert.equal(PERMISSIONS.includes("community:roles_manage"), true);
  });
});
