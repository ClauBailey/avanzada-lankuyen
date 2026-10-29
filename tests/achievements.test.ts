import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  HINT_ACHIEVEMENT_FALLBACK,
  SECRET_ACHIEVEMENT_DESCRIPTION,
  SECRET_ACHIEVEMENT_TITLE,
  sanitizeAchievementForViewer,
  type AchievementSource,
} from "../src/features/achievements/visibility.ts";
import {
  getAchievementRarity,
  RARITY_OPTIONS,
} from "../src/features/achievements/rarity.ts";
import {
  buildMemberDirectoryWhere,
  isSocialMemberRole,
  SOCIAL_MEMBER_ROLES,
} from "../src/features/members/filters.ts";
import { can } from "../src/server/rbac/can.ts";

const secret: AchievementSource = {
  title: "El ritual del fuego",
  description:
    "Descubriste el ritual secreto que solo se comparte alrededor del fuego.",
  hint: "Busca la chispa donde nadie más mira.",
  icon: "Star",
  visibility: "SECRET",
  points: 50,
};

const hinted: AchievementSource = {
  title: "Guardián del bosque",
  description:
    "Dejaste un lugar natural mejor de como lo encontraste y enseñaste a cuidarlo.",
  hint: "Observa lo que dejas atrás después de cada salida.",
  icon: "Leaf",
  visibility: "HINT",
  points: 20,
};

const publicAchievement: AchievementSource = {
  title: "El primer fuego",
  description: "Encendiste el fuego de la Avanzada en un campamento.",
  hint: null,
  icon: "Flame",
  visibility: "PUBLIC",
  points: 10,
};

describe("niebla de guerra de logros SECRET", () => {
  it("oculta título, descripción e ícono para un PP bloqueado", () => {
    const view = sanitizeAchievementForViewer(secret, false, "PP");
    const payload = JSON.stringify(view);

    assert.equal(view.title, SECRET_ACHIEVEMENT_TITLE);
    assert.equal(view.description, SECRET_ACHIEVEMENT_DESCRIPTION);
    assert.equal(view.icon, "Lock");
    assert.equal(view.locked, true);
    assert.equal(view.hint, secret.hint);

    assert.ok(!payload.includes(secret.title));
    assert.ok(!payload.includes(secret.description));
    assert.ok(!payload.includes(secret.icon));
  });

  it("también censura a un COORDINADOR bloqueado", () => {
    const view = sanitizeAchievementForViewer(secret, false, "COORDINADOR");
    assert.equal(view.title, SECRET_ACHIEVEMENT_TITLE);
    assert.equal(view.description, SECRET_ACHIEVEMENT_DESCRIPTION);
    assert.equal(view.icon, "Lock");
  });

  it("revela todo cuando el joven ya lo desbloqueó", () => {
    const view = sanitizeAchievementForViewer(secret, true, "PP");
    assert.equal(view.title, secret.title);
    assert.equal(view.description, secret.description);
    assert.equal(view.icon, secret.icon);
    assert.equal(view.locked, false);
  });

  it("un AA ve el texto completo aunque no lo tenga desbloqueado", () => {
    const view = sanitizeAchievementForViewer(secret, false, "AA");
    assert.equal(view.title, secret.title);
    assert.equal(view.description, secret.description);
    assert.equal(view.locked, false);
  });
});

describe("niebla de guerra de logros HINT", () => {
  it("muestra el título real pero reemplaza la descripción por la pista", () => {
    const view = sanitizeAchievementForViewer(hinted, false, "PP");
    const payload = JSON.stringify(view);

    assert.equal(view.title, hinted.title);
    assert.equal(view.description, hinted.hint);
    assert.equal(view.icon, hinted.icon);
    assert.equal(view.locked, true);
    assert.equal(view.hint, null);
    assert.ok(!payload.includes(hinted.description));
  });

  it("usa una pista genérica si el logro no tiene hint", () => {
    const view = sanitizeAchievementForViewer(
      { ...hinted, hint: null },
      false,
      "PP",
    );
    assert.equal(view.description, HINT_ACHIEVEMENT_FALLBACK);
  });

  it("revela la descripción real al desbloquearlo", () => {
    const view = sanitizeAchievementForViewer(hinted, true, "COORDINADOR");
    assert.equal(view.description, hinted.description);
    assert.equal(view.locked, false);
  });
});

describe("logros públicos", () => {
  it("mantiene la información visible aunque estén bloqueados", () => {
    const view = sanitizeAchievementForViewer(publicAchievement, false, "PP");
    const payload = JSON.stringify(view);

    assert.equal(view.title, publicAchievement.title);
    assert.equal(view.description, publicAchievement.description);
    assert.equal(view.locked, true);
    assert.ok(payload.includes(publicAchievement.description));
  });
});

describe("rareza por valor numérico", () => {
  it("clasifica como Común hasta 15", () => {
    for (const points of [-5, 0, 10, 15]) {
      const rarity = getAchievementRarity(points);
      assert.equal(rarity.key, "COMMON", `points=${points}`);
      assert.equal(rarity.label, "Común");
      assert.equal(rarity.subtitle, "Huella de Sendero");
      assert.equal(rarity.defaultPoints, 10);
    }
  });

  it("clasifica como Poco Común entre 16 y 24", () => {
    for (const points of [16, 20, 24]) {
      const rarity = getAchievementRarity(points);
      assert.equal(rarity.key, "UNCOMMON", `points=${points}`);
      assert.equal(rarity.label, "Poco Común");
      assert.equal(rarity.subtitle, "Huella de Fogón");
      assert.equal(rarity.defaultPoints, 20);
    }
  });

  it("clasifica como Épico entre 25 y 34", () => {
    for (const points of [25, 30, 34]) {
      const rarity = getAchievementRarity(points);
      assert.equal(rarity.key, "EPIC", `points=${points}`);
      assert.equal(rarity.label, "Épico");
      assert.equal(rarity.subtitle, "Huella de Cumbre");
      assert.equal(rarity.defaultPoints, 30);
    }
  });

  it("clasifica como Legendario desde 35", () => {
    for (const points of [35, 50, 1000]) {
      const rarity = getAchievementRarity(points);
      assert.equal(rarity.key, "LEGENDARY", `points=${points}`);
      assert.equal(rarity.label, "Legendario");
      assert.equal(rarity.subtitle, "Reliquia de Lankuyen");
      assert.equal(rarity.defaultPoints, 50);
    }
  });

  it("ofrece las cuatro rarezas para el formulario de creación", () => {
    assert.deepEqual(
      RARITY_OPTIONS.map((rarity) => rarity.defaultPoints),
      [10, 20, 30, 50],
    );
  });
});

describe("rareza oculta de logros SECRET", () => {
  it("no filtra la rareza real a un joven bloqueado", () => {
    const view = sanitizeAchievementForViewer(secret, false, "PP");
    const payload = JSON.stringify(view);

    assert.equal(view.rarity.key, "HIDDEN");
    assert.equal(view.rarity.label, "???");
    assert.ok(!payload.includes("Legendario"));
    assert.ok(!payload.includes("Reliquia de Lankuyen"));
    assert.ok(!payload.includes("LEGENDARY"));
  });

  it("tampoco la filtra a un COORDINADOR bloqueado", () => {
    const view = sanitizeAchievementForViewer(secret, false, "COORDINADOR");
    assert.equal(view.rarity.key, "HIDDEN");
    assert.equal(view.rarity.label, "???");
  });

  it("revela la rareza al desbloquear o al mirar como AA", () => {
    const unlocked = sanitizeAchievementForViewer(secret, true, "PP");
    assert.equal(unlocked.rarity.key, "LEGENDARY");
    assert.equal(unlocked.rarity.label, "Legendario");

    const admin = sanitizeAchievementForViewer(secret, false, "AA");
    assert.equal(admin.rarity.key, "LEGENDARY");
  });
});

describe("permisos de eliminación de logros", () => {
  it("solo el AA puede gestionar el catálogo de logros", () => {
    assert.equal(can({ role: "AA" }, "achievement:manage"), true);
    assert.equal(can({ role: "PP" }, "achievement:manage"), false);
    assert.equal(can({ role: "COORDINADOR" }, "achievement:manage"), false);
    assert.equal(can(null, "achievement:manage"), false);
  });

  it("los jóvenes conservan la vista del catálogo", () => {
    assert.equal(can({ role: "PP" }, "achievement:view"), true);
    assert.equal(can({ role: "COORDINADOR" }, "achievement:view"), true);
  });
});

describe("directorio social sin AA", () => {
  it("solo considera roles juveniles", () => {
    assert.deepEqual([...SOCIAL_MEMBER_ROLES], ["PP", "COORDINADOR"]);
    assert.equal(isSocialMemberRole("PP"), true);
    assert.equal(isSocialMemberRole("COORDINADOR"), true);
    assert.equal(isSocialMemberRole("AA"), false);
  });

  it("filtra el listado por rol y actividad", () => {
    const where = buildMemberDirectoryWhere();

    assert.equal(where.isActive, true);
    assert.equal(where.deletedAt, null);
    assert.deepEqual(where.role, { in: ["PP", "COORDINADOR"] });
    assert.ok(!(where.role.in as string[]).includes("AA"));
    assert.equal(where.OR, undefined);
    assert.equal(where.communityId, undefined);
  });

  it("combina búsqueda y filtro de comunidad sin incluir AA", () => {
    const where = buildMemberDirectoryWhere({
      query: "  antonia ",
      communityId: "sin",
    });

    assert.equal(where.communityId, null);
    assert.deepEqual(where.role, { in: ["PP", "COORDINADOR"] });
    assert.equal(where.OR?.length, 3);
    assert.deepEqual(where.OR?.[0], {
      firstName: { contains: "antonia", mode: "insensitive" },
    });
  });

  it("respeta el filtro por comunidad específica", () => {
    const where = buildMemberDirectoryWhere({ communityId: "community-1" });
    assert.equal(where.communityId, "community-1");
  });
});
