import type { ActionState } from "@/lib/action-state";

export interface ReflectionState extends ActionState {
  savedAt?: string | null;
}

export const EMPTY_REFLECTION_STATE: ReflectionState = {};
