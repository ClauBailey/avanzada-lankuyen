"use client";

import { useActionState } from "react";
import { Handshake } from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";
import { requestCompassConsensusAction } from "@/features/compass/actions";
import { EMPTY_ACTION_STATE } from "@/lib/action-state";

export function ConsensusRequestForm({
  objectiveId,
  hasAssignedAa,
}: {
  objectiveId?: string;
  hasAssignedAa: boolean;
}) {
  const [state, action] = useActionState(
    requestCompassConsensusAction,
    EMPTY_ACTION_STATE,
  );

  if (!hasAssignedAa) {
    return (
      <p className="rounded-xl border border-dashed border-line bg-canvas/40 px-3 py-2 text-[11px] leading-relaxed text-ink-soft">
        Aún no tienes un AA encargado asignado. Cuando lo tengas podrás
        solicitar un Encuentro de Consenso.
      </p>
    );
  }

  return (
    <details className="rounded-xl border border-gold/40 bg-gold-soft/20 px-3 py-2.5">
      <summary className="cursor-pointer text-[11px] font-semibold text-[#7a5a16] marker:text-gold">
        Solicitar Encuentro de Consenso a mi AA
      </summary>
      <form action={action} className="mt-3 space-y-2">
        {objectiveId ? (
          <input type="hidden" name="objectiveId" value={objectiveId} />
        ) : null}
        <Textarea
          name="message"
          rows={3}
          maxLength={600}
          placeholder="¿Qué te gustaría conversar? (opcional)"
          className="min-h-20 bg-surface text-sm"
        />
        <p className="text-[10px] leading-relaxed text-ink-soft">
          El encuentro es una conversación presencial. Tu autoevaluación y la
          redacción de tus objetivos siguen siendo tuyas: tu AA no aprueba ni
          rechaza nada.
        </p>
        {state.error ? <Alert variant="error" className="text-xs">{state.error}</Alert> : null}
        {state.success ? (
          <Alert variant="success" className="text-xs">{state.success}</Alert>
        ) : null}
        <SubmitButton variant="gold" size="sm">
          <Handshake aria-hidden="true" />
          Solicitar encuentro
        </SubmitButton>
      </form>
    </details>
  );
}
