import Link from "next/link";
import {
  ArrowUpRight,
  BookOpen,
  CheckCircle2,
  Clock3,
  Feather,
  ShieldCheck,
  Users,
} from "lucide-react";

import { LogbookDeleteButton } from "@/components/logbook/logbook-delete-button";
import {
  LogbookKeeperButton,
  LogbookKeeperHint,
} from "@/components/logbook/logbook-keeper-button";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatDateOnly, formatTimestamp } from "@/lib/dates";
import { logbookStatusLabel } from "@/lib/logbook";
import { prisma } from "@/server/db";
import { requirePermission } from "@/server/auth/session";

export const metadata = {
  title: "La Bitácora · Panel AA",
};

export default async function AdminBitacoraPage() {
  await requirePermission("logbook:manage");

  const [entries, keeperCandidates, publishedCount, pendingCount] =
    await Promise.all([
      prisma.logbookEntry.findMany({
        where: { deletedAt: null },
        orderBy: [
          { status: "asc" },
          { pageNumber: "asc" },
          { createdAt: "desc" },
        ],
        take: 80,
        select: {
          id: true,
          title: true,
          status: true,
          pageNumber: true,
          adventureDate: true,
          createdAt: true,
          photoFileId: true,
          rejectionReason: true,
          author: {
            select: {
              firstName: true,
              lastName: true,
              username: true,
              community: { select: { name: true } },
            },
          },
        },
      }),
      prisma.user.findMany({
        where: {
          deletedAt: null,
          isActive: true,
          role: { in: ["PP", "COORDINADOR"] },
        },
        orderBy: [{ isLogbookKeeper: "desc" }, { firstName: "asc" }],
        select: {
          id: true,
          firstName: true,
          lastName: true,
          username: true,
          role: true,
          isLogbookKeeper: true,
          community: { select: { name: true } },
        },
      }),
      prisma.logbookEntry.count({
        where: { status: "PUBLICADA", deletedAt: null },
      }),
      prisma.logbookEntry.count({
        where: { status: "PENDIENTE_APROBACION", deletedAt: null },
      }),
    ]);

  const keeper = keeperCandidates.find((candidate) => candidate.isLogbookKeeper);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Administración"
        title="La Bitácora"
        description="Gestiona el libro de la unidad: asigna al Guardián, revisa las páginas pendientes y retira del libro las publicaciones que lo necesiten."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/bitacora"
              className={buttonVariants({ variant: "secondary", size: "sm" })}
            >
              <BookOpen className="size-4" aria-hidden="true" />
              Abrir el libro
            </Link>
            <Link
              href="/bitacora/revision"
              className={buttonVariants({ variant: "primary", size: "sm" })}
            >
              <ShieldCheck className="size-4" aria-hidden="true" />
              Bandeja de revisión
            </Link>
          </div>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="p-4">
          <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-soft">
            <Feather className="size-3.5 text-gold" aria-hidden="true" />
            Páginas publicadas
          </p>
          <p className="mt-1 font-display text-3xl font-semibold text-ink">
            {publishedCount}
          </p>
        </Card>
        <Card className="p-4">
          <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-soft">
            <Clock3 className="size-3.5 text-amber-600" aria-hidden="true" />
            Pendientes de revisión
          </p>
          <p className="mt-1 font-display text-3xl font-semibold text-ink">
            {pendingCount}
          </p>
        </Card>
        <Card className="p-4">
          <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-soft">
            <ShieldCheck className="size-3.5 text-anil-700" aria-hidden="true" />
            Guardián actual
          </p>
          <p className="mt-1 font-display text-lg font-semibold leading-tight text-ink">
            {keeper ? `${keeper.firstName} ${keeper.lastName}` : "Cargo vacante"}
          </p>
          {keeper?.community ? (
            <p className="text-[11px] text-ink-soft">{keeper.community.name}</p>
          ) : null}
        </Card>
      </div>

      <Card className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-semibold text-ink">
              Guardián de La Bitácora
            </h2>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-ink-soft">
              Elige a un Pionero/a o Coordinador/a para cuidar el libro. Suma la
              moderación de La Bitácora a su rol, sin reemplazarlo.
            </p>
            <LogbookKeeperHint />
          </div>
          <Badge variant="gold">
            <Users className="size-3" aria-hidden="true" />
            {keeperCandidates.length} candidato
            {keeperCandidates.length === 1 ? "" : "s"}
          </Badge>
        </div>

        {keeperCandidates.length === 0 ? (
          <p className="mt-4 rounded-xl border border-dashed border-line bg-canvas/40 p-4 text-sm text-ink-soft">
            No hay Pioneros/as o Coordinadores/as activos para asignar.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-line/70">
            {keeperCandidates.map((candidate) => (
              <li
                key={candidate.id}
                className="flex flex-wrap items-center justify-between gap-3 py-3"
              >
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2 font-semibold text-ink">
                    {candidate.firstName} {candidate.lastName}
                    {candidate.isLogbookKeeper ? (
                      <Badge variant="gold">
                        <BookOpen className="size-3" aria-hidden="true" />
                        Guardián
                      </Badge>
                    ) : null}
                  </p>
                  <p className="text-[11px] text-ink-soft">
                    @{candidate.username} · {candidate.role === "PP" ? "Pionero/a" : "Coordinador/a"}
                    {candidate.community ? ` · ${candidate.community.name}` : ""}
                  </p>
                </div>
                <LogbookKeeperButton
                  userId={candidate.id}
                  fullName={`${candidate.firstName} ${candidate.lastName}`}
                  isKeeper={candidate.isLogbookKeeper}
                />
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line/70 px-5 py-3.5">
          <h2 className="font-display text-lg font-semibold text-ink">
            Últimas páginas del libro
          </h2>
          <p className="text-[11px] text-ink-soft">
            {entries.length} página{entries.length === 1 ? "" : "s"} en total
          </p>
        </div>

        {entries.length === 0 ? (
          <p className="p-8 text-center text-sm text-ink-soft">
            La Bitácora todavía está en blanco.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead>
                <tr className="border-b border-line/70 bg-canvas/60 text-[10px] uppercase tracking-[0.14em] text-ink-soft">
                  <th scope="col" className="px-5 py-2.5 font-semibold">
                    Página
                  </th>
                  <th scope="col" className="px-3 py-2.5 font-semibold">
                    Autor/a
                  </th>
                  <th scope="col" className="px-3 py-2.5 font-semibold">
                    Estado
                  </th>
                  <th scope="col" className="px-3 py-2.5 font-semibold">
                    Enviada
                  </th>
                  <th scope="col" className="px-5 py-2.5 font-semibold">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/60">
                {entries.map((entry) => (
                  <tr key={entry.id} className="align-top hover:bg-canvas/40">
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-ink">{entry.title}</p>
                      <p className="text-[11px] text-ink-soft">
                        {entry.pageNumber
                          ? `Página ${entry.pageNumber} · `
                          : ""}
                        {formatDateOnly(entry.adventureDate)}
                      </p>
                      {entry.rejectionReason ? (
                        <p className="mt-1 max-w-sm text-[11px] leading-relaxed text-red-700">
                          Motivo: {entry.rejectionReason}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-3 py-3.5">
                      <p className="text-ink">
                        {entry.author.firstName} {entry.author.lastName}
                      </p>
                      <p className="text-[11px] text-ink-soft">
                        @{entry.author.username}
                        {entry.author.community
                          ? ` · ${entry.author.community.name}`
                          : ""}
                      </p>
                    </td>
                    <td className="px-3 py-3.5">
                      <Badge
                        variant={
                          entry.status === "PUBLICADA"
                            ? "success"
                            : entry.status === "RECHAZADA"
                              ? "danger"
                              : "warning"
                        }
                      >
                        {entry.status === "PUBLICADA" ? (
                          <CheckCircle2 className="size-3" aria-hidden="true" />
                        ) : (
                          <Clock3 className="size-3" aria-hidden="true" />
                        )}
                        {logbookStatusLabel(entry.status)}
                      </Badge>
                    </td>
                    <td className="px-3 py-3.5 text-[11px] text-ink-soft">
                      {formatTimestamp(entry.createdAt)}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {entry.status === "PENDIENTE_APROBACION" ? (
                          <Link
                            href="/bitacora/revision"
                            className={buttonVariants({
                              variant: "secondary",
                              size: "sm",
                            })}
                          >
                            Revisar
                            <ArrowUpRight className="size-3.5" aria-hidden="true" />
                          </Link>
                        ) : null}
                        <LogbookDeleteButton
                          entryId={entry.id}
                          title={entry.title}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <p className="text-xs leading-relaxed text-ink-soft">
        Retirar una página la oculta del libro sin borrar el registro de
        auditoría. Las fotografías de páginas publicadas siguen el acceso del
        libro; las pendientes y rechazadas solo las ven su autor, los AA y el
        Guardián.
      </p>
    </div>
  );
}
