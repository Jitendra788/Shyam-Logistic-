/** Party fields must be names in the UI — IndexedDB overlay can leak full Party objects. */
export function partyLabel(value: unknown): string {
  if (value == null || value === "") return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (typeof value === "object" && "partyName" in value) {
    return partyLabel((value as { partyName: unknown }).partyName);
  }
  return "";
}

export function partyNamesFrom(list: unknown): string[] {
  if (!Array.isArray(list)) return [];
  return [...new Set(list.map(partyLabel).filter(Boolean))];
}
