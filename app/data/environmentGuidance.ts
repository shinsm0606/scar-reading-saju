import type { Element } from "../types/fortune";

export type PlaceRule = {
  direction: string;
  environment: string;
  places: Array<{ name: string; category: string; reason: string }>;
};

export const placeRules: Record<Element, PlaceRule> = {
  목: {
    direction: "동쪽·북동쪽",
    environment: "나무가 많고 완만하게 걸을 수 있는 산·숲",
    places: [
      { name: "수락산", category: "산", reason: "서울 북동권에서 숲과 능선을 따라 걷기 좋은 후보" },
      { name: "도봉산", category: "산", reason: "도심에서 접근하면서도 수목과 바위길의 전환을 경험하는 후보" },
      { name: "국립수목원", category: "숲", reason: "속도를 낮추고 일정한 보행 리듬을 만들기 좋은 후보" },
    ],
  },
  화: {
    direction: "남쪽",
    environment: "해가 잘 들고 시야가 열린 해안·전망지",
    places: [
      { name: "성산일출봉", category: "오름·해안", reason: "일출과 열린 수평선으로 표현과 활동성을 깨우는 후보" },
      { name: "여수 오동도", category: "섬·해안", reason: "바다와 산책로를 함께 이용하며 정체된 리듬을 바꾸는 후보" },
      { name: "부산 이기대 해안산책로", category: "해안", reason: "밝은 야외 활동과 긴 보행을 결합하기 좋은 후보" },
    ],
  },
  토: {
    direction: "중앙·내륙",
    environment: "흙길과 성곽처럼 경계가 분명하고 속도가 안정적인 곳",
    places: [
      { name: "남한산성", category: "산성·걷기", reason: "완만한 성곽길에서 속도와 호흡을 일정하게 만들기 좋은 후보" },
      { name: "수원화성", category: "성곽·도시", reason: "정해진 동선과 역사 공간을 따라 차분히 걷기 좋은 후보" },
      { name: "서울 올림픽공원", category: "공원", reason: "무리한 산행 없이 넓은 지면에서 생활 리듬을 회복하는 후보" },
    ],
  },
  금: {
    direction: "서쪽",
    environment: "동선이 정돈되고 시야가 트인 서쪽 공원·성곽·계획도시",
    places: [
      { name: "강화 마니산", category: "산", reason: "서쪽 방향성과 선명한 등산 동선으로 정리와 결단을 연습하는 후보" },
      { name: "인천 송도 센트럴파크", category: "도시·공원", reason: "정돈된 도시 환경과 수변 산책을 함께 이용하는 후보" },
      { name: "서울 월드컵공원", category: "공원", reason: "넓고 구분된 산책 동선에서 생각을 정리하기 좋은 후보" },
    ],
  },
  수: {
    direction: "북쪽",
    environment: "물의 흐름이 보이고 소음이 적은 계곡·호수·해변",
    places: [
      { name: "포천 백운계곡", category: "계곡", reason: "물소리와 계곡 보행으로 과열된 반응을 식히는 후보" },
      { name: "가평 용추계곡", category: "계곡", reason: "숲과 물길을 함께 보며 생각의 속도를 낮추는 후보" },
      { name: "속초 영랑호", category: "호수", reason: "평탄한 수변 동선에서 오래 생각하기보다 걸으며 정리하는 후보" },
    ],
  },
};

export const excessEnvironmentRules: Record<Element, Array<{ environment: string; reason: string }>> = {
  목: [
    { environment: "코스를 계속 늘리는 종주 산행", reason: "확장 욕구가 강한 원국에서는 멈출 지점보다 다음 목표만 보게 할 수 있습니다." },
    { environment: "일정이 빽빽한 여러 도시 이동", reason: "새 장소를 많이 넣을수록 완료와 회복이 뒤로 밀릴 수 있습니다." },
  ],
  화: [
    { environment: "공항 환승구역·대형 행사장", reason: "속도·소음·대기 압박이 즉흥적인 결정과 날카로운 반응을 키울 수 있습니다." },
    { environment: "고층빌딩이 밀집한 번화가의 장시간 체류", reason: "자극이 계속되는 환경에서는 멈춰 검토하는 시간이 줄어듭니다." },
  ],
  토: [
    { environment: "이동과 교류가 거의 없는 외딴 숙소", reason: "버티기와 고립이 강해져 바꿔야 할 문제도 그대로 둘 수 있습니다." },
    { environment: "하루 종일 앉아 있는 실내 공간", reason: "안정감이 정체로 바뀌면 행동 전환이 더 늦어집니다." },
  ],
  금: [
    { environment: "규칙과 감시가 강한 폐쇄형 공간", reason: "정확성과 통제가 과해져 작은 오류에도 예민해질 수 있습니다." },
    { environment: "업무만 이어지는 고층 오피스 밀집 지역", reason: "성과 기준만 남으면 관계와 회복 신호를 잘라내기 쉽습니다." },
  ],
  수: [
    { environment: "밤늦은 외딴 해변·계곡", reason: "생각이 깊어지는 시간과 고립이 겹치면 확인보다 추측이 늘 수 있습니다." },
    { environment: "동선이 불분명한 장기 체류 여행", reason: "선택지를 계속 열어 두면서 결정과 복귀 기준을 놓칠 수 있습니다." },
  ],
};

export const foodCautions: Record<Element, string> = {
  목: "이동 일정 때문에 끼니를 건너뛰고 카페인으로 버티는 패턴을 줄이십시오.",
  화: "흥분한 날의 과음·야식·자극적인 식사를 중요한 대화와 함께 묶지 마십시오.",
  토: "답답함을 달래는 반복 간식과 늦은 과식을 기록 없이 넘기지 마십시오.",
  금: "식단 규칙을 지나치게 엄격하게 만들었다가 한 번에 포기하는 방식을 피하십시오.",
  수: "밤늦게 생각을 이어가기 위해 술·배달 음식·카페인을 반복하는 습관을 줄이십시오.",
};

export const peopleCautions: Record<string, string> = {
  비견: "당신과 비슷한 방식만 정답이라고 밀어붙이는 사람과는 역할을 먼저 나누십시오.",
  겁재: "친분과 경쟁심을 이용해 공동 지출·명의·책임을 서두르는 사람을 경계하십시오.",
  식신: "편안함을 이유로 중요한 기한을 계속 미루게 만드는 관계에 기준을 세우십시오.",
  상관: "공개석상에서 말싸움과 즉답을 유도하는 사람에게 바로 반응하지 마십시오.",
  편재: "놓치면 손해라고 재촉하며 돈과 사람을 동시에 끌어들이는 제안을 당일 결정하지 마십시오.",
  정재: "안전만 강조하며 필요한 변화까지 막는 사람의 기준을 그대로 빌리지 마십시오.",
  편관: "긴급함과 권위를 앞세워 과도한 책임을 넘기는 사람에게 범위부터 확인하십시오.",
  정관: "직함과 규정만으로 반대 의견을 막는 사람에게 근거와 예외 절차를 요청하십시오.",
  편인: "근거를 보여주지 않고 직감과 비밀 정보만 강조하는 조언을 사실로 받아들이지 마십시오.",
  정인: "계속 공부하고 허락받아야 한다며 실행을 늦추는 조언에서 마감일을 분리하십시오.",
};
