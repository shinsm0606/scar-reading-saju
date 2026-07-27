import type { Element } from "../types/fortune";

export type TravelRange = "nearby" | "daytrip" | "nationwide";

export type PlaceCandidate = {
  id: string;
  name: string;
  region: string;
  category: string;
  elements: Element[];
  range: Exclude<TravelRange, "nearby"> | "nearby";
  intensity: "낮음" | "보통" | "높음";
  reason: string;
};

export type PlaceRule = {
  direction: string;
  environment: string;
};

export const placeRules: Record<Element, PlaceRule> = {
  목: { direction: "동쪽·북동쪽", environment: "나무가 많고 완만하게 걸을 수 있는 산·숲" },
  화: { direction: "남쪽", environment: "해가 잘 들고 시야가 열린 해안·전망지" },
  토: { direction: "중앙·내륙", environment: "흙길과 성곽처럼 경계가 분명하고 속도가 안정적인 곳" },
  금: { direction: "서쪽", environment: "동선이 정돈되고 시야가 트인 공원·성곽·도시" },
  수: { direction: "북쪽", environment: "물의 흐름이 보이고 소음이 적은 계곡·호수·해변" },
};

export const placeCatalog: PlaceCandidate[] = [
  { id: "bukhansan-dulle", name: "북한산 둘레길", region: "서울", category: "산·숲", elements: ["목", "토"], range: "nearby", intensity: "낮음", reason: "수목이 많은 완만한 길에서 대화와 보행 리듬을 함께 유지하기 좋습니다." },
  { id: "seoul-forest", name: "서울숲", region: "서울", category: "숲·공원", elements: ["목", "금"], range: "nearby", intensity: "낮음", reason: "접근성이 높고 동선이 분명해 짧은 시간에도 속도를 낮추기 좋습니다." },
  { id: "dobongsan", name: "도봉산 둘레길", region: "서울", category: "산·숲", elements: ["목", "토"], range: "nearby", intensity: "보통", reason: "바위 능선보다 둘레길을 선택하면 수목과 안정적인 보행을 함께 얻을 수 있습니다." },
  { id: "suraksan", name: "수락산 숲길", region: "서울·경기", category: "산·숲", elements: ["목", "토"], range: "nearby", intensity: "보통", reason: "북동권 숲길에서 정체된 생각을 움직임으로 전환하기 좋은 후보입니다." },
  { id: "gwangneung", name: "국립수목원", region: "경기 포천", category: "수목원", elements: ["목", "수"], range: "daytrip", intensity: "낮음", reason: "걷는 속도를 낮추고 관찰과 대화를 길게 이어가기 좋은 숲입니다." },
  { id: "gapyeong-pine", name: "잣향기푸른숲", region: "경기 가평", category: "숲", elements: ["목", "수"], range: "daytrip", intensity: "낮음", reason: "잣나무 숲과 완만한 길이 긴장 완화와 일정한 호흡을 돕습니다." },
  { id: "odaesan", name: "오대산 선재길", region: "강원 평창", category: "산·계곡", elements: ["목", "수"], range: "nationwide", intensity: "낮음", reason: "깊은 숲과 물길이 함께 있어 과열과 정체를 동시에 낮추기 좋습니다." },
  { id: "jirisan-dulle", name: "지리산 둘레길", region: "전북·전남·경남", category: "산·숲", elements: ["목", "토"], range: "nationwide", intensity: "보통", reason: "목표 경쟁보다 긴 호흡의 이동과 대화에 적합한 길입니다." },
  { id: "naejangsan", name: "내장산 숲길", region: "전북 정읍", category: "산·숲", elements: ["목", "화"], range: "nationwide", intensity: "보통", reason: "계절 색감과 수목이 표현력과 관계의 활기를 보완하는 후보입니다." },
  { id: "suncheon-bay", name: "순천만국가정원", region: "전남 순천", category: "정원·습지", elements: ["목", "수", "금"], range: "nationwide", intensity: "낮음", reason: "정돈된 정원과 열린 습지가 대화와 휴식을 균형 있게 만듭니다." },
  { id: "seongsan", name: "성산일출봉", region: "제주", category: "오름·해안", elements: ["화", "토"], range: "nationwide", intensity: "보통", reason: "해가 잘 들고 시야가 열려 정체된 분위기를 전환하기 좋습니다." },
  { id: "yeosu-odongdo", name: "여수 오동도", region: "전남 여수", category: "섬·해안", elements: ["화", "수", "목"], range: "nationwide", intensity: "낮음", reason: "바다와 산책로를 함께 이용해 활동성과 회복을 동시에 확보할 수 있습니다." },
  { id: "igidae", name: "이기대 해안산책로", region: "부산", category: "해안", elements: ["화", "수"], range: "nationwide", intensity: "보통", reason: "밝은 야외 활동과 긴 수평선이 답답한 관계 리듬을 환기합니다." },
  { id: "gyeongpo", name: "경포호 산책로", region: "강원 강릉", category: "호수·해안", elements: ["화", "수"], range: "nationwide", intensity: "낮음", reason: "빛과 물이 함께 있는 평탄한 길에서 대화를 끊지 않고 걸을 수 있습니다." },
  { id: "namhansanseong", name: "남한산성", region: "경기 광주", category: "산성·걷기", elements: ["토", "금"], range: "daytrip", intensity: "보통", reason: "정해진 성곽 동선이 일정과 역할을 차분하게 맞추는 데 유리합니다." },
  { id: "suwon-hwaseong", name: "수원화성", region: "경기 수원", category: "성곽·도시", elements: ["토", "금"], range: "daytrip", intensity: "낮음", reason: "구간과 목적지가 명확해 즉흥성보다 합의된 속도로 움직이기 좋습니다." },
  { id: "olympic-park", name: "올림픽공원", region: "서울", category: "공원", elements: ["토", "목"], range: "nearby", intensity: "낮음", reason: "무리한 산행 없이 넓은 지면에서 생활 리듬을 회복하기 좋습니다." },
  { id: "gyeryongsan", name: "계룡산 동학사길", region: "충남 공주", category: "산·계곡", elements: ["토", "수"], range: "nationwide", intensity: "보통", reason: "분명한 동선과 계곡이 안정감과 감정 환기를 함께 제공합니다." },
  { id: "manisan", name: "강화 마니산", region: "인천 강화", category: "산", elements: ["금", "토"], range: "daytrip", intensity: "높음", reason: "서쪽의 선명한 등산 동선이 결단과 정리의 기준을 세우는 데 적합합니다." },
  { id: "songdo", name: "송도 센트럴파크", region: "인천", category: "도시·수변", elements: ["금", "수"], range: "daytrip", intensity: "낮음", reason: "정돈된 도시 환경과 수변 산책을 함께 이용할 수 있습니다." },
  { id: "worldcup-park", name: "월드컵공원", region: "서울", category: "공원", elements: ["금", "목"], range: "nearby", intensity: "낮음", reason: "구분된 산책 동선과 넓은 시야가 생각과 역할을 정리하게 합니다." },
  { id: "dadaepo", name: "다대포 해변공원", region: "부산", category: "해안·공원", elements: ["금", "수", "화"], range: "nationwide", intensity: "낮음", reason: "넓고 평탄한 공간에서 각자의 속도를 유지하면서 함께 머물기 좋습니다." },
  { id: "pocheon-baegun", name: "백운계곡", region: "경기 포천", category: "계곡", elements: ["수", "목"], range: "daytrip", intensity: "낮음", reason: "물소리와 숲길이 과열된 반응을 식히고 대화의 속도를 낮춥니다." },
  { id: "gapyeong-yongchu", name: "용추계곡", region: "경기 가평", category: "계곡", elements: ["수", "목"], range: "daytrip", intensity: "보통", reason: "숲과 물길을 함께 보며 즉답보다 관찰을 늘리기 좋습니다." },
  { id: "yeongrangho", name: "영랑호", region: "강원 속초", category: "호수", elements: ["수", "금"], range: "nationwide", intensity: "낮음", reason: "평탄한 수변 동선이 생각을 대화와 움직임으로 전환하게 합니다." },
  { id: "semiwon", name: "세미원", region: "경기 양평", category: "정원·수변", elements: ["수", "목", "금"], range: "daytrip", intensity: "낮음", reason: "정돈된 수변 정원에서 감정의 속도와 일정의 속도를 함께 낮추기 좋습니다." },
  { id: "upo", name: "우포늪 생태길", region: "경남 창녕", category: "습지", elements: ["수", "목"], range: "nationwide", intensity: "낮음", reason: "소음이 적은 물길과 평탄한 길이 오래 대화하며 걷는 일정에 적합합니다." },
  { id: "saryeoni", name: "사려니숲길", region: "제주", category: "숲", elements: ["목", "수"], range: "nationwide", intensity: "낮음", reason: "강한 목표 없이 나란히 걷는 방식으로 관계의 긴장을 낮추기 좋습니다." },
  { id: "palgongsan", name: "팔공산 둘레길", region: "대구·경북", category: "산·숲", elements: ["목", "토"], range: "nationwide", intensity: "보통", reason: "숲과 완만한 구간을 선택하면 활동성과 안정감을 함께 얻을 수 있습니다." },
  { id: "taean", name: "태안 해변길", region: "충남 태안", category: "해안", elements: ["수", "금", "화"], range: "nationwide", intensity: "보통", reason: "긴 수평선과 단순한 동선이 복잡한 결정을 잠시 분리하게 합니다." },
];

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
