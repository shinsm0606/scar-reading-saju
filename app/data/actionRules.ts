import type { WarningRule } from "../types/fortune";

export const actionRules: WarningRule[] = [
  {
    id: "control-under-stress", title: "불안할수록 통제하려는 습관이 강해집니다", conditions: ["fallback"],
    severity: 3, summary: "상황이 흐릿할 때 사람과 일정까지 붙잡으려는 반응이 나올 수 있습니다.",
    detailedReason: "통제는 잠깐의 안도감을 주지만 타인의 자율성과 자신의 회복 시간을 빼앗습니다.",
    warningSigns: ["답을 재촉한다", "역할을 대신 해버린다", "계획 변경을 실패로 여긴다"],
    consequences: "혼자 책임지는 구조를 스스로 만들고 주변의 자발성을 낮출 수 있습니다.",
    actionRules: ["내가 통제할 수 있는 일과 없는 일을 분리한다", "요청은 한 번만 명확하게 말한다"],
    prohibitedClaims: ["정신질환 단정"], tags: ["감정", "관계", "생활"],
  },
];
