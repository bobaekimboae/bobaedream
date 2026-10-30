import { useEffect, useMemo, useState } from "react";
import {
  CameraIcon,
  CheckIcon,
  ChevronLeftIcon,
  Cross2Icon,
  DownloadIcon,
  GearIcon,
  PlayIcon,
  Share2Icon,
} from "@radix-ui/react-icons";
import "./shoot-simple.css";

type Screen = "course" | "capture" | "review" | "shorts" | "result";
type CourseKey = "quick" | "standard" | "detail";
type Stage = { key: string; label: string; seconds: number; image: string; tip: string };

const base = typeof document === "undefined" ? "/" : new URL(".", document.baseURI).pathname;
const shot = (name: string) => `${base}assets/shoot-templates/${name}.webp`;

const STAGES: Stage[] = [
  { key: "exterior", label: "차량 외관", seconds: 15, image: shot("ext-1"), tip: "정면에서 시작해 차량을 한 바퀴 천천히 돌아 주세요." },
  { key: "driver", label: "운전석", seconds: 8, image: shot("in-seat"), tip: "문을 열고 시트와 전동 버튼이 함께 보이게 찍어 주세요." },
  { key: "dashboard", label: "대시보드", seconds: 7, image: shot("in-dash"), tip: "핸들부터 화면까지 수평으로 천천히 훑어 주세요." },
  { key: "rear", label: "뒷좌석", seconds: 8, image: shot("in-rear"), tip: "좌우 시트와 레그룸이 한 화면에 보이게 찍어 주세요." },
  { key: "trunk", label: "트렁크", seconds: 6, image: shot("trk-1"), tip: "트렁크를 열고 바닥까지 보이도록 위에서 아래로 찍어 주세요." },
];

const COURSES: { key: CourseKey; label: string; description: string; duration: string; count: number }[] = [
  { key: "quick", label: "빠른 촬영", description: "외관 · 실내 · 트렁크", duration: "약 40초", count: 3 },
  { key: "standard", label: "표준 촬영", description: "매물에 꼭 필요한 5개 부위", duration: "약 1분 10초", count: 5 },
  { key: "detail", label: "상세 촬영", description: "휠 · 엔진룸 · 옵션까지", duration: "약 2분", count: 8 },
];

function Progress({ step }: { step: number }) {
  return (
    <div className="sc-progress" aria-label={`전체 4단계 중 ${step}단계`}>
      <span style={{ width: `${step * 25}%` }} />
    </div>
  );
}

function Header({ title, onBack, close }: { title: string; onBack?: () => void; close?: boolean }) {
  return (
    <header className="sc-header">
      <button type="button" className="sc-icon-button" aria-label={close ? "닫기" : "뒤로"} onClick={onBack}>
        {close ? <Cross2Icon /> : <ChevronLeftIcon />}
      </button>
      <strong>{title}</strong>
      <span className="sc-header-space" />
    </header>
  );
}

export default function ShootSimplePrototype() {
  const [screen, setScreen] = useState<Screen>("course");
  const [course, setCourse] = useState<CourseKey>("standard");
  const [current, setCurrent] = useState(0);
  const [recording, setRecording] = useState(false);
  const [captured, setCaptured] = useState<string[]>([]);
  const [toast, setToast] = useState("");

  const selectedCourse = COURSES.find((item) => item.key === course)!;
  const visibleStages = useMemo(() => {
    if (course === "quick") return [STAGES[0], STAGES[1], STAGES[4]];
    if (course === "detail") return [...STAGES, { key: "engine", label: "엔진룸", seconds: 10, image: shot("eng-1"), tip: "보닛을 열고 좌우로 천천히 훑어 주세요." }, { key: "wheel", label: "휠 · 타이어", seconds: 8, image: shot("opt-tyre"), tip: "휠과 타이어 홈이 선명하게 보이도록 가까이 찍어 주세요." }, { key: "feature", label: "옵션 작동", seconds: 12, image: shot("opt-feature-1"), tip: "선루프나 화면이 실제로 작동하는 모습을 담아 주세요." }];
    return STAGES;
  }, [course]);

  useEffect(() => {
    const previous = document.title;
    document.title = "보배드림 · 간편 촬영 시안";
    document.documentElement.classList.add("shoot-simple-page");
    return () => {
      document.title = previous;
      document.documentElement.classList.remove("shoot-simple-page");
    };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 1800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const startCourse = () => {
    setCurrent(0);
    setCaptured([]);
    setRecording(false);
    setScreen("capture");
  };

  const finishStage = () => {
    const key = visibleStages[current].key;
    const nextCaptured = captured.includes(key) ? captured : [...captured, key];
    setCaptured(nextCaptured);
    setRecording(false);
    if (current < visibleStages.length - 1) {
      setCurrent(current + 1);
      setToast(`${visibleStages[current].label} 촬영을 저장했어요`);
    } else {
      setScreen("review");
    }
  };

  const goBack = () => {
    if (screen === "capture") setScreen("course");
    else if (screen === "review") setScreen("capture");
    else if (screen === "shorts") setScreen("review");
    else if (screen === "result") setScreen("shorts");
  };

  return (
    <div className="sc-root">
      <main className="sc-phone">
        {screen === "course" && (
          <section className="sc-screen sc-course-screen">
            <Header title="간편 촬영" close onBack={() => history.back()} />
            <Progress step={1} />
            <div className="sc-scroll">
              <div className="sc-intro">
                <span className="sc-eyebrow">보배드림 촬영 도우미</span>
                <h1>누구나 같은 품질로<br />1분 안에 촬영해요</h1>
                <p>코스를 고르면 촬영 순서와 시간을 한 단계씩 안내합니다.</p>
              </div>

              <div className="sc-section-title">
                <div>
                  <span>1단계</span>
                  <h2>촬영 코스를 골라 주세요</h2>
                </div>
                <button type="button" onClick={() => setToast("직접 구성은 다음 시안에서 연결됩니다")}>직접 구성</button>
              </div>

              <div className="sc-course-list" role="radiogroup" aria-label="촬영 코스">
                {COURSES.map((item) => (
                  <button
                    type="button"
                    role="radio"
                    aria-checked={course === item.key}
                    className={`sc-course-card ${course === item.key ? "is-selected" : ""}`}
                    key={item.key}
                    onClick={() => setCourse(item.key)}
                  >
                    <span className="sc-radio-dot">{course === item.key && <CheckIcon />}</span>
                    <span className="sc-course-copy">
                      <strong>{item.label}</strong>
                      <small>{item.description}</small>
                    </span>
                    <span className="sc-course-meta"><b>{item.count}단계</b><small>{item.duration}</small></span>
                  </button>
                ))}
              </div>

              <div className="sc-plan-card">
                <div className="sc-plan-head">
                  <strong>{selectedCourse.label} 순서</strong>
                  <span>{selectedCourse.duration}</span>
                </div>
                <div className="sc-plan-strip">
                  {visibleStages.slice(0, 5).map((stage, index) => (
                    <div key={stage.key} className="sc-plan-item">
                      <img src={stage.image} alt="" />
                      <span>{index + 1}</span>
                      <small>{stage.label}</small>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="sc-sticky">
              <button type="button" className="sc-primary" onClick={startCourse}>{selectedCourse.label} 시작</button>
              <small>촬영한 영상은 기기 안에서만 편집됩니다.</small>
            </div>
          </section>
        )}

        {screen === "capture" && (
          <section className="sc-screen sc-capture-screen">
            <Header title={`${current + 1}/${visibleStages.length} · ${visibleStages[current].label}`} onBack={goBack} />
            <Progress step={2} />
            <div className="sc-camera" style={{ backgroundImage: `url(${visibleStages[current].image})` }}>
              <div className="sc-camera-shade" />
              <div className="sc-camera-topline">
                <span>촬영 안내</span>
                <button type="button" aria-label="촬영 설정" onClick={() => setToast("촬영 설정") }><GearIcon /></button>
              </div>
              <div className="sc-frame-guide" aria-hidden="true" />
              <div className="sc-guide-card">
                <strong>{visibleStages[current].label}</strong>
                <p>{visibleStages[current].tip}</p>
                <span>권장 {visibleStages[current].seconds}초</span>
              </div>
            </div>
            <div className="sc-capture-controls">
              <div className="sc-stage-state">
                <strong>{recording ? "촬영 중" : captured.includes(visibleStages[current].key) ? "촬영 완료" : "준비됐어요"}</strong>
                <span>{recording ? "차량을 천천히 보여 주세요" : "버튼을 누르면 바로 시작합니다"}</span>
              </div>
              <button
                type="button"
                className={`sc-record ${recording ? "is-recording" : ""}`}
                onClick={() => recording ? finishStage() : setRecording(true)}
              >
                <span><CameraIcon /></span>
                {recording ? "촬영 완료" : captured.includes(visibleStages[current].key) ? "다시 촬영" : "촬영 시작"}
              </button>
              <button type="button" className="sc-text-button" onClick={() => setScreen("review")}>현재까지 촬영 확인</button>
            </div>
          </section>
        )}

        {screen === "review" && (
          <section className="sc-screen sc-review-screen">
            <Header title="촬영 확인" onBack={goBack} />
            <Progress step={3} />
            <div className="sc-scroll sc-review-body">
              <div className="sc-review-summary">
                <span className="sc-summary-icon"><CheckIcon /></span>
                <div>
                  <strong>{captured.length}개 단계 촬영 완료</strong>
                  <p>{visibleStages.length - captured.length > 0 ? `${visibleStages.length - captured.length}개 단계가 아직 남아 있어요.` : "필요한 장면을 모두 촬영했어요."}</p>
                </div>
              </div>
              <div className="sc-review-list">
                {visibleStages.map((stage, index) => {
                  const done = captured.includes(stage.key);
                  return (
                    <button type="button" key={stage.key} onClick={() => { setCurrent(index); setScreen("capture"); }}>
                      <img src={stage.image} alt="" />
                      <span className="sc-review-copy"><strong>{stage.label}</strong><small>{done ? `${stage.seconds}초 · 촬영 완료` : "촬영 필요"}</small></span>
                      <span className={`sc-status ${done ? "is-done" : ""}`}>{done ? <CheckIcon /> : `${index + 1}`}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="sc-sticky sc-review-actions">
              {captured.length < visibleStages.length && <button type="button" className="sc-secondary" onClick={() => { const firstMissing = visibleStages.findIndex((stage) => !captured.includes(stage.key)); setCurrent(firstMissing < 0 ? 0 : firstMissing); setScreen("capture"); }}>계속 촬영</button>}
              <button type="button" className="sc-primary" onClick={() => setScreen("shorts")}>현재 영상으로 쇼츠 만들기</button>
            </div>
          </section>
        )}

        {screen === "shorts" && (
          <section className="sc-screen sc-shorts-screen">
            <Header title="쇼츠 자동 구성" onBack={goBack} />
            <Progress step={4} />
            <div className="sc-scroll sc-shorts-body">
              <div className="sc-preview-card" style={{ backgroundImage: `url(${STAGES[0].image})` }}>
                <button type="button" aria-label="미리보기 재생"><PlayIcon /></button>
                <div><span>보배드림 실매물</span><strong>BMW M3 실사용 후기</strong><small>외관 · 실내 · 주요 옵션</small></div>
              </div>
              <div className="sc-form-section">
                <h2>영상 길이</h2>
                <div className="sc-choice-row" role="radiogroup" aria-label="영상 길이">
                  <button type="button" role="radio" aria-checked="true" className="is-on">원본 {Math.max(9, captured.length * 8)}초</button>
                  <button type="button" role="radio" aria-checked="false">15초</button>
                  <button type="button" role="radio" aria-checked="false" disabled={captured.length < 4}>30초</button>
                </div>
              </div>
              <div className="sc-form-section">
                <div className="sc-form-title"><h2>매물 정보</h2><span>자동 입력</span></div>
                <label>차량명<input defaultValue="BMW M3 컴페티션" /></label>
                <label>가격<input defaultValue="11,020만원" /></label>
                <label>첫 화면 문구 <small>선택</small><input defaultValue="실매물 영상 그대로" /></label>
              </div>
              <p className="sc-safety-copy">자막에는 직접 확인한 정보만 사용됩니다. 사고·정비 이력은 자동으로 만들지 않습니다.</p>
            </div>
            <div className="sc-sticky">
              <button type="button" className="sc-primary" onClick={() => setScreen("result")}>쇼츠 미리보기 만들기</button>
            </div>
          </section>
        )}

        {screen === "result" && (
          <section className="sc-screen sc-result-screen">
            <Header title="쇼츠 완성" onBack={goBack} />
            <div className="sc-scroll sc-result-body">
              <div className="sc-result-mark"><CheckIcon /></div>
              <h1>쇼츠가 완성됐어요</h1>
              <p>저장한 뒤 인스타그램·유튜브·틱톡에 바로 올릴 수 있습니다.</p>
              <div className="sc-result-video" style={{ backgroundImage: `url(${STAGES[0].image})` }}>
                <button type="button" aria-label="완성 영상 재생"><PlayIcon /></button>
                <div><small>보배드림 실매물</small><strong>BMW M3 컴페티션</strong><span>0:{Math.max(9, captured.length * 8).toString().padStart(2, "0")}</span></div>
              </div>
              <button type="button" className="sc-primary sc-save" onClick={() => setToast("시안에서는 실제 파일을 저장하지 않습니다") }><DownloadIcon /> 내 폰에 저장</button>
              <button type="button" className="sc-secondary sc-share" onClick={() => setToast("공유 앱 선택 화면을 여는 자리입니다") }><Share2Icon /> 다른 앱으로 공유</button>
              <button type="button" className="sc-text-button" onClick={() => setScreen("shorts")}>다시 고치기</button>
            </div>
          </section>
        )}

        {toast && <div className="sc-toast" role="status">{toast}</div>}
      </main>
    </div>
  );
}
