import "server-only";

import type { Prisma, Role } from "@/generated/prisma/client";
import { prisma } from "@/server/db";

interface AuditInput {
  actor: { id: string; role: Role };
  action: string;
  entityType: string;
  entityId?: string | null;
  before?: unknown;
  after?: unknown;
}

/**
 * Registra una acción sensible en `audit_logs`.
 *
 * Se llama dentro de la misma transacción que la mutación cuando es posible,
 * para que no existan cambios sin rastro.
 */
export async function recordAudit(
  input: AuditInput,
  tx?: Prisma.TransactionClient,
) {
  const client = tx ?? prisma;

  await client.auditLog.create({
    data: {
      actorId: input.actor.id,
      actorRole: input.actor.role,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId ?? null,
      before: toJson(input.before),
      after: toJson(input.after),
    },
  });
}

function toJson(value: unknown): Prisma.InputJsonValue | undefined {
  if (value === undefined) return undefined;
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}
