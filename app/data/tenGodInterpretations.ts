import type { WarningRule } from "../types/fortune";

export const tenGodInterpretations: WarningRule[] = [
  {
    id: "authority-friction", title: "자존심이 판단력을 삼킬 수 있습니다", conditions: ["tenGod:상관", "tenGod:겁재"],
    severity: 5, summary: "틀린 지시를 참지 못하는 힘이, 필요한 협업까지 거부하게 만들 수 있습니다.",
    detailedReason: "비판성과 경쟁성이 강해지면 내용보다 누가 주도권을 쥐는지가 더 중요해집니다.",
    warningSigns: ["피드백의 말투부터 문제 삼는다", "설명 전에 반박한다", "공개석상에서 맞선다"],
    consequences: "실력과 별개로 함께 일하기 어려운 사람이라는 평가를 받을 수 있습니다.",
    actionRules: ["반박 전에 상대 요지를 한 문장으로 확인한다", "공개 반박은 비공개 질문으로 바꾼다"],
    prohibitedClaims: ["해고 예언"], tags: ["상관", "겁재", "직업", "자존심"],
  },
  {
    id: "caregiver-trap", title: "사람을 믿는 것이 아니라 기대를 투사합니다", conditions: ["tenGod:정인", "tenGod:정재"],
    severity: 4, summary: "책임감이 강할수록 상대도 같은 기준을 지킬 거라 가정합니다.",
    detailedReason: "보호와 성실의 기준이 강하면 말하지 않은 기대까지 계약처럼 취급할 수 있습니다.",
    warningSigns: ["부탁받기 전에 해결한다", "고마움을 기대한다", "서운함을 오래 쌓는다"],
    consequences: "일방적으로 희생한 뒤 상대를 배신자로 규정하는 관계 패턴이 생길 수 있습니다.",
    actionRules: ["돕기 전에 범위와 대가를 확인한다", "기대는 추측하지 말고 말로 합의한다"],
    prohibitedClaims: ["배우자 외도 단정"], tags: ["정인", "정재", "관계"],
  },
];
