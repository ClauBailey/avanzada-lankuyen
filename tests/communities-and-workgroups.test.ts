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
  canAccessCommunityLog,
  canEditCommunityLogEntry,
  canManageCommunityLog,
  canReadCommunityLogEntry,
  visibleCommunityLogEntries,
  type CommunityLogActor,
} from "../src/lib/community-log-rules.ts";
import {
  getDisplayFirstName,
  getDisplayInitials,
  getDisplayName,
} from "../src/lib/user-display.ts";
import { PERMISSIONS, permissionsFor } from "../src/server/rbac/permissions.ts";
import {
  canDissolveWorkGroup,
  canEditProject,
  canJoinWorkGroup,
  canSubmitFinalReport,
  nextProjectStep,
  PROJECT_STEPS,
  projectStepProgress,
  validateWorkGroupMemberInput,
  workGroupMemberKindLabel,
  type ProjectActor,
  type ProjectPermissionContext,
} from "../src/features/projects/rules.ts";

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
    assert.match(
      communitySizeAdvisory(2) ?? "",
      /2 personas jóvenes activas/i,
    );
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

describe("RF-BIT-01 a 03 · bitácora privada de comunidad", () => {
  const ownCommunity = "11111111-1111-4111-8111-111111111111";
  const otherCommunity = "22222222-2222-4222-8222-222222222222";
  const AUTHOR_ID = "99999999-9999-4999-8999-999999999999";

  const member: CommunityLogActor = {
    id: AUTHOR_ID,
    role: "PP",
    communityId: ownCommunity,
    isActive: true,
  };

  const privateEntry = {
    id: "entry-private",
    communityId: ownCommunity,
    authorId: AUTHOR_ID,
    sharedWithAa: false,
    sharedWithCoordinators: false,
  };

  const sharedWithAaEntry = {
    id: "entry-aa",
    communityId: ownCommunity,
    authorId: AUTHOR_ID,
    sharedWithAa: true,
    sharedWithCoordinators: false,
  };

  const sharedWithCoordinatorsEntry = {
    id: "entry-coord",
    communityId: ownCommunity,
    authorId: AUTHOR_ID,
    sharedWithAa: false,
    sharedWithCoordinators: true,
  };

  it("solo los miembros activos de la comunidad acceden a su bitácora", () => {
    assert.equal(canAccessCommunityLog(member, ownCommunity), true);
    assert.equal(canAccessCommunityLog(member, otherCommunity), false);
    assert.equal(
      canAccessCommunityLog({ ...member, isActive: false }, ownCommunity),
      false,
    );
  });

  it("ningún adulto del Equipo Adulto accede a la bitácora completa", () => {
    const aa: CommunityLogActor = {
      id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      role: "AA",
      communityId: null,
    };

    assert.equal(canAccessCommunityLog(aa, ownCommunity), false);
    assert.equal(canManageCommunityLog(aa, privateEntry), false);
    assert.equal(canAccessCommunityLog({ ...member, role: "ADMIN" }, ownCommunity), false);
  });

  it("una comunidad distinta no lee ni escribe entradas ajenas", () => {
    const outsider: CommunityLogActor = {
      ...member,
      id: "88888888-8888-4888-8888-888888888888",
      communityId: otherCommunity,
    };

    assert.equal(canReadCommunityLogEntry(outsider, privateEntry), false);
    assert.equal(canReadCommunityLogEntry(outsider, sharedWithAaEntry), false);
    assert.equal(canManageCommunityLog(outsider, privateEntry), false);
    assert.equal(canEditCommunityLogEntry(outsider, privateEntry), false);
  });

  it("el AA encargado ve solo las entradas compartidas con él", () => {
    const aa: CommunityLogActor = {
      id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      role: "AA",
      communityId: null,
    };

    assert.equal(
      canReadCommunityLogEntry(aa, privateEntry, {
        aaAccompaniesCommunity: true,
      }),
      false,
    );
    assert.equal(
      canReadCommunityLogEntry(aa, sharedWithAaEntry, {
        aaAccompaniesCommunity: true,
      }),
      true,
    );
    assert.equal(canReadCommunityLogEntry(aa, sharedWithAaEntry), false);
    assert.deepEqual(
      visibleCommunityLogEntries(
        aa,
        [privateEntry, sharedWithAaEntry, sharedWithCoordinatorsEntry],
        { aaAccompaniesCommunity: true },
      ).map((entry) => entry.id),
      ["entry-aa"],
    );
  });

  it("la Reunión de Coordinadores ve solo lo compartido con ella", () => {
    const coordinator: CommunityLogActor = {
      id: "77777777-7777-4777-8777-777777777777",
      role: "COORDINADOR",
      communityId: otherCommunity,
      isActive: true,
    };

    assert.equal(canReadCommunityLogEntry(coordinator, privateEntry), false);
    assert.equal(canReadCommunityLogEntry(coordinator, sharedWithAaEntry), false);
    assert.equal(
      canReadCommunityLogEntry(coordinator, sharedWithCoordinatorsEntry),
      true,
    );
  });

  it("los miembros ven todo lo de su comunidad y solo editan lo propio", () => {
    const entries = [privateEntry, sharedWithAaEntry, sharedWithCoordinatorsEntry];

    assert.equal(visibleCommunityLogEntries(member, entries).length, 3);
    assert.equal(canEditCommunityLogEntry(member, privateEntry), true);

    const peer: CommunityLogActor = {
      ...member,
      id: "66666666-6666-4666-8666-666666666666",
    };

    assert.equal(canEditCommunityLogEntry(peer, privateEntry), false);
    assert.equal(visibleCommunityLogEntries(peer, entries).length, 3);
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
    // «mentoring:note» es la nota privada del AA adulto hacia su joven
    // asignado: no es educación entre pares y ningún rol juvenil la recibe.
    const adultOnlyMentoring = new Set(["mentoring:note"]);
    const forbidden = ["mentor", "mediador", "tutor"];

    for (const word of forbidden) {
      const matches = PERMISSIONS.filter((permission) =>
        permission.toLowerCase().includes(word),
      );

      for (const permission of matches) {
        assert.equal(
          adultOnlyMentoring.has(permission),
          true,
          `permiso inesperado: ${permission}`,
        );
        assert.equal(
          permissionsFor("PP").has(permission),
          false,
          `un joven no puede tener ${permission}`,
        );
        assert.equal(
          permissionsFor("COORDINADOR").has(permission),
          false,
          `un coordinador juvenil no puede tener ${permission}`,
        );
      }
    }
  });

  it("expone permisos de identidad y cargos para coordinación", () => {
    assert.equal(PERMISSIONS.includes("community:identity_edit"), true);
    assert.equal(PERMISSIONS.includes("community:roles_manage"), true);
  });
});

/**
 * Artículo V · Proyectos y Grupos de Trabajo (Fase 5).
 *
 * El Grupo de Trabajo es abierto y transversal: cualquier joven de cualquier
 * Comunidad se inscribe por interés en la tarea. También puede integrar
 * monitores de la Red de Apoyo e invitados externos sin cuenta. El grupo se
 * disuelve recién después del Informe Final, dejando memoria histórica.
 */
describe("Artículo V · Ciclo de Proyecto y Grupo de Trabajo", () => {
  const youth: ProjectActor = { id: "joven-1", role: "PP", isActive: true };
  const coordinator: ProjectActor = {
    id: "coord-1",
    role: "COORDINADOR",
    isActive: true,
  };
  const adult: ProjectActor = { id: "aa-1", role: "AA", isActive: true };

  const activeProject: ProjectPermissionContext = {
    responsibleUserId: "joven-1",
    workGroupStatus: "ACTIVO",
    memberUserIds: ["joven-1"],
  };

  it("declara los seis pasos del proyecto en orden y cierra en Celebrar", () => {
    assert.deepEqual(
      PROJECT_STEPS.map((step) => step.key),
      ["SONAR", "ELEGIR", "ORGANIZAR", "REALIZAR", "EVALUAR", "CELEBRAR"],
    );

    assert.equal(nextProjectStep("SONAR"), "ELEGIR");
    assert.equal(nextProjectStep("ORGANIZAR"), "REALIZAR");
    assert.equal(nextProjectStep("CELEBRAR"), null);
    assert.equal(projectStepProgress("ORGANIZAR"), "Paso 3 de 6 · Organizar");
  });

  it("inscribe a cualquier joven de cualquier comunidad en un grupo activo", () => {
    const otherCommunityYouth: ProjectActor = {
      id: "joven-otra-comunidad",
      role: "PP",
      isActive: true,
    };

    assert.equal(
      canJoinWorkGroup(otherCommunityYouth, {
        workGroupStatus: "ACTIVO",
        memberUserIds: [],
      }),
      true,
    );

    assert.equal(
      canJoinWorkGroup(coordinator, {
        workGroupStatus: "ACTIVO",
        memberUserIds: [],
      }),
      true,
    );

    // El AA no se inscribe como joven y el grupo disuelto no recibe altas.
    assert.equal(
      canJoinWorkGroup(adult, {
        workGroupStatus: "ACTIVO",
        memberUserIds: [],
      }),
      false,
    );
    assert.equal(
      canJoinWorkGroup(otherCommunityYouth, {
        workGroupStatus: "HISTORICO_DISUELTO",
        memberUserIds: [],
      }),
      false,
    );
  });

  it("valida las tres identidades de integrante sin mezclarlas", () => {
    const interno = validateWorkGroupMemberInput({
      userId: "joven-otra-comunidad",
    });
    assert.deepEqual(interno, { valid: true, kind: "INTERNO" });
    assert.equal(
      workGroupMemberKindLabel({ userId: "joven-otra-comunidad" }),
      "Miembro con cuenta",
    );

    const monitor = validateWorkGroupMemberInput({
      supportContactId: "contacto-red-apoyo",
    });
    assert.deepEqual(monitor, { valid: true, kind: "MONITOR" });
    assert.equal(
      workGroupMemberKindLabel({ supportContactId: "contacto-red-apoyo" }),
      "Monitor de la Red de Apoyo",
    );

    const externo = validateWorkGroupMemberInput({
      externalName: "Camila, amiga invitada",
      externalOrganization: "Vecina del sector",
    });
    assert.deepEqual(externo, { valid: true, kind: "EXTERNO" });
    assert.equal(
      workGroupMemberKindLabel({
        externalName: "Camila, amiga invitada",
      }),
      "Participante externo invitado",
    );

    const mezcla = validateWorkGroupMemberInput({
      userId: "joven-1",
      externalName: "Camila",
    });
    assert.equal(mezcla.valid, false);

    const vacio = validateWorkGroupMemberInput({});
    assert.equal(vacio.valid, false);
  });

  it("permite editar al Responsable y a los participantes activos", () => {
    assert.equal(canEditProject(youth, activeProject), true);
    assert.equal(canEditProject(coordinator, activeProject), true);
    assert.equal(canEditProject(adult, activeProject), true);

    const otroJoven: ProjectActor = {
      id: "joven-2",
      role: "PP",
      isActive: true,
    };
    assert.equal(canEditProject(otroJoven, activeProject), false);

    assert.equal(
      canEditProject(otroJoven, {
        ...activeProject,
        memberUserIds: ["joven-1", "joven-2"],
      }),
      true,
    );

    // Un grupo disuelto ya no admite ediciones de participantes.
    assert.equal(
      canEditProject(otroJoven, {
        ...activeProject,
        workGroupStatus: "HISTORICO_DISUELTO",
        memberUserIds: ["joven-1", "joven-2"],
      }),
      false,
    );
  });

  it("exige el Informe Final antes de disolver el Grupo de Trabajo", () => {
    assert.equal(
      canSubmitFinalReport(youth, { ...activeProject, step: "EVALUAR" }),
      true,
    );
    assert.equal(
      canSubmitFinalReport(youth, { ...activeProject, step: "ORGANIZAR" }),
      false,
    );

    assert.equal(
      canDissolveWorkGroup(youth, { ...activeProject, step: "REALIZAR" }),
      false,
    );
    assert.equal(
      canDissolveWorkGroup(youth, { ...activeProject, step: "EVALUAR" }),
      true,
    );
    assert.equal(
      canDissolveWorkGroup(youth, { ...activeProject, step: "CELEBRAR" }),
      true,
    );
    assert.equal(
      canDissolveWorkGroup(youth, {
        ...activeProject,
        workGroupStatus: "HISTORICO_DISUELTO",
        step: "CELEBRAR",
      }),
      false,
    );
  });

  it("expone los permisos de proyectos y Red de Apoyo en el catálogo", () => {
    for (const permission of [
      "project:view",
      "project:manage",
      "support_network:view",
      "support_network:manage",
    ] as const) {
      assert.equal(PERMISSIONS.includes(permission), true);
    }

    assert.equal(permissionsFor("COORDINADOR").has("support_network:view"), true);
    assert.equal(
      permissionsFor("COORDINADOR").has("support_network:manage"),
      false,
    );
    assert.equal(permissionsFor("AA").has("support_network:manage"), true);
  });
});
