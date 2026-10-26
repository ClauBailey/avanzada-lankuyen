import Link from "next/link";
import { ArrowLeft, UserPlus } from "lucide-react";

import { UserCreateForm } from "@/components/admin/user-create-form";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { prisma } from "@/server/db";
import { requirePermission } from "@/server/auth/session";

export const metadata = {
  title: "Crear cuenta · Panel AA",
};

export default async function AdminNuevoUsuarioPage() {
  await requirePermission("user:manage");

  const communities = await prisma.community.findMany({
    where: { isActive: true, deletedAt: null },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/usuarios"
          className={buttonVariants({ variant: "ghost", size: "sm" })}
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Volver a usuarios
        </Link>
      </div>

      <PageHeader
        eyebrow="Administración"
        title="Crear cuenta"
        description="Entrega credenciales temporales de forma directa. La persona deberá elegir su propia contraseña en el primer inicio de sesión."
      />

      <div className="grid gap-6 lg:grid-cols-[1.5fr_0.8fr] lg:items-start">
        <Card>
          <CardHeader className="border-b border-line/70">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-anil-100 text-anil-800">
                <UserPlus className="size-5" aria-hidden="true" />
              </span>
              <div>
                <CardDescription className="text-[11px] font-semibold uppercase tracking-[0.16em] text-anil-700">
                  Nueva cuenta
                </CardDescription>
                <CardTitle>Datos de la persona</CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-5 sm:p-6">
            <UserCreateForm communities={communities} />
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="border-dashed bg-surface/70 p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-anil-700">
              Reglas de la cuenta
            </p>
            <ul className="mt-3 space-y-2 text-sm text-ink-soft">
              <li>· Todas las cuentas, incluidos los AA, tienen comunidad asignada.</li>
              <li>· Cada AA acompaña la progresión de los Pioneros/as de su comunidad.</li>
              <li>· El usuario se guarda en minúsculas y es único.</li>
              <li>· El correo es opcional, pero también sirve para ingresar.</li>
              <li>· Toda cuenta nace con cambio de contraseña obligatorio.</li>
            </ul>
          </Card>
          <Card className="border-dashed bg-surface/70 p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-anil-700">
              Sobre las credenciales
            </p>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">
              Al crear la cuenta verás la contraseña temporal una sola vez, con un
              botón para copiar usuario y clave juntos. No se guarda en claro ni se
              puede volver a mostrar: si se pierde, usa «Resetear contraseña».
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
