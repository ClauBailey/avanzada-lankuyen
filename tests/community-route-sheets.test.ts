import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  canUploadRouteSheet,
  communityRouteSheetStatus,
  groupRouteSheetsByCommunity,
  latestRouteSheetForCommunity,
  resolveRouteSheetCommunityId,
} from "../src/features/route-sheets/rules.ts";
import {
  MOBILE_BOTTOM_BAR_ITEMS,
  adminNav,
  memberNav,
  mobileMoreGroups,
  mobilePrimaryNav,
  visibleNavItems,
} from "../src/lib/navigation.ts";

/**
 * v2.2 · Hojas de Ruta multi-comunidad.
 *
 * Invariante: una actividad con alcance COMUNIDAD tiene un hilo independiente
 * por Comunidad. Ninguna Comunidad puede sobrescribir ni versionar el hilo de
 * otra, y las notificaciones de revisión quedan acotadas a esa Comunidad.
 */
describe("RF-HDR v2.2 · hilos de hoja de ruta por Comunidad", () => {
  const COMMUNITY_A = "11111111-1111-4111-8111-111111111111";
  const COMMUNITY_B = "22222222-2222-4222-8222-222222222222";

  it("las actividades de Avanzada mantienen un único hilo general", () => {
    const result = resolveRouteSheetCommunityId({
      activityScope: "AVANZADA",
      actorRole: "COORDINADOR",
      actorCommunityId: COMMUNITY_A,
      requestedCommunityId: COMMUNITY_B,
    });

    assert.deepEqual(result, { communityId: null });
  });

  it("un joven queda siempre en el hilo de su propia Comunidad", () => {
    const result = resolveRouteSheetCommunityId({
      activityScope: "COMUNIDAD",
      actorRole: "PP",
      actorCommunityId: COMMUNITY_A,
      requestedCommunityId: COMMUNITY_B,
    });

    assert.deepEqual(result, { communityId: COMMUNITY_A });
  });

  it("el AA debe elegir la Comunidad y puede revisar cualquiera", () => {
    const withoutSelection = resolveRouteSheetCommunityId({
      activityScope: "COMUNIDAD",
      actorRole: "AA",
      actorCommunityId: null,
      requestedCommunityId: null,
    });
    assert.equal("error" in withoutSelection, true);

    const withSelection = resolveRouteSheetCommunityId({
      activityScope: "COMUNIDAD",
      actorRole: "AA",
      actorCommunityId: null,
      requestedCommunityId: COMMUNITY_B,
    });
    assert.deepEqual(withSelection, { communityId: COMMUNITY_B });
  });

  it("un joven sin Comunidad no puede subir una hoja de Comunidad", () => {
    const result = resolveRouteSheetCommunityId({
      activityScope: "COMUNIDAD",
      actorRole: "PP",
      actorCommunityId: null,
      requestedCommunityId: COMMUNITY_B,
    });

    assert.equal("error" in result, true);
  });

  it("la coordinación y los encargados de A no escriben el hilo de B", () => {
    const base = {
      actorRole: "COORDINADOR",
      actorCommunityId: COMMUNITY_A,
      activityScope: "COMUNIDAD",
      isLeader: false,
      isOrganizingCoordinator: false,
      isProjectResponsible: false,
      allowAnyPpUpload: false,
    };

    assert.equal(
      canUploadRouteSheet({ ...base, targetCommunityId: COMMUNITY_A }),
      true,
    );
    assert.equal(
      canUploadRouteSheet({ ...base, targetCommunityId: COMMUNITY_B }),
      false,
    );

    const leaderOfA = {
      ...base,
      actorRole: "PP",
      isLeader: true,
    };
    assert.equal(
      canUploadRouteSheet({
        ...leaderOfA,
        targetCommunityId: COMMUNITY_A,
      }),
      true,
    );
    assert.equal(
      canUploadRouteSheet({
        ...leaderOfA,
        targetCommunityId: COMMUNITY_B,
      }),
      false,
    );
  });

  it("un PP de A solo sube con allowAnyUpload o como encargado", () => {
    const base = {
      actorRole: "PP",
      actorCommunityId: COMMUNITY_A,
      targetCommunityId: COMMUNITY_A,
      activityScope: "COMUNIDAD",
      isLeader: false,
      isOrganizingCoordinator: false,
      isProjectResponsible: false,
    };

    assert.equal(
      canUploadRouteSheet({ ...base, allowAnyPpUpload: false }),
      false,
    );
    assert.equal(
      canUploadRouteSheet({ ...base, allowAnyPpUpload: true }),
      true,
    );
  });

  it("el AA puede subir a cualquier Comunidad", () => {
    assert.equal(
      canUploadRouteSheet({
        actorRole: "AA",
        actorCommunityId: null,
        targetCommunityId: COMMUNITY_B,
        activityScope: "COMUNIDAD",
        isLeader: false,
        isOrganizingCoordinator: false,
        isProjectResponsible: false,
        allowAnyPpUpload: false,
      }),
      true,
    );
  });

  it("cada Comunidad conserva su propia versión y estado", () => {
    const sheets = [
      { communityId: COMMUNITY_A, version: 1, status: "RECHAZADA" },
      { communityId: COMMUNITY_A, version: 2, status: "PENDIENTE_AUTORIZACION" },
      { communityId: COMMUNITY_B, version: 1, status: "APROBADA" },
    ];

    const latestA = latestRouteSheetForCommunity(sheets, COMMUNITY_A);
    const latestB = latestRouteSheetForCommunity(sheets, COMMUNITY_B);

    assert.equal(latestA?.version, 2);
    assert.equal(latestA?.status, "PENDIENTE_AUTORIZACION");
    assert.equal(latestB?.version, 1);
    assert.equal(latestB?.status, "APROBADA");

    assert.equal(communityRouteSheetStatus(latestA).label, "Pendiente de revisión");
    assert.equal(communityRouteSheetStatus(latestB).label, "Aprobada");
    assert.equal(communityRouteSheetStatus(null).label, "Sin entregar");

    const grouped = groupRouteSheetsByCommunity(sheets);
    assert.equal(grouped.get(COMMUNITY_A)?.length, 2);
    assert.equal(grouped.get(COMMUNITY_B)?.length, 1);
    assert.equal(grouped.get("GENERAL"), undefined);
  });
});

/**
 * v2.2 · navegación móvil y filtrado por rol.
 */
describe("navegación móvil v2.2 · 4 accesos + Más", () => {
  it("usa exactamente cinco columnas en la barra inferior", () => {
    assert.equal(MOBILE_BOTTOM_BAR_ITEMS, 5);
    assert.equal(mobilePrimaryNav("AA").length, 4);
    assert.equal(mobilePrimaryNav("PP").length, 4);
    assert.equal(mobilePrimaryNav("COORDINADOR").length, 4);
  });

  it("el AA ve Inicio, Acompañar, Calendario y Rutas", () => {
    assert.deepEqual(
      mobilePrimaryNav("AA").map((item) => item.label),
      ["Inicio", "Acompañar", "Calendario", "Rutas"],
    );
    assert.deepEqual(
      mobilePrimaryNav("AA").map((item) => item.href),
      ["/inicio", "/acompanamiento", "/calendario", "/admin/hojas-de-ruta"],
    );
  });

  it("los jóvenes ven Inicio, Brújula, Calendario y Comunidad", () => {
    assert.deepEqual(
      mobilePrimaryNav("PP").map((item) => item.label),
      ["Inicio", "Brújula", "Calendario", "Comunidad"],
    );
    assert.deepEqual(
      mobilePrimaryNav("COORDINADOR").map((item) => item.href),
      ["/inicio", "/brujula", "/calendario", "/mi-comunidad"],
    );
  });

  it("el AA no recibe enlaces juveniles en el menú", () => {
    const aaItems = visibleNavItems(memberNav, {
      role: "AA",
      variant: "member",
      hasCommunity: false,
    });

    for (const href of [
      "/brujula",
      "/camino",
      "/mi-comunidad",
      "/mi-comunidad/bitacora",
    ]) {
      assert.equal(
        aaItems.some((item) => item.href === href),
        false,
        `el AA no debe ver ${href}`,
      );
    }

    assert.equal(
      aaItems.some((item) => item.href === "/acompanamiento"),
      true,
    );
  });

  it("un joven sí recibe Brújula, Camino y su Comunidad", () => {
    const youthItems = visibleNavItems(memberNav, {
      role: "PP",
      variant: "member",
      hasCommunity: true,
    });

    for (const href of ["/brujula", "/camino", "/mi-comunidad"]) {
      assert.equal(
        youthItems.some((item) => item.href === href),
        true,
        `el joven debe ver ${href}`,
      );
    }

    assert.equal(
      youthItems.some((item) => item.href === "/acompanamiento"),
      false,
    );
  });

  it("el cajón Más no duplica la barra inferior ni ofrece rutas juveniles al AA", () => {
    const groups = mobileMoreGroups({
      role: "AA",
      variant: "member",
      hasCommunity: false,
    });
    const hrefs = groups.flatMap((group) => group.items.map((item) => item.href));
    const primary = mobilePrimaryNav("AA").map((item) => item.href);

    for (const href of primary) {
      assert.equal(hrefs.includes(href), false);
    }

    for (const href of [
      "/brujula",
      "/camino",
      "/mi-comunidad",
      "/mi-comunidad/bitacora",
    ]) {
      assert.equal(hrefs.includes(href), false);
    }

    assert.equal(hrefs.includes("/admin/usuarios"), true);
    assert.equal(hrefs.includes("/admin/objetivos"), true);
  });

  it("el cajón Más de los jóvenes incluye Camino y Perfil", () => {
    const groups = mobileMoreGroups({
      role: "COORDINADOR",
      variant: "member",
      hasCommunity: true,
    });
    const hrefs = groups.flatMap((group) => group.items.map((item) => item.href));

    assert.equal(hrefs.includes("/camino"), true);
    assert.equal(hrefs.includes("/perfil"), true);
    assert.equal(hrefs.includes("/admin/usuarios"), false);
  });

  it("la coordinación no recibe el panel administrativo completo", () => {
    const coordinatorAdmin = visibleNavItems(adminNav, {
      role: "COORDINADOR",
      variant: "admin",
      hasCommunity: true,
    });
    const hrefs = coordinatorAdmin.map((item) => item.href);

    assert.deepEqual(hrefs.sort(), [
      "/admin/red-de-apoyo",
      "/ciclo",
      "/inicio",
      "/proyectos",
    ]);
  });
});
