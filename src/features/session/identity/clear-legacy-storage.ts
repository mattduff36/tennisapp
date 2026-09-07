export const LEGACY_PEGBOARD_KEY = "tennisapp.pegboard.v1";

export function clearLegacyPegboardStorage(): void {
  if (typeof localStorage === "undefined") {
    return;
  }
  localStorage.removeItem(LEGACY_PEGBOARD_KEY);
}
