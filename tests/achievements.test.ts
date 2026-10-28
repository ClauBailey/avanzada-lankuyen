import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  HINT_ACHIEVEMENT_FALLBACK,
  SECRET_ACHIEVEMENT_DESCRIPTION,
  SECRET_ACHIEVEMENT_TITLE,
  sanitizeAchievementForViewer,
  type AchievementSource,
} from "../src/features/achievements/visibility.ts";

const secret: AchievementSource = {
  title: "El ritual del fuego",
  description:
    "Descubriste el ritual secreto que solo se comparte alrededor del fuego.",
  hint: "Busca la chispa donde nadie más mira.",
  icon: "Star",
  visibility: "SECRET",
};

const hinted: AchievementSource = {
  title: "Guardián del bosque",
  description:
    "Dejaste un lugar natural mejor de como lo encontraste y enseñaste a cuidarlo.",
  hint: "Observa lo que dejas atrás después de cada salida.",
  icon: "Leaf",
  visibility: "HINT",
};

const publicAchievement: AchievementSource = {
  title: "El primer fuego",
  description: "Encendiste el fuego de la Avanzada en un campamento.",
  hint: null,
  icon: "Flame",
  visibility: "PUBLIC",
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
