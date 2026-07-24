"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { analyzeChart, selectSectionRules, tone } from "../lib/analysisEngine";
import { KoreanManseCalculator } from "../lib/fortuneCalculator";
import { defaultInput } from "../lib/profiles";
import { decodeSharePayload, encodeSharePayload, sanitizeChartForShare } from "../lib/share";
import { deleteBirthInput, loadBirthInput, saveBirthInput } from "../lib/storage";
import { validateBirthInput } from "../lib/validation";
import type { AnalysisResult, BirthInput, ConcernCategory, Element, Intensity, SharePayload, WarningRule } from "../types/fortune";

type Screen = "intro" | "form" | "loading" | "result";
const loadingSteps = ["사주 원국 확인 중", "오행 불균형 분석 중", "반복되는 약점 탐색 중", "최종 경고문 작성 중"];
const elementMeta: Record<Element, { hanja: string; color: string }> = {
  목: { hanja: "木", color: "#678f64" }, 화: { hanja: "火", color: "#d84b35" },
  토: { hanja: "土", color: "#a77a4d" }, 금: { hanja: "金", color: "#c2aa7b" },
  수: { hanja: "水", color: "#527da0" },
};

function Button({ children, variant = "primary", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" }) {
  return <button className={`button button-${variant}`} {...props}>{children}</button>;
}

function Field({ label, error, children, className = "" }: { label: string; error?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`field ${className}`}>
      <span className="field-label">{label}</span>
      {children}
      {error && <p className="field-error" role="alert">{error}</p>}
    </div>
  );
}

function Choice({ name, value, checked, onChange, children }: { name: string; value: string; checked: boolean; onChange: () => void; children: React.ReactNode }) {
  return (
    <label className={`choice ${checked ? "choice-active" : ""}`}>
      <input type="radio" name={name} value={value} checked={checked} onChange={onChange} />
      <span>{children}</span>
    </label>
  );
}

function Intro({ onStart }: { onStart: () => void }) {
  return (
    <main className="intro">
      <div className="paper-grain" />
      <header className="topbar">
        <div className="brand-mark">傷</div>
        <div><strong>흉터까지 읽는 사주</strong><span>MANSERYEOK ANALYSIS / 01</span></div>
      </header>
      <section className="hero">
        <p className="eyebrow"><span /> 자기 성찰 위험성 분석 보고서</p>
        <h1>좋은 말만<br />듣고 싶다면,<br /><em>시작하지 마세요.</em></h1>
        <p className="hero-copy">당신이 반복해서 무너지는 이유와 반드시 조심해야 할 약점을 가감 없이 보여드립니다.</p>
        <div className="hero-actions">
          <Button onClick={onStart}>내 사주의 경고문 확인하기 <span aria-hidden>→</span></Button>
          <span className="time-note">약 2분 · 외부 전송 없음</span>
        </div>
      </section>
      <aside className="warning-note">
        <span className="warning-icon" aria-hidden>!</span>
        <p>본 결과는 전통 명리학 요소를 활용한 자기 성찰용 콘텐츠입니다. 미래의 사건을 확정하거나 의료·법률·재무 판단을 대신하지 않습니다.</p>
      </aside>
      <div className="vertical-seal" aria-hidden>直說<br />命理</div>
    </main>
  );
}

function InputForm({ initial, onSubmit, onBack }: { initial: BirthInput; onSubmit: (value: BirthInput) => void; onBack: () => void }) {
  const [input, setInput] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const update = <K extends keyof BirthInput>(key: K, value: BirthInput[K]) => setInput((current) => ({ ...current, [key]: value }));
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const nextErrors = validateBirthInput(input);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length === 0) onSubmit(input);
  };
  return (
    <main className="form-page">
      <div className="report-head">
        <button className="back-link" onClick={onBack} type="button">← 처음으로</button>
        <span>CONFIDENTIAL · INPUT SHEET</span>
      </div>
      <section className="form-shell">
        <div className="section-number">01</div>
        <p className="eyebrow"><span /> 분석 대상 기록</p>
        <h1>당신의 시간을<br />정확히 기록하십시오.</h1>
        <p className="form-lead">입력값으로 한국 표준시와 절기 절입 시각을 반영한 사주 원국을 계산합니다. 저장에 동의하지 않으면 브라우저를 닫는 즉시 남지 않습니다.</p>

        <form onSubmit={submit} noValidate>
          <div className="form-grid">
            <Field label="이름 또는 닉네임" error={errors.name}>
              <input id="name" value={input.name} onChange={(e) => update("name", e.target.value)} placeholder="보고서에 표시할 이름" autoComplete="nickname" />
            </Field>
            <Field label="성별">
              <div className="choice-row">
                <Choice name="gender" value="male" checked={input.gender === "male"} onChange={() => update("gender", "male")}>남성</Choice>
                <Choice name="gender" value="female" checked={input.gender === "female"} onChange={() => update("gender", "female")}>여성</Choice>
                <Choice name="gender" value="none" checked={input.gender === "none"} onChange={() => update("gender", "none")}>선택 안 함</Choice>
              </div>
            </Field>
            <Field label="달력 기준">
              <div className="choice-row">
                <Choice name="calendar" value="solar" checked={input.calendarType === "solar"} onChange={() => update("calendarType", "solar")}>양력</Choice>
                <Choice name="calendar" value="lunar" checked={input.calendarType === "lunar"} onChange={() => update("calendarType", "lunar")}>음력</Choice>
              </div>
              <label className={`check-line ${input.calendarType !== "lunar" ? "disabled" : ""}`}>
                <input type="checkbox" checked={input.leapMonth} disabled={input.calendarType !== "lunar"} onChange={(e) => update("leapMonth", e.target.checked)} /> 윤달
              </label>
              {input.calendarType === "lunar" && <p className="field-help">KASI 정본 음력 데이터로 양력 변환 후 절기 기준 원국을 계산합니다.</p>}
            </Field>
            <Field label="출생일" error={errors.date} className="wide">
              <div className="date-row">
                <label><span>연도</span><input aria-label="출생 연도" type="number" min="1900" max={new Date().getFullYear()} value={input.year} onChange={(e) => update("year", Number(e.target.value))} /></label>
                <label><span>월</span><input aria-label="출생 월" type="number" min="1" max="12" value={input.month} onChange={(e) => update("month", Number(e.target.value))} /></label>
                <label><span>일</span><input aria-label="출생 일" type="number" min="1" max="31" value={input.day} onChange={(e) => update("day", Number(e.target.value))} /></label>
              </div>
            </Field>
            <Field label="출생시간" error={errors.time}>
              <div className="time-row">
                <select aria-label="출생 시" value={input.hour ?? ""} disabled={input.timeUnknown} onChange={(e) => update("hour", Number(e.target.value))}>
                  {Array.from({ length: 24 }, (_, hour) => <option key={hour} value={hour}>{String(hour).padStart(2, "0")}시</option>)}
                </select>
                <select aria-label="출생 분" value={input.minute} disabled={input.timeUnknown} onChange={(e) => update("minute", Number(e.target.value))}>
                  {Array.from({ length: 60 }, (_, minute) => <option key={minute} value={minute}>{String(minute).padStart(2, "0")}분</option>)}
                </select>
              </div>
              <label className="check-line"><input type="checkbox" checked={input.timeUnknown} onChange={(e) => update("timeUnknown", e.target.checked)} /> 출생 시간을 모름</label>
              {input.timeUnknown && <p className="field-help warning">출생시간이 없어 시주와 일부 세부 해석의 정확도가 낮아질 수 있습니다.</p>}
            </Field>
            <Field label="출생 지역" error={errors.region}>
              <input id="region" value={input.region} onChange={(e) => update("region", e.target.value)} />
              <label className="check-line"><input type="checkbox" checked={input.trueSolarTime} disabled={input.timeUnknown} onChange={(e) => update("trueSolarTime", e.target.checked)} /> 출생 지역 기반 진태양시 보정</label>
              <p className="field-help">기본으로 국내 도시의 경도·균시차·과거 표준시와 서머타임을 반영합니다. 다른 만세력과 비교할 때는 보정 기준도 함께 확인하십시오.</p>
            </Field>
            <Field label="풀이 강도" className="wide">
              <div className="intensity-row">
                {([["mild", "순한맛"], ["realistic", "현실적인 조언"], ["direct", "가감 없는 분석"]] as [Intensity, string][]).map(([value, label]) => (
                  <Choice key={value} name="intensity" value={value} checked={input.intensity === value} onChange={() => update("intensity", value)}>{label}</Choice>
                ))}
              </div>
              <p className="field-help">욕설·비하·사건 단정 없이, 같은 분석을 선택한 강도에 맞춰 표현합니다.</p>
            </Field>
            <Field label="지금 가장 고민되는 문제 (선택)" error={errors.concern} className="wide">
              <div className="intensity-row">
                {([
                  ["general", "자동 분류"],
                  ["relationship", "관계·연애"],
                  ["career", "직업·이직"],
                  ["money", "돈·투자"],
                  ["lifestyle", "생활·스트레스"],
                ] as [ConcernCategory, string][]).map(([value, label]) => (
                  <Choice key={value} name="concernCategory" value={value} checked={input.concernCategory === value} onChange={() => update("concernCategory", value)}>{label}</Choice>
                ))}
              </div>
              <textarea
                id="concern"
                aria-label="현재 고민이나 질문"
                value={input.concern}
                maxLength={600}
                onChange={(event) => update("concern", event.target.value)}
                placeholder="예: 상사와 부딪힐 때마다 감정적으로 퇴사하고 싶습니다. 지금 이직을 결정할 때 특히 조심할 행동이 궁금합니다."
              />
              <div className="concern-meta">
                <p className="field-help">상황, 반복 행동, 망설이는 선택을 구체적으로 적을수록 원국 신호와 맞는 경고를 더 정확히 고릅니다. 실명·회사명·계좌 등 식별 정보는 적지 마십시오.</p>
                <span>{input.concern.length} / 600</span>
              </div>
            </Field>
          </div>
          <div className="privacy-box">
            <label className="check-line"><input type="checkbox" checked={input.allowStorage} onChange={(e) => update("allowStorage", e.target.checked)} /> 이 기기에 입력값 저장</label>
            <p>선택하지 않으면 이름·생년월일·출생시간을 저장하지 않습니다. 어떤 값도 외부 서버로 전송하지 않습니다.</p>
            <button className="delete-storage" type="button" onClick={() => { deleteBirthInput(window.localStorage); setInput((current) => ({ ...current, allowStorage: false })); }}>이 기기에 저장된 입력값 삭제</button>
          </div>
          <Button type="submit">분석 시작하기 <span aria-hidden>→</span></Button>
        </form>
      </section>
    </main>
  );
}

function Loading({ step }: { step: number }) {
  return (
    <main className="loading-page" aria-live="polite">
      <div className="loading-orbit"><span>命</span></div>
      <p className="eyebrow">MANSERYEOK ANALYSIS IN PROGRESS</p>
      <h1>{loadingSteps[step]}</h1>
      <div className="loading-bar"><span style={{ width: `${((step + 1) / loadingSteps.length) * 100}%` }} /></div>
      <ol>{loadingSteps.map((item, index) => <li key={item} className={index <= step ? "active" : ""}><span>{index < step ? "✓" : String(index + 1).padStart(2, "0")}</span>{item}</li>)}</ol>
      <p>결과를 꾸미지 않고, 반복되는 행동 패턴을 대조하고 있습니다.</p>
    </main>
  );
}

function ReportSection({ number, title, subtitle, children, open = true }: { number: string; title: string; subtitle?: string; children: React.ReactNode; open?: boolean }) {
  return (
    <details className="report-section reveal" open={open}>
      <summary>
        <span className="section-index">{number}</span>
        <span><strong>{title}</strong>{subtitle && <small>{subtitle}</small>}</span>
        <span className="fold-icon" aria-hidden>＋</span>
      </summary>
      <div className="section-content">{children}</div>
    </details>
  );
}

function RuleCard({ rule, index, intensity }: { rule: WarningRule; index: number; intensity: Intensity }) {
  return (
    <article className="weakness-card">
      <div className="weakness-no">0{index + 1}</div>
      <div>
        <span className="severity">위험 신호 {rule.severity}/5</span>
        <h3>{tone(rule.title, intensity)}</h3>
        <p className="rule-summary">{tone(rule.summary, intensity)}</p>
        <dl>
          <div><dt>왜 나타나는가</dt><dd>{tone(rule.detailedReason, intensity)}</dd></div>
          <div><dt>실제 신호</dt><dd>{rule.warningSigns.map((item) => tone(item, intensity)).join(" · ")}</dd></div>
          <div><dt>방치하면</dt><dd>{tone(rule.consequences, intensity)}</dd></div>
        </dl>
        <div className="order"><strong>행동 수칙</strong><p>{tone(rule.actionRules[0], intensity)}</p></div>
      </div>
    </article>
  );
}

function TextAnalysis({ title, rule, intensity, extra }: { title: string; rule: WarningRule; intensity: Intensity; extra: string[] }) {
  return (
    <div className="analysis-grid">
      <div className="analysis-lead"><span>핵심 판독</span><h3>{tone(title, intensity)}</h3><p>{tone(rule.summary, intensity)}</p></div>
      <div className="fact-list">
        {extra.map((item, index) => <div key={item}><span>0{index + 1}</span><p>{tone(item, intensity)}</p></div>)}
      </div>
      <div className="order"><strong>지금 할 일</strong><p>{tone(rule.actionRules.join(" · "), intensity)}</p></div>
    </div>
  );
}

function LuckFlowReport({ chart, intensity }: { chart: AnalysisResult["chart"]; intensity: Intensity }) {
  const options = chart.luckFlow?.options ?? [];
  const currentYear = new Date().getFullYear();
  const today = new Date();
  const [birthYear, birthMonth, birthDay] = chart.solarDate.split("-").map(Number);
  const hasPrivateBirthDate = Number.isFinite(birthYear) && Number.isFinite(birthMonth) && Number.isFinite(birthDay);
  const birthdayPassed = today.getMonth() + 1 > birthMonth
    || (today.getMonth() + 1 === birthMonth && today.getDate() >= birthDay);
  const currentAge = hasPrivateBirthDate
    ? Math.max(0, currentYear - birthYear - (birthdayPassed ? 0 : 1))
    : null;

  if (options.length === 0) {
    return <p className="empty-flow">이 공유 보고서에는 대운 데이터가 없습니다. 처음부터 다시 입력하면 최신 계산 결과가 생성됩니다.</p>;
  }

  return (
    <div className="luck-report">
      {chart.luckFlow?.certainty === "alternatives" && (
        <div className="flow-notice">
          <strong>성별 미선택 · 대운 방향 미확정</strong>
          <p>전통적인 순행·역행 판정에 성별이 사용되므로 두 가능성을 함께 표시합니다. 원국 자체는 변하지 않습니다.</p>
        </div>
      )}
      {options.map((option) => (
        <section className="luck-option" key={option.label}>
          <header>
            <div><span>{option.forward ? "FORWARD" : "REVERSE"}</span><h3>{option.label} 대운</h3></div>
            <p>첫 대운 약 <strong>{option.startAge}세</strong> · 세밀값 {option.startYears}년 {option.startMonths}개월 {option.startDays}일</p>
          </header>
          <div className="luck-track">
            {option.cycles.map((cycle) => {
              const active = currentAge !== null && currentAge >= cycle.startAge && currentAge <= cycle.endAge;
              return (
                <article className={active ? "active" : ""} key={`${option.label}-${cycle.startAge}-${cycle.korean}`}>
                  <span>{cycle.startAge}–{cycle.endAge}세</span>
                  <strong>{cycle.korean}</strong>
                  <b>{cycle.element} · {cycle.tenGod}/{cycle.branchTenGod}</b>
                  <p>{cycle.interactions.length ? cycle.interactions.join(" · ") : "원국 지지와 직접 관계 적음"}</p>
                  {active && <em>{currentYear}년 기준 현재 구간</em>}
                </article>
              );
            })}
          </div>
        </section>
      ))}
      <div className="order">
        <strong>읽는 법</strong>
        <p>{tone("대운은 사건의 확정표가 아닙니다. 해당 10년 동안 반복해서 자극될 역할과 행동 패턴을 확인하는 참고 흐름입니다.", intensity)}</p>
      </div>
    </div>
  );
}

function AnnualFlowReport({ result, intensity }: { result: AnalysisResult; intensity: Intensity }) {
  const currentYear = new Date().getFullYear();
  return (
    <div className="annual-report">
      <div className="annual-intro">
        <p>각 연도의 연주는 입춘 경계를 기준으로 계산합니다. 천간 십신과 원국 지지 관계를 함께 보되, 특정 사건을 예언하지 않습니다.</p>
        <div><span>LOW</span><span>MEDIUM</span><span>HIGH</span></div>
      </div>
      <div className="annual-grid">
        {result.annualFlows.map((flow) => (
          <article className={`${flow.year === currentYear ? "current" : ""} pressure-${flow.pressure}`} key={flow.year}>
            <header><span>{flow.year === currentYear ? "현재 세운" : `${flow.year} YEAR`}</span><b>자극도 {flow.pressure}</b></header>
            <div className="annual-pillar"><strong>{flow.stem}</strong><strong>{flow.branch}</strong></div>
            <h3>{flow.korean}년 · {flow.tenGod}/{flow.branchTenGod}</h3>
            <p className="annual-theme">{flow.theme}</p>
            <dl>
              <div><dt>원국 관계</dt><dd>{flow.interactions.length ? flow.interactions.join(" · ") : "직접적인 합·충·형·파·해가 적음"}</dd></div>
              <div><dt>경고</dt><dd>{tone(flow.warning, intensity)}</dd></div>
              <div><dt>행동</dt><dd>{tone(flow.action, intensity)}</dd></div>
            </dl>
          </article>
        ))}
      </div>
    </div>
  );
}

function SpiritStarReport({ chart, intensity }: { chart: AnalysisResult["chart"]; intensity: Intensity }) {
  const stars = chart.spiritStars ?? [];
  if (stars.length === 0) {
    return <p className="empty-flow">이 공유 보고서에는 신살 데이터가 없습니다. 처음부터 다시 입력하면 최신 판정이 생성됩니다.</p>;
  }
  return (
    <>
      <div className="spirit-disclaimer">
        <strong>보조 판독</strong>
        <p>신살은 원국 전체를 대신하지 않습니다. 년지·일지 또는 일간에서 정한 기준 글자가 원국에 있는지만 확인합니다.</p>
      </div>
      <div className="spirit-grid">
        {[...stars].sort((a, b) => Number(b.present) - Number(a.present)).map((star) => (
          <article className={star.present ? "present" : "absent"} key={star.id}>
            <header><span>{star.hanja}</span><b>{star.present ? "원국에 해당" : "미검출"}</b></header>
            <h3>{star.name}</h3>
            <p>{star.summary}</p>
            <small>{star.basis}{star.present ? ` · 해당 지지 ${star.matchedBranches.join("·")}` : ""}</small>
            {star.present && (
              <dl>
                <div><dt>경계</dt><dd>{tone(star.warning, intensity)}</dd></div>
                <div><dt>활용</dt><dd>{tone(star.action, intensity)}</dd></div>
              </dl>
            )}
          </article>
        ))}
      </div>
    </>
  );
}

function Result({ name, concern, intensity, result, onRestart, onReview }: { name: string; concern: string; intensity: Intensity; result: AnalysisResult; onRestart: () => void; onReview: () => void }) {
  const [notice, setNotice] = useState("");
  const { chart } = result;
  const elementEntries = Object.entries(chart.elementDistribution) as [Element, number][];
  const maxElement = [...elementEntries].sort((a, b) => b[1] - a[1])[0][0];
  const minElement = [...elementEntries].sort((a, b) => a[1] - b[1])[0][0];
  const topTenGod = Object.entries(chart.tenGodDistribution).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "비견";
  const sectionRules = useMemo(() => selectSectionRules(chart), [chart]);
  const notify = (message: string) => { setNotice(message); window.setTimeout(() => setNotice(""), 1800); };
  const reportText = useMemo(() => [
    `${name}님의 사주 경고 보고서`,
    `종합 위험 등급: ${result.riskLevel}`,
    ...result.weaknesses.map((rule, i) => `${i + 1}. ${tone(rule.title, intensity)}\n${tone(rule.summary, intensity)}\n행동: ${tone(rule.actionRules[0], intensity)}`),
    `최종 경고: ${tone(result.finalWarning, intensity)}`,
    "본 결과는 전통 명리학 기반 자기 성찰용 콘텐츠이며 미래 사건을 확정하지 않습니다.",
  ].join("\n\n"), [name, result, intensity]);

  const copyText = async () => {
    await navigator.clipboard.writeText(reportText);
    notify("결과 텍스트를 복사했습니다.");
  };
  const copyLink = async () => {
    const payload: SharePayload = { v: 2, name, intensity, chart: sanitizeChartForShare(chart) };
    const url = new URL(window.location.href);
    url.search = `?report=${encodeSharePayload(payload)}`;
    await navigator.clipboard.writeText(url.toString());
    notify("개인 생년정보를 제외한 공유 링크를 복사했습니다.");
  };
  const saveImage = () => {
    const canvas = document.createElement("canvas");
    canvas.width = 1080; canvas.height = 1440;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const gradient = ctx.createLinearGradient(0, 0, 1080, 1440);
    gradient.addColorStop(0, "#171512"); gradient.addColorStop(1, "#070707");
    ctx.fillStyle = gradient; ctx.fillRect(0, 0, 1080, 1440);
    ctx.strokeStyle = "#3b342b"; ctx.lineWidth = 2; ctx.strokeRect(54, 54, 972, 1332);
    ctx.fillStyle = "#b83025"; ctx.fillRect(76, 76, 130, 130);
    ctx.fillStyle = "#efe7d3"; ctx.font = "700 68px serif"; ctx.textAlign = "center"; ctx.fillText("傷", 141, 164);
    ctx.textAlign = "left"; ctx.fillStyle = "#9b8f7d"; ctx.font = "28px sans-serif"; ctx.fillText("흉터까지 읽는 사주", 236, 120);
    ctx.fillStyle = "#efe7d3"; ctx.font = "700 50px sans-serif"; ctx.fillText(`${name}님의 경고 보고서`, 76, 300);
    ctx.fillStyle = "#a8241b"; ctx.font = "900 104px serif"; ctx.fillText(result.riskLevel, 76, 460);
    ctx.strokeStyle = "#a8241b"; ctx.strokeRect(72, 350, 350, 145);
    ctx.fillStyle = "#9b8f7d"; ctx.font = "24px sans-serif"; ctx.fillText("가장 위험한 약점", 76, 620);
    ctx.fillStyle = "#efe7d3"; ctx.font = "700 44px sans-serif";
    wrapCanvasText(ctx, tone(result.weaknesses[0].title, intensity), 76, 690, 890, 64);
    ctx.fillStyle = "#b83025"; ctx.fillRect(76, 880, 80, 6);
    ctx.fillStyle = "#efe7d3"; ctx.font = "700 42px sans-serif";
    wrapCanvasText(ctx, `“${tone(result.finalWarning, intensity)}”`, 76, 970, 890, 62);
    ctx.fillStyle = "#171512"; ctx.fillRect(76, 1245, 928, 92);
    ctx.fillStyle = "#9b8f7d"; ctx.font = "22px sans-serif"; ctx.fillText("서비스 주소", 102, 1283);
    const serviceUrl = new URL(".", window.location.href).toString().split("?")[0];
    ctx.fillStyle = "#efe7d3"; ctx.font = "24px monospace"; ctx.fillText(serviceUrl, 102, 1319);
    ctx.textAlign = "right"; ctx.fillStyle = "#756b5d"; ctx.font = "20px sans-serif"; ctx.fillText("자기 성찰용 참고 콘텐츠", 980, 1310);
    const link = document.createElement("a");
    link.download = `${name}-사주-경고보고서.png`; link.href = canvas.toDataURL("image/png"); link.click();
    notify("개인 생년정보 없는 공유 이미지를 저장했습니다.");
  };

  return (
    <main className="result-page">
      {notice && <div className="toast" role="status">{notice}</div>}
      <header className="result-nav">
        <div className="mini-brand"><span>傷</span><strong>흉터까지 읽는 사주</strong></div>
        <div className="nav-actions">
          <button onClick={copyLink}>공유 링크</button><button onClick={onReview}>결과 다시 보기</button><button onClick={onRestart}>처음부터</button>
        </div>
      </header>

      <section className="report-cover reveal">
        <div>
          <p className="eyebrow"><span /> CONFIDENTIAL WARNING REPORT</p>
          <h1><em>{name}</em>님의<br />사주 경고 보고서</h1>
          <div className="demo-badge">KASI 기반 한국 만세력</div>
          <p>{chart.calculationBasis}. 원국은 오픈소스 계산 결과를 그대로 사용하며 해석 문장만 규칙 기반으로 조합합니다.</p>
        </div>
        <div className={`risk-seal risk-${result.riskLevel}`} aria-label={`종합 위험 등급 ${result.riskLevel}`}>
          <span>綜合危險</span><strong>{result.riskLevel}</strong><small>{result.riskScore} / 100</small>
        </div>
      </section>
      <p className="risk-caption">위험 등급은 불행의 크기가 아니라, 반복되는 약점을 방치했을 때의 위험도를 의미합니다.</p>

      <div className="report-body">
        <ReportSection number="A" title="사주 원국" subtitle="KOREAN FOUR PILLARS · 시일월년">
          <div className="pillars">
            {[...chart.pillars].reverse().map((pillar) => (
              <article key={pillar.label} className="pillar">
                <span>{pillar.label}</span><strong>{pillar.stem}</strong><strong>{pillar.branch}</strong>
                <div><b>{pillar.element}/{pillar.branchElement}</b><b>{pillar.yinYang}/{pillar.branchYinYang}</b><b>{pillar.tenGod}/{pillar.branchTenGod}</b></div><p>{pillar.role}</p>
              </article>
            ))}
          </div>
          <div className="chart-notes"><span>양력 환산 <strong>{chart.solarDate}</strong></span><span>음력 환산 <strong>{chart.lunarDate}</strong></span><span>일간 <strong>{chart.dayMaster}</strong></span><span>신강·신약 참고 <strong>{chart.strengthScore}</strong></span><span>합·충·형·파·해 <strong>{chart.interactions.join(" / ")}</strong></span></div>
        </ReportSection>

        <ReportSection number="B" title="오행 불균형" subtitle="ELEMENT IMBALANCE">
          <div className="elements">
            <div className="element-bars">
              {elementEntries.map(([element, value]) => (
                <div key={element}><span className="element-name">{elementMeta[element].hanja}<b>{element}</b></span><div className="bar"><i style={{ width: `${Math.max(7, value * 10)}%`, background: elementMeta[element].color }} /></div><strong>{value}</strong></div>
              ))}
            </div>
            <aside>
              <div><span>가장 강한 기운</span><strong>{maxElement} · {elementMeta[maxElement].hanja}</strong></div>
              <div><span>가장 부족한 기운</span><strong>{minElement} · {elementMeta[minElement].hanja}</strong></div>
              <p>{tone(`강한 ${maxElement}의 속도를 약한 ${minElement}의 생활 습관으로 보완해야 합니다. 한쪽의 장점만 밀어붙이면 그 장점이 바로 맹점으로 바뀝니다.`, intensity)}</p>
            </aside>
          </div>
          <div className="order"><strong>균형 습관</strong><p>결정 전 사실을 세 줄로 적고, 수면·식사·운동 중 하나를 고정된 시간에 반복하십시오.</p></div>
        </ReportSection>

        <ReportSection number="C" title="가장 위험한 약점 3가지" subtitle="CRITICAL WEAKNESSES">
          <div className="weaknesses">{result.weaknesses.map((rule, index) => <RuleCard key={rule.id} rule={rule} index={index} intensity={intensity} />)}</div>
        </ReportSection>

        {result.focusAnalysis && (
          <ReportSection number="C+" title="현재 고민 집중 풀이" subtitle="PERSONAL FOCUS">
            <div className="focus-question">
              <span>입력한 고민</span>
              <blockquote>“{concern}”</blockquote>
              <small>이 내용은 이 화면에서만 분석에 사용되며 공유 링크와 공유 이미지에는 포함되지 않습니다.</small>
            </div>
            <TextAnalysis
              title={result.focusAnalysis.rule.title}
              rule={result.focusAnalysis.rule}
              intensity={intensity}
              extra={[
                `${result.focusAnalysis.linkedWeakness.title}이라는 원국 신호가 지금 고민의 취약 지점과 겹칩니다.`,
                result.focusAnalysis.matchedKeywords.length > 0
                  ? `입력한 내용에서 ${result.focusAnalysis.matchedKeywords.join(" · ")} 문제를 핵심 초점으로 잡았습니다.`
                  : "특정 결과를 예언하는 대신, 입력한 상황에서 반복될 행동과 판단 습관을 중심으로 읽었습니다.",
                `강한 ${maxElement} 기운과 두드러진 ${topTenGod} 성향이 올라오는 순간에는 즉시 결론보다 기록과 제3자 검토가 먼저입니다.`,
              ]}
            />
          </ReportSection>
        )}

        <ReportSection number="D" title="성격의 어두운 면" subtitle="SHADOW PATTERN">
          <TextAnalysis title="평소의 침착함이 압박 속에서는 통제로 바뀔 수 있습니다" rule={result.weaknesses[1]} intensity={intensity} extra={[
            `겉으로는 ${maxElement}의 장점이 선명하지만, 내면에서는 부족한 ${minElement}의 방식으로 상황을 조절하는 데 빈틈이 생길 수 있습니다.`,
            "스트레스가 심하면 설명보다 지시가 늘고, 타인은 그 태도를 불신으로 받아들일 수 있습니다.",
            `${topTenGod} 성향이 압박 속에서 과해지면 자기 방어가 먼저 나와 자신의 책임을 늦게 볼 수 있습니다.`,
          ]} />
        </ReportSection>

        <ReportSection number="E" title="인간관계 경고" subtitle="RELATIONSHIP ALERT">
          <TextAnalysis title={sectionRules.relationship.title} rule={sectionRules.relationship} intensity={intensity} extra={[
            `${maxElement} 기운의 장점이 과해지는 순간, 가까운 사람에게 속도나 기준을 맞추라고 압박할 수 있습니다.`,
            "연애에서는 답장과 말투를 애정의 증거로 해석하는 순간 갈등이 커집니다.",
            "말을 자주 바꾸고 책임을 전가하는 사람과는 속도를 늦추고 경계를 확인하십시오.",
            "관계가 무너지기 직전에는 질문이 줄고 혼자 내린 결론이 늘어납니다.",
          ]} />
        </ReportSection>

        <ReportSection number="F" title="직업과 조직생활 경고" subtitle="CAREER & ORGANIZATION">
          <TextAnalysis title={sectionRules.career.title} rule={sectionRules.career} intensity={intensity} extra={[
            `${topTenGod} 성향을 생산적으로 쓸 수 있는 명확한 역할과 중간 피드백이 있는 환경이 맞습니다.`,
            "동료는 빠른 판단보다 이미 결론을 정해 둔 태도를 부담스러워할 수 있습니다.",
            "성과가 막히는 가장 큰 원인은 완벽한 준비가 아니라 중간 검토를 늦추는 습관입니다.",
            "감정이 올라온 날에는 퇴사 의사를 전하지 말고, 72시간 뒤 조건표를 다시 보십시오.",
          ]} />
        </ReportSection>

        <ReportSection number="G" title="재물 경고" subtitle="MONEY RISK">
          <TextAnalysis title={sectionRules.money.title} rule={sectionRules.money} intensity={intensity} extra={[
            `강한 ${maxElement} 기운으로 결제나 투자 판단이 빨라질 때, 부족한 ${minElement}의 검증 절차를 의도적으로 추가해야 합니다.`,
            "손실 뒤 만회 심리가 올라오면 투자 금액을 키우지 말고 판단을 중단하십시오.",
            "보증·명의 대여·구두 공동투자는 하지 말고, 지인 거래도 반드시 계약서를 작성하십시오.",
            "투자 판단은 감정과 별개인 전문 자료로 다시 검증해야 합니다.",
          ]} />
        </ReportSection>

        <ReportSection number="H" title="건강과 생활 습관 주의" subtitle="LIFESTYLE CAUTION">
          <TextAnalysis title={sectionRules.lifestyle.title} rule={sectionRules.lifestyle} intensity={intensity} extra={[
            `${maxElement}의 과한 사용을 쉬게 하고 ${minElement}의 리듬을 보완하는 생활 습관이 필요합니다.`,
            "분노와 긴장을 참는 것만으로 처리하면 가까운 사람에게 날카로운 방식으로 새어 나올 수 있습니다.",
            "활동량이 줄어든 주에는 짧은 산책부터 일정에 넣고 회복 시간을 업무처럼 확보하십시오.",
          ]} />
          <p className="medical-note">이 내용은 의학적 진단이 아닙니다. 지속적인 통증이나 이상 증상은 반드시 의료 전문가와 상담하십시오.</p>
        </ReportSection>

        <ReportSection number="I" title="대운의 흐름" subtitle="10-YEAR LUCK CYCLES">
          <LuckFlowReport chart={chart} intensity={intensity} />
        </ReportSection>

        <ReportSection number="J" title="연도별 세운 경고" subtitle="ANNUAL FLOW">
          <AnnualFlowReport result={result} intensity={intensity} />
        </ReportSection>

        <ReportSection number="K" title="재미로 보는 보조 신살" subtitle="SYMBOLIC STARS">
          <SpiritStarReport chart={chart} intensity={intensity} />
        </ReportSection>

        <ReportSection number="L" title="절대 하면 안 되는 행동 5가지" subtitle="DO NOT">
          <ol className="command-list prohibited">
            {[
              "화가 난 상태에서 퇴사나 이별을 결정하지 마십시오.",
              "미안함 때문에 돈을 빌려주지 마십시오.",
              "확인하지 않은 추측으로 상대를 몰아붙이지 마십시오.",
              "모든 일을 혼자 해결하려 하지 마십시오.",
              "실패를 감추기 위해 더 큰 위험을 선택하지 마십시오.",
            ].map((item, index) => <li key={item}><span>{index + 1}</span>{tone(item, intensity)}</li>)}
          </ol>
        </ReportSection>

        <ReportSection number="M" title="당신을 살리는 행동 5가지" subtitle="SURVIVAL RULES">
          <ol className="command-list rescue">
            {[
              "중요한 결정은 메모한 뒤 24시간 후 다시 확인한다.",
              "매월 같은 날 소비 기록과 자동결제를 검토한다.",
              "감정이 격해지면 메시지를 전송하지 않고 임시 저장한다.",
              "이해관계가 없는 사람에게 결정의 허점을 검토받는다.",
              "반복되는 갈등 상황을 날짜·사실·내 해석으로 나눠 기록한다.",
            ].map((item, index) => <li key={item}><span>{index + 1}</span>{tone(item, intensity)}</li>)}
          </ol>
        </ReportSection>

        <section className="final-warning reveal">
          <p>N · FINAL WARNING</p>
          <blockquote>“{tone(result.finalWarning, intensity)}”</blockquote>
          <span>운명은 확정된 사건이 아니라, 반복되는 선택을 알아차릴 때 달라지는 패턴입니다.</span>
        </section>

        <section className="share-panel reveal">
          <div><span>REPORT ACTIONS</span><h2>보고서를 남기되,<br />개인정보는 남기지 마십시오.</h2><p>공유 이미지와 링크에는 생년월일·출생시간·지역이 포함되지 않습니다.</p></div>
          <div className="share-actions"><Button onClick={saveImage}>최종 경고문 이미지 저장</Button><Button variant="ghost" onClick={copyText}>결과 텍스트 복사</Button><Button variant="ghost" onClick={copyLink}>공유 링크 복사</Button></div>
        </section>
      </div>
      <footer><strong>흉터까지 읽는 사주</strong><p>KASI 기반 만세력 원국과 전통 명리학 요소를 활용한 자기 성찰용 콘텐츠입니다. 미래 사건을 확정하지 않습니다.</p></footer>
    </main>
  );
}

function wrapCanvasText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
  const words = text.split(" ");
  let line = ""; let row = 0;
  words.forEach((word) => {
    const test = `${line}${word} `;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line.trim(), x, y + row * lineHeight); line = `${word} `; row += 1;
    } else line = test;
  });
  ctx.fillText(line.trim(), x, y + row * lineHeight);
}

export function SajuApp() {
  const [screen, setScreen] = useState<Screen>("intro");
  const [input, setInput] = useState<BirthInput>(defaultInput);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [step, setStep] = useState(0);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shared = decodeSharePayload(params.get("report") ?? "");
    if (shared) {
      queueMicrotask(() => {
        setInput((current) => ({ ...current, name: shared.name, intensity: shared.intensity }));
        setResult(analyzeChart(shared.chart)); setScreen("result");
      });
      return;
    }
    const saved = loadBirthInput(window.localStorage);
    if (saved) queueMicrotask(() => setInput({ ...defaultInput, ...saved }));
  }, []);

  useEffect(() => {
    if (screen !== "result") return;
    const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
      if (entry.isIntersecting) entry.target.classList.add("revealed");
    }), { threshold: 0.08 });
    document.querySelectorAll(".reveal").forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [screen]);

  useEffect(() => () => { if (timer.current) window.clearInterval(timer.current); }, []);

  const startAnalysis = (value: BirthInput) => {
    setInput(value);
    saveBirthInput(window.localStorage, value);
    const chart = new KoreanManseCalculator().calculate(value);
    const analysis = analyzeChart(chart, { category: value.concernCategory, concern: value.concern });
    setResult(analysis); setStep(0); setScreen("loading");
    let current = 0;
    timer.current = window.setInterval(() => {
      current += 1;
      if (current >= loadingSteps.length) {
        if (timer.current) window.clearInterval(timer.current);
        window.setTimeout(() => setScreen("result"), 260);
      } else setStep(current);
    }, 680);
  };

  const restart = () => {
    if (timer.current) window.clearInterval(timer.current);
    window.history.replaceState({}, "", window.location.pathname);
    setResult(null); setStep(0); setScreen("intro");
  };

  if (screen === "intro") return <Intro onStart={() => setScreen("form")} />;
  if (screen === "form") return <InputForm initial={input} onSubmit={startAnalysis} onBack={() => setScreen("intro")} />;
  if (screen === "loading") return <Loading step={step} />;
  if (!result) return null;
  return <Result name={input.name} concern={input.concern} intensity={input.intensity} result={result} onRestart={restart} onReview={() => { window.scrollTo({ top: 0, behavior: "smooth" }); }} />;
}
