import {
  calculateFourPillars,
  lunarToSolar,
  solarToLunar,
  type BirthInfo,
  type EarthlyBranch,
  type ElementPair,
  type FourPillarsDetail,
  type TenGodChart,
  type YinYangPair,
} from "manseryeok";
import type { BirthInput, Element, FortuneCalculator, FortuneChart, Pillar, YinYang } from "../types/fortune";
import { buildLuckFlow, buildSpiritStars } from "./flowCalculator";

const roles = [
  "가문·초기 환경과 바깥에 보이는 태도",
  "절기 기준 사회적 습관과 일하는 방식",
  "판단의 핵심인 일간과 가까운 관계",
  "내밀한 욕구와 실제 행동으로 옮기는 방식",
] as const;

const longitudes: Array<[string[], number]> = [
  [["서울"], 126.978], [["부산"], 129.0756], [["대구"], 128.6014],
  [["인천"], 126.7052], [["광주"], 126.8526], [["대전"], 127.3845],
  [["울산"], 129.3114], [["제주"], 126.5312], [["세종"], 127.289],
];

const relationSets: Record<string, string[]> = {
  합: ["자축", "인해", "묘술", "진유", "사신", "오미"],
  충: ["자오", "축미", "인신", "묘유", "진술", "사해"],
  형: ["인사", "사신", "신인", "축술", "술미", "미축", "자묘", "묘자", "진진", "오오", "유유", "해해"],
  파: ["자유", "축진", "인해", "묘오", "사신", "미술"],
  해: ["자미", "축오", "인사", "묘진", "신해", "유술"],
};

const generates: Record<Element, Element> = { 목: "화", 화: "토", 토: "금", 금: "수", 수: "목" };
const controls: Record<Element, Element> = { 목: "토", 화: "금", 토: "수", 금: "목", 수: "화" };

function hashChart(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function resolveLongitude(region: string): number {
  return longitudes.find(([names]) => names.some((name) => region.includes(name)))?.[1] ?? 126.978;
}

function calculateInteractions(branches: EarthlyBranch[]): string[] {
  const found = new Set<string>();
  for (let i = 0; i < branches.length; i += 1) {
    for (let j = i + 1; j < branches.length; j += 1) {
      const direct = `${branches[i]}${branches[j]}`;
      const reverse = `${branches[j]}${branches[i]}`;
      Object.entries(relationSets).forEach(([name, pairs]) => {
        if (pairs.includes(direct) || pairs.includes(reverse)) found.add(`${branches[i]}·${branches[j]} ${name}`);
      });
    }
  }
  return found.size ? [...found] : ["뚜렷한 합·충·형·파·해 없음"];
}

function calculateStrength(dayMaster: Element, distribution: Record<Element, number>, monthBranch: Element): number {
  const resource = (Object.keys(generates) as Element[]).find((element) => generates[element] === dayMaster) ?? dayMaster;
  const output = generates[dayMaster];
  const wealth = controls[dayMaster];
  const authority = (Object.keys(controls) as Element[]).find((element) => controls[element] === dayMaster) ?? dayMaster;
  const support = distribution[dayMaster] * 1.15 + distribution[resource] + (monthBranch === dayMaster || monthBranch === resource ? 1.5 : 0);
  const drain = distribution[output] * .75 + distribution[wealth] * .85 + distribution[authority] * .9;
  return Math.max(12, Math.min(90, Math.round(50 + (support - drain) * 5)));
}

function pillarFrom(
  label: Pillar["label"],
  stem: string,
  branch: string,
  element: ElementPair,
  yinYang: YinYangPair,
  tenGod: { stem: string; branch: string },
  role: string,
): Pillar {
  return {
    label,
    stem,
    branch,
    element: element.stem as Element,
    branchElement: element.branch as Element,
    yinYang: yinYang.stem as YinYang,
    branchYinYang: yinYang.branch as YinYang,
    tenGod: tenGod.stem,
    branchTenGod: tenGod.branch,
    role,
  };
}

function buildPillars(result: FourPillarsDetail, timeUnknown: boolean): Pillar[] {
  const tenGods = result.tenGods as TenGodChart;
  const pillars: Pillar[] = [
    pillarFrom("년주", result.year.heavenlyStem, result.year.earthlyBranch, result.yearElement, result.yearYinYang, tenGods.year, roles[0]),
    pillarFrom("월주", result.month.heavenlyStem, result.month.earthlyBranch, result.monthElement, result.monthYinYang, tenGods.month, roles[1]),
    pillarFrom("일주", result.day.heavenlyStem, result.day.earthlyBranch, result.dayElement, result.dayYinYang, tenGods.day, roles[2]),
    pillarFrom("시주", result.hour.heavenlyStem, result.hour.earthlyBranch, result.hourElement, result.hourYinYang, tenGods.hour, roles[3]),
  ];
  if (timeUnknown) {
    pillars[3] = {
      label: "시주", stem: "?", branch: "?", element: "?", branchElement: "?",
      yinYang: "?", branchYinYang: "?", tenGod: "미상", branchTenGod: "미상", role: roles[3],
    };
  }
  return pillars;
}

export class KoreanManseCalculator implements FortuneCalculator {
  calculate(input: BirthInput): FortuneChart {
    const hour = input.timeUnknown ? 12 : (input.hour ?? 12);
    const longitude = resolveLongitude(input.region);
    const birthInfo: BirthInfo = {
      year: input.year,
      month: input.month,
      day: input.day,
      hour,
      minute: input.timeUnknown ? 0 : input.minute,
      isLunar: input.calendarType === "lunar",
      isLeapMonth: input.calendarType === "lunar" && input.leapMonth,
      dayBoundary: "midnight",
      ...(input.gender === "none" ? {} : { gender: input.gender }),
      ...(!input.timeUnknown && input.trueSolarTime ? {
        trueSolarTime: { longitude, applyEquationOfTime: true, applyHistoricalDst: true },
      } : {}),
    };
    const result = calculateFourPillars(birthInfo);
    const pillars = buildPillars(result, input.timeUnknown);
    const elements: Element[] = ["목", "화", "토", "금", "수"];
    const elementDistribution = Object.fromEntries(elements.map((element) => [element, 0])) as Record<Element, number>;
    const yinYangDistribution: Record<YinYang, number> = { 음: 0, 양: 0 };
    const tenGodDistribution: Record<string, number> = {};
    pillars.forEach((pillar) => {
      if (pillar.element === "?") return;
      elementDistribution[pillar.element] += 1;
      elementDistribution[pillar.branchElement as Element] += 1;
      yinYangDistribution[pillar.yinYang as YinYang] += 1;
      yinYangDistribution[pillar.branchYinYang as YinYang] += 1;
      [pillar.tenGod, pillar.branchTenGod].forEach((tenGod) => {
        if (tenGod !== "일간") tenGodDistribution[tenGod] = (tenGodDistribution[tenGod] ?? 0) + 1;
      });
    });
    const counts = elements.map((element) => elementDistribution[element]);
    const max = Math.max(...counts);
    const min = Math.min(...counts);
    const excessiveElements = elements.filter((element) => elementDistribution[element] === max && max >= 3);
    const deficientElements = elements.filter((element) => elementDistribution[element] === min && min <= 1);
    const dayMaster = result.dayElement.stem as Element;
    const solar = input.calendarType === "solar"
      ? { year: input.year, month: input.month, day: input.day }
      : lunarToSolar(input.year, input.month, input.day, input.leapMonth);
    const lunar = input.calendarType === "lunar"
      ? { year: input.year, month: input.month, day: input.day, isLeapMonth: input.leapMonth }
      : solarToLunar(input.year, input.month, input.day);
    const visibleBranches = pillars.filter((pillar) => pillar.branch !== "?").map((pillar) => pillar.branch as EarthlyBranch);
    const signature = pillars.map((pillar) => `${pillar.stem}${pillar.branch}`).join("|");
    const luckFlow = buildLuckFlow(
      input,
      result,
      (gender) => calculateFourPillars({ ...birthInfo, gender }),
    );
    const spiritStars = buildSpiritStars(result, input.timeUnknown);
    return {
      mode: "manse",
      seed: hashChart(signature),
      pillars,
      dayMaster: result.day.heavenlyStem,
      elementDistribution,
      yinYangDistribution,
      tenGodDistribution,
      strengthScore: calculateStrength(dayMaster, elementDistribution, result.monthElement.branch as Element),
      deficientElements,
      excessiveElements,
      interactions: calculateInteractions(visibleBranches),
      confidence: input.timeUnknown ? 82 : (input.trueSolarTime ? 98 : 96),
      calculationBasis: input.timeUnknown
        ? "KASI 기반 절기·간지 계산 · 시주 제외 · 자정 일 경계"
        : `KASI 기반 절기·간지 계산 · ${input.trueSolarTime ? `${input.region} 경도 진태양시 보정` : "입력 KST 사용"} · 자정 일 경계`,
      solarDate: `${solar.year}-${String(solar.month).padStart(2, "0")}-${String(solar.day).padStart(2, "0")}`,
      lunarDate: `${lunar.year}-${String(lunar.month).padStart(2, "0")}-${String(lunar.day).padStart(2, "0")}${lunar.isLeapMonth ? " 윤달" : ""}`,
      luckFlow,
      spiritStars,
    };
  }
}
