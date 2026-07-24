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
  finalWarning: string;
}

export interface SharePayload {
  v: 2;
  name: string;
  intensity: Intensity;
  chart: FortuneChart;
}

export interface FortuneCalculator {
  calculate(input: BirthInput): FortuneChart;
}
