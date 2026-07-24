import {
  calculateFourPillars,
  getBranchTenGod,
  getHeavenlyStemElement,
  getTenGod,
  type FourPillarsDetail,
  type HeavenlyStem,
  type LuckPillarInfo,
} from "manseryeok";
import type {
  AnnualFlow,
  BirthInput,
  Element,
  FortuneChart,
  LuckFlow,
  LuckOption,
  SpiritStar,
} from "../types/fortune";
import { formatInteractions } from "./sajuLabels";

const relationSets: Record<string, string[]> = {
  합: ["자축", "인해", "묘술", "진유", "사신", "오미"],
  충: ["자오", "축미", "인신", "묘유", "진술", "사해"],
  형: ["인사", "사신", "신인", "축술", "술미", "미축", "자묘", "묘자", "진진", "오오", "유유", "해해"],
  파: ["자유", "축진", "인해", "묘오", "사신", "미술"],
  해: ["자미", "축오", "인사", "묘진", "신해", "유술"],
};

const tenGodThemes: Record<string, { theme: string; warning: string; action: string }> = {
  비견: {
    theme: "자기 결정과 경쟁 기준이 강해지는 해",
    warning: "독립심이 협업 거부나 불필요한 비교로 바뀌지 않게 해야 합니다.",
    action: "큰 결정 전에 반대 의견 한 가지를 끝까지 확인하십시오.",
  },
  겁재: {
    theme: "사람·경쟁·공동 자원이 크게 움직이는 해",
    warning: "관계 때문에 돈과 시간을 함께 거는 선택을 특히 경계해야 합니다.",
    action: "공동 지출과 투자는 지분·손실 한도·종료 조건을 문서로 남기십시오.",
  },
  식신: {
    theme: "생산·표현·생활 리듬을 현실화하는 해",
    warning: "편안함을 지키려다 불편하지만 중요한 과제를 미룰 수 있습니다.",
    action: "매주 눈에 보이는 결과물 하나를 완성하십시오.",
  },
  상관: {
    theme: "표현과 문제 제기가 강해지는 해",
    warning: "맞는 말을 하는 방식 때문에 조직과 관계의 마찰이 커질 수 있습니다.",
    action: "공개 반박 전에 질문과 대안을 먼저 준비하십시오.",
  },
  편재: {
    theme: "새 기회·사람·재물 흐름이 넓어지는 해",
    warning: "가능성에 흥분하면 회수 계획 없이 여러 판을 벌일 수 있습니다.",
    action: "새 제안은 숫자와 종료 조건을 받은 뒤 하루 후 결정하십시오.",
  },
  정재: {
    theme: "현실적인 돈 관리와 책임이 강조되는 해",
    warning: "안전을 지키려다 필요한 변화와 성장 지출까지 얼릴 수 있습니다.",
    action: "생활비·비상금·성장 예산을 분리해 관리하십시오.",
  },
  편관: {
    theme: "책임·압박·승부처가 선명해지는 해",
    warning: "압박을 성과의 연료로만 쓰면 과로와 날카로운 대응이 늘어납니다.",
    action: "중요한 목표와 함께 중단 시간과 도움 요청 기준도 정하십시오.",
  },
  정관: {
    theme: "평판·규칙·직책과 관련된 선택이 커지는 해",
    warning: "모범 답안을 지키느라 자신의 한계나 반대 의견을 숨길 수 있습니다.",
    action: "실수와 이견은 작을 때 근거와 대안을 붙여 공유하십시오.",
  },
  편인: {
    theme: "탐구·직감·새 관점이 강해지는 해",
    warning: "혼자 만든 해석을 사실로 믿으면 실행과 관계가 모두 늦어질 수 있습니다.",
    action: "직감마다 근거와 반증 조건을 한 줄씩 적으십시오.",
  },
  정인: {
    theme: "학습·보호·자격을 축적하는 해",
    warning: "준비와 승인만 기다리며 실제 피드백을 받을 시점을 놓칠 수 있습니다.",
    action: "자료 수집 마감과 첫 결과물 공개일을 함께 정하십시오.",
  },
};

function branchRelations(target: string, natalBranches: string[]): string[] {
  const found = new Set<string>();
  natalBranches.forEach((branch) => {
    const direct = `${target}${branch}`;
    const reverse = `${branch}${target}`;
    Object.entries(relationSets).forEach(([name, pairs]) => {
      if (pairs.includes(direct) || pairs.includes(reverse)) found.add(`${target}·${branch} ${name}`);
    });
  });
  return [...found];
}

function convertLuckOption(
  info: LuckPillarInfo,
  dayMaster: HeavenlyStem,
  natalBranches: string[],
  label: string,
  excessiveElements: Element[],
  deficientElements: Element[],
): LuckOption {
  return {
    forward: info.forward,
    label,
    startAge: info.startAge,
    startYears: info.startYears,
    startMonths: info.startMonths,
    startDays: info.startDays,
    cycles: info.pillars.map((cycle) => {
      const element = getHeavenlyStemElement(cycle.pillar.heavenlyStem) as Element;
      const tenGod = getTenGod(dayMaster, cycle.pillar.heavenlyStem);
      const branchTenGod = getBranchTenGod(dayMaster, cycle.pillar.earthlyBranch);
      const interactions = branchRelations(cycle.pillar.earthlyBranch, natalBranches);
      const difficultRelations = interactions.filter((relation) => / 충$| 형$| 파$| 해$/.test(relation));
      const combinedRelations = interactions.filter((relation) => relation.endsWith(" 합"));
      const elementReading = deficientElements.includes(element)
        ? `부족했던 ${element}를 보완해 익숙하지 않은 방식이 성장 장치가 되고`
        : excessiveElements.includes(element)
          ? `이미 강한 ${element}가 더해져 장점이 과속하기 쉬우므로 검토 기준이 필요하고`
          : `${element}가 새로운 역할을 요구하므로 기존 방식만 고집하지 않는 것이 중요하고`;
      const relationReading = difficultRelations.length > 0
        ? `${formatInteractions(difficultRelations)} 자극이 있어 변화와 갈등을 한 번에 결론내리지 마십시오.`
        : combinedRelations.length > 0
          ? `${formatInteractions(combinedRelations)} 흐름은 협력에 유리하지만 역할과 책임은 분리해야 합니다.`
          : "원국과의 직접 충돌이 적어 한 분야를 꾸준히 축적하는 편이 유리합니다.";
      const roleTheme = tenGodThemes[tenGod]
        ? `${tenGod}: ${tenGodThemes[tenGod].theme.replace(/해$/, "10년")}`
        : `${tenGod} 역할이 부각되는 10년`;
      return {
        startAge: cycle.age,
        endAge: cycle.age + 9,
        stem: cycle.pillar.heavenlyStem,
        branch: cycle.pillar.earthlyBranch,
        korean: cycle.korean,
        element,
        tenGod,
        branchTenGod,
        interactions,
        assessment: `${roleTheme}이며 ${branchTenGod}의 반응도 함께 작동합니다. ${elementReading}, ${relationReading}`,
      };
    }),
  };
}

export function buildLuckFlow(
  input: BirthInput,
  result: FourPillarsDetail,
  calculateWithGender: (gender: "male" | "female") => FourPillarsDetail,
  excessiveElements: Element[],
  deficientElements: Element[],
): LuckFlow {
  const dayMaster = result.day.heavenlyStem;
  const natalBranches = [result.year, result.month, result.day, ...(input.timeUnknown ? [] : [result.hour])]
    .map((pillar) => pillar.earthlyBranch);

  if (input.gender !== "none" && result.luckPillars) {
    return {
      certainty: "confirmed",
      options: [convertLuckOption(
        result.luckPillars,
        dayMaster,
        natalBranches,
        result.luckPillars.forward ? "순행" : "역행",
        excessiveElements,
        deficientElements,
      )],
    };
  }

  const candidates = (["male", "female"] as const)
    .map((gender) => calculateWithGender(gender).luckPillars)
    .filter((info): info is LuckPillarInfo => Boolean(info));
  const unique = candidates.filter((info, index) =>
    candidates.findIndex((candidate) => candidate.forward === info.forward) === index,
  );
  return {
    certainty: "alternatives",
    options: unique.map((info) => convertLuckOption(
      info,
      dayMaster,
      natalBranches,
      info.forward ? "순행 가능성" : "역행 가능성",
      excessiveElements,
      deficientElements,
    )),
  };
}

export function calculateAnnualFlows(chart: FortuneChart, referenceYear: number): AnnualFlow[] {
  const dayMaster = chart.dayMaster as HeavenlyStem;
  const natalBranches = chart.pillars.filter((pillar) => pillar.branch !== "?").map((pillar) => pillar.branch);
  return Array.from({ length: 7 }, (_, index) => referenceYear - 2 + index).map((year) => {
    const yearResult = calculateFourPillars({ year, month: 7, day: 1, hour: 12, minute: 0 });
    const stem = yearResult.year.heavenlyStem;
    const branch = yearResult.year.earthlyBranch;
    const tenGod = getTenGod(dayMaster, stem);
    const relations = branchRelations(branch, natalBranches);
    const element = getHeavenlyStemElement(stem) as Element;
    const difficultRelations = relations.filter((relation) => /충|형|파|해/.test(relation)).length;
    const excessPressure = chart.excessiveElements.includes(element) ? 1 : 0;
    const pressureScore = difficultRelations * 2 + excessPressure;
    const interpretation = tenGodThemes[tenGod];
    return {
      year,
      stem,
      branch,
      korean: `${stem}${branch}`,
      element,
      tenGod,
      branchTenGod: getBranchTenGod(dayMaster, branch),
      interactions: relations,
      pressure: pressureScore >= 3 ? "높음" : pressureScore >= 1 ? "보통" : "낮음",
      theme: interpretation.theme,
      warning: interpretation.warning,
      action: interpretation.action,
    };
  });
}

type TripleGroup = { members: string[]; peach: string; horse: string; canopy: string };
const tripleGroups: TripleGroup[] = [
  { members: ["인", "오", "술"], peach: "묘", horse: "신", canopy: "술" },
  { members: ["신", "자", "진"], peach: "유", horse: "인", canopy: "진" },
  { members: ["해", "묘", "미"], peach: "자", horse: "사", canopy: "미" },
  { members: ["사", "유", "축"], peach: "오", horse: "해", canopy: "축" },
];

const nobleBranches: Record<string, string[]> = {
  갑: ["축", "미"], 무: ["축", "미"], 경: ["축", "미"],
  을: ["자", "신"], 기: ["자", "신"],
  병: ["해", "유"], 정: ["해", "유"],
  임: ["묘", "사"], 계: ["묘", "사"],
  신: ["인", "오"],
};

export function detectSpiritStars(
  yearBranch: string,
  dayBranch: string,
  dayStem: string,
  chartBranches: string[],
): SpiritStar[] {
  const anchorBranches = [...new Set([yearBranch, dayBranch])];
  const targets = (kind: "peach" | "horse" | "canopy") =>
    [...new Set(anchorBranches.flatMap((anchor) => {
      const group = tripleGroups.find(({ members }) => members.includes(anchor));
      return group ? [group[kind]] : [];
    }))];
  const create = (
    id: SpiritStar["id"],
    name: string,
    hanja: string,
    targetBranches: string[],
    basis: string,
    summary: string,
    warning: string,
    action: string,
  ): SpiritStar => {
    const matchedBranches = [...new Set(chartBranches.filter((branch) => targetBranches.includes(branch)))];
    return { id, name, hanja, present: matchedBranches.length > 0, matchedBranches, basis, summary, warning, action };
  };

  return [
    create(
      "peach-blossom", "도화", "桃花", targets("peach"), "년지·일지 삼합국의 도화 지지",
      "매력과 노출, 사람의 시선을 끄는 방식이 강조되는 보조 신호입니다.",
      "관심의 크기를 관계의 진정성으로 착각하지 마십시오.",
      "호감보다 경계와 약속이 실제로 지켜지는지 확인하십시오.",
    ),
    create(
      "travel-horse", "역마", "驛馬", targets("horse"), "년지·일지 삼합국의 역마 지지",
      "이동·변화·새 환경에서 에너지가 살아나는 보조 신호입니다.",
      "답답하다는 이유만으로 이직·이사·관계를 한꺼번에 바꾸지 마십시오.",
      "움직이기 전에 목적, 비용, 돌아올 기준을 적으십시오.",
    ),
    create(
      "canopy", "화개", "華蓋", targets("canopy"), "년지·일지 삼합국의 화개 지지",
      "몰입·예술·학습과 혼자 정리하는 시간이 필요한 보조 신호입니다.",
      "깊이 생각하는 습관이 관계 단절과 현실 회피로 바뀌지 않게 하십시오.",
      "혼자 몰입하는 시간 뒤에 결과를 공유할 날짜를 정하십시오.",
    ),
    create(
      "noble-helper", "천을귀인", "天乙貴人", nobleBranches[dayStem] ?? [], "일간 기준 천을귀인 지지",
      "위기에서 도움과 조언을 연결하는 능력을 상징하는 보조 신호입니다.",
      "도움받을 운이 있다는 말로 준비와 책임을 다른 사람에게 넘기지 마십시오.",
      "문제가 작을 때 구체적인 요청과 함께 도움을 구하십시오.",
    ),
  ];
}

export function buildSpiritStars(result: FourPillarsDetail, timeUnknown: boolean): SpiritStar[] {
  const branches = [result.year, result.month, result.day, ...(timeUnknown ? [] : [result.hour])]
    .map((pillar) => pillar.earthlyBranch);
  return detectSpiritStars(
    result.year.earthlyBranch,
    result.day.earthlyBranch,
    result.day.heavenlyStem,
    branches,
  );
}
