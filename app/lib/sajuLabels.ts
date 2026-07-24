const branchLabels: Record<string, { hanja: string; animal: string }> = {
  자: { hanja: "子", animal: "쥐" },
  축: { hanja: "丑", animal: "소" },
  인: { hanja: "寅", animal: "호랑이" },
  묘: { hanja: "卯", animal: "토끼" },
  진: { hanja: "辰", animal: "용" },
  사: { hanja: "巳", animal: "뱀" },
  오: { hanja: "午", animal: "말" },
  미: { hanja: "未", animal: "양" },
  신: { hanja: "申", animal: "원숭이" },
  유: { hanja: "酉", animal: "닭" },
  술: { hanja: "戌", animal: "개" },
  해: { hanja: "亥", animal: "돼지" },
};

const relationLabels: Record<string, { hanja: string; meaning: string }> = {
  합: { hanja: "合", meaning: "결합·협력" },
  충: { hanja: "沖", meaning: "정면 충돌·큰 변화" },
  형: { hanja: "刑", meaning: "반복 압박·마찰" },
  파: { hanja: "破", meaning: "균열·계획 변경" },
  해: { hanja: "害", meaning: "숨은 불편·엇갈림" },
};

export function formatBranch(branch: string): string {
  const label = branchLabels[branch];
  return label ? `${label.hanja}(${branch}·${label.animal})` : branch;
}

export function formatInteraction(interaction: string): string {
  const match = interaction.match(/^([자축인묘진사오미신유술해])·([자축인묘진사오미신유술해]) (합|충|형|파|해)$/);
  if (!match) return interaction;
  const [, first, second, relation] = match;
  const relationLabel = relationLabels[relation];
  return `${formatBranch(first)}–${formatBranch(second)} · ${relationLabel.hanja} ${relation}(${relationLabel.meaning})`;
}

export function formatInteractions(interactions: string[]): string {
  return interactions.map(formatInteraction).join(" / ");
}
