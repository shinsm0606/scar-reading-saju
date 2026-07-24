import type { SharePayload } from "../types/fortune";

export function encodeSharePayload(payload: SharePayload): string {
  const bytes = new TextEncoder().encode(JSON.stringify(payload));
  let binary = "";
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

export function decodeSharePayload(value: string): SharePayload | null {
  try {
    const normalized = value.replaceAll("-", "+").replaceAll("_", "/");
    const binary = atob(normalized);
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
    const parsed = JSON.parse(new TextDecoder().decode(bytes)) as SharePayload;
    if (parsed.v !== 1 || !parsed.name || !Number.isInteger(parsed.seed)) return null;
    return parsed;
  } catch {
    return null;
  }
}
