import type { WarningRule } from "../types/fortune";

export const moneyWarnings: WarningRule[] = [
  {
    id: "emotional-money", title: "미안함과 흥분을 돈으로 해결하지 마십시오", conditions: ["tag:재물"],
    severity: 5, summary: "사람을 돕거나 불안을 달래려는 지출이 예산을 무너뜨릴 수 있습니다.",
    detailedReason: "관계의 불편함을 현금으로 빨리 끝내려 하면 검증과 계약이 생략됩니다.",
    warningSigns: ["지인 부탁에 당일 송금한다", "힘든 날 쇼핑 앱을 연다", "손실을 만회하려 금액을 키운다"],
    consequences: "돈뿐 아니라 관계의 경계까지 동시에 잃을 수 있습니다.",
    actionRules: ["큰 금액은 당일 결정하지 않는다", "지인 거래는 계약서를 쓴다", "보증과 명의 대여를 하지 않는다"],
    prohibitedClaims: ["파산 확정", "수익 보장"], tags: ["재물", "투자", "관계"],
  },
];
