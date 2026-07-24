import { lunarToSolar, isValidSolarDate } from "manseryeok";
import type { BirthInput } from "../types/fortune";

export function isValidDate(year: number, month: number, day: number): boolean {
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return false;
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

export function validateBirthInput(input: BirthInput, now = new Date()): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!input.name.trim()) errors.name = "이름 또는 닉네임을 입력하십시오.";
  try {
    if (input.calendarType === "solar" && !isValidSolarDate(input.year, input.month, input.day)) {
      throw new RangeError("invalid solar date");
    }
    const solar = input.calendarType === "lunar"
      ? lunarToSolar(input.year, input.month, input.day, input.leapMonth)
      : { year: input.year, month: input.month, day: input.day };
    const birth = new Date(solar.year, solar.month - 1, solar.day, input.timeUnknown ? 0 : (input.hour ?? 0), input.minute);
    if (birth.getTime() > now.getTime()) errors.date = "미래 날짜는 입력할 수 없습니다.";
  } catch {
    errors.date = input.calendarType === "lunar"
      ? "존재하지 않는 음력 날짜이거나 해당 월에 선택한 윤달이 없습니다."
      : "존재하지 않는 날짜입니다.";
  }
  if (!input.timeUnknown && (input.hour === null || input.hour < 0 || input.hour > 23)) {
    errors.time = "출생시간을 올바르게 선택하십시오.";
  }
  if (input.minute < 0 || input.minute > 59) errors.time = "출생 분을 올바르게 입력하십시오.";
  if (!input.region.trim()) errors.region = "출생 지역을 입력하십시오.";
  return errors;
}
