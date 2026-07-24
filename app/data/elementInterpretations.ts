import type { WarningRule } from "../types/fortune";

export const elementInterpretations: WarningRule[] = [
  {
    id: "fire-overheat", title: "기회보다 감정에 먼저 반응합니다", conditions: ["excess:화"],
    severity: 5, summary: "추진력은 강하지만 제동 장치가 약합니다.",
    detailedReason: "화 기운이 과하면 속도와 확신이 판단 검증보다 먼저 작동합니다.",
    warningSigns: ["목소리가 커진다", "답장을 재촉한다", "당일에 결론을 낸다"],
    consequences: "주변을 밀어낸 뒤 혼자 수습하는 패턴이 반복될 수 있습니다.",
    actionRules: ["중요한 결정은 24시간 보류한다", "격한 메시지는 임시 저장한다"],
    prohibitedClaims: ["사고 확정", "질병 진단"], tags: ["화", "감정", "결정"],
  },
  {
    id: "water-overthink", title: "생각이 깊은 것이 아니라 빠져나오지 못하는 겁니다", conditions: ["excess:수"],
    severity: 4, summary: "정보를 모을수록 불안이 줄지 않고 선택지만 늘어날 수 있습니다.",
    detailedReason: "수 기운의 과다는 관찰력을 키우지만 의심과 과잉 해석도 함께 키웁니다.",
    warningSigns: ["같은 대화를 반복해서 복기한다", "상대의 침묵에 의미를 붙인다", "결정을 계속 미룬다"],
    consequences: "확인되지 않은 추측이 관계와 실행력을 잠식할 수 있습니다.",
    actionRules: ["사실과 해석을 두 칸으로 나눠 기록한다", "결정 기한을 먼저 정한다"],
    prohibitedClaims: ["정신질환 단정"], tags: ["수", "불안", "관계"],
  },
  {
    id: "wood-scarcity", title: "신중한 척하며 시작을 피할 수 있습니다", conditions: ["deficient:목"],
    severity: 4, summary: "방향을 세우고 첫걸음을 떼는 힘이 약해질 때가 있습니다.",
    detailedReason: "목 기운 부족은 장기 계획을 실제 첫 행동으로 번역하는 데 마찰을 만듭니다.",
    warningSigns: ["준비 목록만 늘어난다", "완벽한 시점을 기다린다", "남의 계획을 따른다"],
    consequences: "실패보다 미착수로 기회를 놓치는 일이 더 커질 수 있습니다.",
    actionRules: ["오늘 할 15분짜리 첫 행동을 정한다", "70%에서 검토를 요청한다"],
    prohibitedClaims: ["무능 단정"], tags: ["목", "실행", "직업"],
  },
];
