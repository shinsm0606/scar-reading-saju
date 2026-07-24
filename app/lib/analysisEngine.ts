import { actionRules } from "../data/actionRules";
import { balanceInterpretations } from "../data/balanceInterpretations";
import { careerWarnings } from "../data/careerWarnings";
import { dayMasterInterpretations } from "../data/dayMasterInterpretations";
import { elementInterpretations } from "../data/elementInterpretations";
import { lifestyleWarnings } from "../data/lifestyleWarnings";
import { moneyWarnings } from "../data/moneyWarnings";
import { relationshipWarnings } from "../data/relationshipWarnings";
import { tenGodInterpretations } from "../data/tenGodInterpretations";
import type { AnalysisResult, ConcernCategory, Element, FortuneChart, Intensity, RiskLevel, WarningRule } from "../types/fortune";
import { calculateAnnualFlows } from "./flowCalculator";

const weaknessRules = [
  ...elementInterpretations,
  ...dayMasterInterpretations,
  ...tenGodInterpretations,
  ...balanceInterpretations,
];

function stableHash(value: string): number {
  let hash = 2166136261;
  for (const character of value) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function conditionScore(condition: string, chart: FortuneChart): number | null {
  const [type, value] = condition.split(":");
  if (type === "excess") {
    const element = value as Element;
    return chart.excessiveElements.includes(element)
      ? 34 + chart.elementDistribution[element] * 7
      : null;
  }
  if (type === "deficient") {
    const element = value as Element;
    return chart.deficientElements.includes(element)
      ? 34 + Math.max(0, 2 - chart.elementDistribution[element]) * 9
      : null;
  }
  if (type === "tenGod") {
    const count = chart.tenGodDistribution[value] ?? 0;
    return count > 0 ? 12 + count * 14 : null;
  }
  if (type === "dayMaster") {
    return chart.dayMaster === value ? 42 : null;
  }
  if (type === "strength" && value === "strong") {
    return chart.strengthScore >= 62 ? 25 + (chart.strengthScore - 62) * 1.4 : null;
  }
  if (type === "strength" && value === "weak") {
    return chart.strengthScore <= 38 ? 25 + (38 - chart.strengthScore) * 1.4 : null;
  }
  if (type === "fallback") return 1;
  return null;
}

function ruleScore(rule: WarningRule, chart: FortuneChart): number | null {
  const signals = rule.conditions
    .map((condition) => conditionScore(condition, chart))
    .filter((score): score is number => score !== null);
  if (signals.length === 0) return null;
  const strongestSignal = Math.max(...signals);
  const repeatedSignals = signals.slice(1).reduce((sum, score) => sum + Math.min(score, 18) * 0.25, 0);
  const deterministicTieBreak = stableHash(`${chart.seed}:${rule.id}`) % 1000 / 1000;
  return strongestSignal + repeatedSignals + rule.severity * 3 + deterministicTieBreak;
}

function rankMatchingRules(rules: WarningRule[], chart: FortuneChart): WarningRule[] {
  return rules
    .map((rule) => ({ rule, score: ruleScore(rule, chart) }))
    .filter((item): item is { rule: WarningRule; score: number } => item.score !== null)
    .sort((a, b) => b.score - a.score)
    .map(({ rule }) => rule);
}

const concernKeywords: Record<Exclude<ConcernCategory, "general">, Array<{ words: string[]; ruleId: string }>> = {
  relationship: [
    { words: ["답장", "연락", "의심", "속마음", "썸", "외도"], ruleId: "relationship-mind-reading" },
    { words: ["서운", "희생", "배신", "가족", "부모", "친구"], ruleId: "relationship-scorekeeping" },
    { words: ["싸움", "갈등", "말투", "이별", "연애", "결혼"], ruleId: "relationship-winning" },
  ],
  career: [
    { words: ["퇴사", "이직", "상사", "인정", "승진"], ruleId: "career-recognition-collapse" },
    { words: ["준비", "완벽", "시험", "취업", "실행"], ruleId: "career-preparation-loop" },
    { words: ["조직", "회사", "규칙", "보고", "직장"], ruleId: "career-rigid-order" },
  ],
  money: [
    { words: ["투자", "대출", "보증", "공동", "지인", "코인", "주식"], ruleId: "money-emotional" },
    { words: ["저축", "절약", "집", "부동산", "예산"], ruleId: "money-fear-freeze" },
    { words: ["소비", "쇼핑", "카드", "지출", "빚"], ruleId: "money-anxiety-spending" },
  ],
  lifestyle: [
    { words: ["과로", "야근", "분노", "압박", "번아웃"], ruleId: "lifestyle-overdrive" },
    { words: ["수면", "잠", "불안", "걱정", "생각"], ruleId: "lifestyle-rumination" },
    { words: ["운동", "식사", "무기력", "생활", "휴식"], ruleId: "lifestyle-stagnation" },
  ],
};

const categoryRules: Record<Exclude<ConcernCategory, "general">, WarningRule[]> = {
  relationship: relationshipWarnings,
  career: careerWarnings,
  money: moneyWarnings,
  lifestyle: lifestyleWarnings,
};

function buildFocusAnalysis(
  chart: FortuneChart,
  weaknesses: WarningRule[],
  requestedCategory: ConcernCategory,
  concern: string,
): AnalysisResult["focusAnalysis"] {
  const normalized = concern.trim().toLowerCase();
  if (!normalized) return undefined;

  const keywordMatches = Object.entries(concernKeywords).flatMap(([category, routes]) =>
    routes.flatMap(({ words, ruleId }) =>
      words
        .filter((word) => normalized.includes(word))
        .map((word) => ({ category: category as Exclude<ConcernCategory, "general">, word, ruleId })),
    ),
  );
  const inferredCategory = keywordMatches.reduce<Record<string, number>>((counts, match) => {
    counts[match.category] = (counts[match.category] ?? 0) + 1;
    return counts;
  }, {});
  const category = requestedCategory === "general"
    ? (Object.entries(inferredCategory).sort((a, b) => b[1] - a[1])[0]?.[0] as Exclude<ConcernCategory, "general"> | undefined) ?? "relationship"
    : requestedCategory;
  const routes = keywordMatches.filter((match) => match.category === category);
  const rules = categoryRules[category];
  const ranked = rules
    .map((rule) => ({
      rule,
      score: (ruleScore(rule, chart) ?? 0)
        + routes.filter((route) => route.ruleId === rule.id).length * 60
        + stableHash(`${chart.seed}:${normalized}:${rule.id}`) % 1000 / 1000,
    }))
    .sort((a, b) => b.score - a.score);
  const rule = ranked[0].rule;
  const linkedWeakness = [...weaknesses].sort((a, b) => {
    const overlap = (candidate: WarningRule) => candidate.tags.filter((tag) => rule.tags.includes(tag)).length;
    return overlap(b) - overlap(a);
  })[0];
  return {
    category,
    matchedKeywords: [...new Set(routes.map((route) => route.word))].slice(0, 5),
    rule,
    linkedWeakness,
  };
}

export function deduplicateWarnings(rules: WarningRule[]): WarningRule[] {
  const ids = new Set<string>();
  const titles = new Set<string>();
  return rules.filter((rule) => {
    if (ids.has(rule.id) || titles.has(rule.title)) return false;
    ids.add(rule.id);
    titles.add(rule.title);
    return true;
  });
}

export function calculateRisk(score: number): RiskLevel {
  if (score < 28) return "안정";
  if (score < 43) return "주의";
  if (score < 59) return "경계";
  if (score < 75) return "위험";
  return "고위험";
}

function selectFinalWarning(weaknesses: WarningRule[], seed: number): string {
  const tags = new Set(weaknesses.flatMap((rule) => rule.tags));
  if (tags.has("화") || tags.has("상관")) {
    return "당신의 가장 큰 적은 능력 부족이 아니라, 감정이 확신으로 변하는 순간입니다.";
  }
  if (tags.has("수") || tags.has("편인")) {
    return "확인하지 않은 생각을 사실로 받아들이는 순간, 통찰은 가장 위험한 착각이 됩니다.";
  }
  if (tags.has("금") || tags.has("정관")) {
    return "정답을 지키는 데 집착하면, 사람과 기회를 함께 잘라낼 수 있습니다.";
  }
  if (tags.has("토") || tags.has("정재")) {
    return "참는 것이 강함이라고 믿는 순간, 빠져나올 기회를 놓치게 됩니다.";
  }
  if (tags.has("목") || tags.has("편재")) {
    return "시작의 속도보다 끝까지 책임지는 힘이 당신의 운을 결정합니다.";
  }
  const finals = [
    "당신을 무너뜨리는 것은 운이 아니라, 상처받은 순간 모든 것을 단정하는 습관입니다.",
    "불안이 사실처럼 느껴지는 순간일수록, 결론보다 확인이 먼저입니다.",
    "지금의 자존심을 지키려다 내일의 선택권을 버리지 마십시오.",
  ];
  return finals[seed % finals.length];
}

function buildOverallAssessment(result: Omit<AnalysisResult, "overallAssessment">): AnalysisResult["overallAssessment"] {
  const { chart, weaknesses, riskLevel, annualFlows, focusAnalysis } = result;
  const elementEntries = Object.entries(chart.elementDistribution) as [Element, number][];
  const strongestElement = [...elementEntries].sort((a, b) => b[1] - a[1])[0][0];
  const weakestElement = [...elementEntries].sort((a, b) => a[1] - b[1])[0][0];
  const dominantTenGod = Object.entries(chart.tenGodDistribution).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "비견";
  const currentAnnual = annualFlows[2];
  const verdicts: Record<RiskLevel, string> = {
    안정: "균형 유지형",
    주의: "습관 교정 필요",
    경계: "반복 패턴 경계",
    위험: "우선순위 재정비 필요",
    고위험: "생활 구조 즉시 점검",
  };
  const strengths: Record<Element, string> = {
    목: "방향을 만들고 시작하는 힘",
    화: "분위기를 움직이고 표현하는 힘",
    토: "책임을 지고 지속하는 힘",
    금: "기준을 세우고 정리하는 힘",
    수: "맥락을 읽고 우회로를 찾는 힘",
  };
  const compensations: Record<Element, string> = {
    목: "작은 첫 행동과 장기 방향",
    화: "즉시 표현하고 반응을 확인하는 습관",
    토: "반복 가능한 생활 리듬",
    금: "거절·정리·중단 기준",
    수: "정보 확인과 감정의 냉각 시간",
  };
  const primary = weaknesses[0];
  const focusConclusion = focusAnalysis
    ? `입력한 고민에서는 “${focusAnalysis.rule.title}” 문제가 원국의 핵심 약점과 겹칩니다. ${focusAnalysis.rule.actionRules[0]}`
    : undefined;

  return {
    verdict: verdicts[riskLevel],
    headline: primary.title,
    summary: `${chart.dayMaster} 일간을 중심으로 ${strongestElement} 기운과 ${dominantTenGod} 성향이 두드러집니다. 힘이 없어서 무너지는 구조가 아니라, 강점이 과속할 때 부족한 ${weakestElement}의 제동 방식이 따라오지 못하는 구조입니다.`,
    coreRisk: `${primary.summary} ${primary.consequences}`,
    protectiveFactor: `보호 요인은 ${strongestElement}의 ${strengths[strongestElement]}입니다. 다만 ${weakestElement}의 ${compensations[weakestElement]}을 붙여야 이 힘이 독주가 아닌 성과로 남습니다.`,
    currentFlow: `${currentAnnual.year}년 ${currentAnnual.korean} 세운은 ${currentAnnual.theme}입니다. 현재 자극도는 ${currentAnnual.pressure}이며, ${currentAnnual.warning}`,
    firstPriority: focusAnalysis?.rule.actionRules[0] ?? primary.actionRules[0],
    ...(focusConclusion ? { focusConclusion } : {}),
  };
}

export function analyzeChart(
  chart: FortuneChart,
  focus?: { category: ConcernCategory; concern: string },
  referenceYear = new Date().getFullYear(),
): AnalysisResult {
  const ranked = rankMatchingRules(weaknessRules, chart);
  const fallbacks = rankMatchingRules(actionRules, chart);
  const weaknesses = deduplicateWarnings([...ranked, ...fallbacks]).slice(0, 3);
  const values = Object.values(chart.elementDistribution);
  const imbalance = Math.max(...values) - Math.min(...values);
  const strengthDeviation = Math.abs(chart.strengthScore - 50);
  const signalSeverity = weaknesses.reduce((sum, item) => sum + item.severity, 0);
  const riskScore = Math.min(
    92,
    Math.max(18, 19 + imbalance * 6.5 + strengthDeviation * 0.45 + signalSeverity * 1.8 + (chart.confidence < 70 ? 3 : 0)),
  );
  const annualFlows = calculateAnnualFlows(chart, referenceYear);
  const partialResult: Omit<AnalysisResult, "overallAssessment"> = {
    chart,
    riskLevel: calculateRisk(riskScore),
    riskScore,
    weaknesses,
    finalWarning: selectFinalWarning(weaknesses, chart.seed),
    annualFlows,
  };
  if (focus) {
    partialResult.focusAnalysis = buildFocusAnalysis(chart, weaknesses, focus.category, focus.concern);
  }
  return {
    ...partialResult,
    overallAssessment: buildOverallAssessment(partialResult),
  };
}

export function selectSectionRules(chart: FortuneChart) {
  const choose = (rules: WarningRule[]): WarningRule =>
    rankMatchingRules(rules, chart)[0]
    ?? rules[stableHash(`${chart.seed}:${rules.map((rule) => rule.id).join(":")}`) % rules.length];

  return {
    relationship: choose(relationshipWarnings),
    career: choose(careerWarnings),
    money: choose(moneyWarnings),
    lifestyle: choose(lifestyleWarnings),
  };
}

export function tone(text: string, intensity: Intensity): string {
  if (intensity === "direct") return text;
  if (intensity === "realistic") {
    return text
      .replaceAll("하지 마십시오", "하지 않는 편이 안전합니다")
      .replaceAll("할 수 있습니다", "할 가능성이 큽니다")
      .replaceAll("무너뜨릴", "흔들 수 있는");
  }
  return text
    .replaceAll("하지 마십시오", "잠시 미루는 것이 도움이 됩니다")
    .replaceAll("위험합니다", "주의가 필요합니다")
    .replaceAll("망가집니다", "어려워질 수 있습니다")
    .replaceAll("무너뜨릴", "부담을 줄 수 있는")
    .replaceAll("삼킬 수 있습니다", "흐릴 수 있습니다");
}
