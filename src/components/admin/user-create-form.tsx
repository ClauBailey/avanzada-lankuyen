"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Check, RefreshCw, UserPlus } from "lucide-react";

import { CredentialsDialog } from "@/components/admin/credentials-dialog";
import { Alert } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import { createUserAction } from "@/features/users/actions";
import {
  EMPTY_USER_ACTION_STATE,
  type UserActionState,
} from "@/features/users/types";
import {
  PASSWORD_RULES_HINT,
  generateTemporaryPassword,
} from "@/lib/temporary-password";
import { cn } from "@/lib/utils";

interface CommunityOption {
  id: string;
  name: string;
}

interface UserCreateFormProps {
  communities: CommunityOption[];
}

function buildUsername(firstName: string, lastName: string) {
  const normalize = (value: string) =>
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "")
      .slice(0, 20);

  const first = normalize(firstName.split(/\s+/)[0] ?? "");
  const last = normalize(lastName.split(/\s+/).slice(-1)[0] ?? "");

  if (!first && !last) return "";
  if (!last) return first;
  return `${first}.${last}`;
}

export function UserCreateForm({ communities }: UserCreateFormProps) {
  const [state, formAction] = useActionState(
    createUserAction,
    EMPTY_USER_ACTION_STATE,
  );
  const [dismissedPassword, setDismissedPassword] = useState<string | null>(
    null,
  );

  const credentials = state.credentials ?? null;
  const showCredentials = Boolean(
    credentials && dismissedPassword !== credentials.password,
  );

  return (
    <>
      <UserCreateFields
        key={state.createdId ?? "draft"}
        state={state}
        formAction={formAction}
        communities={communities}
      />

      <CredentialsDialog
        key={credentials?.password ?? "none"}
        credentials={showCredentials ? credentials : null}
        onClose={() => setDismissedPassword(credentials?.password ?? null)}
      />
    </>
  );
}

interface UserCreateFieldsProps {
  state: UserActionState;
  formAction: (payload: FormData) => void;
  communities: CommunityOption[];
}

function UserCreateFields({
  state,
  formAction,
  communities,
}: UserCreateFieldsProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [usernameInput, setUsernameInput] = useState("");
  const [usernameDirty, setUsernameDirty] = useState(false);
  const [role, setRole] = useState<"PP" | "COORDINADOR" | "AA">("PP");
  const [passwordMode, setPasswordMode] = useState<"auto" | "manual">("auto");
  const [password, setPassword] = useState("");

  const username = usernameDirty
    ? usernameInput
    : buildUsername(firstName, lastName);

  return (
    <form action={formAction} className="space-y-6">
      {state.error ? <Alert variant="error">{state.error}</Alert> : null}
      {state.success ? <Alert variant="success">{state.success}</Alert> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="firstName">Nombre</Label>
          <Input
            id="firstName"
            name="firstName"
            value={firstName}
            onChange={(event) => setFirstName(event.target.value)}
            placeholder="Ej. Martina"
            maxLength={80}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Apellido</Label>
          <Input
            id="lastName"
            name="lastName"
            value={lastName}
            onChange={(event) => setLastName(event.target.value)}
            placeholder="Ej. Rojas"
            maxLength={80}
            required
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="username">Nombre de usuario</Label>
          <Input
            id="username"
            name="username"
            value={username}
            onChange={(event) => {
              setUsernameDirty(true);
              setUsernameInput(event.target.value);
            }}
            autoCapitalize="none"
            spellCheck={false}
            placeholder="nombre.apellido"
            maxLength={40}
            required
          />
          <p className="text-xs text-ink-soft">
            Se sugiere automáticamente; puedes editarlo. Se guarda en minúsculas.
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">
            Correo <span className="normal-case tracking-normal">(opcional)</span>
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoCapitalize="none"
            spellCheck={false}
            placeholder="nombre@correo.cl"
            maxLength={255}
          />
          <p className="text-xs text-ink-soft">
            También podrá iniciar sesión con su correo si lo registras.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="role">Rol</Label>
          <Select
            id="role"
            name="role"
            value={role}
            onChange={(event) =>
              setRole(event.target.value as "PP" | "COORDINADOR" | "AA")
            }
          >
            <option value="PP">Pionero/a</option>
            <option value="COORDINADOR">Coordinador/a</option>
            <option value="AA">Adulto Acompañante</option>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="communityId">Comunidad</Label>
          <Select id="communityId" name="communityId" defaultValue="" required>
            <option value="" disabled>
              Selecciona una comunidad
            </option>
            {communities.map((community) => (
              <option key={community.id} value={community.id}>
                {community.name}
              </option>
            ))}
          </Select>
          <p className="text-xs text-ink-soft">
            {role === "AA"
              ? "El AA acompaña la progresión de los Pioneros/as de esta comunidad."
              : "Todo Pionero/a y Coordinador/a pertenece a una comunidad."}
          </p>
          {communities.length === 0 ? (
            <p className="text-xs text-red-700">
              No hay comunidades activas.{" "}
              <Link href="/admin/comunidades" className="underline">
                Crea una primero
              </Link>
              .
            </p>
          ) : null}
        </div>
      </div>

      <div className="space-y-3">
        <Label>Contraseña temporal</Label>
        <div className="grid gap-2 sm:grid-cols-2">
          <PasswordModeOption
            checked={passwordMode === "auto"}
            onSelect={() => setPasswordMode("auto")}
            title="Generar automáticamente"
            description="Creamos una clave legible para que la compartas."
          />
          <PasswordModeOption
            checked={passwordMode === "manual"}
            onSelect={() => setPasswordMode("manual")}
            title="Definir manualmente"
            description="Escribe o genera una clave y ajústala a tu gusto."
          />
        </div>
        <input type="hidden" name="passwordMode" value={passwordMode} />

        {passwordMode === "manual" ? (
          <div className="space-y-2">
            <div className="flex gap-2">
              <Input
                id="password"
                name="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Contraseña temporal"
                autoComplete="new-password"
                minLength={10}
                maxLength={128}
                required
              />
              <button
                type="button"
                onClick={() => setPassword(generateTemporaryPassword())}
                className="inline-flex h-11 shrink-0 items-center gap-2 rounded-xl border border-line bg-surface px-3.5 text-sm font-semibold text-ink transition-colors hover:border-anil-200 hover:bg-anil-50"
              >
                <RefreshCw className="size-4" aria-hidden="true" />
                Generar
              </button>
            </div>
            <p className="text-xs text-ink-soft">{PASSWORD_RULES_HINT}</p>
          </div>
        ) : (
          <p className="text-xs text-ink-soft">
            La clave se mostrará una sola vez al crear la cuenta, junto al botón
            para copiar las credenciales. {PASSWORD_RULES_HINT}
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t border-line/70 pt-5">
        <SubmitButton
          pendingLabel="Creando cuenta…"
          disabled={communities.length === 0}
        >
          <UserPlus aria-hidden="true" />
          Crear cuenta
        </SubmitButton>
        <p className="text-xs text-ink-soft">
          La cuenta nace con cambio de contraseña obligatorio en el primer ingreso.
        </p>
      </div>
    </form>
  );
}

interface PasswordModeOptionProps {
  checked: boolean;
  onSelect: () => void;
  title: string;
  description: string;
}

function PasswordModeOption({
  checked,
  onSelect,
  title,
  description,
}: PasswordModeOptionProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={checked}
      className={cn(
        "relative rounded-xl border p-3.5 text-left transition-colors",
        checked
          ? "border-anil-400 bg-anil-50/70 ring-1 ring-anil-300"
          : "border-line bg-surface hover:border-anil-200",
      )}
    >
      <span className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold text-ink">{title}</span>
        <span
          className={cn(
            "flex size-4 items-center justify-center rounded-full border",
            checked ? "border-anil-700 bg-anil-700 text-white" : "border-line",
          )}
        >
          {checked ? <Check className="size-3" aria-hidden="true" /> : null}
        </span>
      </span>
      <span className="mt-1 block text-xs leading-relaxed text-ink-soft">
        {description}
      </span>
    </button>
  );
}
