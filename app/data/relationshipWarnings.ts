import type { WarningRule } from "../types/fortune";

export const relationshipWarnings: WarningRule[] = [
  {
    id: "mind-reading", title: "말하지 않은 의도까지 심판하지 마십시오", conditions: ["tag:관계"],
    severity: 4, summary: "상대의 표정과 침묵을 증거처럼 다루면 관계가 빠르게 망가집니다.",
    detailedReason: "불안할수록 빈칸을 사실이 아닌 추측으로 채우는 방어가 작동합니다.",
    warningSigns: ["답장 속도를 애정의 크기로 해석한다", "확인 없이 결론을 낸다", "떠보는 질문을 한다"],
    consequences: "상대는 대화가 아니라 재판을 받는다고 느낄 수 있습니다.",
    actionRules: ["사실 확인 질문을 한 번만 한다", "추측을 문장으로 보내지 않는다"],
    prohibitedClaims: ["외도 단정", "이혼 확정"], tags: ["관계", "갈등"],
  },
];
