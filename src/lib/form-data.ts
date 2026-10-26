export function readField(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export function firstIssue(error: {
  issues: ReadonlyArray<{ message: string }>;
}): string {
  return error.issues[0]?.message ?? "Revisa los datos ingresados.";
}
