import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  AccountDeletionError,
  assertCanDeleteAccount,
} from "../src/features/users/delete-account.ts";

const aa = { id: "aa-1", role: "AA" as const };
const pp = { id: "pp-1", role: "PP" as const };

describe("permisos de eliminación de cuentas", () => {
  it("bloquea a cualquier usuario que no sea AA con 403", () => {
    assert.throws(
      () => assertCanDeleteAccount(pp, pp, 2),
      (error: unknown) =>
        error instanceof AccountDeletionError &&
        error.statusCode === 403 &&
        /permiso/i.test(error.message),
    );
  });

  it("bloquea que un AA elimine su propia cuenta", () => {
    assert.throws(
      () => assertCanDeleteAccount(aa, aa, 3),
      (error: unknown) =>
        error instanceof AccountDeletionError &&
        error.statusCode === 400 &&
        /propia cuenta/i.test(error.message),
    );
  });

  it("impide dejar la plataforma sin otro AA activo", () => {
    const otherAa = { id: "aa-2", role: "AA" as const };

    assert.throws(
      () => assertCanDeleteAccount(aa, otherAa, 1),
      (error: unknown) =>
        error instanceof AccountDeletionError &&
        error.statusCode === 409 &&
        /Adulto Acompañante/i.test(error.message),
    );
  });

  it("bloquea también si el conteo activo es cero", () => {
    const otherAa = { id: "aa-2", role: "AA" as const };
    assert.throws(() => assertCanDeleteAccount(aa, otherAa, 0));
  });

  it("permite borrar a otro AA cuando queda al menos uno activo", () => {
    const otherAa = { id: "aa-2", role: "AA" as const };
    assert.doesNotThrow(() => assertCanDeleteAccount(aa, otherAa, 2));
  });

  it("permite borrar a un PP desde una sesión AA", () => {
    assert.doesNotThrow(() => assertCanDeleteAccount(aa, pp, 1));
  });

  it("permite borrar un AA ya desactivado aunque no quede otro activo", () => {
    const inactiveAa = { id: "aa-3", role: "AA" as const, isActive: false };
    assert.doesNotThrow(() => assertCanDeleteAccount(aa, inactiveAa, 1));
  });
});
