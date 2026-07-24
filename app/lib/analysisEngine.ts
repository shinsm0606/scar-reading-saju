import { actionRules } from "../data/actionRules";
import { balanceInterpretations } from "../data/balanceInterpretations";
import { careerWarnings } from "../data/careerWarnings";
import { elementInterpretations } from "../data/elementInterpretations";
import { lifestyleWarnings } from "../data/lifestyleWarnings";
import { moneyWarnings } from "../data/moneyWarnings";
import { relationshipWarnings } from "../data/relationshipWarnings";
import { tenGodInterpretations } from "../data/tenGodInterpretations";
import type { AnalysisResult, FortuneChart, Intensity, RiskLevel, WarningRule } from "../types/fortune";

const allRules = [
  ...elementInterpretations, ...tenGodInterpretations, ...balanceInterpretations,
  ...relationshipWarnings, ...careerWarnings, ...moneyWarnings, ...lifestyleWarnings, ...actionRules,
];

function matches(rule: WarningRule, chart: FortuneChart): boolean {
  return rule.conditions.some((condition) => {
    const [type, value] = condition.split(":");
    if (type === "excess") return chart.excessiveElements.includes(value as never);
    if (type === "deficient") return chart.deficientElements.includes(value as never);
    if (type === "tenGod") return Boolean(chart.tenGodDistribution[value]);
    if (type === "strength") return value === "strong" ? chart.strengthScore >= 62 : chart.strengthScore <= 38;
    if (type === "fallback") return true;
    if (type === "tag") {
      const signal = [...chart.excessiveElements, ...chart.deficientElements].join("");
      return (signal.charCodeAt(0) + chart.seed) % 3 !== 0;
    }
    return false;
  });
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

export function analyzeChart(chart: FortuneChart): AnalysisResult {
  const ranked = allRules
    .filter((rule) => matches(rule, chart))
    .map((rule) => ({ rule, rank: rule.severity * 20 + ((chart.seed ^ rule.id.length) % 17) }))
    .sort((a, b) => b.rank - a.rank)
    .map(({ rule }) => rule);
  const pool = deduplicateWarnings([...ranked, ...allRules]);
  const weaknesses = pool.slice(0, 3);
  const values = Object.values(chart.elementDistribution);
  const imbalance = Math.max(...values) - Math.min(...values);
  const riskScore = Math.min(92, Math.max(18, 24 + imbalance * 7 + weaknesses.reduce((sum, item) => sum + item.severity, 0) * 2 + (chart.confidence < 70 ? 3 : 0)));
  const finals = [
    "당신을 무너뜨리는 것은 운이 아니라, 상처받은 순간 모든 것을 단정하는 습관입니다.",
    "참는 것이 강함이라고 믿는 순간, 빠져나올 기회를 놓치게 됩니다.",
    "당신의 가장 큰 적은 능력 부족이 아니라, 감정이 확신으로 변하는 순간입니다.",
    "불안이 사실처럼 느껴지는 순간일수록, 결론보다 확인이 먼저입니다.",
    "지금의 자존심을 지키려다 내일의 선택권을 버리지 마십시오.",
  ];
  return { chart, riskLevel: calculateRisk(riskScore), riskScore, weaknesses, finalWarning: finals[chart.seed % finals.length] };
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

export const sectionRules = {
  relationship: relationshipWarnings[0],
  career: careerWarnings[0],
  money: moneyWarnings[0],
  lifestyle: lifestyleWarnings[0],
};
