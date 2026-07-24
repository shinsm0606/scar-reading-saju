import { getSolarTerm } from "manseryeok";
import { describe, expect, it } from "vitest";
import { analyzeChart, calculateRisk, deduplicateWarnings, tone } from "../app/lib/analysisEngine";
import { KoreanManseCalculator } from "../app/lib/fortuneCalculator";
import { defaultInput, demoProfiles } from "../app/lib/profiles";
import { decodeSharePayload, encodeSharePayload } from "../app/lib/share";
import { deleteBirthInput, loadBirthInput, saveBirthInput } from "../app/lib/storage";
import { isValidDate, validateBirthInput } from "../app/lib/validation";

describe("KASI 기반 실제 만세력 계산", () => {
  it("공식 문서의 1992-10-24 05:30 원국과 일치한다", () => {
    const chart = new KoreanManseCalculator().calculate({
      ...defaultInput, name: "검증", year: 1992, month: 10, day: 24, hour: 5, minute: 30,
    });
    expect(chart.pillars.map(({ stem, branch }) => `${stem}${branch}`))
      .toEqual(["임신", "경술", "계유", "을묘"]);
    expect(chart.mode).toBe("manse");
  });

  it("같은 입력은 항상 같은 원국과 해석 시드를 만든다", () => {
    const calculator = new KoreanManseCalculator();
    expect(calculator.calculate(defaultInput)).toEqual(calculator.calculate(defaultInput));
  });

  it("개발 프로필은 서로 다른 원국 시드를 만든다", () => {
    const calculator = new KoreanManseCalculator();
    const seeds = demoProfiles.map(({ input }) => calculator.calculate(input).seed);
    expect(new Set(seeds).size).toBe(demoProfiles.length);
  });

  it("출생시간 미상은 실제 년월일주를 유지하고 시주만 숨긴다", () => {
    const chart = new KoreanManseCalculator().calculate(demoProfiles[4].input);
    expect(chart.pillars.slice(0, 3).every((pillar) => pillar.stem !== "?")).toBe(true);
    expect(chart.pillars[3].stem).toBe("?");
    expect(chart.confidence).toBeLessThan(90);
  });

  it("양력과 대응 음력 입력은 같은 원국을 만든다", () => {
    const calculator = new KoreanManseCalculator();
    const solar = calculator.calculate({
      ...defaultInput, year: 1992, month: 10, day: 24, hour: 5, minute: 30, calendarType: "solar",
    });
    const lunar = calculator.calculate({
      ...defaultInput, year: 1992, month: 9, day: 29, hour: 5, minute: 30, calendarType: "lunar",
    });
    expect(solar.pillars).toEqual(lunar.pillars);
  });

  it("입춘 절입 전후의 연주를 다르게 계산한다", () => {
    const term = getSolarTerm(2024, 2).date;
    const before = new Date(term.getTime() - 60_000);
    const after = new Date(term.getTime() + 60_000);
    const parts = (date: Date) => {
      const values = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Seoul", year: "numeric", month: "numeric", day: "numeric",
        hour: "numeric", minute: "numeric", hourCycle: "h23",
      }).formatToParts(date);
      const get = (type: Intl.DateTimeFormatPartTypes) => Number(values.find((part) => part.type === type)?.value);
      return { year: get("year"), month: get("month"), day: get("day"), hour: get("hour"), minute: get("minute") };
    };
    const calculator = new KoreanManseCalculator();
    const beforeChart = calculator.calculate({ ...defaultInput, ...parts(before) });
    const afterChart = calculator.calculate({ ...defaultInput, ...parts(after) });
    expect(`${beforeChart.pillars[0].stem}${beforeChart.pillars[0].branch}`)
      .not.toBe(`${afterChart.pillars[0].stem}${afterChart.pillars[0].branch}`);
  });
});

describe("검증과 해석", () => {
  it("윤년과 존재하지 않는 날짜를 검증한다", () => {
    expect(isValidDate(2024, 2, 29)).toBe(true);
    expect(isValidDate(2023, 2, 29)).toBe(false);
  });

  it("미래 날짜와 잘못된 음력 윤달을 거부한다", () => {
    const future = validateBirthInput({ ...defaultInput, name: "테스트", year: 2099 }, new Date("2026-07-24"));
    expect(future.date).toBeTruthy();
    const badLeap = validateBirthInput({ ...defaultInput, calendarType: "lunar", year: 2024, month: 3, day: 1, leapMonth: true });
    expect(badLeap.date).toBeTruthy();
  });

  it("위험 등급 경계를 계산한다", () => {
    expect([calculateRisk(10), calculateRisk(30), calculateRisk(50), calculateRisk(65), calculateRisk(90)])
      .toEqual(["안정", "주의", "경계", "위험", "고위험"]);
  });

  it("경고 문장을 id와 제목 기준으로 중복 제거한다", () => {
    const result = analyzeChart(new KoreanManseCalculator().calculate(defaultInput));
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
    const chart = new KoreanManseCalculator().calculate(defaultInput);
    const encoded = encodeSharePayload({ v: 2, name: "공유자", intensity: "direct", chart });
    const decoded = decodeSharePayload(encoded);
    expect(decoded?.chart.pillars).toEqual(chart.pillars);
    expect(decoded).not.toHaveProperty("year");
    expect(decoded).not.toHaveProperty("hour");
    expect(encoded).not.toContain(String(defaultInput.year));
  });
});
