import type { WarningRule } from "../types/fortune";

export const lifestyleWarnings: WarningRule[] = [
  {
    id: "lifestyle-overdrive", title: "긴장을 연료로 쓰는 생활을 멈추십시오", conditions: ["tenGod:편관", "excess:화"],
    severity: 5, summary: "압박이 있어야 움직이는 습관은 과로와 수면 부족을 일상으로 만듭니다.",
    detailedReason: "속도와 위기 대응의 신호가 강하면 피로를 경고가 아니라 더 밀어붙일 이유로 해석합니다.",
    warningSigns: ["잠을 줄여 마감을 맞춘다", "쉬는 날에도 업무를 확인한다", "피곤할수록 말이 날카로워진다"],
    consequences: "회복되지 않은 상태에서 판단 실수와 갈등이 늘어날 수 있습니다.",
    actionRules: ["취침 시간을 마감처럼 고정한다", "피로한 날에는 중요한 결정을 미룬다"],
    prohibitedClaims: ["질병 진단", "수명 예측"], tags: ["생활", "과로", "화"],
  },
  {
    id: "lifestyle-rumination", title: "쉬는 시간에도 머릿속 재판을 계속합니다", conditions: ["excess:수", "tenGod:편인"],
    severity: 4, summary: "몸을 멈춰도 대화와 실수를 반복해서 복기하면 실제 휴식이 되지 않습니다.",
    detailedReason: "관찰과 해석의 신호가 강할수록 해결되지 않은 생각을 붙잡아 수면과 집중을 방해합니다.",
    warningSigns: ["잠들기 전 대화를 복기한다", "휴식 중에도 검색을 멈추지 못한다", "확인할 수 없는 답을 계속 찾는다"],
    consequences: "피로가 누적되어 사소한 자극에도 예민하게 반응할 수 있습니다.",
    actionRules: ["저녁에 걱정 메모 시간을 10분만 둔다", "취침 30분 전 화면을 끈다"],
    prohibitedClaims: ["정신질환 단정", "질병 진단"], tags: ["생활", "수면", "수"],
  },
  {
    id: "lifestyle-stagnation", title: "버티기만 하는 생활은 회복이 아닙니다", conditions: ["excess:토", "strength:strong", "deficient:목"],
    severity: 4, summary: "익숙한 루틴을 지키는 동안 활동량과 감정 표현이 줄어들 수 있습니다.",
    detailedReason: "유지와 인내의 신호가 강하면 불편함을 바꾸기보다 참고 견디는 쪽을 선택합니다.",
    warningSigns: ["식사 시간이 불규칙해도 방치한다", "한 자세로 오래 일한다", "힘들다는 말을 끝까지 미룬다"],
    consequences: "생활의 작은 불균형이 쌓여 의욕과 관계의 여유를 떨어뜨릴 수 있습니다.",
    actionRules: ["주 3회 20분 걷기를 일정에 넣는다", "지속적인 통증이나 이상 증상은 의료 전문가에게 확인한다"],
    prohibitedClaims: ["질병 예측", "수명 예측"], tags: ["생활", "회복", "토"],
  },
];
