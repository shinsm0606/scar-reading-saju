import type { CompatibilityProfile } from "../types/fortune";
import { sanitizeChartForShare } from "./share";

const STORAGE_KEY = "scar-saju-compatibility-profiles-v1";

function isProfile(value: unknown): value is CompatibilityProfile {
  if (!value || typeof value !== "object") return false;
  const profile = value as Partial<CompatibilityProfile>;
  return Boolean(profile.id && profile.name && profile.chart?.mode === "manse");
}

export function loadCompatibilityProfiles(storage: Storage): CompatibilityProfile[] {
  try {
    const parsed = JSON.parse(storage.getItem(STORAGE_KEY) ?? "[]") as unknown;
    return Array.isArray(parsed) ? parsed.filter(isProfile).slice(0, 20) : [];
  } catch {
    return [];
  }
}

export function saveCompatibilityProfile(storage: Storage, profile: CompatibilityProfile): CompatibilityProfile[] {
  const safeProfile = { ...profile, chart: sanitizeChartForShare(profile.chart) };
  const profiles = [safeProfile, ...loadCompatibilityProfiles(storage).filter(({ id }) => id !== profile.id)].slice(0, 20);
  storage.setItem(STORAGE_KEY, JSON.stringify(profiles));
  return profiles;
}

export function removeCompatibilityProfile(storage: Storage, profileId: string): CompatibilityProfile[] {
  const profiles = loadCompatibilityProfiles(storage).filter(({ id }) => id !== profileId);
  storage.setItem(STORAGE_KEY, JSON.stringify(profiles));
  return profiles;
}

export function clearCompatibilityProfiles(storage: Storage): void {
  storage.removeItem(STORAGE_KEY);
}
