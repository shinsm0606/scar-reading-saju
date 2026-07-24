import { describe, expect, it } from "vitest";
import { analyzeChart, calculateRisk, deduplicateWarnings, tone } from "../app/lib/analysisEngine";
import { DemoFortuneCalculator } from "../app/lib/fortuneCalculator";
import { defaultInput, demoProfiles } from "../app/lib/profiles";
import { decodeSharePayload, encodeSharePayload } from "../app/lib/share";
import { deleteBirthInput, loadBirthInput, saveBirthInput } from "../app/lib/storage";
import { isValidDate, validateBirthInput } from "../app/lib/validation";

describe("결정론적 데모 계산", () => {
  it("같은 입력은 항상 같은 결과를 만든다", () => {
    const calculator = new DemoFortuneCalculator();
    expect(calculator.calculate(defaultInput)).toEqual(calculator.calculate(defaultInput));
  });

  it("테스트 프로필은 서로 다른 시드를 만든다", () => {
    const calculator = new DemoFortuneCalculator();
    const seeds = demoProfiles.map(({ input }) => calculator.calculate(input).seed);
    expect(new Set(seeds).size).toBe(demoProfiles.length);
  });

  it("출생시간 미상은 시주를 물음표로 처리하고 신뢰도를 낮춘다", () => {
    const chart = new DemoFortuneCalculator().calculate(demoProfiles[4].input);
    expect(chart.pillars[3].stem).toBe("?");
    expect(chart.confidence).toBeLessThan(70);
  });

  it("양력과 음력 선택을 서로 다른 시드로 반영한다", () => {
    const calculator = new DemoFortuneCalculator();
    const solar = calculator.calculate(defaultInput);
    const lunar = calculator.calculate({ ...defaultInput, calendarType: "lunar" });
    expect(solar.seed).not.toBe(lunar.seed);
  });
});

describe("검증과 해석", () => {
  it("윤년과 존재하지 않는 날짜를 검증한다", () => {
    expect(isValidDate(2024, 2, 29)).toBe(true);
    expect(isValidDate(2023, 2, 29)).toBe(false);
  });

  it("미래 날짜를 거부한다", () => {
    const errors = validateBirthInput({ ...defaultInput, name: "테스트", year: 2099 }, new Date("2026-07-24"));
    expect(errors.date).toBeTruthy();
  });

  it("위험 등급 경계를 계산한다", () => {
    expect([calculateRisk(10), calculateRisk(30), calculateRisk(50), calculateRisk(65), calculateRisk(90)])
      .toEqual(["안정", "주의", "경계", "위험", "고위험"]);
  });

  it("경고 문장을 id와 제목 기준으로 중복 제거한다", () => {
    const result = analyzeChart(new DemoFortuneCalculator().calculate(defaultInput));
    const duplicated = deduplicateWarnings([...result.weaknesses, ...result.weaknesses]);
    expect(duplicated).toHaveLength(result.weaknesses.length);
  });

  it("풀이 강도에 따라 표현이 달라진다", () => {
    const text = "중요한 결정을 하지 마십시오";
    expect(tone(text, "mild")).not.toBe(tone(text, "direct"));
    expect(tone(text, "realistic")).not.toBe(tone(text, "direct"));
  });
});

describe("저장과 공유 개인정보", () => {
  const memory = new Map<string, string>();
  const storage = {
    getItem: (key: string) => memory.get(key) ?? null,
    setItem: (key: string, value: string) => { memory.set(key, value); },
    removeItem: (key: string) => { memory.delete(key); },
  } as Storage;

  it("동의할 때만 저장하고 삭제한다", () => {
    saveBirthInput(storage, { ...defaultInput, allowStorage: true });
    expect(loadBirthInput(storage)?.year).toBe(defaultInput.year);
    deleteBirthInput(storage);
    expect(loadBirthInput(storage)).toBeNull();
  });

  it("공유 데이터에는 생년월일과 출생시간이 없다", () => {
    const encoded = encodeSharePayload({ v: 1, name: "공유자", intensity: "direct", seed: 123, timeUnknown: false });
    const decoded = decodeSharePayload(encoded);
    expect(decoded).toEqual({ v: 1, name: "공유자", intensity: "direct", seed: 123, timeUnknown: false });
    expect(decoded).not.toHaveProperty("year");
    expect(decoded).not.toHaveProperty("hour");
    expect(encoded).not.toContain(String(defaultInput.year));
  });
});
