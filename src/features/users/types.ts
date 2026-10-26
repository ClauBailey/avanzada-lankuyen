import type { Role } from "@/generated/prisma/enums";
import type { ActionState } from "@/lib/action-state";

export interface TemporaryCredentials {
  username: string;
  password: string;
  fullName: string;
  role: Role;
}

export interface UserActionState extends ActionState {
  credentials?: TemporaryCredentials;
  /** Identificador de la cuenta creada; remonta el formulario para limpiarlo. */
  createdId?: string;
}

export const EMPTY_USER_ACTION_STATE: UserActionState = {};
