import type { FortuneChart, SharePayload } from "../types/fortune";

export function sanitizeChartForShare(chart: FortuneChart): FortuneChart {
  return {
    ...chart,
    solarDate: "공유본에서 제외",
    lunarDate: "공유본에서 제외",
    calculationBasis: chart.calculationBasis.includes("시주 제외")
      ? "KASI 기반 절기·간지 계산 · 시주 제외 · 출생 지역 비공개"
      : "KASI 기반 절기·간지 계산 · 출생 지역 및 보정 세부값 비공개",
  };
}

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
    if (parsed.v !== 2 || !parsed.name || parsed.chart?.mode !== "manse") return null;
    return parsed;
  } catch {
    return null;
  }
}
