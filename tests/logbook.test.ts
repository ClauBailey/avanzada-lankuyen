import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  badgeShareFilename,
  badgeShareMotto,
  formatLogbookPage,
  isAllowedLogbookPhotoMime,
  LOGBOOK_PHOTO_MAX_BYTES,
  logbookPhotoExtension,
  logbookStatusLabel,
  nextPublishedPageNumber,
} from "../src/lib/logbook.ts";
import {
  createLogbookEntrySchema,
  reviewLogbookEntrySchema,
  setLogbookKeeperSchema,
} from "../src/features/logbook/schemas.ts";
import { can } from "../src/server/rbac/can.ts";
import { permissionsFor } from "../src/server/rbac/permissions.ts";

const validEntry = {
  title: "La noche bajo las estrellas",
  adventureDate: "2026-10-24",
  contentMd:
    "Caminamos hasta el claro y armamos el campamento mientras caía la tarde. La unidad compartió historias alrededor del fuego.",
};

describe("permisos de La Bitácora", () => {
  it("PP y COORDINADOR pueden ver y proponer páginas", () => {
    for (const role of ["PP", "COORDINADOR"] as const) {
      assert.equal(permissionsFor(role).has("logbook:view"), true);
      assert.equal(permissionsFor(role).has("logbook:create"), true);
      assert.equal(permissionsFor(role).has("logbook:review"), false);
      assert.equal(permissionsFor(role).has("logbook:manage"), false);
    }
  });

  it("AA conserva la moderación y administración completa", () => {
    for (const permission of [
      "logbook:view",
      "logbook:create",
      "logbook:review",
      "logbook:manage",
    ] as const) {
      assert.equal(permissionsFor("AA").has(permission), true);
    }
  });

  it("el cargo de Guardián habilita moderar sin reemplazar el rol base", () => {
    assert.equal(can({ role: "PP" }, "logbook:review"), false);
    assert.equal(
      can({ role: "PP", isLogbookKeeper: true }, "logbook:review"),
      true,
    );
    assert.equal(
      can({ role: "COORDINADOR", isLogbookKeeper: true }, "logbook:review"),
      true,
    );
  });

  it("el Guardián no obtiene permisos de administración ni gestión del libro", () => {
    const keeper = { role: "PP", isLogbookKeeper: true } as const;
    assert.equal(can(keeper, "logbook:manage"), false);
    assert.equal(can(keeper, "admin:access"), false);
    assert.equal(can(keeper, "user:manage"), false);
    assert.equal(can(keeper, "logbook:create"), true);
  });

  it("sin sesión no hay permisos de bitácora", () => {
    assert.equal(can(null, "logbook:view"), false);
    assert.equal(can(undefined, "logbook:review"), false);
  });
});

describe("validación de páginas de La Bitácora", () => {
  it("acepta una página completa y normaliza los espacios del título", () => {
    const parsed = createLogbookEntrySchema.safeParse({
      ...validEntry,
      title: "  La noche bajo las estrellas  ",
    });
    assert.equal(parsed.success, true);
    if (parsed.success) {
      assert.equal(parsed.data.title, "La noche bajo las estrellas");
      assert.equal(parsed.data.adventureDate, "2026-10-24");
    }
  });

  it("acepta una actividad opcional vacía", () => {
    const parsed = createLogbookEntrySchema.safeParse({
      ...validEntry,
      activityId: "",
    });
    assert.equal(parsed.success, true);
  });

  it("rechaza títulos demasiado cortos", () => {
    const parsed = createLogbookEntrySchema.safeParse({
      ...validEntry,
      title: "Oy",
    });
    assert.equal(parsed.success, false);
  });

  it("rechaza un relato demasiado breve", () => {
    const parsed = createLogbookEntrySchema.safeParse({
      ...validEntry,
      contentMd: "Fue bonito.",
    });
    assert.equal(parsed.success, false);
  });

  it("rechaza fechas que no existen o tienen otro formato", () => {
    for (const adventureDate of ["2026-02-31", "24-10-2026", ""]) {
      const parsed = createLogbookEntrySchema.safeParse({
        ...validEntry,
        adventureDate,
      });
      assert.equal(parsed.success, false, adventureDate);
    }
  });

  it("rechaza un identificador de actividad que no es UUID", () => {
    const parsed = createLogbookEntrySchema.safeParse({
      ...validEntry,
      activityId: "actividad-1",
    });
    assert.equal(parsed.success, false);
  });

  it("solo acepta publicar de inmediato con los valores del formulario", () => {
    for (const publishNow of ["on", "off", undefined]) {
      const parsed = createLogbookEntrySchema.safeParse({
        ...validEntry,
        publishNow,
      });
      assert.equal(parsed.success, true, String(publishNow));
    }

    assert.equal(
      createLogbookEntrySchema.safeParse({
        ...validEntry,
        publishNow: "true",
      }).success,
      false,
    );
  });
});

describe("moderación y cargo de Guardián", () => {
  it("aprobar no exige motivo de rechazo", () => {
    const parsed = reviewLogbookEntrySchema.safeParse({
      entryId: "6c1f4a2f-23d8-4e11-bf6c-2f6c9a4f9e21",
      decision: "approve",
    });
    assert.equal(parsed.success, true);
  });

  it("rechazar exige un motivo de al menos 5 caracteres", () => {
    const base = {
      entryId: "6c1f4a2f-23d8-4e11-bf6c-2f6c9a4f9e21",
      decision: "reject" as const,
    };

    assert.equal(
      reviewLogbookEntrySchema.safeParse({ ...base, rejectionReason: "mal" })
        .success,
      false,
    );
    assert.equal(
      reviewLogbookEntrySchema.safeParse({
        ...base,
        rejectionReason: "Falta la fecha de la actividad.",
      }).success,
      true,
    );
  });

  it("valida la asignación del cargo de Guardián", () => {
    const userId = "6c1f4a2f-23d8-4e11-bf6c-2f6c9a4f9e21";

    assert.equal(
      setLogbookKeeperSchema.safeParse({ userId, isKeeper: "true" }).success,
      true,
    );
    assert.equal(
      setLogbookKeeperSchema.safeParse({ userId, isKeeper: "false" }).success,
      true,
    );
    assert.equal(
      setLogbookKeeperSchema.safeParse({ userId, isKeeper: "quizás" }).success,
      false,
    );
    assert.equal(
      setLogbookKeeperSchema.safeParse({ userId: "abc", isKeeper: "true" })
        .success,
      false,
    );
  });
});

describe("fotografías de La Bitácora", () => {
  it("acepta solo JPG, PNG y WEBP", () => {
    assert.equal(isAllowedLogbookPhotoMime("image/jpeg"), true);
    assert.equal(isAllowedLogbookPhotoMime("image/png"), true);
    assert.equal(isAllowedLogbookPhotoMime("image/webp"), true);
    assert.equal(isAllowedLogbookPhotoMime("image/gif"), false);
    assert.equal(isAllowedLogbookPhotoMime("application/pdf"), false);
  });

  it("mantiene el máximo estricto de 1.5 MB", () => {
    assert.equal(LOGBOOK_PHOTO_MAX_BYTES, 1_572_864);
    assert.ok(LOGBOOK_PHOTO_MAX_BYTES <= 1_572_864);
  });

  it("conserva la extensión segura o la deduce desde el MIME", () => {
    assert.equal(logbookPhotoExtension("foto.JPG", "image/jpeg"), ".jpg");
    assert.equal(logbookPhotoExtension("recuerdo.webp", "image/webp"), ".webp");
    assert.equal(logbookPhotoExtension("sin-extension", "image/png"), ".png");
    assert.equal(logbookPhotoExtension("raro.gif", "image/gif"), "");
  });
});

describe("numeración y textos de La Bitácora", () => {
  it("asigna el correlativo siguiente al máximo publicado", () => {
    assert.equal(nextPublishedPageNumber([]), 1);
    assert.equal(nextPublishedPageNumber([null]), 1);
    assert.equal(nextPublishedPageNumber([1, 3, 2]), 4);
    assert.equal(nextPublishedPageNumber([null, 7]), 8);
  });

  it("etiqueta estados y páginas sin numerar", () => {
    assert.equal(logbookStatusLabel("PUBLICADA"), "Publicada");
    assert.equal(logbookStatusLabel("RECHAZADA"), "Rechazada");
    assert.equal(logbookStatusLabel("PENDIENTE_APROBACION"), "Pendiente de aprobación");
    assert.equal(formatLogbookPage(4), "Página 4");
    assert.equal(formatLogbookPage(null), "Sin numerar");
  });

  it("genera el nombre de archivo insignia-[slug]-[username].png", () => {
    assert.equal(
      badgeShareFilename("Etapa Sendero", "pp.prueba"),
      "insignia-etapa-sendero-pp-prueba.png",
    );
    assert.equal(
      badgeShareFilename("¡Promesa!", "Pionero_01"),
      "insignia-promesa-pionero-01.png",
    );
  });

  it("usa un lema coherente cuando el AA no dejó dedicatoria", () => {
    assert.match(badgeShareMotto("ETAPA_SENDERO", "ETAPA"), /sendero/i);
    assert.match(badgeShareMotto("ETAPA_CUMBRE", "ETAPA"), /cumbre/i);
    assert.match(badgeShareMotto("COMP_APRENDER", "COMPETENCIA"), /juntos/i);
  });
});
