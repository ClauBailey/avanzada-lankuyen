import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, BookOpen, TriangleAlert, UsersRound } from "lucide-react";

import { CommunityForm } from "@/components/admin/community-form";
import { CommunityMemberRoles } from "@/components/communities/community-member-roles";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { communitySizeAdvisory } from "@/lib/community-rules";
import { getDisplayName } from "@/lib/user-display";
import { prisma } from "@/server/db";
import { requireUser } from "@/server/auth/session";
import { can } from "@/server/rbac/can";

export const metadata = {
  title: "Mi comunidad",
};

export default async function MiComunidadPage() {
  const user = await requireUser();

  if (user.role === "AA") {
    redirect("/admin/comunidades");
  }

  const canManage = can(user, "community:identity_edit");

  const community = user.communityId
    ? await prisma.community.findFirst({
        where: { id: user.communityId, deletedAt: null },
        select: {
          id: true,
          name: true,
          slug: true,
          motto: true,
          description: true,
          color: true,
          isActive: true,
          deletedAt: true,
        },
      })
    : null;

  const members = community
    ? await prisma.user.findMany({
        where: {
          communityId: community.id,
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
          communityRole: true,
        },
      })
    : [];

  const sizeAdvisory = community ? communitySizeAdvisory(members.length) : null;

  return (
    <div className="space-y-6">
      <Link href="/inicio" className="inline-flex items-center gap-1 text-xs font-semibold text-anil-700 hover:text-anil-900">
        <ArrowLeft className="size-3.5" aria-hidden="true" />
        Volver al inicio
      </Link>

      <PageHeader
        eyebrow={canManage ? "Coordinación" : "Mi comunidad"}
        title={community ? community.name : "Mi comunidad"}
        description={
          canManage
            ? "Como coordinador o coordinadora puedes cuidar la identidad de tu comunidad y rotar los cargos internos del grupo."
            : "Este es el espacio de tu comunidad: su identidad, sus cargos internos, su asistencia y su bitácora privada."
        }
        actions={
          community ? (
            <Badge variant="default">
              <UsersRound className="size-3.5" aria-hidden="true" />
              {members.length} persona{members.length === 1 ? "" : "s"} joven
              {members.length === 1 ? "" : "es"} activa
              {members.length === 1 ? "" : "s"}
              {members.length === 1 ? "" : "s"}
            </Badge>
          ) : null
        }
      />

      {!community ? (
        <Card className="border-dashed bg-surface/70 p-8 text-center">
          <UsersRound className="mx-auto size-8 text-anil-400" aria-hidden="true" />
          <p className="mt-3 font-display text-lg font-semibold text-ink">
            Todavía no tienes una comunidad asignada
          </p>
          <p className="mx-auto mt-1 max-w-md text-sm text-ink-soft">
            Cuando un Adulto Acompañante te asigne a una comunidad podrás editar su
            identidad y acompañar la rotación de cargos internos.
          </p>
        </Card>
      ) : (
        <>
          {sizeAdvisory ? (
            <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3 text-sm text-amber-900">
              <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <p className="text-xs leading-relaxed">{sizeAdvisory}</p>
            </div>
          ) : null}

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader className="border-b border-line/70">
                <CardDescription className="text-[11px] font-semibold uppercase tracking-[0.16em] text-anil-700">
                  Seguridad en terreno
                </CardDescription>
                <CardTitle>Asistencia de mi comunidad</CardTitle>
              </CardHeader>
              <CardContent className="p-5">
                <p className="text-sm leading-relaxed text-ink-soft">
                  Ratifica la lista real de tu comunidad para cuidar la
                  seguridad y la responsabilidad legal en cada actividad. Sin
                  porcentajes ni comparaciones: solo presencia, aviso previo y
                  ausencia.
                </p>
                <Link
                  href="/mi-comunidad/asistencia"
                  className={buttonVariants({
                    size: "sm",
                    className: "mt-4",
                  })}
                >
                  <UsersRound className="size-4" aria-hidden="true" />
                  Ir a asistencia
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="border-b border-line/70">
                <CardDescription className="text-[11px] font-semibold uppercase tracking-[0.16em] text-anil-700">
                  Identidad
                </CardDescription>
                <CardTitle>Nombre, lema y color</CardTitle>
              </CardHeader>
              <CardContent className="p-5">
                {canManage ? (
                  <CommunityForm mode="edit" community={community} />
                ) : (
                  <div className="space-y-2 text-sm text-ink">
                    <p className="font-semibold">{community.name}</p>
                    {community.motto ? (
                      <p className="text-ink-soft">«{community.motto}»</p>
                    ) : null}
                    {community.description ? (
                      <p className="whitespace-pre-line text-ink-soft">
                        {community.description}
                      </p>
                    ) : null}
                    {community.color ? (
                      <p className="flex items-center gap-2 text-xs text-ink-soft">
                        <span
                          className="size-3 rounded-full"
                          style={{ backgroundColor: community.color }}
                          aria-hidden="true"
                        />
                        Color de la comunidad
                      </p>
                    ) : null}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="border-b border-line/70">
              <CardDescription className="text-[11px] font-semibold uppercase tracking-[0.16em] text-anil-700">
                Bitácora privada
              </CardDescription>
              <CardTitle>La memoria de nuestra comunidad</CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <p className="text-sm leading-relaxed text-ink-soft">
                Acuerdos, anécdotas y tradiciones del grupo. Solo los miembros
                activos de la comunidad pueden leerla y escribir en ella; el AA
                encargado ve únicamente lo que ustedes decidan compartir.
              </p>
              <Link
                href="/mi-comunidad/bitacora"
                className={buttonVariants({ size: "sm", className: "mt-4" })}
              >
                <BookOpen className="size-4" aria-hidden="true" />
                Abrir la bitácora
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b border-line/70">
              <CardDescription className="text-[11px] font-semibold uppercase tracking-[0.16em] text-anil-700">
                Cargos internos
              </CardDescription>
              <CardTitle>Rotación del grupo</CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <CommunityMemberRoles
                communityId={community.id}
                canManage={canManage}
                members={members.map((member) => ({
                  id: member.id,
                  name: getDisplayName(member),
                  username: member.username,
                  role: member.role,
                  communityRole: member.communityRole,
                }))}
              />
              <p className="mt-3 text-[11px] leading-relaxed text-ink-soft">
                Al asignar el cargo de Coordinador/a, el rol de sistema se
                sincroniza automáticamente. El cambio queda registrado en el
                historial de cargos y en la auditoría.
              </p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
