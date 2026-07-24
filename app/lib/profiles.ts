import type { BirthInput } from "../types/fortune";

export const defaultInput: BirthInput = {
  name: "", gender: "none", calendarType: "solar", leapMonth: false,
  year: 1992, month: 8, day: 17, hour: 9, minute: 0, timeUnknown: false,
  region: "대한민국 서울", trueSolarTime: true, intensity: "direct", allowStorage: false,
};

export const demoProfiles: Array<{ label: string; hint: string; input: BirthInput }> = [
  { label: "균형형", hint: "오행이 비교적 고른 유형", input: { ...defaultInput, name: "균형잡이", year: 1988, month: 4, day: 13, hour: 14 } },
  { label: "화 과다형", hint: "속도와 반응성이 강한 유형", input: { ...defaultInput, name: "불꽃직진", year: 1995, month: 7, day: 22, hour: 11 } },
  { label: "수 과다형", hint: "생각과 관찰이 강한 유형", input: { ...defaultInput, name: "깊은물", year: 1990, month: 12, day: 9, hour: 23 } },
  { label: "결핍형", hint: "특정 오행이 크게 비는 유형", input: { ...defaultInput, name: "빈자리", year: 2001, month: 2, day: 3, hour: 6 } },
  { label: "시간 미상형", hint: "시주 없이 분석하는 유형", input: { ...defaultInput, name: "미상인", year: 1983, month: 10, day: 28, hour: null, timeUnknown: true } },
];
