import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  evaluateSchedule,
  getIsoWeekKey,
  getZonedDateTimeParts,
} from "../src/lib/route-sheet-schedule.ts";

const SANTIAGO = "America/Santiago";

describe("guard horario del cron de hojas de ruta", () => {
  it("acepta miércoles a las 11:00 en horario de verano chileno", () => {
    // 28-10-2026 11:00 en Santiago (UTC-3) = 14:00 UTC.
    const result = evaluateSchedule(new Date("2026-10-28T14:00:00.000Z"), {
      timeZone: SANTIAGO,
      hour: 11,
    });

    assert.equal(result.weekday, 3);
    assert.equal(result.hour, 11);
    assert.equal(result.isScheduledDay, true);
    assert.equal(result.isScheduledHour, true);
    assert.equal(result.matchesSchedule, true);
    assert.equal(result.dateKey, "2026-10-28");
    assert.equal(result.timeKey, "11:00");
  });

  it("acepta la hora completa 11:00–11:59", () => {
    const result = evaluateSchedule(new Date("2026-10-28T14:59:00.000Z"), {
      timeZone: SANTIAGO,
      hour: 11,
    });

    assert.equal(result.matchesSchedule, true);
    assert.equal(result.timeKey, "11:59");
  });

  it("rechaza miércoles antes de las 11:00", () => {
    const result = evaluateSchedule(new Date("2026-10-28T13:59:00.000Z"), {
      timeZone: SANTIAGO,
      hour: 11,
    });

    assert.equal(result.isScheduledDay, true);
    assert.equal(result.isScheduledHour, false);
    assert.equal(result.matchesSchedule, false);
  });

  it("rechaza jueves a las 11:00", () => {
    const result = evaluateSchedule(new Date("2026-10-29T14:00:00.000Z"), {
      timeZone: SANTIAGO,
      hour: 11,
    });

    assert.equal(result.isScheduledDay, false);
    assert.equal(result.isScheduledHour, true);
    assert.equal(result.matchesSchedule, false);
  });

  it("respeta el horario de invierno chileno (UTC-4)", () => {
    // 03-06-2026 11:00 en Santiago (UTC-4) = 15:00 UTC.
    const result = evaluateSchedule(new Date("2026-06-03T15:00:00.000Z"), {
      timeZone: SANTIAGO,
      hour: 11,
    });

    assert.equal(result.weekday, 3);
    assert.equal(result.hour, 11);
    assert.equal(result.matchesSchedule, true);
  });

  it("calcula el día local correcto cerca de la medianoche UTC", () => {
    // 29-10-2026 02:00 UTC = 28-10-2026 23:00 en Santiago.
    const result = evaluateSchedule(new Date("2026-10-29T02:00:00.000Z"), {
      timeZone: SANTIAGO,
      hour: 23,
    });

    assert.equal(result.dateKey, "2026-10-28");
    assert.equal(result.weekday, 3);
    assert.equal(result.matchesSchedule, true);
  });
});

describe("clave semanal ISO", () => {
  it("genera 2026-W44 para la semana del 28 de octubre de 2026", () => {
    assert.equal(
      getIsoWeekKey(new Date("2026-10-28T14:00:00.000Z"), SANTIAGO),
      "2026-W44",
    );
  });

  it("mantiene la misma semana antes y después del cambio de día UTC", () => {
    const before = getIsoWeekKey(
      new Date("2026-10-27T02:00:00.000Z"),
      SANTIAGO,
    );
    const after = getIsoWeekKey(
      new Date("2026-10-28T02:00:00.000Z"),
      SANTIAGO,
    );

    assert.equal(before, "2026-W44");
    assert.equal(after, "2026-W44");
  });

  it("usa el año ISO en la transición de diciembre a enero", () => {
    // 01-01-2027 es viernes: pertenece a la semana ISO 53 de 2026.
    const parts = getZonedDateTimeParts(
      new Date("2027-01-01T15:00:00.000Z"),
      SANTIAGO,
    );

    assert.equal(parts.dateKey, "2027-01-01");
    assert.equal(
      getIsoWeekKey(new Date("2027-01-01T15:00:00.000Z"), SANTIAGO),
      "2026-W53",
    );
  });
});
