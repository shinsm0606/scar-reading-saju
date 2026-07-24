import { actionRules } from "../data/actionRules";
import { balanceInterpretations } from "../data/balanceInterpretations";
import { dayMasterInterpretations } from "../data/dayMasterInterpretations";
import { elementInterpretations } from "../data/elementInterpretations";
import { interactionInterpretations } from "../data/interactionInterpretations";
import { tenGodInterpretations } from "../data/tenGodInterpretations";
import type { AnalysisResult, Element, FortuneChart, Intensity, RiskLevel, WarningRule } from "../types/fortune";
import { calculateAnnualFlows } from "./flowCalculator";

const weaknessRules = [
  ...dayMasterInterpretations,
  ...elementInterpretations,
  ...tenGodInterpretations,
  ...balanceInterpretations,
  ...interactionInterpretations,
];

function stableHash(value: string): number {
  let hash = 2166136261;
  for (const character of value) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function matchingInteractions(chart: FortuneChart, value: string): string[] {
  return chart.interactions.filter((item) => item.endsWith(` ${value}`));
}

function conditionScore(condition: string, chart: FortuneChart): number | null {
  const [type, value] = condition.split(":");
  if (type === "excess") {
    const element = value as Element;
    return chart.excessiveElements.includes(element)
      ? 46 + chart.elementDistribution[element] * 9
      : null;
  }
  if (type === "deficient") {
    const element = value as Element;
    return chart.deficientElements.includes(element)
      ? 43 + Math.max(0, 2 - chart.elementDistribution[element]) * 10
      : null;
  }
  if (type === "tenGod") {
    const count = chart.tenGodDistribution[value] ?? 0;
    return count > 0 ? 22 + count * 15 : null;
  }
  if (type === "dayMaster") return chart.dayMaster === value ? 64 : null;
  if (type === "strength" && value === "strong") {
    return chart.strengthScore >= 62 ? 38 + (chart.strengthScore - 62) * 1.5 : null;
  }
  if (type === "strength" && value === "weak") {
    return chart.strengthScore <= 38 ? 38 + (38 - chart.strengthScore) * 1.5 : null;
  }
  if (type === "interaction") {
    const count = matchingInteractions(chart, value).length;
    return count > 0 ? 39 + count * 12 : null;
  }
  if (type === "fallback") return 1;
  return null;
}

function ruleScore(rule: WarningRule, chart: FortuneChart): number | null {
  const signals = rule.conditions
    .map((condition) => conditionScore(condition, chart))
    .filter((score): score is number => score !== null)
    .sort((a, b) => b - a);
  if (signals.length === 0) return null;
  const strongestSignal = signals[0];
  const repeatedSignals = signals.slice(1).reduce((sum, score) => sum + Math.min(score, 24) * 0.3, 0);
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

function signalFamily(rule: WarningRule): string {
  const type = rule.conditions[0]?.split(":")[0] ?? rule.id;
  return type === "excess" || type === "deficient" ? "element" : type;
}

function selectDiverseWeaknesses(chart: FortuneChart): WarningRule[] {
  const ranked = rankMatchingRules(weaknessRules, chart);
  const selected: WarningRule[] = [];
  const usedFamilies = new Set<string>();
  const dayMasterRule = ranked.find((rule) => rule.conditions.includes(`dayMaster:${chart.dayMaster}`));
  if (dayMasterRule) {
    selected.push(dayMasterRule);
    usedFamilies.add("dayMaster");
  }
  for (const rule of ranked) {
    if (selected.includes(rule)) continue;
    const family = signalFamily(rule);
    if (usedFamilies.has(family)) continue;
    selected.push(rule);
    usedFamilies.add(family);
    if (selected.length === 3) break;
  }
  for (const rule of [...ranked, ...actionRules]) {
    if (selected.some((item) => item.id === rule.id)) continue;
    selected.push(rule);
    if (selected.length === 3) break;
  }
  return deduplicateWarnings(selected).slice(0, 3);
}

function conditionEvidence(condition: string, chart: FortuneChart): string | null {
  const [type, value] = condition.split(":");
  if (conditionScore(condition, chart) === null) return null;
  if (type === "dayMaster") return `판단의 중심인 일간이 ${value}입니다`;
  if (type === "excess") return `${value}가 ${chart.elementDistribution[value as Element]}개로 원국에서 가장 강합니다`;
  if (type === "deficient") return `${value}가 ${chart.elementDistribution[value as Element]}개로 원국에서 가장 약합니다`;
  if (type === "tenGod") return `${value}이 원국에 ${chart.tenGodDistribution[value]}회 드러납니다`;
  if (type === "strength") return `신강·신약 참고 지표가 ${chart.strengthScore}로 ${value === "strong" ? "자기 지지력이 강한 편" : "외부 자극의 영향을 받기 쉬운 편"}입니다`;
  if (type === "interaction") return `지지에서 ${matchingInteractions(chart, value).join(" · ")} 관계가 확인됩니다`;
  return null;
}

export function describeRuleMatch(rule: WarningRule, chart: FortuneChart): string {
  const evidence = rule.conditions
    .map((condition) => conditionEvidence(condition, chart))
    .filter((item): item is string => Boolean(item));
  return evidence.length > 0
    ? `원국 판독: ${evidence.join("이며, ")}. 이 신호가 약점으로 과장되는 상황을 우선 경고합니다.`
    : "이 항목은 뚜렷한 원국 근거가 없어 핵심 경고로 사용하지 않습니다.";
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

function selectFinalWarning(weaknesses: WarningRule[], chart: FortuneChart): string {
  const primary = weaknesses[0];
  const interaction = chart.interactions.find((item) => item !== "뚜렷한 합·충·형·파·해 없음");
  const endings = [
    `${primary.actionRules[0]}. 이것을 미루는 순간 강점은 같은 문제를 반복하는 핑계가 됩니다.`,
    `${primary.summary} ${primary.actionRules[0]}.`,
    `${interaction ? `${interaction}의 긴장이 올라올수록` : "압박이 높아질수록"} ${primary.warningSigns[0]} 반응을 사실로 착각하지 마십시오.`,
  ];
  return endings[chart.seed % endings.length];
}

function buildOverallAssessment(result: Omit<AnalysisResult, "overallAssessment">): AnalysisResult["overallAssessment"] {
  const { chart, weaknesses, riskLevel, annualFlows } = result;
  const elementEntries = Object.entries(chart.elementDistribution) as [Element, number][];
  const sortedElements = [...elementEntries].sort((a, b) => b[1] - a[1]);
  const strongestElement = sortedElements[0][0];
  const weakestElement = sortedElements.at(-1)?.[0] ?? "수";
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
  const secondary = weaknesses[1];
  return {
    verdict: verdicts[riskLevel],
    headline: primary.title,
    summary: `${chart.dayMaster} 일간, ${strongestElement} ${chart.elementDistribution[strongestElement]}개와 ${dominantTenGod} ${chart.tenGodDistribution[dominantTenGod] ?? 0}회가 핵심 축입니다. ${weakestElement} ${chart.elementDistribution[weakestElement]}개의 보완 방식이 늦을 때 “${primary.title}” 패턴이 먼저 드러납니다.`,
    coreRisk: `${primary.summary} 이어서 ${secondary.summary}`,
    protectiveFactor: `${strongestElement}의 ${strengths[strongestElement]}이 보호 장치입니다. ${weakestElement}의 ${compensations[weakestElement]}을 붙이면 같은 힘이 독주보다 성과로 남습니다.`,
    currentFlow: `${currentAnnual.year}년 ${currentAnnual.korean} 세운은 ${currentAnnual.theme}입니다. 자극도는 ${currentAnnual.pressure}이며, ${currentAnnual.warning}`,
    firstPriority: primary.actionRules[0],
    conclusion: `${chart.dayMaster} 일간의 기본 반응과 ${strongestElement}의 과속 지점, ${dominantTenGod}의 반복 역할이 함께 겹칩니다. 가장 중요한 것은 ${primary.actionRules[0]}는 것입니다. 이 한 가지를 지키면 ${secondary.title} 패턴까지 동시에 낮출 수 있습니다.`,
  };
}

export function analyzeChart(chart: FortuneChart, referenceYear = new Date().getFullYear()): AnalysisResult {
  const weaknesses = selectDiverseWeaknesses(chart);
  const values = Object.values(chart.elementDistribution);
  const imbalance = Math.max(...values) - Math.min(...values);
  const strengthDeviation = Math.abs(chart.strengthScore - 50);
  const interactionPressure = chart.interactions.filter((item) => / 충$| 형$| 파$| 해$/.test(item)).length;
  const signalSeverity = weaknesses.reduce((sum, item) => sum + item.severity, 0);
  const riskScore = Math.min(
    92,
    Math.max(18, 18 + imbalance * 6.5 + strengthDeviation * 0.45 + signalSeverity * 1.7 + interactionPressure * 2.5 + (chart.confidence < 90 ? 3 : 0)),
  );
  const annualFlows = calculateAnnualFlows(chart, referenceYear);
  const weaknessEvidence = Object.fromEntries(weaknesses.map((rule) => [rule.id, describeRuleMatch(rule, chart)]));
  const partialResult: Omit<AnalysisResult, "overallAssessment"> = {
    chart,
    riskLevel: calculateRisk(riskScore),
    riskScore,
    weaknesses,
    weaknessEvidence,
    finalWarning: selectFinalWarning(weaknesses, chart),
    annualFlows,
  };
  return { ...partialResult, overallAssessment: buildOverallAssessment(partialResult) };
}

export function buildPersonalizedActions(
  chart: FortuneChart,
  weaknesses: WarningRule[],
): { prohibited: string[]; rescue: string[] } {
  const sourceRules = deduplicateWarnings(weaknesses);
  const prohibited = sourceRules
    .flatMap((rule) => rule.warningSigns.slice(0, 2).map(
      (sign) => `“${sign}” 신호가 보일 때 중요한 결정을 밀어붙이지 마십시오.`,
    ))
    .filter((item, index, items) => items.indexOf(item) === index)
    .slice(0, 5);
  const rescue = sourceRules
    .flatMap((rule) => rule.actionRules)
    .filter((item, index, items) => items.indexOf(item) === index)
    .slice(0, 5);
  const missingElement = (Object.entries(chart.elementDistribution) as [Element, number][])
    .sort((a, b) => a[1] - b[1])[0][0];
  const elementFallbacks: Record<Element, string> = {
    목: "미루는 일은 오늘 끝낼 15분짜리 첫 행동으로 바꾼다.",
    화: "고마움과 반대 의견은 쌓아 두지 말고 그날 짧게 표현한다.",
    토: "수면·식사·운동 중 하나를 같은 시간에 반복한다.",
    금: "부탁을 받으면 역할·범위·마감을 확인한 뒤 답한다.",
    수: "결론 전에 사실과 해석을 두 칸으로 나눠 기록한다.",
  };
  if (rescue.length < 5) rescue.push(elementFallbacks[missingElement]);
  while (prohibited.length < 5) {
    const fallback = [
      "원국 근거가 약한 일반적인 경고를 자신의 핵심 약점처럼 받아들이지 마십시오.",
      "한 번의 감정 반응을 운명이나 성격 전체로 단정하지 마십시오.",
    ][prohibited.length % 2];
    if (!prohibited.includes(fallback)) prohibited.push(fallback);
    else break;
  }
  return { prohibited: prohibited.slice(0, 5), rescue: rescue.slice(0, 5) };
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
