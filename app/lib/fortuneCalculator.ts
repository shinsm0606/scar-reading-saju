import type { BirthInput, Element, FortuneCalculator, Pillar, FortuneChart, YinYang } from "../types/fortune";

const stems = [
  { name: "갑", element: "목", yy: "양" }, { name: "을", element: "목", yy: "음" },
  { name: "병", element: "화", yy: "양" }, { name: "정", element: "화", yy: "음" },
  { name: "무", element: "토", yy: "양" }, { name: "기", element: "토", yy: "음" },
  { name: "경", element: "금", yy: "양" }, { name: "신", element: "금", yy: "음" },
  { name: "임", element: "수", yy: "양" }, { name: "계", element: "수", yy: "음" },
] as const;
const branches = [
  { name: "자", element: "수", yy: "양" }, { name: "축", element: "토", yy: "음" },
  { name: "인", element: "목", yy: "양" }, { name: "묘", element: "목", yy: "음" },
  { name: "진", element: "토", yy: "양" }, { name: "사", element: "화", yy: "음" },
  { name: "오", element: "화", yy: "양" }, { name: "미", element: "토", yy: "음" },
  { name: "신", element: "금", yy: "양" }, { name: "유", element: "금", yy: "음" },
  { name: "술", element: "토", yy: "양" }, { name: "해", element: "수", yy: "음" },
] as const;
const elements: Element[] = ["목", "화", "토", "금", "수"];
const tenGods = ["비견", "겁재", "식신", "상관", "편재", "정재", "편관", "정관", "편인", "정인"];
const roles = [
  "초기 환경과 바깥에 보이는 태도", "사회적 습관과 일하는 방식",
  "판단의 핵심과 가까운 관계", "후반 행동과 내밀한 욕구",
] as const;

export function hashBirthInput(input: BirthInput): number {
  const raw = [
    input.name.trim(), input.gender, input.calendarType, input.leapMonth ? 1 : 0,
    input.year, input.month, input.day, input.timeUnknown ? "unknown" : input.hour,
    input.timeUnknown ? 0 : input.minute, input.region.trim(),
  ].join("|");
  let hash = 2166136261;
  for (let i = 0; i < raw.length; i += 1) {
    hash ^= raw.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function next(seed: number): number {
  let x = seed + 0x6d2b79f5;
  x = Math.imul(x ^ (x >>> 15), x | 1);
  x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
  return (x ^ (x >>> 14)) >>> 0;
}

export function calculateDemoChartFromSeed(seed: number, timeUnknown: boolean): FortuneChart {
  let cursor = seed;
  const labels: Pillar["label"][] = ["년주", "월주", "일주", "시주"];
  const pillars = labels.map((label, index): Pillar => {
    cursor = next(cursor);
    if (label === "시주" && timeUnknown) {
      return { label, stem: "?", branch: "?", element: "?", yinYang: "?", tenGod: "미상", role: roles[index] };
    }
    const stem = stems[cursor % stems.length];
    const branch = branches[(cursor >>> 8) % branches.length];
    return {
      label, stem: stem.name, branch: branch.name, element: stem.element,
      yinYang: stem.yy, tenGod: tenGods[(cursor >>> 16) % tenGods.length], role: roles[index],
    };
  });
  const distribution = Object.fromEntries(elements.map((element) => [element, 0])) as Record<Element, number>;
  const yinYang: Record<YinYang, number> = { 음: 0, 양: 0 };
  const tenGodDistribution: Record<string, number> = {};
  pillars.forEach((pillar, index) => {
    if (pillar.element === "?") return;
    distribution[pillar.element] += 2;
    const branch = branches.find((item) => item.name === pillar.branch);
    if (branch) distribution[branch.element] += 1;
    if (pillar.yinYang !== "?") yinYang[pillar.yinYang] += index % 2 === 0 ? 2 : 1;
    tenGodDistribution[pillar.tenGod] = (tenGodDistribution[pillar.tenGod] ?? 0) + 1;
  });
  elements.forEach((element, index) => {
    cursor = next(cursor + index);
    distribution[element] += cursor % 3;
  });
  const values = elements.map((element) => distribution[element]);
  const max = Math.max(...values);
  const min = Math.min(...values);
  const excessiveElements = elements.filter((element) => distribution[element] === max && max >= 5);
  const deficientElements = elements.filter((element) => distribution[element] === min && min <= 2);
  const strengthScore = Math.max(18, Math.min(88, 48 + (distribution[pillars[2].element as Element] ?? 0) * 6 - min * 3));
  return {
    mode: "demo", seed, pillars, dayMaster: pillars[2].stem,
    elementDistribution: distribution, yinYangDistribution: yinYang, tenGodDistribution,
    strengthScore, deficientElements, excessiveElements,
    interactions: [
      `${pillars[0].branch}${pillars[2].branch} 긴장 참고`,
      `${pillars[1].stem}${pillars[2].stem} 상생·상극 참고`,
    ],
    confidence: timeUnknown ? 62 : 78,
  };
}

export class DemoFortuneCalculator implements FortuneCalculator {
  calculate(input: BirthInput): FortuneChart {
    return calculateDemoChartFromSeed(hashBirthInput(input), input.timeUnknown);
  }
}
