import type { WarningRule } from "../types/fortune";

export const careerWarnings: WarningRule[] = [
  {
    id: "recognition-collapse", title: "인정받지 못했다는 감정으로 판을 깨지 마십시오", conditions: ["tag:직업"],
    severity: 5, summary: "능력 부족보다 인정 욕구가 쌓였을 때의 돌발 행동이 더 위험합니다.",
    detailedReason: "성과와 자존감이 붙으면 수정 요청도 존재에 대한 부정처럼 받아들일 수 있습니다.",
    warningSigns: ["퇴사 검색을 충동적으로 한다", "인수인계를 거부하고 싶어진다", "동료 성과를 깎아본다"],
    consequences: "좋은 경력까지 감정적인 퇴장 방식으로 훼손할 수 있습니다.",
    actionRules: ["퇴사 결정은 72시간과 재정 점검 후 확정한다", "성과와 감정을 별도 문서에 기록한다"],
    prohibitedClaims: ["해고 확정"], tags: ["직업", "조직", "감정"],
  },
];
