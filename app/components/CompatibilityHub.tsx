"use client";

import { useMemo, useState } from "react";
import {
  analyzeGroup,
  createCompatibilityProfile,
} from "../lib/compatibilityEngine";
import {
  clearCompatibilityProfiles,
  loadCompatibilityProfiles,
  removeCompatibilityProfile,
  saveCompatibilityProfile,
} from "../lib/compatibilityStorage";
import { formatInteractions } from "../lib/sajuLabels";
import { decodeSharePayloadFromUrl } from "../lib/share";
import type {
  CompatibilityProfile,
  Element,
  GroupCompatibilityReport,
  GroupPurpose,
  TravelRange,
} from "../types/fortune";

const purposeOptions: Array<[GroupPurpose, string]> = [
  ["friends", "친구 모임"],
  ["family", "가족"],
  ["travel", "여행 모임"],
  ["work", "회사·프로젝트"],
  ["business", "사업·공동결정"],
];
const rangeOptions: Array<[TravelRange, string]> = [
  ["nearby", "가까운 곳"],
  ["daytrip", "당일치기"],
  ["nationwide", "전국"],
];
const elementHanja: Record<Element, string> = { 목: "木", 화: "火", 토: "土", 금: "金", 수: "水" };

function uniqueProfiles(profiles: CompatibilityProfile[]): CompatibilityProfile[] {
  return [...new Map(profiles.map((profile) => [profile.id, profile])).values()];
}

function CompatibilityResult({ report }: { report: GroupCompatibilityReport }) {
  const pairMode = report.memberCount === 2;
  return (
    <section className="compat-result" aria-live="polite">
      <header className="compat-verdict">
        <div>
          <span>{pairMode ? "PAIR COMPATIBILITY" : "GROUP COMPATIBILITY"} · {report.purposeLabel}</span>
          <h2>{report.grade}</h2>
          <p>{report.headline}</p>
        </div>
        <div className="compat-score" aria-label={`관계 참고 지표 ${report.score}점`}>
          <strong>{report.score}</strong><span>/ 100</span>
        </div>
      </header>
      <p className="compat-summary">{report.summary}</p>
      <div className="compat-current-flow"><strong>{report.currentYear}년 공동 흐름</strong><p>{report.currentFlow}</p></div>

      <section className="compat-section">
        <header><span>01</span><div><strong>모임의 오행 분포</strong><p>모든 사람의 분포를 동일한 비중으로 환산한 참고값입니다.</p></div></header>
        <div className="group-elements">
          {(Object.entries(report.elementDistribution) as [Element, number][]).map(([element, value]) => (
            <div key={element}>
              <span>{elementHanja[element]} <b>{element}</b></span>
              <i><em style={{ width: `${value}%` }} /></i>
              <strong>{value}</strong>
            </div>
          ))}
        </div>
        <div className="compat-signal-row">
          <span>보완이 필요한 방식 <strong>{report.supportiveElements.join(" · ")}</strong></span>
          <span>동시에 과속하기 쉬운 방식 <strong>{report.excessiveElements.join(" · ")}</strong></span>
        </div>
      </section>

      <section className="compat-section">
        <header><span>02</span><div><strong>강점과 위험 신호</strong><p>사람의 좋고 나쁨이 아니라 함께 있을 때 반복될 행동 구조입니다.</p></div></header>
        <div className="compat-two-column">
          <article><b>함께 살릴 강점</b>{report.strengths.map((item) => <p key={item}>{item}</p>)}</article>
          <article className="warning"><b>반드시 관리할 위험</b>{report.risks.map((item) => <p key={item}>{item}</p>)}</article>
        </div>
      </section>

      <section className="compat-section">
        <header><span>03</span><div><strong>{pairMode ? "두 사람의 세부 궁합" : "모든 1:1 연결"}</strong><p>구성원 전체를 평균만 내지 않고 각 조합을 따로 계산합니다.</p></div></header>
        <div className="pair-grid">
          {report.pairReports.map((pair) => (
            <article key={pair.memberIds.join("-")}>
              <header><div><span>{pair.memberNames.join(" × ")}</span><strong>{pair.grade}</strong></div><b>{pair.score}</b></header>
              <div className="metric-list">
                {pair.metrics.map((metric) => (
                  <div key={metric.id}><span>{metric.label}</span><i><em style={{ width: `${metric.score}%` }} /></i><b>{metric.score}</b><p>{metric.description}</p></div>
                ))}
              </div>
              <dl>
                <div><dt>상호 작용</dt><dd>{pair.interactions.length ? formatInteractions(pair.interactions) : "직접적인 합·충·형·파·해가 적음"}</dd></div>
                <div><dt>강점</dt><dd>{pair.synergy.join(" ")}</dd></div>
                <div><dt>마찰</dt><dd>{pair.friction.join(" ")}</dd></div>
                <div><dt>행동 수칙</dt><dd>{pair.action}</dd></div>
              </dl>
            </article>
          ))}
        </div>
      </section>

      {!pairMode && (
        <section className="compat-section">
          <header><span>04</span><div><strong>모임 운영 판독</strong><p>특정인을 문제로 낙인찍지 않고 역할 배치에 사용하십시오.</p></div></header>
          <div className="group-network">
            <article><span>가장 자연스러운 연결</span><strong>{report.strongestPair.memberNames.join(" · ")}</strong><p>현재 구성에서 상호 보완 신호가 가장 높습니다.</p></article>
            <article><span>대화 순서를 정할 연결</span><strong>{report.carefulPair.memberNames.join(" · ")}</strong><p>관계가 나쁘다는 뜻이 아니라 속도와 해석 차이를 먼저 확인해야 합니다.</p></article>
            <article><span>연결 폭이 넓은 구성원</span><strong>{report.bridgeMember}</strong><p>중재 책임을 고정하지 말고 진행 역할을 순환하십시오.</p></article>
          </div>
        </section>
      )}

      <section className="compat-section">
        <header><span>{pairMode ? "04" : "05"}</span><div><strong>같이 가기 좋은 장소</strong><p>행운을 보장하는 장소가 아니라 이 구성의 부족한 환경을 보완하는 현실적 후보입니다.</p></div></header>
        <div className="compat-places">
          {report.recommendedPlaces.map((place) => (
            <article key={place.name}><span>{place.category} · {place.region}</span><strong>{place.name}</strong><p>{place.reason}</p></article>
          ))}
        </div>
        <div className="avoid-place"><strong>피해야 할 일정</strong><p>{report.avoidEnvironment}. 이 환경에서는 모임의 강한 반응이 동시에 올라오기 쉽습니다.</p></div>
      </section>

      <section className="compat-section">
        <header><span>{pairMode ? "05" : "06"}</span><div><strong>이 모임을 살리는 규칙</strong><p>추상적인 궁합 평가보다 실제 운영 규칙이 중요합니다.</p></div></header>
        <ol className="compat-rules">{report.operatingRules.map((rule, index) => <li key={rule}><span>{index + 1}</span>{rule}</li>)}</ol>
      </section>
      <p className="compat-disclaimer">{report.disclaimer}</p>
    </section>
  );
}

export function CompatibilityHub({
  initialProfiles,
  onAddOwn,
  onBack,
}: {
  initialProfiles: CompatibilityProfile[];
  onAddOwn: () => void;
  onBack: () => void;
}) {
  const [savedProfiles, setSavedProfiles] = useState<CompatibilityProfile[]>(() => (
    typeof window === "undefined" ? [] : loadCompatibilityProfiles(window.localStorage)
  ));
  const [sessionProfiles, setSessionProfiles] = useState<CompatibilityProfile[]>(() => uniqueProfiles(initialProfiles));
  const [selectedIds, setSelectedIds] = useState<string[]>(() => initialProfiles.map(({ id }) => id));
  const [shareUrl, setShareUrl] = useState("");
  const [purpose, setPurpose] = useState<GroupPurpose>("friends");
  const [range, setRange] = useState<TravelRange>("daytrip");
  const [baseRegion, setBaseRegion] = useState("서울");
  const [saveImported, setSaveImported] = useState(false);
  const [message, setMessage] = useState("");
  const [report, setReport] = useState<GroupCompatibilityReport | null>(null);
  const profiles = useMemo(() => uniqueProfiles([...sessionProfiles, ...savedProfiles]), [sessionProfiles, savedProfiles]);
  const selected = profiles.filter(({ id }) => selectedIds.includes(id));

  const importShare = () => {
    const payload = decodeSharePayloadFromUrl(shareUrl.trim());
    if (!payload) {
      setMessage("유효한 공유 링크를 확인할 수 없습니다. 전체 주소를 다시 붙여 넣으십시오.");
      return;
    }
    const profile = createCompatibilityProfile(payload.name, payload.chart);
    setSessionProfiles((current) => uniqueProfiles([...current, profile]));
    setSelectedIds((current) => [...new Set([...current, profile.id])].slice(0, 8));
    if (saveImported) setSavedProfiles(saveCompatibilityProfile(window.localStorage, profile));
    setShareUrl("");
    setMessage(`${profile.name}님의 원국을 추가했습니다.`);
    setReport(null);
  };

  const toggleProfile = (profileId: string) => {
    setSelectedIds((current) => {
      if (current.includes(profileId)) return current.filter((id) => id !== profileId);
      if (current.length >= 8) {
        setMessage("한 번에 최대 8명까지 분석할 수 있습니다.");
        return current;
      }
      return [...current, profileId];
    });
    setReport(null);
  };

  const runAnalysis = () => {
    if (selected.length < 2) {
      setMessage("두 명 이상을 선택해야 궁합을 분석할 수 있습니다.");
      return;
    }
    setReport(analyzeGroup(selected, purpose, { range, baseRegion }));
    setMessage("");
    window.setTimeout(() => document.querySelector(".compat-result")?.scrollIntoView({ behavior: "smooth" }), 0);
  };

  return (
    <main className="compat-page">
      <header className="compat-nav">
        <button onClick={onBack}>← 보고서로 돌아가기</button>
        <div><span>合</span><strong>궁합·모임 분석실</strong></div>
        <small>2–8 PEOPLE · LOCAL ONLY</small>
      </header>
      <section className="compat-hero">
        <p>RELATIONSHIP STRUCTURE REPORT</p>
        <h1>사람을 심판하지 않고,<br /><em>함께 무너지는 패턴</em>을 찾습니다.</h1>
        <span>공유 원국과 직접 입력한 원국은 이 브라우저 안에서만 비교됩니다.</span>
      </section>

      <div className="compat-shell">
        <section className="compat-builder">
          <div className="compat-builder-head">
            <div><span>01 · MEMBERS</span><h2>분석할 사람 선택</h2></div>
            <b>{selected.length} / 8명 선택</b>
          </div>
          <div className="profile-list">
            {profiles.map((profile) => {
              const selectedProfile = selectedIds.includes(profile.id);
              const stored = savedProfiles.some(({ id }) => id === profile.id);
              return (
                <article className={selectedProfile ? "selected" : ""} key={profile.id}>
                  <button className="profile-select" onClick={() => toggleProfile(profile.id)} aria-pressed={selectedProfile}>
                    <span>{selectedProfile ? "✓" : "+"}</span>
                    <div><strong>{profile.name}</strong><small>{profile.chart.pillars.map(({ stem, branch }) => `${stem}${branch}`).join(" · ")}</small></div>
                  </button>
                  <button
                    className="profile-store"
                    onClick={() => {
                      if (stored) setSavedProfiles(removeCompatibilityProfile(window.localStorage, profile.id));
                      else setSavedProfiles(saveCompatibilityProfile(window.localStorage, profile));
                    }}
                  >
                    {stored ? "보관 삭제" : "이 기기에 보관"}
                  </button>
                </article>
              );
            })}
          </div>

          <div className="compat-import">
            <label htmlFor="share-url">공유 링크로 사람 추가</label>
            <div><input id="share-url" value={shareUrl} onChange={(event) => setShareUrl(event.target.value)} placeholder="https://.../#report=..." /><button onClick={importShare}>링크 불러오기</button></div>
            <label className="compat-check"><input type="checkbox" checked={saveImported} onChange={(event) => setSaveImported(event.target.checked)} /> 불러온 원국을 이 기기 보관함에 저장</label>
            <button className="own-profile-button" onClick={onAddOwn}>공유 링크 없이 내 생년정보를 직접 입력해 추가하기 →</button>
            {message && <p role="status">{message}</p>}
          </div>

          {savedProfiles.length > 0 && (
            <button className="clear-vault" onClick={() => { clearCompatibilityProfiles(window.localStorage); setSavedProfiles([]); setReport(null); }}>
              이 기기에 저장된 궁합 보관함 전체 삭제
            </button>
          )}
        </section>

        <section className="compat-settings">
          <div><span>02 · PURPOSE</span><h2>관계의 목적</h2></div>
          <div className="purpose-grid">
            {purposeOptions.map(([value, label]) => <button className={purpose === value ? "active" : ""} onClick={() => { setPurpose(value); setReport(null); }} key={value}>{label}</button>)}
          </div>
          <div className="place-settings">
            <label>출발 지역<input value={baseRegion} onChange={(event) => { setBaseRegion(event.target.value); setReport(null); }} placeholder="예: 서울" /></label>
            <fieldset><legend>이동 범위</legend>{rangeOptions.map(([value, label]) => <button className={range === value ? "active" : ""} onClick={() => { setRange(value); setReport(null); }} type="button" key={value}>{label}</button>)}</fieldset>
          </div>
          <button className="compat-run" onClick={runAnalysis} disabled={selected.length < 2}>{selected.length === 2 ? "두 사람의 궁합 분석하기" : `${selected.length}명의 모임 구조 분석하기`}</button>
        </section>

        {report && <CompatibilityResult report={report} />}
      </div>
    </main>
  );
}
