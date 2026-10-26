"use client";

import {
  useMemo,
  useState,
  useTransition,
  type FormEvent,
} from "react";
import {
  AlertTriangle,
  Check,
  CheckCheck,
  FileWarning,
  Filter,
  LoaderCircle,
  Paperclip,
  RotateCcw,
  Save,
  Search,
  Users,
} from "lucide-react";

import { CommunityTag } from "@/components/brand/community-tag";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { ratifyAttendanceAction } from "@/features/attendance/actions";
import { ATTENDANCE_LABELS, RSVP_LABELS } from "@/lib/activity-types";
import { cn } from "@/lib/utils";

type AttendanceStatus = "PRESENTE" | "AUSENTE" | "JUSTIFICADO";
type RsvpStatus = "CONFIRMADO" | "NO_ASISTE";

interface RatifierFile {
  id: string;
  originalName: string;
  mimeType: string;
}

export interface RatifierMember {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  role: "PP" | "COORDINADOR";
  community: { id: string; name: string; color: string | null } | null;
  rsvpStatus: RsvpStatus | null;
  justificationText: string | null;
  files: RatifierFile[];
  recordStatus: AttendanceStatus | null;
  recordNotes: string | null;
}

interface CommunityOption {
  id: string;
  name: string;
}

interface EntryState {
  status: AttendanceStatus;
  notes: string;
}

interface RatifyState {
  error?: string;
  success?: string;
}

interface AttendanceRatifierProps {
  activityId: string;
  members: RatifierMember[];
  communities: CommunityOption[];
  isFuture: boolean;
  isRatified: boolean;
  lastRatifiedAt: string | null;
  lastRatifiedBy: string | null;
}

function defaultStatus(rsvp: RsvpStatus | null): AttendanceStatus {
  if (rsvp === "CONFIRMADO") return "PRESENTE";
  if (rsvp === "NO_ASISTE") return "JUSTIFICADO";
  return "AUSENTE";
}

function buildInitialEntries(members: RatifierMember[]): Record<string, EntryState> {
  return Object.fromEntries(
    members.map((member) => [
      member.id,
      {
        status: member.recordStatus ?? defaultStatus(member.rsvpStatus),
        notes: member.recordNotes ?? "",
      },
    ]),
  );
}

const STATUS_OPTIONS: AttendanceStatus[] = [
  "PRESENTE",
  "JUSTIFICADO",
  "AUSENTE",
];

const STATUS_BADGE_CLASSES: Record<AttendanceStatus, string> = {
  PRESENTE: "border-emerald-200 bg-emerald-50 text-emerald-800",
  JUSTIFICADO: "border-amber-200 bg-amber-50 text-amber-800",
  AUSENTE: "border-red-200 bg-red-50 text-red-800",
};

export function AttendanceRatifier({
  activityId,
  members,
  communities,
  isFuture,
  isRatified,
  lastRatifiedAt,
  lastRatifiedBy,
}: AttendanceRatifierProps) {
  const [state, setState] = useState<RatifyState>({});
  const [pending, startTransition] = useTransition();
  const [entries, setEntries] = useState<Record<string, EntryState>>(() =>
    buildInitialEntries(members),
  );
  const [communityFilter, setCommunityFilter] = useState("all");
  const [rsvpFilter, setRsvpFilter] = useState("all");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const term = query
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

    return members.filter((member) => {
      if (
        communityFilter !== "all" &&
        (member.community?.id ?? "none") !== communityFilter
      ) {
        return false;
      }

      if (rsvpFilter === "sin_respuesta" && member.rsvpStatus !== null) {
        return false;
      }
      if (rsvpFilter !== "all" && rsvpFilter !== "sin_respuesta") {
        if (member.rsvpStatus !== rsvpFilter) return false;
      }

      if (!term) return true;

      const haystack = `${member.firstName} ${member.lastName} ${member.username}`
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
      return haystack.includes(term);
    });
  }, [members, communityFilter, rsvpFilter, query]);

  const liveCounts = useMemo(() => {
    const values = Object.values(entries);
    return {
      PRESENTE: values.filter((entry) => entry.status === "PRESENTE").length,
      JUSTIFICADO: values.filter((entry) => entry.status === "JUSTIFICADO")
        .length,
      AUSENTE: values.filter((entry) => entry.status === "AUSENTE").length,
    };
  }, [entries]);

  const rsvpCounts = useMemo(
    () => ({
      confirmed: members.filter((member) => member.rsvpStatus === "CONFIRMADO")
        .length,
      absent: members.filter((member) => member.rsvpStatus === "NO_ASISTE")
        .length,
      pending: members.filter((member) => member.rsvpStatus === null).length,
    }),
    [members],
  );

  const updateEntry = (userId: string, patch: Partial<EntryState>) => {
    setEntries((current) => ({
      ...current,
      [userId]: { ...current[userId], ...patch },
    }));
  };

  const applyPrefill = () => {
    setEntries(buildInitialEntries(members.map((member) => ({
      ...member,
      recordStatus: null,
      recordNotes: null,
    }))));
  };

  const payload = members.map((member) => ({
    userId: member.id,
    status: entries[member.id]?.status ?? "AUSENTE",
    notes: entries[member.id]?.notes.trim() || undefined,
  }));

  // Enviamos la acción manualmente para que React no reinicie los campos
  // nativos del formulario al terminar: el select debe conservar el estado
  // que el AA acaba de ratificar.
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    formData.set("payload", JSON.stringify(payload));

    startTransition(async () => {
      const result = await ratifyAttendanceAction({}, formData);
      setState(result);
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <input type="hidden" name="activityId" value={activityId} />
      <input type="hidden" name="payload" value={JSON.stringify(payload)} />

      {isFuture ? (
        <Alert variant="info">
          <span className="inline-flex items-start gap-2">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            La actividad aún no comienza. Puedes guardar la ratificación, pero
            revisa que los estados correspondan a la asistencia real.
          </span>
        </Alert>
      ) : null}

      {isRatified ? (
        <Alert variant="success">
          <span className="inline-flex items-start gap-2">
            <CheckCheck className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            Asistencia ya ratificada
            {lastRatifiedBy ? ` por ${lastRatifiedBy}` : ""}
            {lastRatifiedAt ? ` el ${lastRatifiedAt}` : ""}. Puedes corregir y
            volver a guardar; cada cambio queda registrado en auditoría.
          </span>
        </Alert>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-line bg-surface px-4 py-3">
          <p className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-soft">
            <Users className="size-3.5" aria-hidden="true" />
            Miembros
          </p>
          <p className="mt-1 font-display text-2xl font-semibold text-ink">
            {members.length}
          </p>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-800">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em]">
            Confirmados
          </p>
          <p className="mt-1 font-display text-2xl font-semibold">
            {rsvpCounts.confirmed}
          </p>
          <p className="text-[11px] opacity-80">respuesta previa</p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em]">
            Inasistencias
          </p>
          <p className="mt-1 font-display text-2xl font-semibold">
            {rsvpCounts.absent}
          </p>
          <p className="text-[11px] opacity-80">con justificación</p>
        </div>
        <div className="rounded-xl border border-line bg-canvas/60 px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-soft">
            Sin respuesta
          </p>
          <p className="mt-1 font-display text-2xl font-semibold text-ink">
            {rsvpCounts.pending}
          </p>
          <p className="text-[11px] text-ink-soft">antes del evento</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-surface p-3.5">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-soft">
          <Filter className="size-3.5" aria-hidden="true" />
          Filtrar
        </span>

        <div className="w-44">
          <Select
            value={communityFilter}
            onChange={(event) => setCommunityFilter(event.target.value)}
            aria-label="Filtrar por comunidad"
            className="h-9"
          >
            <option value="all">Todas las comunidades</option>
            {communities.map((community) => (
              <option key={community.id} value={community.id}>
                {community.name}
              </option>
            ))}
            <option value="none">Sin comunidad</option>
          </Select>
        </div>

        <div className="w-44">
          <Select
            value={rsvpFilter}
            onChange={(event) => setRsvpFilter(event.target.value)}
            aria-label="Filtrar por respuesta previa"
            className="h-9"
          >
            <option value="all">Todas las respuestas</option>
            <option value="CONFIRMADO">Confirmados</option>
            <option value="NO_ASISTE">No podrán ir</option>
            <option value="sin_respuesta">Sin respuesta</option>
          </Select>
        </div>

        <div className="relative min-w-48 flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft"
            aria-hidden="true"
          />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar miembro…"
            className="h-9 bg-canvas/50 pl-9"
            aria-label="Buscar miembro"
          />
        </div>

        <button
          type="button"
          onClick={applyPrefill}
          className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-anil-200 bg-anil-50 px-3 text-xs font-semibold text-anil-800 transition-colors hover:bg-anil-100"
        >
          <RotateCcw className="size-3.5" aria-hidden="true" />
          Pre-rellenar según RSVP
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-line/70 bg-canvas/50 px-4 py-3 text-xs text-ink-soft">
        <span className="font-semibold text-ink">Ratificación actual:</span>
        <span className="text-emerald-800">
          {liveCounts.PRESENTE} presente{liveCounts.PRESENTE === 1 ? "" : "s"}
        </span>
        <span aria-hidden="true">·</span>
        <span className="text-amber-800">
          {liveCounts.JUSTIFICADO} justificado
          {liveCounts.JUSTIFICADO === 1 ? "" : "s"}
        </span>
        <span aria-hidden="true">·</span>
        <span className="text-red-800">
          {liveCounts.AUSENTE} ausente{liveCounts.AUSENTE === 1 ? "" : "s"}
        </span>
        <span className="ml-auto">
          Mostrando {filtered.length} de {members.length}
        </span>
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-line bg-canvas/60 px-5 py-8 text-center text-sm text-ink-soft">
            No hay miembros con esos filtros.
          </p>
        ) : (
          filtered.map((member) => {
            const entry = entries[member.id];
            return (
              <div
                key={member.id}
                className="rounded-2xl border border-line bg-surface p-4 shadow-card"
              >
                <div className="grid gap-4 lg:grid-cols-[1.25fr_1fr] lg:items-start">
                  <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-display text-sm font-semibold text-ink">
                        {member.firstName} {member.lastName}
                      </p>
                      <span className="font-mono text-[11px] text-ink-soft">
                        @{member.username}
                      </span>
                      <CommunityTag
                        name={member.community?.name}
                        color={member.community?.color}
                      />
                      {member.recordStatus ? (
                        <Badge variant="outline">Ya ratificado</Badge>
                      ) : null}
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      {member.rsvpStatus ? (
                        <Badge
                          variant={
                            member.rsvpStatus === "CONFIRMADO"
                              ? "success"
                              : "warning"
                          }
                        >
                          {RSVP_LABELS[member.rsvpStatus]}
                        </Badge>
                      ) : (
                        <Badge variant="outline">Sin respuesta</Badge>
                      )}
                    </div>

                    {member.rsvpStatus === "NO_ASISTE" ? (
                      <div className="rounded-xl border border-amber-200 bg-amber-50/60 px-3 py-2 text-xs text-ink">
                        <p className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-amber-800">
                          <FileWarning className="size-3.5" aria-hidden="true" />
                          Justificación
                        </p>
                        <p className="mt-1 whitespace-pre-line">
                          {member.justificationText ||
                            "Sin texto: solo se adjuntó un documento."}
                        </p>
                        {member.files.length > 0 ? (
                          <ul className="mt-2 space-y-1">
                            {member.files.map((file) => (
                              <li key={file.id}>
                                <a
                                  href={`/api/files/${file.id}`}
                                  className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-anil-700 underline-offset-2 hover:underline"
                                >
                                  <Paperclip className="size-3" aria-hidden="true" />
                                  {file.originalName}
                                </a>
                              </li>
                            ))}
                          </ul>
                        ) : null}
                      </div>
                    ) : null}
                  </div>

                  <div className="grid gap-3 sm:grid-cols-[minmax(0,150px)_1fr]">
                    <div className="space-y-1.5">
                      <label
                        htmlFor={`status-${member.id}`}
                        className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-soft"
                      >
                        Asistencia real
                      </label>
                      <Select
                        id={`status-${member.id}`}
                        value={entry?.status ?? "AUSENTE"}
                        onChange={(event) =>
                          updateEntry(member.id, {
                            status: event.target.value as AttendanceStatus,
                          })
                        }
                        className={cn(
                          "h-10 text-xs font-semibold",
                          entry?.status === "PRESENTE" &&
                            "border-emerald-300 bg-emerald-50 text-emerald-900",
                          entry?.status === "JUSTIFICADO" &&
                            "border-amber-300 bg-amber-50 text-amber-900",
                          entry?.status === "AUSENTE" &&
                            "border-red-300 bg-red-50 text-red-900",
                        )}
                      >
                        {STATUS_OPTIONS.map((status) => (
                          <option key={status} value={status}>
                            {ATTENDANCE_LABELS[status]}
                          </option>
                        ))}
                      </Select>
                      <span
                        className={cn(
                          "inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em]",
                          entry ? STATUS_BADGE_CLASSES[entry.status] : "",
                        )}
                      >
                        {entry ? ATTENDANCE_LABELS[entry.status] : "—"}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <label
                        htmlFor={`notes-${member.id}`}
                        className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-soft"
                      >
                        Nota (opcional)
                      </label>
                      <Input
                        id={`notes-${member.id}`}
                        value={entry?.notes ?? ""}
                        onChange={(event) =>
                          updateEntry(member.id, { notes: event.target.value })
                        }
                        placeholder="Observación para el historial…"
                        maxLength={500}
                        className="h-10 text-xs"
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {state.error ? <Alert variant="error">{state.error}</Alert> : null}
      {state.success ? (
        <Alert variant="success">
          <span className="inline-flex items-center gap-1.5">
            <Check className="size-4" aria-hidden="true" />
            {state.success}
          </span>
        </Alert>
      ) : null}

      <div className="flex flex-wrap items-center gap-3 border-t border-line/70 pt-4">
        <Button type="submit" disabled={pending}>
          {pending ? (
            <LoaderCircle className="animate-spin" aria-hidden="true" />
          ) : (
            <Save aria-hidden="true" />
          )}
          {pending ? "Guardando ratificación…" : "Guardar y ratificar asistencia"}
        </Button>
        <p className="text-[11px] leading-relaxed text-ink-soft">
          Se guardan {members.length} registro{members.length === 1 ? "" : "s"} con
          tu firma de AA y la fecha de ratificación.
        </p>
      </div>
    </form>
  );
}
