export interface ActionState {
  error?: string;
  success?: string;
  /** Código de rechazo cuando la acción expresa una denegación constitucional. */
  status?: number;
}

export const EMPTY_ACTION_STATE: ActionState = {};
