import type { BirthInput } from "../types/fortune";

const STORAGE_KEY = "saju.birthInput";

export function saveBirthInput(storage: Storage, input: BirthInput): void {
  if (input.allowStorage) storage.setItem(STORAGE_KEY, JSON.stringify(input));
  else storage.removeItem(STORAGE_KEY);
}

export function loadBirthInput(storage: Storage): BirthInput | null {
  const value = storage.getItem(STORAGE_KEY);
  if (!value) return null;
  try {
    return JSON.parse(value) as BirthInput;
  } catch {
    storage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function deleteBirthInput(storage: Storage): void {
  storage.removeItem(STORAGE_KEY);
}
