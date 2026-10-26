import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getInitials(firstName: string, lastName?: string) {
  const first = firstName.trim().charAt(0);
  const last = lastName?.trim().charAt(0) ?? "";
  return `${first}${last}`.toUpperCase();
}

export function formatFullName(firstName: string, lastName: string) {
  return `${firstName} ${lastName}`.replace(/\s+/g, " ").trim();
}

export function pluralize(count: number, singular: string, plural: string) {
  return count === 1 ? singular : plural;
}
