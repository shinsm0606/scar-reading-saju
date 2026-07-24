import { excessEnvironmentRules, foodCautions, peopleCautions, placeRules } from "../data/environmentGuidance";
import type { AnnualFlow, AnnualGuidance, Element, FortuneChart } from "../types/fortune";

export function buildAnnualGuidance(chart: FortuneChart, annual: AnnualFlow): AnnualGuidance {
  const elementEntries = Object.entries(chart.elementDistribution) as [Element, number][];
  const supportiveElement = [...elementEntries].sort((a, b) => a[1] - b[1])[0][0];
  const dominantElement = [...elementEntries].sort((a, b) => b[1] - a[1])[0][0];
  const placeRule = placeRules[supportiveElement];
  const difficultRelations = annual.interactions.filter((relation) => / 충$| 형$| 파$| 해$/.test(relation));
  const travelHorse = chart.spiritStars?.find(({ id }) => id === "travel-horse" && Boolean(id))?.present ?? false;
  const documentAdvice = ["편재", "정재"].includes(annual.tenGod)
    ? "견적서·대출·투자·공동비용 문서에서 금액뿐 아니라 해지와 손실 부담 조건을 확인하십시오."
    : ["편관", "정관"].includes(annual.tenGod)
      ? "신청서·승인 문서·계약서에서 책임 범위와 예외 절차를 구두 설명만 믿지 말고 확인하십시오."
      : ["편인", "정인"].includes(annual.tenGod)
        ? "자격·교육·지원 문서에서 제출 기한, 환불 조건과 실제 인정 범위를 확인하십시오."
        : "메시지·제안서·합의 문서에서 상대가 동의한 내용과 내가 추측한 내용을 분리하십시오.";
  const cautions: AnnualGuidance["cautions"] = [
    {
      category: "문서",
      basis: `${annual.year}년 천간 십신 ${annual.tenGod}`,
      advice: documentAdvice,
    },
    {
      category: "음식",
      basis: `원국 최강 오행 ${dominantElement} ${chart.elementDistribution[dominantElement]}개`,
      advice: foodCautions[dominantElement],
    },
    {
      category: "사람",
      basis: `${annual.year}년 반복 역할 ${annual.tenGod}`,
      advice: peopleCautions[annual.tenGod],
    },
  ];
  if (travelHorse || difficultRelations.length > 0) {
    cautions.push({
      category: "이동·자동차",
      basis: travelHorse
        ? `원국 역마 신호${difficultRelations.length ? ` + 세운 ${difficultRelations.join(" · ")}` : ""}`
        : `세운 ${difficultRelations.join(" · ")}`,
      advice: "장거리 이동은 출발 시간을 촘촘하게 잡지 말고, 차량 점검·보험·주차·복귀 시간을 먼저 확인하십시오. 이는 사고 예측이 아니라 이동이 많아질 때 생기는 판단 누락을 막는 수칙입니다.",
    });
  }
  const annualRelation = annual.element === supportiveElement
    ? `올해 ${annual.element} 기운이 원국의 부족한 부분을 직접 보완합니다.`
    : chart.excessiveElements.includes(annual.element)
      ? `올해 ${annual.element} 기운이 이미 강한 축을 더 자극하므로 ${supportiveElement} 환경으로 속도를 낮출 필요가 있습니다.`
      : `올해 ${annual.element} 흐름 속에서 원국의 약한 ${supportiveElement} 방식을 의도적으로 보완해야 합니다.`;
  return {
    year: annual.year,
    supportiveElement,
    direction: placeRule.direction,
    headline: `${annual.year}년에는 ${placeRule.environment}이 균형 회복에 맞습니다`,
    basis: `원국에서 ${supportiveElement}가 ${chart.elementDistribution[supportiveElement]}개로 가장 약합니다. ${annualRelation}`,
    recommendedPlaces: placeRule.places,
    reduceEnvironments: excessEnvironmentRules[dominantElement],
    cautions,
  };
}
