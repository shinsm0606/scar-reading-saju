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
    { words: ["저축", "절약", "집", "부동산", "예산", "아파트", "인테리어", "리모델링", "확장", "공사", "견적", "비용"], ruleId: "money-fear-freeze" },
    { words: ["소비", "쇼핑", "카드", "지출", "빚", "가격", "금액"], ruleId: "money-anxiety-spending" },
  ],
  lifestyle: [
    { words: ["과로", "야근", "분노", "압박", "번아웃"], ruleId: "lifestyle-overdrive" },
    { words: ["수면", "잠", "불안", "걱정", "생각"], ruleId: "lifestyle-rumination" },
    { words: ["운동", "식사", "무기력", "생활", "휴식"], ruleId: "lifestyle-stagnation" },
  ],
};

type ConcernScenario = {
  id: "home-project" | "career-change" | "investment" | "relationship-decision" | "recovery" | "general-decision";
  category: Exclude<ConcernCategory, "general">;
  label: string;
  words: string[];
  preferredRuleId: string;
};

const concernScenarios: ConcernScenario[] = [
  {
    id: "home-project",
    category: "money",
    label: "주거·인테리어 결정",
    words: ["인테리어", "리모델링", "아파트", "주택", "확장 공사", "베란다", "샷시", "구축", "견적"],
    preferredRuleId: "money-fear-freeze",
  },
  {
    id: "career-change",
    category: "career",
    label: "퇴사·이직 결정",
    words: ["퇴사", "이직", "직장", "상사", "취업", "승진"],
    preferredRuleId: "career-recognition-collapse",
  },
  {
    id: "investment",
    category: "money",
    label: "투자·대출 결정",
    words: ["투자", "주식", "코인", "대출", "보증", "공동투자"],
    preferredRuleId: "money-emotional",
  },
  {
    id: "relationship-decision",
    category: "relationship",
    label: "관계 유지·정리 결정",
    words: ["이별", "헤어", "결혼", "연애", "연락", "손절", "친구"],
    preferredRuleId: "relationship-winning",
  },
  {
    id: "recovery",
    category: "lifestyle",
    label: "과로·생활 회복",
    words: ["번아웃", "과로", "수면", "잠", "불안", "무기력", "휴식"],
    preferredRuleId: "lifestyle-rumination",
  },
  {
    id: "general-decision",
    category: "lifestyle",
    label: "중요한 선택",
    words: ["할까", "말까", "고민", "선택", "결정"],
    preferredRuleId: "lifestyle-overdrive",
  },
];

function detectConcernScenario(normalized: string): ConcernScenario | undefined {
  return concernScenarios
    .map((scenario) => ({
      scenario,
      matches: scenario.words.filter((word) => normalized.includes(word)).length,
    }))
    .filter(({ matches }) => matches > 0)
    .sort((a, b) => b.matches - a.matches)[0]?.scenario;
}

function buildScenarioGuidance(
  scenario: ConcernScenario,
  chart: FortuneChart,
  linkedWeakness: WarningRule,
  concern: string,
): Pick<NonNullable<AnalysisResult["focusAnalysis"]>, "scenarioLabel" | "understoodContext" | "directAnswer" | "decisionChecklist"> {
  const elementEntries = Object.entries(chart.elementDistribution) as [Element, number][];
  const strongestElement = [...elementEntries].sort((a, b) => b[1] - a[1])[0][0];
  const weakestElement = [...elementEntries].sort((a, b) => a[1] - b[1])[0][0];
  const amount = concern.match(/[\d,.]+\s*(?:천|만|억)?\s*원/)?.[0]?.replace(/\s+/g, "");
  const commonPrefix = `원국에서는 “${linkedWeakness.title}” 반응이 먼저 올라올 수 있습니다. 강한 ${strongestElement}의 방식으로 밀어붙이기 전에 부족한 ${weakestElement}의 검증 절차를 붙여야 합니다.`;

  if (scenario.id === "home-project") {
    return {
      scenarioLabel: scenario.label,
      understoodContext: `노후 주거 공간의 공사 범위를 두고, 확장 여부와 ${amount ? `${amount} 이상의 ` : ""}비용 차이 사이에서 선택하는 문제로 읽었습니다.`,
      directAnswer: `사주만으로 확장 공사를 권하거나 말릴 수는 없습니다. 지금은 “감당할 수 있나”보다 비용 차이가 실제 공간 효용과 안전·단열·결로·추가 공사 위험을 충분히 줄이는지부터 확인해야 합니다. ${commonPrefix}`,
      decisionChecklist: [
        "확장 없이 가구 배치나 수납 변경으로 같은 목적을 달성할 수 있는지 비교한다.",
        "구조·단열·결로·창호·냉난방 영향과 필요한 승인 절차를 관리 주체와 전문가에게 확인한다.",
        "업체마다 동일한 공사 범위표를 주고 자재·철거·폐기·추가 공사 조건이 분리된 견적을 받는다.",
        "공사비 외 임시 거주, 보관, 일정 지연과 예상 밖 보수 비용을 위한 별도 예비비를 둔다.",
        "실제 거주 예정 기간과 확장 공간의 주당 사용 시간을 적은 뒤 비용 차이와 비교한다.",
      ],
    };
  }
  if (scenario.id === "career-change") {
    return {
      scenarioLabel: scenario.label,
      understoodContext: "현재 조직의 불편함과 다음 선택의 조건 사이에서 퇴사 또는 이직 시점을 결정하는 문제로 읽었습니다.",
      directAnswer: `감정이 가장 높은 날에는 퇴사 여부를 확정하지 마십시오. ${commonPrefix} 다음 직장의 조건과 생활비 확보 여부가 문서로 확인된 뒤 결정해야 합니다.`,
      decisionChecklist: ["퇴사 이유를 사람·업무·보상·성장으로 분리한다.", "다음 선택의 최소 조건 세 가지를 적는다.", "생활비와 공백 기간을 숫자로 확인한다.", "72시간 뒤 같은 결론인지 다시 검토한다."],
    };
  }
  if (scenario.id === "investment") {
    return {
      scenarioLabel: scenario.label,
      understoodContext: "수익 가능성과 손실 위험 사이에서 투자·대출 규모 또는 참여 여부를 결정하는 문제로 읽었습니다.",
      directAnswer: `사주는 투자 수익을 보장하지 않습니다. ${commonPrefix} 손실 한도·회수 조건·최악의 경우를 별도 전문 자료로 검증하기 전에는 큰 금액을 결정하지 마십시오.`,
      decisionChecklist: ["손실 가능한 최대 금액을 먼저 정한다.", "수익 설명과 반대되는 자료를 확인한다.", "대출·보증·명의 대여를 분리해 검토한다.", "지인 제안도 계약과 종료 조건을 문서로 남긴다."],
    };
  }
  if (scenario.id === "relationship-decision") {
    return {
      scenarioLabel: scenario.label,
      understoodContext: "관계에서 반복되는 갈등과 유지·거리 두기·정리 사이의 선택 문제로 읽었습니다.",
      directAnswer: `확인되지 않은 의도 추측만으로 관계를 끝내거나 붙잡지 마십시오. ${commonPrefix} 반복된 사실과 한 번의 감정 반응을 구분한 뒤 경계를 말로 확인해야 합니다.`,
      decisionChecklist: ["관찰한 사실과 내 해석을 분리한다.", "상대에게 원하는 변화와 기한을 한 번 명확히 말한다.", "사과보다 행동 변화가 반복되는지 본다.", "위협이나 안전 문제가 있다면 사주와 무관하게 전문 도움을 우선한다."],
    };
  }
  if (scenario.id === "recovery") {
    return {
      scenarioLabel: scenario.label,
      understoodContext: "버티는 생활을 계속할지, 속도를 낮추고 회복 구조를 만들지 묻는 문제로 읽었습니다.",
      directAnswer: `회복은 의지로 버티는 일이 아닙니다. ${commonPrefix} 수면·식사·업무 종료 시간 중 하나부터 고정하고, 지속적인 이상 증상은 의료 전문가에게 확인하십시오.`,
      decisionChecklist: ["일주일간 수면과 업무 종료 시간을 기록한다.", "회복을 방해하는 일정 하나를 줄인다.", "피로한 날 중요한 결정을 미룬다.", "지속되는 통증이나 이상 증상은 의료 전문가와 상담한다."],
    };
  }
  return {
    scenarioLabel: scenario.label,
    understoodContext: "두 선택지의 장단점보다 지금의 감정과 판단 습관이 결론을 왜곡하는지 확인하려는 문제로 읽었습니다.",
    directAnswer: `사주가 대신 결정을 내려주지는 않습니다. ${commonPrefix} 되돌릴 수 있는 선택은 작게 시험하고, 되돌리기 어려운 선택은 비용·기한·중단 조건을 확인한 뒤 결정하십시오.`,
    decisionChecklist: ["원하는 결과와 피하려는 결과를 각각 적는다.", "되돌릴 수 있는 선택인지 구분한다.", "결정 기한과 중단 조건을 정한다.", "이해관계가 없는 사람에게 빠진 조건을 검토받는다."],
  };
}

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
  const scenario = detectConcernScenario(normalized);

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
    ? scenario?.category
      ?? (Object.entries(inferredCategory).sort((a, b) => b[1] - a[1])[0]?.[0] as Exclude<ConcernCategory, "general"> | undefined)
      ?? "lifestyle"
    : requestedCategory;
  const routes = keywordMatches.filter((match) => match.category === category);
  const rules = categoryRules[category];
  const ranked = rules
    .map((rule) => ({
      rule,
      score: (ruleScore(rule, chart) ?? 0)
        + routes.filter((route) => route.ruleId === rule.id).length * 60
        + (scenario?.preferredRuleId === rule.id ? 80 : 0)
        + stableHash(`${chart.seed}:${normalized}:${rule.id}`) % 1000 / 1000,
    }))
    .sort((a, b) => b.score - a.score);
  const rule = ranked[0].rule;
  const linkedWeakness = [...weaknesses].sort((a, b) => {
    const overlap = (candidate: WarningRule) => candidate.tags.filter((tag) => rule.tags.includes(tag)).length;
    return overlap(b) - overlap(a);
  })[0];
  const scenarioGuidance = scenario
    ? buildScenarioGuidance(scenario, chart, linkedWeakness, concern)
    : {};
  return {
    category,
    matchedKeywords: [...new Set(routes.map((route) => route.word))].slice(0, 5),
    rule,
    linkedWeakness,
    ...scenarioGuidance,
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
    ? focusAnalysis.directAnswer
      ?? `입력한 고민에서는 “${focusAnalysis.rule.title}” 문제가 원국의 핵심 약점과 겹칩니다. ${focusAnalysis.rule.actionRules[0]}`
    : undefined;

  return {
    verdict: verdicts[riskLevel],
    headline: primary.title,
    summary: `${chart.dayMaster} 일간을 중심으로 ${strongestElement} 기운과 ${dominantTenGod} 성향이 두드러집니다. 힘이 없어서 무너지는 구조가 아니라, 강점이 과속할 때 부족한 ${weakestElement}의 제동 방식이 따라오지 못하는 구조입니다.`,
    coreRisk: `${primary.summary} ${primary.consequences}`,
    protectiveFactor: `보호 요인은 ${strongestElement}의 ${strengths[strongestElement]}입니다. 다만 ${weakestElement}의 ${compensations[weakestElement]}을 붙여야 이 힘이 독주가 아닌 성과로 남습니다.`,
    currentFlow: `${currentAnnual.year}년 ${currentAnnual.korean} 세운은 ${currentAnnual.theme}입니다. 현재 자극도는 ${currentAnnual.pressure}이며, ${currentAnnual.warning}`,
    firstPriority: focusAnalysis?.decisionChecklist?.[0] ?? focusAnalysis?.rule.actionRules[0] ?? primary.actionRules[0],
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
