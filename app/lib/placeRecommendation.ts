import { placeCatalog, type PlaceCandidate, type TravelRange } from "../data/environmentGuidance";
import type { Element } from "../types/fortune";

const rangeLevel: Record<TravelRange, number> = { nearby: 0, daytrip: 1, nationwide: 2 };
const candidateRangeLevel: Record<PlaceCandidate["range"], number> = { nearby: 0, daytrip: 1, nationwide: 2 };

function stableHash(value: string): number {
  let hash = 2166136261;
  for (const character of value) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export type PlaceRecommendationInput = {
  supportiveElements: Element[];
  excessiveElements: Element[];
  seed: number;
  range?: TravelRange;
  baseRegion?: string;
  count?: number;
};

export function recommendPlaces({
  supportiveElements,
  excessiveElements,
  seed,
  range = "nationwide",
  baseRegion = "",
  count = 3,
}: PlaceRecommendationInput): PlaceCandidate[] {
  const allowedLevel = rangeLevel[range];
  const normalizedRegion = baseRegion.trim().replace(/\s+/g, "");
  const candidates = placeCatalog
    .filter((place) => candidateRangeLevel[place.range] <= allowedLevel)
    .map((place) => {
      const supportMatches = place.elements.filter((element) => supportiveElements.includes(element)).length;
      const excessMatches = place.elements.filter((element) => excessiveElements.includes(element)).length;
      const regionBonus = normalizedRegion && place.region.replace(/\s+/g, "").includes(normalizedRegion) ? 5 : 0;
      const variety = (stableHash(`${seed}:${place.id}`) % 1000) / 1000;
      return { place, score: supportMatches * 12 - excessMatches * 4 + regionBonus + variety * 3 };
    })
    .sort((a, b) => b.score - a.score);

  const selected: PlaceCandidate[] = [];
  const usedCategories = new Set<string>();
  const usedRegions = new Set<string>();

  for (const { place } of candidates) {
    const categoryFamily = place.category.split("·")[0];
    const regionFamily = place.region.split(" ")[0].split("·")[0];
    if (selected.length < 2 && usedCategories.has(categoryFamily) && usedRegions.has(regionFamily)) continue;
    selected.push(place);
    usedCategories.add(categoryFamily);
    usedRegions.add(regionFamily);
    if (selected.length === count) break;
  }
  if (selected.length >= count) return selected.slice(0, count);
  for (const { place } of candidates) {
    if (selected.some(({ id }) => id === place.id)) continue;
    selected.push(place);
    if (selected.length === count) break;
  }
  return selected.slice(0, count);
}
