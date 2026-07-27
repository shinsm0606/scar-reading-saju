import { excessEnvironmentRules } from "../data/environmentGuidance";
import type {
  CompatibilityMetric,
  CompatibilityProfile,
  Element,
  FortuneChart,
  GroupCompatibilityReport,
  GroupPurpose,
  PairCompatibility,
  TravelRange,
} from "../types/fortune";
import { calculateAnnualFlows } from "./flowCalculator";
import { recommendPlaces } from "./placeRecommendation";

const elements: Element[] = ["목", "화", "토", "금", "수"];
const stemElements: Record<string, Element> = {
  갑: "목", 을: "목", 병: "화", 정: "화", 무: "토",
  기: "토", 경: "금", 신: "금", 임: "수", 계: "수",
};
const relationSets: Record<string, string[]> = {
  합: ["자축", "인해", "묘술", "진유", "사신", "오미"],
  충: ["자오", "축미", "인신", "묘유", "진술", "사해"],
  형: ["인사", "사신", "신인", "축술", "술미", "미축", "자묘", "묘자", "진진", "오오", "유유", "해해"],
  파: ["자유", "축진", "인해", "묘오", "사신", "미술"],
  해: ["자미", "축오", "인사", "묘진", "신해", "유술"],
};
const relationWeight: Record<string, number> = { 합: 8, 충: -6, 형: -5, 파: -3, 해: -3 };
const purposeMeta: Record<GroupPurpose, {
  label: string;
  strength: string;
  risk: string;
  rules: string[];
}> = {
  friends: {
    label: "친구 모임",
    strength: "역할을 고정하지 않을 때 서로의 생활 경험을 넓히는 힘이 생깁니다.",
    risk: "친분을 이유로 비용과 시간 기준을 말하지 않으면 서운함이 뒤늦게 쌓입니다.",
    rules: ["모임 날짜와 비용 상한을 먼저 공개한다.", "대답하지 않은 사람의 의도를 추측해 확정하지 않는다."],
  },
  family: {
    label: "가족",
    strength: "익숙한 관계에서 빠르게 움직일 수 있지만 역할을 다시 합의할 때 장점이 살아납니다.",
    risk: "오래된 역할을 현재의 의무처럼 강요하면 대화보다 방어가 먼저 올라옵니다.",
    rules: ["과거의 희생을 현재 결정의 근거로 사용하지 않는다.", "부탁·의견·통보를 명확히 구분한다."],
  },
  travel: {
    label: "여행 모임",
    strength: "서로 다른 속도를 코스에 분리하면 활동과 휴식을 모두 확보할 수 있습니다.",
    risk: "한 사람이 일정·예약·운전을 독점하면 작은 변경도 관계 갈등으로 번집니다.",
    rules: ["필수 일정은 하루 두 개 이하로 제한한다.", "운전·예약·정산 담당을 출발 전에 나눈다."],
  },
  work: {
    label: "회사·프로젝트 팀",
    strength: "실행과 검토 역할이 분리될 때 결과물의 속도와 완성도가 함께 올라갑니다.",
    risk: "회의에서 빠른 목소리가 결론을 독점하면 조용한 검토 신호가 사라집니다.",
    rules: ["결정 전에 반대 검토 담당을 한 명 지정한다.", "업무 책임자와 최종 승인자를 문서로 분리한다."],
  },
  business: {
    label: "사업·공동 의사결정",
    strength: "기회 탐색과 손실 통제가 서로 다른 사람에게 배분될 때 판단 폭이 넓어집니다.",
    risk: "친분과 확신을 계약·정산·중단 조건보다 앞세우면 관계와 돈이 동시에 흔들립니다.",
    rules: ["공동비용·지분·중단 조건을 실행 전에 문서화한다.", "큰 금액은 당일 합의하지 않고 별도 검증일을 둔다."],
  },
};

function clamp(value: number, min = 20, max = 92): number {
  return Math.round(Math.max(min, Math.min(max, value)));
}

function stableHash(value: string): number {
  let hash = 2166136261;
  for (const character of value) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function profileSignature(name: string, chart: FortuneChart): string {
  return `${name}:${chart.seed}:${chart.pillars.map(({ stem, branch }) => `${stem}${branch}`).join("")}`;
}

export function createCompatibilityProfile(name: string, chart: FortuneChart): CompatibilityProfile {
  const signature = profileSignature(name.trim(), chart);
  return {
    id: `profile-${stableHash(signature).toString(36)}`,
    name: name.trim() || "이름 없음",
    chart,
    addedAt: new Date().toISOString(),
  };
}

function crossInteractions(first: FortuneChart, second: FortuneChart): string[] {
  const firstBranches = first.pillars.map(({ branch }) => branch).filter((branch) => branch !== "?");
  const secondBranches = second.pillars.map(({ branch }) => branch).filter((branch) => branch !== "?");
  const found = new Set<string>();
  firstBranches.forEach((a) => secondBranches.forEach((b) => {
    const direct = `${a}${b}`;
    const reverse = `${b}${a}`;
    Object.entries(relationSets).forEach(([relation, pairs]) => {
      if (pairs.includes(direct) || pairs.includes(reverse)) found.add(`${a}·${b} ${relation}`);
    });
  }));
  return [...found];
}

function elementDistance(first: FortuneChart, second: FortuneChart): number {
  const totalA = Object.values(first.elementDistribution).reduce((sum, value) => sum + value, 0) || 1;
  const totalB = Object.values(second.elementDistribution).reduce((sum, value) => sum + value, 0) || 1;
  return elements.reduce((sum, element) => (
    sum + Math.abs(first.elementDistribution[element] / totalA - second.elementDistribution[element] / totalB)
  ), 0);
}

function complementCount(first: FortuneChart, second: FortuneChart): number {
  return first.deficientElements.filter((element) => second.elementDistribution[element] >= 2).length
    + second.deficientElements.filter((element) => first.elementDistribution[element] >= 2).length;
}

function metric(id: CompatibilityMetric["id"], label: string, score: number, description: string): CompatibilityMetric {
  return { id, label, score: clamp(score), description };
}

function grade(score: number): string {
  if (score >= 78) return "보완이 강한 관계";
  if (score >= 65) return "조율하면 단단한 관계";
  if (score >= 52) return "긴장과 성장이 함께 있는 관계";
  return "운영 규칙이 꼭 필요한 관계";
}

export function analyzePair(first: CompatibilityProfile, second: CompatibilityProfile): PairCompatibility {
  const interactions = crossInteractions(first.chart, second.chart);
  const relationTotal = interactions.reduce((sum, item) => sum + (relationWeight[item.split(" ").at(-1) ?? ""] ?? 0), 0);
  const complements = complementCount(first.chart, second.chart);
  const distance = elementDistance(first.chart, second.chart);
  const strengthGap = Math.abs(first.chart.strengthScore - second.chart.strengthScore);
  const dayElementA = stemElements[first.chart.dayMaster] ?? "토";
  const dayElementB = stemElements[second.chart.dayMaster] ?? "토";
  const sameDayElement = dayElementA === dayElementB;
  const dayBranchA = first.chart.pillars[2]?.branch;
  const dayBranchB = second.chart.pillars[2]?.branch;
  const dayRelation = interactions.find((item) => item.startsWith(`${dayBranchA}·${dayBranchB} `));
  const hasConflict = interactions.some((item) => / 충$| 형$| 파$| 해$/.test(item));
  const hasCombine = interactions.some((item) => item.endsWith(" 합"));

  const metrics = [
    metric("emotion", "정서적 호흡", 64 + complements * 8 - distance * 13 + (hasCombine ? 5 : 0),
      complements > 0 ? "한쪽의 부족한 반응을 다른 쪽이 채울 여지가 있습니다." : "감정 회복 방식이 비슷하지 않을 수 있어 말로 확인해야 합니다."),
    metric("communication", "대화 방식", 66 + relationTotal * .6 - (hasConflict ? 4 : 0),
      hasConflict ? "강한 반응이 올라올 때 사실 확인보다 결론이 먼저 나올 수 있습니다." : "직접 충돌 신호가 적어 대화 순서를 정하면 안정적입니다."),
    metric("daily", "생활 궁합", 72 - distance * 18 - strengthGap * .12,
      distance < .5 ? "생활 속도와 에너지 배분이 비교적 비슷합니다." : "휴식·약속·소비 속도를 같은 기준으로 묶지 않는 편이 좋습니다."),
    metric("decision", "의사결정", 61 + (sameDayElement ? -2 : 5) + relationTotal * .45,
      sameDayElement ? "판단 기준이 비슷해 빠르지만 반대 검토가 사라질 수 있습니다." : "다른 판단 기준을 역할로 나누면 검토 폭이 넓어집니다."),
    metric("resilience", "갈등 회복력", 65 + complements * 6 - (hasConflict ? 8 : 0) - strengthGap * .08,
      hasConflict ? "갈등을 그날 끝내려 하기보다 식히는 시간을 합의해야 합니다." : "갈등 신호가 낮아도 불편을 미루지 않는 확인 절차가 필요합니다."),
  ];
  const score = clamp(metrics.reduce((sum, item) => sum + item.score, 0) / metrics.length + (dayRelation ? 2 : 0));
  const synergy = [
    complements > 0
      ? `서로 부족한 오행을 ${complements}개 축에서 보완합니다. 익숙하지 않은 방식을 상대에게 배울 수 있습니다.`
      : "부족한 오행을 자동으로 채우는 관계는 아닙니다. 필요한 역할을 의식적으로 나눠야 합니다.",
    sameDayElement
      ? `두 사람의 일간 오행이 ${dayElementA}로 같아 판단의 출발점이 빠르게 통합니다.`
      : `${dayElementA}와 ${dayElementB}의 다른 판단 방식이 실행과 검토를 분담하는 장점이 됩니다.`,
  ];
  const friction = [
    hasConflict
      ? `두 원국 사이에 충·형·파·해가 ${interactions.filter((item) => / 충$| 형$| 파$| 해$/.test(item)).length}개 확인됩니다. 사건 예고가 아니라 반복 마찰 지점입니다.`
      : "강한 지지 충돌은 적지만 불편을 말하지 않으면 오히려 늦게 드러날 수 있습니다.",
    distance >= .55
      ? "생활 에너지 분포 차이가 큽니다. 한 사람의 정상 속도를 다른 사람에게 강요하지 마십시오."
      : "생활 리듬이 비슷해도 같은 약점을 동시에 방치할 가능성을 경계해야 합니다.",
  ];
  return {
    memberIds: [first.id, second.id],
    memberNames: [first.name, second.name],
    score,
    grade: grade(score),
    metrics,
    interactions,
    synergy,
    friction,
    action: hasConflict
      ? "감정이 올라온 날에는 결론을 확정하지 말고, 각자 확인한 사실과 해석을 분리해 다음 날 다시 대화하십시오."
      : "중요한 결정은 한 사람이 제안하고 다른 사람이 반대 조건을 검토하는 순서로 진행하십시오.",
  };
}

function aggregateElements(profiles: CompatibilityProfile[]): Record<Element, number> {
  const totals = { 목: 0, 화: 0, 토: 0, 금: 0, 수: 0 };
  profiles.forEach(({ chart }) => elements.forEach((element) => {
    const chartTotal = Object.values(chart.elementDistribution).reduce((sum, value) => sum + value, 0) || 1;
    totals[element] += chart.elementDistribution[element] / chartTotal;
  }));
  elements.forEach((element) => { totals[element] = Math.round((totals[element] / profiles.length) * 100); });
  return totals;
}

export function analyzeGroup(
  profiles: CompatibilityProfile[],
  purpose: GroupPurpose,
  options: { range?: TravelRange; baseRegion?: string } = {},
): GroupCompatibilityReport {
  if (profiles.length < 2 || profiles.length > 8) throw new Error("궁합 분석은 2명 이상 8명 이하만 가능합니다.");
  const pairReports: PairCompatibility[] = [];
  for (let i = 0; i < profiles.length; i += 1) {
    for (let j = i + 1; j < profiles.length; j += 1) pairReports.push(analyzePair(profiles[i], profiles[j]));
  }
  const sortedPairs = [...pairReports].sort((a, b) => b.score - a.score);
  const score = clamp(pairReports.reduce((sum, pair) => sum + pair.score, 0) / pairReports.length);
  const distribution = aggregateElements(profiles);
  const sortedElements = [...elements].sort((a, b) => distribution[a] - distribution[b]);
  const supportiveElements = sortedElements.slice(0, 2);
  const excessiveElements = [...sortedElements].reverse().slice(0, 2);
  const connectionScores = profiles.map((profile) => {
    const connections = pairReports.filter(({ memberIds }) => memberIds.includes(profile.id));
    return { name: profile.name, score: connections.reduce((sum, pair) => sum + pair.score, 0) / connections.length };
  }).sort((a, b) => b.score - a.score);
  const meta = purposeMeta[purpose];
  const currentYear = new Date().getFullYear();
  const currentAnnuals = profiles.map(({ chart }) => (
    calculateAnnualFlows(chart, currentYear).find(({ year }) => year === currentYear)
  )).filter((flow) => Boolean(flow));
  const highPressureCount = currentAnnuals.filter((flow) => flow?.pressure === "높음").length;
  const annualElements = currentAnnuals.map((flow) => flow?.element).filter((element): element is Element => Boolean(element));
  const repeatedAnnualElement = elements
    .map((element) => ({ element, count: annualElements.filter((value) => value === element).length }))
    .sort((a, b) => b.count - a.count)[0];
  const currentFlow = highPressureCount >= Math.ceil(profiles.length / 2)
    ? `${currentYear}년에는 구성원 절반 이상에게 변화 압력이 높습니다. 큰 결정과 예약 변경을 한 번에 몰지 말고 검토일을 따로 두십시오.`
    : `${currentYear}년에는 ${repeatedAnnualElement.element} 흐름이 공통으로 가장 많이 작동합니다. 같은 속도를 강요하기보다 실행·검토·회복 역할을 분리하십시오.`;
  const seed = profiles.reduce((sum, profile) => sum + profile.chart.seed, 0) + stableHash(purpose) + currentYear;
  const places = recommendPlaces({
    supportiveElements,
    excessiveElements,
    seed,
    range: options.range ?? "nationwide",
    baseRegion: options.baseRegion,
    count: 4,
  });
  const relationPressure = pairReports.filter(({ interactions }) => interactions.some((item) => / 충$| 형$| 파$| 해$/.test(item))).length;
  const sharedTopElement = excessiveElements[0];
  const operatingRules = [
    ...meta.rules,
    relationPressure > 0
      ? "감정이 격해진 날에는 단체 결론·결제·예약 변경을 확정하지 않는다."
      : "반대 의견이 없더라도 결정 전 한 명은 실패 조건을 검토한다.",
    "비용·시간·담당자를 말로만 합의하지 않고 짧게 기록한다.",
    `${connectionScores[0].name}에게 중재 책임을 고정하지 말고 회차마다 진행 역할을 바꾼다.`,
  ].slice(0, 5);
  return {
    memberCount: profiles.length,
    purpose,
    purposeLabel: meta.label,
    score,
    grade: grade(score),
    headline: `${profiles.length}명의 장점보다, 같은 약점이 동시에 올라오는 순간을 관리해야 합니다`,
    summary: `${meta.label} 기준 평균 연결 지표는 ${score}점입니다. 점수는 관계의 운명을 뜻하지 않습니다. 모임 전체에서 ${sharedTopElement} 반응이 강하고 ${supportiveElements.join("·")} 방식이 부족하므로, 빠른 결론보다 역할과 회복 시간을 분리해야 합니다.`,
    currentYear,
    currentFlow,
    elementDistribution: distribution,
    supportiveElements,
    excessiveElements,
    pairReports: sortedPairs,
    strongestPair: sortedPairs[0],
    carefulPair: sortedPairs.at(-1) ?? sortedPairs[0],
    bridgeMember: connectionScores[0].name,
    strengths: [
      meta.strength,
      `${sortedPairs[0].memberNames.join("·")} 조합은 현재 구성에서 상호 보완 신호가 가장 선명합니다.`,
      `${supportiveElements.join("·")} 역할을 일정과 환경에 의도적으로 넣으면 모임 전체의 과속을 낮출 수 있습니다.`,
    ],
    risks: [
      meta.risk,
      `${sortedPairs.at(-1)?.memberNames.join("·")} 조합은 좋고 나쁨보다 대화 순서와 생활 속도 차이를 먼저 확인해야 합니다.`,
      `${sharedTopElement} 반응이 동시에 강해질 때 같은 확신을 서로 검증 없이 강화할 수 있습니다.`,
    ],
    operatingRules,
    recommendedPlaces: places.map(({ name, region, category, reason }) => ({ name, region, category, reason })),
    avoidEnvironment: excessEnvironmentRules[sharedTopElement][0].environment,
    disclaimer: "이 결과는 전통 명리학 요소를 규칙 기반으로 비교한 자기 성찰용 참고값입니다. 관계의 성공·이별·배신이나 특정 사건을 예측하지 않습니다.",
  };
}
