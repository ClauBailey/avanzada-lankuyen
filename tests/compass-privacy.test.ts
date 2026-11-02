import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  canManageMentoringNotes,
  canReadCompass,
  canReadMentoringNote,
  canRequestConsensus,
  canWriteCompass,
  compassTransparencyBanner,
  visibleCompassObjectives,
  visibleMentoringNotesForStudent,
  type CompassActor,
  type CompassTarget,
} from "../src/features/compass/rules.ts";
import { permissionsFor } from "../src/server/rbac/permissions.ts";

/**
 * Artículos I, VII y VIII de la Constitución.
 *
 * La Brújula pertenece exclusivamente al joven: solo él escribe. La lectura es
 * 1 a 1 con su AA encargado y, para los compañeros de comunidad, únicamente lo
 * que se comparte de forma explícita.
 */

const COMMUNITY_A = "11111111-1111-4111-8111-111111111111";
const COMMUNITY_B = "22222222-2222-4222-8222-222222222222";
const AA_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const OTHER_AA_ID = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const YOUTH_ID = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const PEER_ID = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";

const youth: CompassActor = {
  id: YOUTH_ID,
  role: "PP",
  communityId: COMMUNITY_A,
  isActive: true,
};

const assignedAa: CompassActor = {
  id: AA_ID,
  role: "AA",
  communityId: null,
};

const otherAa: CompassActor = {
  id: OTHER_AA_ID,
  role: "AA",
  communityId: null,
};

const target: CompassTarget = {
  id: YOUTH_ID,
  role: "PP",
  assignedAaId: AA_ID,
  communityId: COMMUNITY_A,
  isActive: true,
};

const peer: CompassActor = {
  id: PEER_ID,
  role: "PP",
  communityId: COMMUNITY_A,
  isActive: true,
};

describe("Artículo I · propiedad exclusiva de escritura", () => {
  it("solo el joven titular puede escribir su Brújula", () => {
    assert.equal(canWriteCompass(youth, YOUTH_ID), true);
    assert.equal(
      canWriteCompass({ ...youth, role: "COORDINADOR" }, YOUTH_ID),
      true,
    );
  });

  it("su propio AA encargado no puede escribir la Brújula del joven", () => {
    assert.equal(canWriteCompass(assignedAa, YOUTH_ID), false);
    assert.equal(canWriteCompass(otherAa, YOUTH_ID), false);
  });

  it("ningún otro joven puede escribir una Brújula ajena", () => {
    assert.equal(canWriteCompass(peer, YOUTH_ID), false);
  });

  it("el rol AA no recibe el permiso de escritura de La Brújula", () => {
    assert.equal(permissionsFor("AA").has("compass:write"), false);
    assert.equal(permissionsFor("AA").has("compass:view"), true);
    assert.equal(permissionsFor("AA").has("mentoring:note"), true);
    assert.equal(permissionsFor("PP").has("compass:write"), true);
    assert.equal(permissionsFor("PP").has("mentoring:note"), false);
    assert.equal(permissionsFor("COORDINADOR").has("compass:write"), true);
  });
});

describe("Artículos VII y VIII · privacidad de lectura 1 a 1", () => {
  it("el titular siempre puede leer su propia Brújula", () => {
    assert.equal(canReadCompass(youth, target), true);
  });

  it("el AA encargado puede leer; otro AA no", () => {
    assert.equal(canReadCompass(assignedAa, target), true);
    assert.equal(canReadCompass(otherAa, target), false);
  });

  it("un compañero activo de la misma comunidad puede leer lo compartido", () => {
    assert.equal(canReadCompass(peer, target), true);
  });

  it("un joven de otra comunidad no accede a la Brújula", () => {
    assert.equal(
      canReadCompass({ ...peer, communityId: COMMUNITY_B }, target),
      false,
    );
  });

  it("un compañero inactivo no accede a la Brújula", () => {
    assert.equal(canReadCompass({ ...peer, isActive: false }, target), false);
  });

  it("los compañeros solo ven los objetivos marcados para la comunidad", () => {
    const objectives = [
      { id: "1", sharedWithCommunity: true },
      { id: "2", sharedWithCommunity: false },
    ];

    const shared = visibleCompassObjectives({
      viewerId: PEER_ID,
      targetId: YOUTH_ID,
      isAssignedAa: false,
      objectives,
    });

    assert.deepEqual(
      shared.map((objective) => objective.id),
      ["1"],
    );

    const all = visibleCompassObjectives({
      viewerId: AA_ID,
      targetId: YOUTH_ID,
      isAssignedAa: true,
      objectives,
    });

    assert.equal(all.length, 2);
  });
});

describe("RF-BRU-09 · notas de acompañamiento", () => {
  it("solo el AA encargado administra el historial completo", () => {
    assert.equal(canManageMentoringNotes(assignedAa, target), true);
    assert.equal(canManageMentoringNotes(otherAa, target), false);
    assert.equal(canManageMentoringNotes(youth, target), false);
  });

  const privateNote = {
    id: "note-private",
    studentId: YOUTH_ID,
    authorAaId: AA_ID,
    sharedWithStudent: false,
  };

  const sharedNote = {
    id: "note-shared",
    studentId: YOUTH_ID,
    authorAaId: AA_ID,
    sharedWithStudent: true,
  };

  it("el joven no ve las notas privadas del AA", () => {
    assert.equal(canReadMentoringNote(youth, target, privateNote), false);
    assert.deepEqual(visibleMentoringNotesForStudent([privateNote]), []);
  });

  it("el joven sí ve las notas compartidas con él", () => {
    assert.equal(canReadMentoringNote(youth, target, sharedNote), true);
    assert.deepEqual(
      visibleMentoringNotesForStudent([privateNote, sharedNote]).map(
        (note) => note.id,
      ),
      ["note-shared"],
    );
  });

  it("otro AA no lee ninguna nota del joven", () => {
    assert.equal(canReadMentoringNote(otherAa, target, sharedNote), false);
    assert.equal(canReadMentoringNote(otherAa, target, privateNote), false);
  });
});

describe("RF-BRU-08 · banner de transparencia", () => {
  it("nombra al AA encargado y a la comunidad", () => {
    const text = compassTransparencyBanner({
      aaDisplayName: "Marti Rojas",
      communityName: "Araucarias",
    });

    assert.equal(
      text,
      "Tu Brújula es privada. Solo tú puedes escribir en ella. Actualmente pueden leerla: Marti Rojas (y tu Comunidad Araucarias solo en los elementos que marques para compartir).",
    );
  });

  it("explícita cuando todavía no hay AA asignado", () => {
    const text = compassTransparencyBanner({
      aaDisplayName: null,
      communityName: null,
    });

    assert.match(text, /Ningún AA asignado aún/);
  });
});

describe("solicitud de Encuentro de Consenso", () => {
  it("solo el titular con AA asignado puede solicitarlo", () => {
    assert.equal(
      canRequestConsensus({
        actorId: YOUTH_ID,
        targetId: YOUTH_ID,
        targetRole: "PP",
        assignedAaId: AA_ID,
      }),
      true,
    );

    assert.equal(
      canRequestConsensus({
        actorId: YOUTH_ID,
        targetId: YOUTH_ID,
        targetRole: "PP",
        assignedAaId: null,
      }),
      false,
    );

    assert.equal(
      canRequestConsensus({
        actorId: AA_ID,
        targetId: YOUTH_ID,
        targetRole: "PP",
        assignedAaId: AA_ID,
      }),
      false,
    );
  });
});
