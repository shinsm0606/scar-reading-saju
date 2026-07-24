import type { WarningRule } from "../types/fortune";

export const relationshipWarnings: WarningRule[] = [
  {
    id: "relationship-mind-reading", title: "말하지 않은 의도까지 심판하지 마십시오", conditions: ["tenGod:편인", "excess:수"],
    severity: 5, summary: "상대의 표정과 침묵을 증거처럼 다루면 관계가 빠르게 어려워집니다.",
    detailedReason: "관찰과 추론이 강할수록 빈칸을 사실이 아닌 해석으로 채우는 방어가 작동합니다.",
    warningSigns: ["답장 속도를 애정의 크기로 해석한다", "확인 없이 결론을 낸다", "떠보는 질문을 한다"],
    consequences: "상대는 대화가 아니라 재판을 받는다고 느낄 수 있습니다.",
    actionRules: ["사실 확인 질문을 한 번만 한다", "추측을 문장으로 보내지 않는다"],
    prohibitedClaims: ["외도 단정", "이혼 확정"], tags: ["관계", "추측", "수"],
  },
  {
    id: "relationship-scorekeeping", title: "관계를 호의의 장부로 만들지 마십시오", conditions: ["tenGod:정재", "tenGod:정인", "excess:토"],
    severity: 4, summary: "많이 책임질수록 상대도 같은 방식으로 보답해야 한다는 기대가 생길 수 있습니다.",
    detailedReason: "성실과 돌봄의 기준이 강하면 말하지 않은 기대까지 합의된 의무처럼 느껴집니다.",
    warningSigns: ["부탁받기 전에 해결한다", "내가 한 일을 오래 기억한다", "서운해도 바로 말하지 않는다"],
    consequences: "상대는 기대를 몰랐는데 자신만 배신당했다고 느끼는 갈등이 생길 수 있습니다.",
    actionRules: ["돕기 전에 범위를 묻는다", "원하는 보답은 행동 전에 말로 합의한다"],
    prohibitedClaims: ["배신 확정"], tags: ["관계", "기대", "토"],
  },
  {
    id: "relationship-winning", title: "옳음을 증명하고 관계를 잃지 마십시오", conditions: ["tenGod:상관", "tenGod:겁재", "excess:금", "excess:화"],
    severity: 5, summary: "갈등에서 문제 해결보다 승패와 말의 정확성에 집착할 수 있습니다.",
    detailedReason: "경쟁·비판·속도의 기운이 강하면 상대의 감정을 듣기 전에 잘못부터 판정합니다.",
    warningSigns: ["과거 증거를 한꺼번에 꺼낸다", "사과보다 해명을 먼저 한다", "대화 중 목소리와 속도가 올라간다"],
    consequences: "논리적으로 이기고도 안전하게 대화할 수 없는 사람으로 남을 수 있습니다.",
    actionRules: ["반박 전에 상대가 원하는 해결을 묻는다", "격해지면 대화 재개 시간을 정하고 멈춘다"],
    prohibitedClaims: ["관계 단절 명령"], tags: ["관계", "갈등", "금", "화"],
  },
];
