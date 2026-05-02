const STORAGE_KEY = "reliefops:activeOrgId";

export function getActiveOrgId(): string | null {
  try { return localStorage.getItem(STORAGE_KEY); } catch { return null; }
}

export function setActiveOrgId(id: string) {
  try { localStorage.setItem(STORAGE_KEY, id); } catch {}
}
