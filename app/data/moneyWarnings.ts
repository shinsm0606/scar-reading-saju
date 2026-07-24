import type { WarningRule } from "../types/fortune";

export const moneyWarnings: WarningRule[] = [
  {
    id: "money-emotional", title: "흥분과 경쟁심으로 돈을 결정하지 마십시오", conditions: ["tenGod:편재", "tenGod:겁재", "excess:화"],
    severity: 5, summary: "기회나 사람에게 빠르게 반응할수록 검증과 손실 한도가 생략될 수 있습니다.",
    detailedReason: "확장·승부·속도의 신호가 강하면 수익 가능성을 먼저 보고 회수 조건을 나중에 확인합니다.",
    warningSigns: ["지인 제안에 당일 송금한다", "손실을 만회하려 금액을 키운다", "놓치면 안 된다는 말에 흔들린다"],
    consequences: "돈뿐 아니라 관계의 경계까지 동시에 잃을 수 있습니다.",
    actionRules: ["큰 금액은 당일 결정하지 않는다", "공동투자는 계약서와 종료 조건을 확인한다", "보증과 명의 대여를 하지 않는다"],
    prohibitedClaims: ["파산 확정", "수익 보장"], tags: ["재물", "투자", "속도"],
  },
  {
    id: "money-fear-freeze", title: "아끼는 것이 아니라 결정을 얼리고 있습니다", conditions: ["tenGod:정재", "tenGod:정관", "excess:금"],
    severity: 4, summary: "손실을 피하려는 기준이 강해 필요한 지출과 장기 계획까지 미룰 수 있습니다.",
    detailedReason: "안정과 통제의 신호가 강하면 작은 변동도 실패처럼 느껴져 현금만 붙잡게 됩니다.",
    warningSigns: ["비용만 보고 시간을 계산하지 않는다", "계획 변경을 손해로 본다", "작은 손실도 오래 복기한다"],
    consequences: "큰 사고는 피하지만 성장에 필요한 선택도 계속 늦어질 수 있습니다.",
    actionRules: ["생활비·비상금·성장 예산을 분리한다", "가격뿐 아니라 절약되는 시간도 기록한다"],
    prohibitedClaims: ["재산 결과 확정"], tags: ["재물", "안정", "통제"],
  },
  {
    id: "money-anxiety-spending", title: "불안을 소비와 숫자 확인으로 달래지 마십시오", conditions: ["excess:수", "tenGod:편인", "deficient:토"],
    severity: 4, summary: "감정이 흔들릴 때 쇼핑이나 잦은 잔액 확인으로 즉각적인 안도감을 찾을 수 있습니다.",
    detailedReason: "생각이 많고 생활 리듬이 흔들리면 돈의 실제 목적보다 불안을 낮추는 행동이 먼저 나옵니다.",
    warningSigns: ["힘든 날 쇼핑 앱을 연다", "계좌를 반복 확인한다", "소액 결제를 기억하지 못한다"],
    consequences: "큰 한 번보다 작은 감정 지출이 쌓여 예산을 흐릴 수 있습니다.",
    actionRules: ["감정이 격한 날 결제를 24시간 보류한다", "주 1회만 소비 기록을 검토한다"],
    prohibitedClaims: ["파산 예언"], tags: ["재물", "불안", "생활"],
  },
];
