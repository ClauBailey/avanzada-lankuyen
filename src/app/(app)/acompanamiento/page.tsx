import Link from "next/link";
import { ArrowLeft, Compass, TriangleAlert, UsersRound } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { aaLoadAdvisory, MAX_YOUTH_PER_AA } from "@/lib/community-rules";
import { getDisplayName } from "@/lib/user-display";
import { prisma } from "@/server/db";
import { requirePermission } from "@/server/auth/session";

export const metadata = {
  title: "Acompañamiento 1 a 1",
};

export default async function AcompanamientoPage() {
  const user = await requirePermission("mentoring:note");

  const students = await prisma.user.findMany({
    where: {
      assignedAaId: user.id,
      role: { in: ["PP", "COORDINADOR"] },
      isActive: true,
      deletedAt: null,
    },
    orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
    select: {
      id: true,
      firstName: true,
      lastName: true,
      preferredName: true,
      username: true,
      role: true,
      community: { select: { name: true, color: true } },
      _count: {
        select: {
          compassObjectives: true,
          compassReflections: true,
          mentoringNotesReceived: true,
        },
      },
    },
  });

  const advisory = aaLoadAdvisory(students.length);

  return (
    <div className="space-y-6">
      <Link
        href="/admin"
        className={buttonVariants({ variant: "ghost", size: "sm" })}
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Volver al tablero
      </Link>

      <PageHeader
        eyebrow="Acompañamiento privado 1 a 1"
        title="Mis jóvenes asignados"
        description="Aquí solo aparecen los jóvenes que tienes asignados. Puedes leer su Brújula en modo solo lectura y dejar notas de acompañamiento privadas o compartidas."
        actions={
          <Badge variant={students.length > MAX_YOUTH_PER_AA ? "warning" : "default"}>
            <UsersRound className="size-3.5" aria-hidden="true" />
            {students.length} de {MAX_YOUTH_PER_AA} recomendados
          </Badge>
        }
      />

      {advisory ? (
        <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3 text-sm text-amber-900">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <p className="text-xs leading-relaxed">{advisory}</p>
        </div>
      ) : null}

      {students.length === 0 ? (
        <Card className="border-dashed bg-surface/70 p-8 text-center">
          <Compass className="mx-auto size-8 text-anil-400" aria-hidden="true" />
          <p className="mt-3 font-display text-lg font-semibold text-ink">
            Todavía no tienes jóvenes asignados
          </p>
          <p className="mx-auto mt-1 max-w-md text-sm leading-relaxed text-ink-soft">
            Cuando la coordinación te asigne un Pionero/a o Coordinador/a, su
            Brújula aparecerá aquí. La lectura es siempre 1 a 1: no verás a
            jóvenes de otros AA.
          </p>
        </Card>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {students.map((student) => (
            <li key={student.id}>
              <Card className="flex h-full flex-col p-5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-display text-lg font-semibold text-ink">
                      {getDisplayName(student)}
                    </p>
                    <p className="text-[11px] text-ink-soft">
                      @{student.username}
                      {student.community
                        ? ` · ${student.community.name}`
                        : " · Sin comunidad"}
                    </p>
                  </div>
                  <Badge variant="outline">
                    {student.role === "COORDINADOR" ? "Coordinador/a" : "Pionero/a"}
                  </Badge>
                </div>

                <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-xl border border-line bg-canvas/40 px-2 py-2">
                    <dt className="text-[9px] font-semibold uppercase tracking-[0.1em] text-ink-soft">
                      Objetivos
                    </dt>
                    <dd className="mt-0.5 font-display text-lg font-semibold text-ink">
                      {student._count.compassObjectives}
                    </dd>
                  </div>
                  <div className="rounded-xl border border-line bg-canvas/40 px-2 py-2">
                    <dt className="text-[9px] font-semibold uppercase tracking-[0.1em] text-ink-soft">
                      Reflexiones
                    </dt>
                    <dd className="mt-0.5 font-display text-lg font-semibold text-ink">
                      {student._count.compassReflections}
                    </dd>
                  </div>
                  <div className="rounded-xl border border-line bg-canvas/40 px-2 py-2">
                    <dt className="text-[9px] font-semibold uppercase tracking-[0.1em] text-ink-soft">
                      Notas
                    </dt>
                    <dd className="mt-0.5 font-display text-lg font-semibold text-ink">
                      {student._count.mentoringNotesReceived}
                    </dd>
                  </div>
                </dl>

                <Link
                  href={`/acompanamiento/${student.id}`}
                  className={buttonVariants({
                    size: "sm",
                    className: "mt-4 w-fit",
                  })}
                >
                  <Compass className="size-4" aria-hidden="true" />
                  Abrir su Brújula
                </Link>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <p className="text-xs leading-relaxed text-ink-soft">
        El Manual recomienda acompañar como máximo a {MAX_YOUTH_PER_AA} jóvenes
        activos por AA. Es una orientación para sostener un vínculo cercano, no
        un bloqueo del sistema.
      </p>
    </div>
  );
}
