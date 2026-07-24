import type { WarningRule } from "../types/fortune";

export const careerWarnings: WarningRule[] = [
  {
    id: "career-recognition-collapse", title: "인정받지 못했다는 감정으로 판을 깨지 마십시오", conditions: ["tenGod:상관", "tenGod:겁재", "excess:화"],
    severity: 5, summary: "능력 부족보다 인정 욕구가 쌓였을 때의 돌발 행동이 더 위험합니다.",
    detailedReason: "성과와 자존감이 붙으면 수정 요청도 존재에 대한 부정처럼 받아들일 수 있습니다.",
    warningSigns: ["퇴사 검색을 충동적으로 한다", "인수인계를 거부하고 싶어진다", "동료 성과를 깎아본다"],
    consequences: "좋은 경력까지 감정적인 퇴장 방식으로 훼손할 수 있습니다.",
    actionRules: ["퇴사 결정은 72시간과 재정 점검 후 확정한다", "성과와 감정을 별도 문서에 기록한다"],
    prohibitedClaims: ["해고 확정"], tags: ["직업", "조직", "감정"],
  },
  {
    id: "career-preparation-loop", title: "완벽하게 준비하다 실행 시점을 놓칩니다", conditions: ["tenGod:정인", "tenGod:편인", "deficient:목"],
    severity: 4, summary: "자료와 설계를 늘리는 동안 검토받을 실제 결과물이 늦어질 수 있습니다.",
    detailedReason: "정보를 충분히 이해해야 움직이려는 성향은 불확실한 업무에서 미착수로 이어집니다.",
    warningSigns: ["초안을 혼자 오래 다듬는다", "회의 전에 자료만 늘린다", "질문받을까 봐 공유를 미룬다"],
    consequences: "능력보다 속도와 가시성이 낮게 평가될 수 있습니다.",
    actionRules: ["70% 완성에서 검토를 요청한다", "조사 시간과 제작 시간을 일정에서 분리한다"],
    prohibitedClaims: ["실패 확정"], tags: ["직업", "실행", "준비"],
  },
  {
    id: "career-rigid-order", title: "성실함이 낡은 방식의 변명이 될 수 있습니다", conditions: ["tenGod:정관", "tenGod:정재", "excess:토"],
    severity: 4, summary: "규칙을 잘 지키지만 목표보다 절차를 지키는 데 에너지를 더 쓸 수 있습니다.",
    detailedReason: "질서와 안정의 기운이 강하면 역할 밖의 시도와 빠른 수정이 무책임하게 느껴집니다.",
    warningSigns: ["전례가 없다는 말부터 한다", "권한 경계를 지나치게 따진다", "환경이 바뀌어도 보고 방식을 유지한다"],
    consequences: "신뢰받는 실무자에 머물고 변화의 주도권은 다른 사람에게 넘어갈 수 있습니다.",
    actionRules: ["절차마다 지키려는 목적을 확인한다", "분기마다 한 가지 업무 방식을 실험한다"],
    prohibitedClaims: ["승진 실패 확정"], tags: ["직업", "조직", "안정"],
  },
];
