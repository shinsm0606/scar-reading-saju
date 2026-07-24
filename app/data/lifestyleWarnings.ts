import type { WarningRule } from "../types/fortune";

export const lifestyleWarnings: WarningRule[] = [
  {
    id: "endurance-body", title: "휴식 없이 버티는 것을 강함으로 착각합니다", conditions: ["tag:생활"],
    severity: 4, summary: "과로와 수면 부족을 의지로 덮으면 판단부터 무너집니다.",
    detailedReason: "긴장 상태가 익숙해지면 피로 신호를 무시하고 감정 기복을 성격 문제로 오해할 수 있습니다.",
    warningSigns: ["식사를 건너뛴다", "쉬는 날에도 일을 확인한다", "잠들기 직전까지 화면을 본다"],
    consequences: "회복되지 않은 상태에서 갈등과 실수가 늘어날 수 있습니다.",
    actionRules: ["취침 30분 전 화면을 끈다", "주 3회 20분 걷기를 일정에 넣는다", "통증이나 이상 증상은 의료 전문가에게 확인한다"],
    prohibitedClaims: ["질병 진단", "수명 예측"], tags: ["생활", "건강", "과로"],
  },
];
