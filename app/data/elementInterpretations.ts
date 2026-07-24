import type { Element, WarningRule } from "../types/fortune";

type ElementSpec = {
  element: Element;
  excess: Omit<WarningRule, "id" | "conditions" | "prohibitedClaims" | "tags">;
  deficient: Omit<WarningRule, "id" | "conditions" | "prohibitedClaims" | "tags">;
};

const specs: ElementSpec[] = [
  {
    element: "목",
    excess: {
      title: "벌여 놓는 속도가 책임지는 속도를 앞섭니다", severity: 4,
      summary: "확장과 시작에는 강하지만 끝맺기 전에 다음 목표로 움직이기 쉽습니다.",
      detailedReason: "목 기운이 몰리면 성장 욕구가 현실적인 자원 계산보다 먼저 작동합니다.",
      warningSigns: ["동시에 여러 일을 시작한다", "중간 점검을 답답해한다", "방향을 자주 넓힌다"],
      consequences: "가능성은 많지만 완성된 결과와 신뢰가 남지 않을 수 있습니다.",
      actionRules: ["새 일을 받기 전에 진행 중인 일 하나를 끝낸다", "주간 완료 목록을 숫자로 확인한다"],
    },
    deficient: {
      title: "신중한 척하며 시작을 피할 수 있습니다", severity: 4,
      summary: "방향을 세우고 첫걸음을 떼는 힘이 약해질 때가 있습니다.",
      detailedReason: "목 기운 부족은 장기 계획을 실제 첫 행동으로 번역하는 데 마찰을 만듭니다.",
      warningSigns: ["준비 목록만 늘어난다", "완벽한 시점을 기다린다", "남의 계획을 따른다"],
      consequences: "실패보다 미착수로 기회를 놓치는 일이 더 커질 수 있습니다.",
      actionRules: ["오늘 할 15분짜리 첫 행동을 정한다", "70%에서 검토를 요청한다"],
    },
  },
  {
    element: "화",
    excess: {
      title: "기회보다 감정에 먼저 반응합니다", severity: 5,
      summary: "추진력은 강하지만 제동 장치가 약합니다.",
      detailedReason: "화 기운이 과하면 속도와 확신이 판단 검증보다 먼저 작동합니다.",
      warningSigns: ["목소리가 커진다", "답장을 재촉한다", "당일에 결론을 낸다"],
      consequences: "주변을 밀어낸 뒤 혼자 수습하는 패턴이 반복될 수 있습니다.",
      actionRules: ["중요한 결정은 24시간 보류한다", "격한 메시지는 임시 저장한다"],
    },
    deficient: {
      title: "표현하지 않은 마음은 아무도 알아주지 않습니다", severity: 3,
      summary: "느끼는 것에 비해 표현과 반응이 늦어 관계의 온도가 떨어질 수 있습니다.",
      detailedReason: "화 기운 부족은 감정과 의욕을 바깥으로 드러내는 속도를 낮춥니다.",
      warningSigns: ["좋아도 반응을 아낀다", "칭찬을 미룬다", "열의가 없는 사람처럼 보인다"],
      consequences: "실제 의도와 무관하게 무관심하거나 냉담하다는 오해가 쌓일 수 있습니다.",
      actionRules: ["고마움과 반대 의견을 그날 말한다", "중요한 관계에는 반응을 행동으로 보여준다"],
    },
  },
  {
    element: "토",
    excess: {
      title: "안정이 아니라 변화 거부일 수 있습니다", severity: 4,
      summary: "버티는 힘이 강한 만큼 이미 틀린 선택에서도 오래 머물 수 있습니다.",
      detailedReason: "토 기운이 몰리면 익숙한 구조를 지키는 일이 목표 자체보다 중요해집니다.",
      warningSigns: ["매몰 비용을 자주 말한다", "새 방식을 먼저 반박한다", "도움을 늦게 요청한다"],
      consequences: "고칠 수 있었던 문제를 견디다가 시간과 선택권을 함께 잃을 수 있습니다.",
      actionRules: ["중단 기준을 시작 전에 적는다", "한 달마다 유지 이유를 다시 검토한다"],
    },
    deficient: {
      title: "꾸준함이 없어 실력이 증명되지 않습니다", severity: 4,
      summary: "순간적인 집중은 가능하지만 반복 가능한 구조를 만드는 힘이 약할 수 있습니다.",
      detailedReason: "토 기운 부족은 생활 리듬과 약속을 안정적으로 유지하는 데 빈틈을 만듭니다.",
      warningSigns: ["일정이 기분에 따라 바뀐다", "기록을 며칠 만에 그만둔다", "마감 직전에 몰아친다"],
      consequences: "능력이 있어도 예측하기 어려운 사람이라는 평가를 받을 수 있습니다.",
      actionRules: ["매일 같은 시간에 한 가지를 반복한다", "일정을 의지가 아니라 알림과 체크리스트에 맡긴다"],
    },
  },
  {
    element: "금",
    excess: {
      title: "정확함이 사람을 자르는 칼이 됩니다", severity: 5,
      summary: "기준과 판단은 빠르지만 수정 가능한 실수까지 결함으로 취급할 수 있습니다.",
      detailedReason: "금 기운이 강하면 구분과 정리 능력이 비판과 단절 쪽으로 과도하게 기울 수 있습니다.",
      warningSigns: ["말의 오류부터 잡는다", "한 번의 실수로 사람을 평가한다", "완벽하지 않으면 공개하지 않는다"],
      consequences: "정답을 지키는 동안 협업자와 실행 기회를 잃을 수 있습니다.",
      actionRules: ["지적 전에 유지할 장점 하나를 말한다", "수정 가능한 오류와 중단할 문제를 구분한다"],
    },
    deficient: {
      title: "거절하지 못한 대가를 뒤늦게 분노로 받습니다", severity: 4,
      summary: "경계를 세우고 불필요한 것을 끊어내는 결정이 늦을 수 있습니다.",
      detailedReason: "금 기운 부족은 관계와 일의 선을 명확히 긋는 데 부담을 만듭니다.",
      warningSigns: ["즉석 부탁을 받아준다", "범위를 확인하지 않는다", "참다가 갑자기 연락을 끊는다"],
      consequences: "상대에게는 갑작스러운 단절로, 자신에게는 반복되는 소진으로 남을 수 있습니다.",
      actionRules: ["부탁에는 확인 후 답하겠다고 말한다", "역할과 마감 범위를 문장으로 합의한다"],
    },
  },
  {
    element: "수",
    excess: {
      title: "생각이 깊은 것이 아니라 빠져나오지 못하는 겁니다", severity: 4,
      summary: "정보를 모을수록 불안이 줄지 않고 선택지만 늘어날 수 있습니다.",
      detailedReason: "수 기운의 과다는 관찰력을 키우지만 의심과 과잉 해석도 함께 키웁니다.",
      warningSigns: ["같은 대화를 반복해서 복기한다", "상대의 침묵에 의미를 붙인다", "결정을 계속 미룬다"],
      consequences: "확인되지 않은 추측이 관계와 실행력을 잠식할 수 있습니다.",
      actionRules: ["사실과 해석을 두 칸으로 나눠 기록한다", "결정 기한을 먼저 정한다"],
    },
    deficient: {
      title: "정보가 부족한데도 결론부터 냅니다", severity: 4,
      summary: "멈춰서 관찰하고 우회로를 찾는 과정이 짧아질 수 있습니다.",
      detailedReason: "수 기운 부족은 상황의 맥락과 장기 파장을 읽기 전에 행동하게 만듭니다.",
      warningSigns: ["첫 설명만 듣고 판단한다", "질문보다 주장이 먼저 나온다", "과거 기록을 확인하지 않는다"],
      consequences: "속도는 빠르지만 같은 실수를 다른 형태로 반복할 수 있습니다.",
      actionRules: ["결론 전에 반대 자료 하나를 확인한다", "모르는 점을 세 가지 질문으로 바꾼다"],
    },
  },
];

export const elementInterpretations: WarningRule[] = specs.flatMap(({ element, excess, deficient }) => [
  {
    id: `${element}-excess`, conditions: [`excess:${element}`],
    prohibitedClaims: ["사건 확정", "질병 진단"], tags: [element, "오행", "과다"], ...excess,
  },
  {
    id: `${element}-deficient`, conditions: [`deficient:${element}`],
    prohibitedClaims: ["정체성 단정", "무능 단정"], tags: [element, "오행", "부족"], ...deficient,
  },
]);
