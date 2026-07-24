"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { analyzeChart, buildPersonalizedActions, tone } from "../lib/analysisEngine";
import { KoreanManseCalculator } from "../lib/fortuneCalculator";
import { defaultInput } from "../lib/profiles";
import { formatBranch, formatInteractions } from "../lib/sajuLabels";
import { decodeSharePayload, encodeSharePayload, sanitizeChartForShare } from "../lib/share";
import { deleteBirthInput, loadBirthInput, saveBirthInput } from "../lib/storage";
import { validateBirthInput } from "../lib/validation";
import type { AnalysisResult, BirthInput, Element, Intensity, SharePayload, WarningRule } from "../types/fortune";

type Screen = "intro" | "form" | "loading" | "result";
const loadingSteps = ["사주 원국 확인 중", "오행 불균형 분석 중", "반복되는 약점 탐색 중", "최종 경고문 작성 중"];
const elementMeta: Record<Element, { hanja: string; color: string }> = {
  목: { hanja: "木", color: "#678f64" }, 화: { hanja: "火", color: "#d84b35" },
  토: { hanja: "土", color: "#a77a4d" }, 금: { hanja: "金", color: "#c2aa7b" },
  수: { hanja: "水", color: "#527da0" },
};

const termCaptions: Record<string, string> = {
  "사주 원국": "태어난 연·월·일·시를 네 기둥, 여덟 글자로 정리한 기본 명식입니다.",
  천간: "각 기둥의 위 글자입니다. 겉으로 드러나는 작동 방식과 역할을 읽는 기준으로 씁니다.",
  지지: "각 기둥의 아래 글자입니다. 계절·환경·생활 바탕과 글자 사이의 관계를 살핍니다.",
  "12지지": "자·축·인·묘·진·사·오·미·신·유·술·해 열두 글자입니다. 이 화면에서는 한자와 띠 동물을 함께 표시합니다.",
  일간: "일주의 천간입니다. 다른 오행과 십신을 판단할 때 기준점이 되는 ‘나’의 글자입니다.",
  오행: "목·화·토·금·수 다섯 작동 방식입니다. 좋고 나쁨보다 분포와 균형을 봅니다.",
  음양: "같은 오행 안에서도 밖으로 뻗는 양과 안으로 모이는 음의 방향성을 구분합니다.",
  십신: "일간과 다른 글자의 관계를 비견·재성·관성·인성 등 열 가지 역할로 번역한 이름입니다.",
  "신강·신약": "일간을 돕는 힘과 소모시키는 힘의 상대적 균형입니다. 사람의 강함·약함이나 능력 점수가 아닙니다.",
  "합·충·형·파·해": "지지끼리 결합하거나 부딪히는 관계 표기입니다. 사건 예언이 아니라 반복 자극의 참고값입니다.",
  대운: "삶의 흐름을 약 10년 단위로 나눠 어떤 역할과 오행이 오래 자극되는지 보는 참고 주기입니다.",
  "순행·역행": "대운의 간지를 월주에서 앞 또는 뒤 방향으로 배열하는 전통 계산 방식입니다.",
  대운수: "첫 대운이 시작되는 대략적인 나이입니다. 관법에 따라 약간의 차이가 날 수 있습니다.",
  세운: "입춘부터 다음 입춘까지 적용하는 한 해의 간지 흐름입니다.",
  입춘: "명리학에서 해의 간지가 바뀌는 기준으로 사용하는 절기 시점입니다. 양력 1월 1일과 다릅니다.",
  연주: "해당 연도의 천간과 지지를 합친 두 글자입니다. 예: 2026년 병오.",
  자극도: "세운의 충·형·파·해와 과다 오행 중첩을 계산한 이 서비스의 참고 강도입니다.",
  신살: "특정 지지 조합에 붙인 전통적 보조 표지입니다. 원국 전체보다 우선하지 않습니다.",
  도화: "호감·노출·대인 반응을 살피는 보조 표지입니다. 연애 성패를 확정하지 않습니다.",
  역마: "이동·변화·새 환경에 대한 반응을 살피는 보조 표지입니다. 사고나 이사를 예언하지 않습니다.",
  화개: "몰입·학습·예술성과 혼자 정리하는 경향을 살피는 보조 표지입니다.",
  천을귀인: "도움과 조언을 연결하는 방식을 살피는 보조 표지입니다. 누군가의 등장을 보장하지 않습니다.",
};

const tenGodCaptions: Record<string, string> = {
  비견: "나와 같은 기준·자기주도·동료 의식",
  겁재: "경쟁·공동 자원·관계 속 주도권",
  식신: "생산·표현·생활의 안정과 결과물",
  상관: "비판·문제 제기·자유로운 표현",
  편재: "넓은 기회·유동적인 돈·대외 활동",
  정재: "고정 수입·예산·현실적인 관리",
  편관: "압박·결단·도전과 강한 책임",
  정관: "규칙·직책·평판과 조직의 기준",
  편인: "직감·독창적 관찰·비정형 학습",
  정인: "학습·보호·문서와 안정적 지원",
};

function TermCaptions({ terms }: { terms: string[] }) {
  return (
    <aside className="term-captions" aria-label="사주 용어 쉬운 설명">
      <strong className="term-captions-title">용어를 쉽게 읽으면</strong>
      <div>
        {terms.map((term) => (
          <article key={term}>
            <b>{term}</b>
            <p>{termCaptions[term]}</p>
          </article>
        ))}
      </div>
    </aside>
  );
}

function TenGodCaptions({ terms: providedTerms }: { terms: string[] }) {
  const terms = [...new Set(
    providedTerms
      .filter((term) => term !== "일간" && term !== "미상"),
  )];
  return (
    <aside className="ten-god-captions" aria-label="이 원국에 나온 십신 설명">
      <strong>이 원국에 나온 십신</strong>
      <div>{terms.map((term) => <span key={term}><b>{term}</b>{tenGodCaptions[term] ?? "일간과의 관계를 나타내는 역할 이름"}</span>)}</div>
    </aside>
  );
}

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
        <p className="form-lead">입력값으로 한국 표준시와 절기 절입 시각을 반영한 사주 원국(태어난 연·월·일·시의 여덟 글자)을 계산합니다. 저장에 동의하지 않으면 브라우저를 닫는 즉시 남지 않습니다.</p>

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
              <p className="field-help">진태양시는 지역별 경도와 날짜별 태양 시각 차이를 출생시간에 보정하는 방식입니다. 국내 도시의 과거 표준시와 서머타임도 반영하므로 다른 만세력과 비교할 때 보정 기준을 함께 확인하십시오.</p>
            </Field>
            <Field label="풀이 강도" className="wide">
              <div className="intensity-row">
                {([["mild", "순한맛"], ["realistic", "현실적인 조언"], ["direct", "가감 없는 분석"]] as [Intensity, string][]).map(([value, label]) => (
                  <Choice key={value} name="intensity" value={value} checked={input.intensity === value} onChange={() => update("intensity", value)}>{label}</Choice>
                ))}
              </div>
              <p className="field-help">욕설·비하·사건 단정 없이, 같은 분석을 선택한 강도에 맞춰 표현합니다.</p>
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

function RuleCard({ rule, evidence, index, intensity }: { rule: WarningRule; evidence: string; index: number; intensity: Intensity }) {
  return (
    <article className="weakness-card">
      <div className="weakness-no">0{index + 1}</div>
      <div>
        <span className="severity">위험 신호 {rule.severity}/5</span>
        <h3>{tone(rule.title, intensity)}</h3>
        <p className="rule-summary">{tone(rule.summary, intensity)}</p>
        <dl>
          <div><dt>이 원국의 근거</dt><dd>{tone(evidence, intensity)}</dd></div>
          <div><dt>왜 나타나는가</dt><dd>{tone(rule.detailedReason, intensity)}</dd></div>
          <div><dt>실제 신호</dt><dd>{rule.warningSigns.map((item) => tone(item, intensity)).join(" · ")}</dd></div>
          <div><dt>방치하면</dt><dd>{tone(rule.consequences, intensity)}</dd></div>
        </dl>
        <div className="order"><strong>행동 수칙</strong><p>{tone(rule.actionRules[0], intensity)}</p></div>
      </div>
    </article>
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
          {currentAge !== null && option.cycles.find((cycle) => currentAge >= cycle.startAge && currentAge <= cycle.endAge) && (
            <div className="current-luck-summary">
              <span>CURRENT CYCLE · 현재 대운 총평</span>
              <strong>
                {option.cycles.find((cycle) => currentAge >= cycle.startAge && currentAge <= cycle.endAge)?.startAge}–
                {option.cycles.find((cycle) => currentAge >= cycle.startAge && currentAge <= cycle.endAge)?.endAge}세 ·
                {" "}{option.cycles.find((cycle) => currentAge >= cycle.startAge && currentAge <= cycle.endAge)?.korean} 대운
              </strong>
              <p>{tone(option.cycles.find((cycle) => currentAge >= cycle.startAge && currentAge <= cycle.endAge)?.assessment ?? "", intensity)}</p>
            </div>
          )}
          <div className="luck-track">
            {option.cycles.map((cycle) => {
              const active = currentAge !== null && currentAge >= cycle.startAge && currentAge <= cycle.endAge;
              return (
                <article className={active ? "active" : ""} key={`${option.label}-${cycle.startAge}-${cycle.korean}`}>
                  <span>{cycle.startAge}–{cycle.endAge}세</span>
                  <strong>{cycle.korean}</strong>
                  <b>{cycle.element} · {cycle.tenGod}/{cycle.branchTenGod}</b>
                  <small className="branch-plain">지지 {formatBranch(cycle.branch)}</small>
                  <p className="luck-relations">{cycle.interactions.length ? formatInteractions(cycle.interactions) : "원국 지지와 직접 관계 적음"}</p>
                  <p className="luck-assessment">{tone(
                    cycle.assessment ?? `${cycle.tenGod}/${cycle.branchTenGod} 역할이 강조되는 시기입니다. 원국과의 관계를 확인하며 속도보다 행동 기준을 먼저 세우십시오.`,
                    intensity,
                  )}</p>
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
            <p className="branch-plain">올해 지지 {formatBranch(flow.branch)}</p>
            <h3>{flow.korean}년 · {flow.tenGod}/{flow.branchTenGod}</h3>
            <p className="annual-theme">{flow.theme}</p>
            <dl>
              <div><dt>원국 관계</dt><dd>{flow.interactions.length ? formatInteractions(flow.interactions) : "직접적인 합·충·형·파·해가 적음"}</dd></div>
              <div><dt>경고</dt><dd>{tone(flow.warning, intensity)}</dd></div>
              <div><dt>행동</dt><dd>{tone(flow.action, intensity)}</dd></div>
            </dl>
          </article>
        ))}
      </div>
    </div>
  );
}

function AnnualGuidanceReport({ result, intensity }: { result: AnalysisResult; intensity: Intensity }) {
  const guidance = result.annualGuidance;
  return (
    <div className="environment-report">
      <header>
        <div>
          <span>YEARLY ENVIRONMENT PRESCRIPTION</span>
          <h3>{tone(guidance.headline, intensity)}</h3>
          <p>{guidance.basis}</p>
        </div>
        <div className="direction-seal">
          <span>보완 방위</span>
          <strong>{guidance.direction}</strong>
          <b>{guidance.supportiveElement}</b>
        </div>
      </header>

      <section>
        <div className="environment-title">
          <span>01</span>
          <div><strong>실제로 가볼 만한 장소</strong><p>장소명은 행운을 보장하는 목적지가 아니라, 필요한 환경을 현실에서 찾기 위한 방문 후보입니다.</p></div>
        </div>
        <div className="place-grid">
          {guidance.recommendedPlaces.map((place) => (
            <article key={place.name}>
              <span>{place.category}</span>
              <h4>{place.name}</h4>
              <p>{place.reason}</p>
            </article>
          ))}
        </div>
      </section>

      <section>
        <div className="environment-title">
          <span>02</span>
          <div><strong>올해 오래 머물지 말아야 할 환경</strong><p>특정 지역의 불운이 아니라, 원국의 과한 반응을 더 키우는 환경 유형입니다.</p></div>
        </div>
        <div className="reduce-grid">
          {guidance.reduceEnvironments.map((item) => (
            <article key={item.environment}><strong>{item.environment}</strong><p>{item.reason}</p></article>
          ))}
        </div>
      </section>

      <section>
        <div className="environment-title">
          <span>03</span>
          <div><strong>문서·음식·사람·이동 경계</strong><p>실제 원국 또는 올해 세운 근거가 있는 항목만 표시합니다.</p></div>
        </div>
        <div className="caution-grid">
          {guidance.cautions.map((item) => (
            <article key={item.category}>
              <header><strong>{item.category}</strong><span>{item.basis}</span></header>
              <p>{tone(item.advice, intensity)}</p>
            </article>
          ))}
        </div>
      </section>

      <p className="environment-disclaimer">
        오행의 전통적 방위인 목–동, 화–남, 토–중앙, 금–서, 수–북을 생활 환경에 적용한 자기 성찰용 해석입니다.
        여행 안전, 음식 선택, 계약과 차량 관리는 날씨·건강 상태·공식 안내·전문 자료를 우선하십시오.
      </p>
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

function Result({ name, intensity, result, onRestart, onReview }: { name: string; intensity: Intensity; result: AnalysisResult; onRestart: () => void; onReview: () => void }) {
  const [notice, setNotice] = useState("");
  const { chart } = result;
  const elementEntries = Object.entries(chart.elementDistribution) as [Element, number][];
  const maxElement = [...elementEntries].sort((a, b) => b[1] - a[1])[0][0];
  const minElement = [...elementEntries].sort((a, b) => a[1] - b[1])[0][0];
  const personalizedActions = useMemo(
    () => buildPersonalizedActions(chart, result.weaknesses),
    [chart, result.weaknesses],
  );
  const notify = (message: string) => { setNotice(message); window.setTimeout(() => setNotice(""), 1800); };
  const reportText = useMemo(() => [
    `${name}님의 사주 경고 보고서`,
    `종합 위험 등급: ${result.riskLevel}`,
    ...result.weaknesses.map((rule, i) => `${i + 1}. ${tone(rule.title, intensity)}\n${tone(rule.summary, intensity)}\n행동: ${tone(rule.actionRules[0], intensity)}`),
    `최종 총평: ${result.overallAssessment.verdict}\n${tone(result.overallAssessment.summary, intensity)}\n가장 먼저 할 일: ${tone(result.overallAssessment.firstPriority, intensity)}`,
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
          <TermCaptions terms={["사주 원국", "천간", "지지", "12지지", "일간", "십신", "신강·신약", "합·충·형·파·해"]} />
          <div className="pillars">
            {[...chart.pillars].reverse().map((pillar) => (
              <article key={pillar.label} className="pillar">
                <span>{pillar.label}</span>
                <small>천간 · 위 글자</small><strong>{pillar.stem}</strong>
                <small>지지 · 아래 글자</small><strong>{pillar.branch}</strong>
                <em className="branch-plain">{pillar.branch === "?" ? "출생시간 미상" : formatBranch(pillar.branch)}</em>
                <div><b>{pillar.element}/{pillar.branchElement}</b><b>{pillar.yinYang}/{pillar.branchYinYang}</b><b>{pillar.tenGod}/{pillar.branchTenGod}</b></div><p>{pillar.role}</p>
              </article>
            ))}
          </div>
          <div className="chart-notes"><span>양력 환산 <strong>{chart.solarDate}</strong></span><span>음력 환산 <strong>{chart.lunarDate}</strong></span><span>일간 <strong>{chart.dayMaster}</strong></span><span>신강·신약 참고 <strong>{chart.strengthScore}</strong></span><span>합·충·형·파·해 <strong>{formatInteractions(chart.interactions)}</strong></span></div>
          <TenGodCaptions terms={chart.pillars.flatMap(({ tenGod, branchTenGod }) => [tenGod, branchTenGod])} />
        </ReportSection>

        <ReportSection number="B" title="오행 불균형" subtitle="ELEMENT IMBALANCE">
          <TermCaptions terms={["오행", "음양"]} />
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
          <div className="weaknesses">{result.weaknesses.map((rule, index) => <RuleCard key={rule.id} rule={rule} evidence={result.weaknessEvidence[rule.id]} index={index} intensity={intensity} />)}</div>
        </ReportSection>

        <ReportSection number="D" title="대운의 흐름" subtitle="10-YEAR LUCK CYCLES">
          <TermCaptions terms={["대운", "순행·역행", "대운수", "십신"]} />
          <TenGodCaptions terms={(chart.luckFlow?.options ?? []).flatMap(({ cycles }) => cycles.flatMap(({ tenGod, branchTenGod }) => [tenGod, branchTenGod]))} />
          <LuckFlowReport chart={chart} intensity={intensity} />
        </ReportSection>

        <ReportSection number="E" title="연도별 세운 경고" subtitle="ANNUAL FLOW">
          <TermCaptions terms={["세운", "입춘", "연주", "자극도"]} />
          <TenGodCaptions terms={result.annualFlows.flatMap(({ tenGod, branchTenGod }) => [tenGod, branchTenGod])} />
          <AnnualFlowReport result={result} intensity={intensity} />
        </ReportSection>

        <ReportSection number="F" title="올해의 환경 처방" subtitle="PLACE & DAILY CAUTION">
          <AnnualGuidanceReport result={result} intensity={intensity} />
        </ReportSection>

        <ReportSection number="G" title="재미로 보는 보조 신살" subtitle="SYMBOLIC STARS">
          <TermCaptions terms={["신살", "도화", "역마", "화개", "천을귀인"]} />
          <SpiritStarReport chart={chart} intensity={intensity} />
        </ReportSection>

        <ReportSection number="H" title="절대 하면 안 되는 행동 5가지" subtitle="DO NOT">
          <ol className="command-list prohibited">
            {personalizedActions.prohibited.map((item, index) => <li key={item}><span>{index + 1}</span>{tone(item, intensity)}</li>)}
          </ol>
        </ReportSection>

        <ReportSection number="I" title="당신을 살리는 행동 5가지" subtitle="SURVIVAL RULES">
          <ol className="command-list rescue">
            {personalizedActions.rescue.map((item, index) => <li key={item}><span>{index + 1}</span>{tone(item, intensity)}</li>)}
          </ol>
        </ReportSection>

        <ReportSection number="J" title="최종 종합 판정" subtitle="OVERALL ASSESSMENT">
          <div className="overall-assessment">
            <header>
              <div className="overall-grade">
                <span>FINAL VERDICT</span>
                <strong>{result.overallAssessment.verdict}</strong>
                <b>위험 등급 {result.riskLevel} · {result.riskScore}/100</b>
              </div>
              <div className="overall-headline">
                <span>이 사주의 핵심 결론</span>
                <h3>{tone(result.overallAssessment.headline, intensity)}</h3>
                <p>{tone(result.overallAssessment.summary, intensity)}</p>
              </div>
            </header>
            <div className="overall-grid">
              <article>
                <span>01 · CORE RISK</span>
                <h4>가장 먼저 무너지는 지점</h4>
                <p>{tone(result.overallAssessment.coreRisk, intensity)}</p>
              </article>
              <article>
                <span>02 · PROTECTIVE FACTOR</span>
                <h4>당신에게 이미 있는 보호 장치</h4>
                <p>{tone(result.overallAssessment.protectiveFactor, intensity)}</p>
              </article>
              <article>
                <span>03 · CURRENT FLOW</span>
                <h4>현재 흐름에서의 판단</h4>
                <p>{tone(result.overallAssessment.currentFlow, intensity)}</p>
              </article>
              <article className="priority">
                <span>04 · FIRST PRIORITY</span>
                <h4>지금 가장 먼저 할 일</h4>
                <p>{tone(result.overallAssessment.firstPriority, intensity)}</p>
              </article>
            </div>
            <div className="overall-conclusion">
              <strong>총평</strong>
              <p>{tone(result.overallAssessment.conclusion, intensity)}</p>
            </div>
          </div>
        </ReportSection>

        <section className="final-warning reveal">
          <p>K · FINAL WARNING</p>
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
    const analysis = analyzeChart(chart);
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
  return <Result name={input.name} intensity={input.intensity} result={result} onRestart={restart} onReview={() => { window.scrollTo({ top: 0, behavior: "smooth" }); }} />;
}
