import Link from "next/link";
import { Handshake, Phone, ShieldCheck, UsersRound } from "lucide-react";

import {
  SupportContactForm,
  SupportContactToggle,
} from "@/components/projects/support-network-forms";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  COMPETENCY_AREA_OPTIONS,
  competencyAreaLabel,
  type CompetencyAreaKey,
} from "@/features/projects/rules";
import { prisma } from "@/server/db";
import { requirePermission } from "@/server/auth/session";
import { can } from "@/server/rbac/can";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Red de Apoyo · Panel",
};

function isAreaKey(value: string): value is CompetencyAreaKey {
  return COMPETENCY_AREA_OPTIONS.some((area) => area.key === value);
}

export default async function AdminRedDeApoyoPage({
  searchParams,
}: {
  searchParams: Promise<{ area?: string }>;
}) {
  const user = await requirePermission("support_network:view");
  const canManage = can(user, "support_network:manage");
  const { area: areaParam } = await searchParams;
  const selectedArea = areaParam && isAreaKey(areaParam) ? areaParam : null;

  const contacts = await prisma.supportNetworkContact.findMany({
    orderBy: [{ isActive: "desc" }, { fullName: "asc" }],
    select: {
      id: true,
      fullName: true,
      relationshipOrRole: true,
      organization: true,
      contactInfo: true,
      supportedAreas: true,
      collaborationNotes: true,
      isActive: true,
      updatedAt: true,
      members: {
        where: { project: { workGroupStatus: "ACTIVO" } },
        select: {
          project: { select: { id: true, title: true } },
        },
      },
    },
  });

  const filtered = selectedArea
    ? contacts.filter((contact) =>
        contact.supportedAreas.includes(selectedArea),
      )
    : contacts;

  const activeCount = contacts.filter((contact) => contact.isActive).length;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Panel de coordinación"
        title="Red de Apoyo"
        description="Directorio de colaboradores confiables de la Avanzada: personas y organizaciones que pueden acompañar proyectos, talleres y salidas. El Equipo Adulto edita el directorio; la Reunión de Coordinadores puede consultarlo."
        actions={
          <Badge variant="outline">
            {activeCount} de {contacts.length} activos
          </Badge>
        }
      />

      <Card className="border-anil-200 bg-anil-50/40 p-5">
        <p className="flex items-center gap-2 text-sm font-semibold text-ink">
          <ShieldCheck className="size-4 text-anil-700" aria-hidden="true" />
          {canManage
            ? "Como Equipo Adulto, puedes crear, editar y archivar contactos."
            : "Como coordinación, puedes consultar el directorio y sumar monitores a los Grupos de Trabajo."}
        </p>
        <p className="mt-2 text-xs leading-relaxed text-ink-soft">
          El contacto directo solo es visible para el Equipo Adulto y la Reunión
          de Coordinadores. Un contacto activo puede integrarse como monitor en
          un Grupo de Trabajo.
        </p>
      </Card>

      <nav
        aria-label="Filtrar por área de competencia"
        className="no-scrollbar flex flex-nowrap gap-2 overflow-x-auto pb-1"
      >
        <Link
          href="/admin/red-de-apoyo"
          className={cn(
            buttonVariants({
              variant: selectedArea ? "ghost" : "secondary",
              size: "sm",
            }),
          )}
        >
          Todas las áreas
        </Link>
        {COMPETENCY_AREA_OPTIONS.map((area) => (
          <Link
            key={area.key}
            href={`/admin/red-de-apoyo?area=${area.key}`}
            className={cn(
              buttonVariants({
                variant: selectedArea === area.key ? "secondary" : "ghost",
                size: "sm",
              }),
            )}
          >
            {area.label}
          </Link>
        ))}
      </nav>

      {canManage ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Handshake className="size-5 text-anil-700" aria-hidden="true" />
              Sumar un contacto a la Red de Apoyo
            </CardTitle>
            <CardDescription>
              Registra el vínculo, las áreas en que puede apoyar y el historial
              de colaboración con la Avanzada.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SupportContactForm />
          </CardContent>
        </Card>
      ) : null}

      {filtered.length === 0 ? (
        <EmptyState
          icon={Handshake}
          title="No hay contactos en esta área"
          description="Prueba con otra área de competencia o consulta todos los contactos."
        />
      ) : (
        <section className="space-y-3">
          <h2 className="font-display text-xl font-semibold text-ink">
            Directorio
          </h2>
          <div className="grid gap-3 lg:grid-cols-2">
            {filtered.map((contact) => (
              <Card key={contact.id} className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-display text-base font-semibold text-ink">
                      {contact.fullName}
                    </p>
                    <p className="text-xs text-ink-soft">
                      {contact.relationshipOrRole}
                      {contact.organization
                        ? ` · ${contact.organization}`
                        : ""}
                    </p>
                  </div>
                  <Badge variant={contact.isActive ? "success" : "outline"}>
                    {contact.isActive ? "Activo" : "Archivado"}
                  </Badge>
                </div>

                {contact.supportedAreas.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {contact.supportedAreas.map((area) => (
                      <Badge key={area} variant="outline">
                        {competencyAreaLabel(area)}
                      </Badge>
                    ))}
                  </div>
                ) : null}

                {contact.contactInfo ? (
                  <p className="mt-2 inline-flex items-center gap-1.5 text-[11px] text-ink-soft">
                    <Phone className="size-3.5" aria-hidden="true" />
                    {contact.contactInfo}
                  </p>
                ) : null}

                {contact.collaborationNotes ? (
                  <p className="mt-2 whitespace-pre-line text-xs text-ink-soft">
                    {contact.collaborationNotes}
                  </p>
                ) : null}

                {contact.members.length > 0 ? (
                  <p className="mt-2 inline-flex items-center gap-1.5 text-[11px] text-ink-soft">
                    <UsersRound className="size-3.5" aria-hidden="true" />
                    Monitor en:{" "}
                    {contact.members
                      .map((member) => member.project.title)
                      .join(", ")}
                  </p>
                ) : (
                  <p className="mt-2 text-[11px] text-ink-soft">
                    Sin proyectos activos por ahora.
                  </p>
                )}

                {canManage ? (
                  <div className="mt-3 space-y-3 border-t border-line/70 pt-3">
                    <SupportContactForm
                      contact={{
                        id: contact.id,
                        fullName: contact.fullName,
                        relationshipOrRole: contact.relationshipOrRole,
                        organization: contact.organization,
                        contactInfo: contact.contactInfo,
                        supportedAreas: contact.supportedAreas,
                        collaborationNotes: contact.collaborationNotes,
                        isActive: contact.isActive,
                      }}
                    />
                    <SupportContactToggle
                      contactId={contact.id}
                      isActive={contact.isActive}
                    />
                  </div>
                ) : null}
              </Card>
            ))}
          </div>
        </section>
      )}

      {canManage ? (
        <p className="text-[11px] leading-relaxed text-ink-soft">
          Los contactos archivados dejan de estar disponibles para nuevos
          Grupos de Trabajo, pero su historial se conserva.{" "}
          <Link href="/proyectos" className="underline">
            Volver a Proyectos
          </Link>
        </p>
      ) : null}
    </div>
  );
}
