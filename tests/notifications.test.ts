import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  normalizeNotificationPage,
  NOTIFICATIONS_ORDER_BY,
  NOTIFICATIONS_PAGE_SIZE,
  notificationPageWindow,
  notificationTotalPages,
} from "../src/features/notifications/pagination.ts";

describe("orden de notificaciones", () => {
  it("ordena siempre por fecha descendente y desempata por id", () => {
    assert.deepEqual(NOTIFICATIONS_ORDER_BY, [
      { createdAt: "desc" },
      { id: "desc" },
    ]);
  });
});

describe("paginación de notificaciones", () => {
  it("usa páginas de 10 elementos", () => {
    assert.equal(NOTIFICATIONS_PAGE_SIZE, 10);
    assert.deepEqual(notificationPageWindow(1), {
      page: 1,
      skip: 0,
      take: 10,
    });
    assert.deepEqual(notificationPageWindow(2), {
      page: 2,
      skip: 10,
      take: 10,
    });
    assert.deepEqual(notificationPageWindow(7), {
      page: 7,
      skip: 60,
      take: 10,
    });
  });

  it("normaliza páginas inválidas a la primera página", () => {
    assert.equal(normalizeNotificationPage(undefined), 1);
    assert.equal(normalizeNotificationPage(""), 1);
    assert.equal(normalizeNotificationPage("abc"), 1);
    assert.equal(normalizeNotificationPage("0"), 1);
    assert.equal(normalizeNotificationPage("-4"), 1);
    assert.equal(normalizeNotificationPage("3"), 3);
    assert.equal(normalizeNotificationPage(["5", "6"]), 5);
  });

  it("calcula el total de páginas con mínimo de una", () => {
    assert.equal(notificationTotalPages(0), 1);
    assert.equal(notificationTotalPages(1), 1);
    assert.equal(notificationTotalPages(10), 1);
    assert.equal(notificationTotalPages(11), 2);
    assert.equal(notificationTotalPages(95), 10);
  });
});
