import type { WarningRule } from "../types/fortune";

export const balanceInterpretations: WarningRule[] = [
  {
    id: "too-strong", title: "버티는 능력이 오히려 탈출을 늦춥니다", conditions: ["strength:strong"],
    severity: 5, summary: "견디는 힘이 강해 손절과 도움 요청이 늦습니다.",
    detailedReason: "신강 참고 지표가 높으면 자기 방식으로 버티는 능력과 고집이 함께 커집니다.",
    warningSigns: ["아무에게도 진행 상황을 말하지 않는다", "이미 쓴 시간이 아까워 계속한다", "피곤을 성실함으로 포장한다"],
    consequences: "작은 손실을 인정하지 못해 더 큰 시간과 감정을 소모할 수 있습니다.",
    actionRules: ["중단 기준을 시작 전에 수치로 정한다", "2주마다 제3자 검토를 받는다"],
    prohibitedClaims: ["파산 확정"], tags: ["신강", "고집", "재물", "생활"],
  },
  {
    id: "too-weak", title: "타인의 확신을 빌려 살면 책임만 남습니다", conditions: ["strength:weak"],
    severity: 4, summary: "압박을 받으면 자신의 기준보다 강한 사람의 판단에 기대기 쉽습니다.",
    detailedReason: "신약 참고 지표가 낮을 때 외부 기준을 빠르게 흡수하고 자기 판단을 뒤로 미룰 수 있습니다.",
    warningSigns: ["결정 전 여러 사람에게 같은 질문을 한다", "권위 있는 말에 검증을 멈춘다", "싫다는 말을 늦게 한다"],
    consequences: "선택권은 넘겼는데 결과의 책임은 혼자 떠안을 수 있습니다.",
    actionRules: ["조언을 듣기 전 내 기준 세 가지를 적는다", "즉답 대신 검토 시간을 요청한다"],
    prohibitedClaims: ["가치 없음 단정"], tags: ["신약", "경계", "관계"],
  },
];
