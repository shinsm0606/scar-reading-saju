export type Gender = "male" | "female" | "none";
export type CalendarType = "solar" | "lunar";
export type Intensity = "mild" | "realistic" | "direct";
export type Element = "목" | "화" | "토" | "금" | "수";
export type YinYang = "음" | "양";
export type RiskLevel = "안정" | "주의" | "경계" | "위험" | "고위험";

export interface BirthInput {
  name: string;
  gender: Gender;
  calendarType: CalendarType;
  leapMonth: boolean;
  year: number;
  month: number;
  day: number;
  hour: number | null;
  minute: number;
  timeUnknown: boolean;
  region: string;
  trueSolarTime: boolean;
  intensity: Intensity;
  allowStorage: boolean;
}

export interface Pillar {
  label: "년주" | "월주" | "일주" | "시주";
  stem: string;
  branch: string;
  element: Element | "?";
  branchElement: Element | "?";
  yinYang: YinYang | "?";
  branchYinYang: YinYang | "?";
  tenGod: string;
  branchTenGod: string;
  role: string;
}

export interface FortuneChart {
  mode: "manse";
  seed: number;
  pillars: Pillar[];
  dayMaster: string;
  elementDistribution: Record<Element, number>;
  yinYangDistribution: Record<YinYang, number>;
  tenGodDistribution: Record<string, number>;
  strengthScore: number;
  deficientElements: Element[];
  excessiveElements: Element[];
  interactions: string[];
  confidence: number;
  calculationBasis: string;
  solarDate: string;
  lunarDate: string;
  luckFlow?: LuckFlow;
  spiritStars?: SpiritStar[];
}

export interface LuckCycle {
  startAge: number;
  endAge: number;
  stem: string;
  branch: string;
  korean: string;
  element: Element;
  tenGod: string;
  branchTenGod: string;
  interactions: string[];
  assessment: string;
}

export interface LuckOption {
  forward: boolean;
  label: string;
  startAge: number;
  startYears: number;
  startMonths: number;
  startDays: number;
  cycles: LuckCycle[];
}

export interface LuckFlow {
  certainty: "confirmed" | "alternatives";
  options: LuckOption[];
}

export interface AnnualFlow {
  year: number;
  stem: string;
  branch: string;
  korean: string;
  element: Element;
  tenGod: string;
  branchTenGod: string;
  interactions: string[];
  pressure: "낮음" | "보통" | "높음";
  theme: string;
  warning: string;
  action: string;
}

export interface AnnualGuidance {
  year: number;
  supportiveElement: Element;
  direction: string;
  headline: string;
  basis: string;
  recommendedPlaces: Array<{
    name: string;
    category: string;
    reason: string;
  }>;
  reduceEnvironments: Array<{
    environment: string;
    reason: string;
  }>;
  cautions: Array<{
    category: "문서" | "음식" | "사람" | "이동·자동차";
    basis: string;
    advice: string;
  }>;
}

export interface SpiritStar {
  id: "peach-blossom" | "travel-horse" | "canopy" | "noble-helper";
  name: string;
  hanja: string;
  present: boolean;
  matchedBranches: string[];
  basis: string;
  summary: string;
  warning: string;
  action: string;
}

export interface WarningRule {
  id: string;
  title: string;
  conditions: string[];
  severity: number;
  summary: string;
  detailedReason: string;
  warningSigns: string[];
  consequences: string;
  actionRules: string[];
  prohibitedClaims: string[];
  tags: string[];
}

export interface AnalysisResult {
  chart: FortuneChart;
  riskLevel: RiskLevel;
  riskScore: number;
  weaknesses: WarningRule[];
  weaknessEvidence: Record<string, string>;
  finalWarning: string;
  annualFlows: AnnualFlow[];
  annualGuidance: AnnualGuidance;
  overallAssessment: {
    verdict: string;
    headline: string;
    summary: string;
    coreRisk: string;
    protectiveFactor: string;
    currentFlow: string;
    firstPriority: string;
    conclusion: string;
  };
}

export interface SharePayload {
  v: 2;
  name: string;
  intensity: Intensity;
  chart: FortuneChart;
}

export type GroupPurpose = "friends" | "family" | "travel" | "work" | "business";
export type TravelRange = "nearby" | "daytrip" | "nationwide";

export interface CompatibilityProfile {
  id: string;
  name: string;
  chart: FortuneChart;
  addedAt: string;
}

export interface CompatibilityMetric {
  id: "emotion" | "communication" | "daily" | "decision" | "resilience";
  label: string;
  score: number;
  description: string;
}

export interface PairCompatibility {
  memberIds: [string, string];
  memberNames: [string, string];
  score: number;
  grade: string;
  metrics: CompatibilityMetric[];
  interactions: string[];
  synergy: string[];
  friction: string[];
  action: string;
}

export interface GroupCompatibilityReport {
  memberCount: number;
  purpose: GroupPurpose;
  purposeLabel: string;
  score: number;
  grade: string;
  headline: string;
  summary: string;
  currentYear: number;
  currentFlow: string;
  elementDistribution: Record<Element, number>;
  supportiveElements: Element[];
  excessiveElements: Element[];
  pairReports: PairCompatibility[];
  strongestPair: PairCompatibility;
  carefulPair: PairCompatibility;
  bridgeMember: string;
  strengths: string[];
  risks: string[];
  operatingRules: string[];
  recommendedPlaces: Array<{
    name: string;
    region: string;
    category: string;
    reason: string;
  }>;
  avoidEnvironment: string;
  disclaimer: string;
}

export interface FortuneCalculator {
  calculate(input: BirthInput): FortuneChart;
}
