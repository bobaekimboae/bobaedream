import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeftIcon,
  CameraIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  Cross2Icon,
  DownloadIcon,
  PlusIcon,
  TrashIcon,
  VideoIcon,
} from "@radix-ui/react-icons";
import { MobileDeviceProvider } from "../../../mobile/Device";
import { PhoneFrame } from "../../../mobile/PhoneFrame";
import {
  KeyboardInput,
  KeyboardProvider,
  KeyboardTextarea,
  useKeyboard,
} from "../../../mobile/Keyboard";
import { BottomSheet } from "../../../mobile/BottomSheet";
import { pickRecorderType } from "./camera";
import { saveToDevice } from "./save-mp4";
import {
  addRecommendations,
  clampSeconds,
  makeEditPlan,
  newProject,
  PART_LIBRARY,
  PART_LIMIT,
  PROFILES,
  restoreProject,
  type StudioPart,
  type StudioProject,
} from "./studio-model";
import { loadStudioDraft, saveStudioDraft } from "./studio-storage";
import { inspectStudioMedia, renderStudioMp4 } from "./studio-render";
import "./studio.css";

const message = (error: unknown) =>
  error instanceof Error
    ? error.message
    : "처리하지 못했어요. 다시 시도해 주세요.";
const seconds = (n: number) => `${Number(n.toFixed(1))}초`;
const fileName = (ext: string) => {
  const date = new Date();
  return `보배드림_숏폼_${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}_${String(date.getHours()).padStart(2, "0")}${String(date.getMinutes()).padStart(2, "0")}${String(date.getSeconds()).padStart(2, "0")}.${ext}`;
};

type StudioProps = {
  open: boolean;
  onClose: () => void;
  onUse: (result: { blob: Blob; cover: Blob; duration: number }) => void;
};
export default function ShortformStudio({ open, onClose, onUse }: StudioProps) {
  return (
    <div className="sf-host" hidden={!open}>
      <MobileDeviceProvider>
        <PhoneFrame>
          <KeyboardProvider>
            <Workbench open={open} onClose={onClose} onUse={onUse} />
          </KeyboardProvider>
        </PhoneFrame>
      </MobileDeviceProvider>
    </div>
  );
}

function Workbench({ open, onClose, onUse }: StudioProps) {
  const [project, setProject] = useState<StudioProject>(newProject);
  const [tab, setTab] = useState<"plan" | "edit">("plan");
  const [mode, setMode] = useState<"easy" | "pro">("easy");
  const [sheet, setSheet] = useState<
    "" | "library" | "part" | "exit" | "remove"
  >("");
  const [draft, setDraft] = useState<StudioPart | null>(null);
  const [captureId, setCaptureId] = useState("");
  const [notice, setNotice] = useState("");
  const [working, setWorking] = useState("");
  const [progress, setProgress] = useState(0);
  const [quality, setQuality] = useState<720 | 1080>(720);
  const [result, setResult] = useState<{
    blob: Blob;
    url: string;
    cover: Blob;
    duration: number;
    width: number;
  } | null>(null);
  const file = useRef<HTMLInputElement>(null);
  const filePart = useRef("");
  const urls = useRef(new Set<string>());
  const controller = useRef<AbortController | null>(null);
  const projectRef = useRef(project);
  projectRef.current = project;
  const noticeTimer = useRef(0);
  const keyboard = useKeyboard();
  const tell = (text: string) => {
    setNotice(text);
    clearTimeout(noticeTimer.current);
    noticeTimer.current = window.setTimeout(() => setNotice(""), 5000);
  };
  const urlOf = (blob: Blob) => {
    const url = URL.createObjectURL(blob);
    urls.current.add(url);
    return url;
  };
  const releaseMedia = (part?: StudioPart) => {
    if (part?.media) {
      URL.revokeObjectURL(part.media.url);
      urls.current.delete(part.media.url);
    }
  };
  useEffect(
    () => () => {
      controller.current?.abort();
      clearTimeout(noticeTimer.current);
      urls.current.forEach((url) => URL.revokeObjectURL(url));
    },
    [],
  );
  useEffect(() => {
    document.documentElement.dataset.shootStudio = open ? "true" : "false";
    if (open) document.title = "보배드림 · 차량 숏폼 스튜디오";
    const leaving = (event: BeforeUnloadEvent) => {
      if (projectRef.current.parts.some((p) => p.media)) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", leaving);
    return () => {
      window.removeEventListener("beforeunload", leaving);
      delete document.documentElement.dataset.shootStudio;
    };
  }, [open]);
  const update = (id: string, patch: Partial<StudioPart>) =>
    setProject((p) => ({
      ...p,
      parts: p.parts.map((part) =>
        part.id === id ? { ...part, ...patch } : part,
      ),
    }));
  // Editing after a render must never offer a stale export as if it contained the new changes.
  useEffect(() => {
    setResult((old) => {
      if (old) {
        URL.revokeObjectURL(old.url);
        urls.current.delete(old.url);
      }
      return null;
    });
  }, [project, quality]);
  const enabled = project.parts.filter((p) => p.enabled);
  const completed = enabled.filter((p) => p.media).length;
  const plan = useMemo(
    () => makeEditPlan(project.parts, project.target),
    [project],
  );
  const duration = plan.reduce((n, p) => n + p.seconds, 0);
  const planned = enabled.reduce((n, p) => n + p.seconds, 0);
  const capturePart = project.parts.find((p) => p.id === captureId);
  const captionText = [
    project.vehicle || "차량 소개",
    ...plan.map((p) => p.part.caption || p.part.label),
    "#보배드림 #중고차",
  ].join("\n");

  function openSheet(next: typeof sheet) {
    keyboard.hide();
    setSheet(next);
  }
  function editPart(part?: StudioPart) {
    setDraft(
      part
        ? { ...part }
        : {
            id: `custom-${crypto.randomUUID()}`,
            label: "",
            guide: "",
            caption: "",
            seconds: 4,
            start: 0,
            enabled: true,
            keepAudio: true,
            custom: true,
          },
    );
    openSheet("part");
  }
  async function attach(id: string, blob: Blob) {
    if (blob.size > 300 * 1024 * 1024) {
      tell("한 클립은 300MB 이하로 선택해 주세요.");
      return;
    }
    setWorking("영상을 확인하고 있어요");
    try {
      const info = await inspectStudioMedia(blob);
      releaseMedia(projectRef.current.parts.find((p) => p.id === id));
      update(id, { media: { blob, url: urlOf(blob), ...info }, start: 0 });
      tell("영상이 추가됐어요. 사용할 구간과 시간을 조정할 수 있어요.");
    } catch (error) {
      tell(message(error));
    } finally {
      setWorking("");
    }
  }
  function chooseFile(id: string) {
    filePart.current = id;
    file.current?.click();
  }
  function move(id: string, direction: number) {
    setProject((p) => {
      const parts = [...p.parts];
      const from = parts.findIndex((x) => x.id === id);
      const to = from + direction;
      if (from < 0 || to < 0 || to >= parts.length) return p;
      [parts[from], parts[to]] = [parts[to], parts[from]];
      return { ...p, parts };
    });
  }
  async function save(exit = false) {
    setWorking("기기에 초안을 저장하고 있어요");
    try {
      await saveStudioDraft(project);
      tell("촬영 원본과 설정을 이 브라우저에 저장했어요.");
      if (exit) {
        setSheet("");
        onClose();
      }
    } catch {
      tell(
        "저장 공간이 부족하거나 브라우저 저장이 막혀 있어요. 영상부터 내보내 주세요.",
      );
    } finally {
      setWorking("");
    }
  }
  async function restore() {
    setWorking("저장한 초안을 불러오고 있어요");
    try {
      const raw = await loadStudioDraft();
      if (!raw) {
        tell("이 브라우저에 저장한 초안이 없어요.");
        return;
      }
      const restored = restoreProject(raw);
      restored.parts.forEach((p) => {
        if (p.media) urls.current.add(p.media.url);
      });
      setProject(restored);
      setSheet("");
      tell("저장한 촬영 원본과 설정을 불러왔어요.");
    } catch {
      tell("초안을 읽지 못했어요. 브라우저 저장 권한을 확인해 주세요.");
    } finally {
      setWorking("");
    }
  }
  async function render() {
    keyboard.hide();
    setWorking("세로 MP4를 만들고 있어요");
    setProgress(0);
    const aborter = new AbortController();
    controller.current = aborter;
    try {
      const output = await renderStudioMp4(
        plan,
        project.vehicle,
        quality,
        aborter.signal,
        setProgress,
      );
      setResult({
        ...output,
        url: urlOf(output.blob),
        duration,
        width: quality,
      });
      tell("MP4가 완성됐어요. 재생해 확인한 뒤 저장해 주세요.");
    } catch (error) {
      tell(
        aborter.signal.aborted
          ? "편집을 취소했어요. 원본은 그대로예요."
          : message(error),
      );
    } finally {
      setWorking("");
      controller.current = null;
    }
  }
  async function download() {
    if (!result) return;
    try {
      const status = await saveToDevice(result.blob, fileName("mp4"));
      tell(
        status === "cancelled"
          ? "공유를 취소했어요. 완성본은 그대로예요."
          : status === "shared"
            ? "기기 공유창으로 전달했어요."
            : "MP4 다운로드를 시작했어요.",
      );
    } catch (error) {
      tell(message(error));
    }
  }
  function saveCover() {
    if (!result) return;
    const url = urlOf(result.cover);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName("jpg");
    link.click();
  }

  return (
    <section className="sf-app" aria-label="보배드림 숏폼 스튜디오">
      <header className="sf-top">
        <button
          aria-label="등록 화면으로 돌아가기"
          onClick={() => openSheet("exit")}
        >
          <ArrowLeftIcon />
        </button>
        <div>
          <b>
            보배드림 <span>숏폼</span>
          </b>
          <small>촬영부터 세로 영상 완성까지</small>
        </div>
        <button
          className="sf-save"
          disabled={!!working}
          onClick={() => void save()}
        >
          초안 저장
        </button>
      </header>
      <nav className="sf-tabs" aria-label="제작 단계">
        <button
          aria-current={tab === "plan" ? "step" : undefined}
          className={tab === "plan" ? "is-on" : ""}
          onClick={() => setTab("plan")}
        >
          1 촬영 구성{" "}
          <small>
            {completed}/{enabled.length}
          </small>
        </button>
        <button
          aria-current={tab === "edit" ? "step" : undefined}
          className={tab === "edit" ? "is-on" : ""}
          onClick={() => setTab("edit")}
        >
          2 숏폼 만들기
        </button>
      </nav>
      <div className="sf-body" aria-busy={!!working}>
        {tab === "plan" ? (
          <>
            <div className="sf-intro sf-intro--compact">
              <h1>촬영 부위를 구성하세요</h1>
              <p>시트·옵션을 따로 찍고, 한 편으로 완성해요.</p>
            </div>
            <div className="sf-mode" aria-label="편집 모드">
              <button
                aria-pressed={mode === "easy"}
                disabled={!!working}
                onClick={() => setMode("easy")}
              >
                딜러 간편
              </button>
              <button
                aria-pressed={mode === "pro"}
                disabled={!!working}
                onClick={() => setMode("pro")}
              >
                촬영팀 전문
              </button>
            </div>
            {mode === "pro" ? (
              <p className="sf-note">
                위·아래 버튼으로 순서를 바꾸고, 시간 설정에서 자막과 원본 구간을
                조정하세요.
              </p>
            ) : null}
            <label className="sf-field">
              차량 이름
              <KeyboardInput
                placeholder="예: 현대 그랜저 하이브리드"
                maxLength={60}
                value={project.vehicle}
                disabled={!!working}
                onChange={(e) =>
                  setProject((p) => ({ ...p, vehicle: e.target.value }))
                }
              />
            </label>
            <div className="sf-profile">
              <label>
                촬영 추천 기준
                <select
                  value={project.profile}
                  disabled={!!working}
                  onChange={(e) =>
                    setProject((p) => ({
                      ...p,
                      profile: e.target.value as StudioProject["profile"],
                    }))
                  }
                >
                  {PROFILES.map((p) => (
                    <option key={p.key} value={p.key}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </label>
              <button
                disabled={!!working || project.parts.length >= PART_LIMIT}
                onClick={() => {
                  setProject((p) => ({
                    ...p,
                    parts: addRecommendations(p.parts, p.profile),
                  }));
                  tell(
                    "차종별 추천 부위를 추가했어요. 실제 장착된 옵션만 촬영해 주세요.",
                  );
                }}
              >
                추천 부위 추가
              </button>
            </div>
            <p className="sf-note">
              차종에 따른 촬영 제안이에요. 옵션 장착 여부를 자동 판정하지
              않아요.
            </p>
            <div className="sf-section-title">
              <h2>
                촬영 부위 <span>{project.parts.length}</span>
              </h2>
              <span>구성 {planned}초 · 순서 변경 가능</span>
            </div>
            <div className="sf-parts">
              {project.parts.map((part, index) => (
                <article
                  key={part.id}
                  className={`sf-part ${part.enabled ? "" : "is-off"}`}
                  aria-label={`${part.label} 촬영 카드`}
                >
                  <div className="sf-part-head">
                    <button
                      className="sf-check"
                      aria-label={`${part.label} 영상에 포함`}
                      aria-pressed={part.enabled}
                      disabled={!!working}
                      onClick={() =>
                        update(part.id, { enabled: !part.enabled })
                      }
                    >
                      {part.enabled ? <CheckIcon /> : null}
                    </button>
                    <b>{String(index + 1).padStart(2, "0")}</b>
                    <h3>{part.label}</h3>
                    <button
                      className="sf-time"
                      aria-label={`${part.label} 시간 및 구간 설정`}
                      disabled={!!working}
                      onClick={() => editPart(part)}
                    >
                      {part.seconds}초 설정
                    </button>
                  </div>
                  {part.media ? (
                    <div className="sf-clip">
                      <video
                        src={part.media.url}
                        controls
                        playsInline
                        preload="metadata"
                        aria-label={`${part.label} 원본 미리보기`}
                      />
                      <div>
                        <b>원본 {seconds(part.media.duration)}</b>
                        <span>
                          {seconds(part.start)}부터 최대 {part.seconds}초 사용
                        </span>
                        <small>
                          {part.media.hasAudio
                            ? part.keepAudio
                              ? "현장음 유지"
                              : "현장음 끔"
                            : "원본에 음성 없음"}
                        </small>
                      </div>
                    </div>
                  ) : (
                    <p className="sf-guide">{part.guide}</p>
                  )}
                  {mode === "pro" && part.caption ? (
                    <p className="sf-caption">자막: {part.caption}</p>
                  ) : null}
                  <div className="sf-part-actions">
                    <button
                      disabled={!!working}
                      onClick={() => {
                        keyboard.hide();
                        setCaptureId(part.id);
                      }}
                    >
                      <CameraIcon />
                      {part.media ? "다시 촬영" : "촬영"}
                    </button>
                    <button
                      disabled={!!working}
                      onClick={() => chooseFile(part.id)}
                    >
                      <VideoIcon />
                      {part.media ? "영상 교체" : "앨범"}
                    </button>
                    {mode === "pro" ? (
                      <div className="sf-order">
                        <button
                          aria-label={`${part.label} 위로 이동`}
                          disabled={!!working || index === 0}
                          onClick={() => move(part.id, -1)}
                        >
                          <ChevronUpIcon />
                        </button>
                        <button
                          aria-label={`${part.label} 아래로 이동`}
                          disabled={
                            !!working || index === project.parts.length - 1
                          }
                          onClick={() => move(part.id, 1)}
                        >
                          <ChevronDownIcon />
                        </button>
                        <button
                          aria-label={`${part.label} 부위 삭제`}
                          disabled={!!working}
                          onClick={() => {
                            setDraft(part);
                            openSheet("remove");
                          }}
                        >
                          <TrashIcon />
                        </button>
                      </div>
                    ) : (
                      <span className="sf-part-state">
                        {part.media ? "촬영 완료" : "촬영 대기"}
                      </span>
                    )}
                  </div>
                </article>
              ))}
            </div>
            <div className="sf-add-row">
              <button
                disabled={!!working || project.parts.length >= PART_LIMIT}
                onClick={() => openSheet("library")}
              >
                <PlusIcon />
                추천 부위 고르기
              </button>
              <button
                disabled={!!working || project.parts.length >= PART_LIMIT}
                onClick={() => editPart()}
              >
                <PlusIcon />
                직접 부위 만들기
              </button>
            </div>
            {mode === "easy" ? (
              <button
                className="sf-text-button"
                disabled={!!working}
                onClick={() => setMode("pro")}
              >
                촬영 순서 변경·부위 삭제
              </button>
            ) : null}
            <p className="sf-note">
              최대 {PART_LIMIT}개 · 초안 저장 시 원본도 이 브라우저에 보관돼요.
              서버에는 업로드하지 않아요.
            </p>
            <button
              className="sf-text-button"
              disabled={!!working}
              onClick={() => openSheet("exit")}
            >
              저장한 초안 불러오기
            </button>
          </>
        ) : (
          <>
            <div className="sf-intro">
              <span className="sf-eyebrow">AUTO EDIT · 실제 촬영본으로</span>
              <h1>
                촬영은 따로,
                <br />
                완성은 한 편으로.
              </h1>
              <p>
                선택한 순서와 사용 시간에 맞춰
                <br />
                자막이 들어간 세로 MP4를 만들어요.
              </p>
            </div>
            <h2 className="sf-h2">완성 길이</h2>
            <div className="sf-length">
              {[15, 30, 45, 60].map((n) => (
                <button
                  key={n}
                  disabled={!!working}
                  aria-pressed={project.target === n}
                  onClick={() => setProject((p) => ({ ...p, target: n }))}
                >
                  {n}초
                </button>
              ))}
            </div>
            <p className="sf-note">
              넘치면 장면별 시간을 비례해 줄여요. 부족하면 반복하지 않고 실제
              길이로 완성해요.
            </p>
            <div className="sf-summary">
              <div>
                <small>사용 가능한 장면</small>
                <b>
                  {plan.length}
                  <em>개</em>
                </b>
              </div>
              <div>
                <small>실제 완성 길이</small>
                <b>{seconds(duration)}</b>
              </div>
              <div>
                <small>화면 비율</small>
                <b>9:16</b>
              </div>
            </div>
            {completed < enabled.length ? (
              <p className="sf-warning">
                미촬영 {enabled.length - completed}개는 이번 영상에서 빠져요.
                촬영한 장면만 사용합니다.
              </p>
            ) : null}
            <ol className="sf-timeline">
              {plan.map((p) => (
                <li key={p.part.id}>
                  <span>{p.part.label}</span>
                  <b>{seconds(p.seconds)}</b>
                </li>
              ))}
            </ol>
            {!plan.length ? (
              <div className="sf-empty">
                <VideoIcon />
                <b>아직 촬영한 장면이 없어요</b>
                <p>부위별 촬영 또는 앨범 추가 후 만들 수 있어요.</p>
                <button onClick={() => setTab("plan")}>
                  촬영 구성으로 돌아가기
                </button>
              </div>
            ) : null}
            <label className="sf-field">
              출력 화질
              <select
                value={quality}
                disabled={!!working}
                onChange={(e) =>
                  setQuality(Number(e.target.value) as 720 | 1080)
                }
              >
                <option value={720}>빠른 출력 · 720 × 1280 / 30fps</option>
                <option value={1080}>고화질 · 1080 × 1920 / 30fps</option>
              </select>
            </label>
            <p className="sf-note">
              가로 영상은 전체를 보존해 여백이 생길 수 있어요. 옵션 자막은 직접
              확인한 내용만 입력하세요.
            </p>
            {result ? (
              <section className="sf-result" aria-label="완성된 숏폼">
                <h2>완성됐어요</h2>
                <video
                  src={result.url}
                  controls
                  playsInline
                  preload="metadata"
                  aria-label="완성 MP4 미리보기"
                />
                <p>
                  {seconds(result.duration)} · {result.width} ×{" "}
                  {(result.width * 16) / 9} · MP4
                </p>
                <div className="sf-add-row">
                  <button onClick={() => void download()}>
                    <DownloadIcon />
                    영상 저장·공유
                  </button>
                  <button onClick={saveCover}>표지 저장</button>
                </div>
                <button
                  className="sf-text-button"
                  onClick={() => onUse(result)}
                >
                  이 영상을 등록 화면에 추가
                </button>
                <button
                  className="sf-text-button"
                  onClick={() =>
                    void navigator.clipboard
                      .writeText(captionText)
                      .then(() => tell("게시글 문구를 복사했어요."))
                      .catch(() =>
                        tell(
                          "복사가 차단됐어요. 아래 문구를 직접 선택해 주세요.",
                        ),
                      )
                  }
                >
                  게시글 문구 복사
                </button>
                <pre className="sf-post-copy">{captionText}</pre>
              </section>
            ) : null}
            <p className="sf-note">
              자동 편집은 규칙 기반입니다. AI 옵션 인식·배경음악·SNS 자동 게시
              기능은 포함되지 않아요.
            </p>
          </>
        )}
      </div>
      <footer className="sf-footer">
        <span>
          {tab === "plan"
            ? `${completed}/${enabled.length}개 촬영 완료`
            : `완성 예상 ${seconds(duration)}`}
        </span>
        <button
          className="sf-primary"
          disabled={!!working || (tab === "edit" && !plan.length)}
          onClick={() => (tab === "plan" ? setTab("edit") : void render())}
        >
          {tab === "plan"
            ? "숏폼 만들기"
            : result
              ? "다시 만들기"
              : "세로 MP4 생성"}
        </button>
      </footer>
      <input
        ref={file}
        hidden
        type="file"
        accept="video/*"
        aria-label="부위 영상 파일 선택"
        onChange={(e) => {
          const picked = e.target.files?.[0];
          if (picked) void attach(filePart.current, picked);
          e.target.value = "";
        }}
      />
      <BottomSheet
        open={!!sheet && open}
        onOpenChange={(next) => {
          if (!next && !working) setSheet("");
        }}
        snap={0.92}
        title={
          sheet === "library"
            ? "촬영 부위 추천"
            : sheet === "part"
              ? draft?.custom
                ? "직접 촬영 부위 만들기·편집"
                : "촬영 부위 설정"
              : sheet === "remove"
                ? "촬영 부위 삭제"
                : "초안 보관·불러오기"
        }
        description="설정과 영상은 이 기기에서만 처리합니다."
      >
        {sheet === "library" ? (
          <>
            <p className="sf-note">
              실제 차량에 있는 기능만 추가하세요. 추가 후 순서와 시간을 바꿀 수
              있어요.
            </p>
            <div className="sf-library">
              {PART_LIBRARY.map((p) => (
                <button
                  key={p.id}
                  disabled={
                    project.parts.some((x) => x.id === p.id) ||
                    project.parts.length >= PART_LIMIT
                  }
                  onClick={() => {
                    setProject((old) => ({
                      ...old,
                      parts: [...old.parts, { ...p }],
                    }));
                    tell(`${p.label}을 추가했어요.`);
                  }}
                >
                  <span>
                    <b>{p.label}</b>
                    <small>{p.guide}</small>
                  </span>
                  <em>
                    {project.parts.some((x) => x.id === p.id)
                      ? "추가됨"
                      : `${p.seconds}초 +`}
                  </em>
                </button>
              ))}
            </div>
          </>
        ) : null}
        {sheet === "part" && draft ? (
          <div className="sf-part-form">
            <label className="sf-field">
              촬영 부위 이름
              <KeyboardInput
                value={draft.label}
                maxLength={32}
                placeholder="예: 뒷좌석 마사지 시트"
                onChange={(e) => setDraft({ ...draft, label: e.target.value })}
              />
            </label>
            <label className="sf-field">
              촬영 안내
              <KeyboardTextarea
                value={draft.guide}
                maxLength={180}
                placeholder="어디서 무엇을 보여줄지 적어주세요"
                onChange={(e) => setDraft({ ...draft, guide: e.target.value })}
              />
            </label>
            <label className="sf-field">
              영상 자막 · 선택
              <KeyboardInput
                value={draft.caption}
                maxLength={60}
                placeholder="확인한 옵션 또는 부위 이름"
                onChange={(e) =>
                  setDraft({ ...draft, caption: e.target.value })
                }
              />
            </label>
            <label className="sf-field">
              완성 영상에 사용할 시간 · 1~60초
              <KeyboardInput
                type="number"
                min={1}
                max={60}
                inputMode="numeric"
                value={draft.seconds}
                onChange={(e) =>
                  setDraft({ ...draft, seconds: Number(e.target.value) })
                }
              />
            </label>
            {draft.media ? (
              <>
                <label className="sf-field">
                  원본 시작 시간 · 초
                  <KeyboardInput
                    type="number"
                    min={0}
                    max={Math.max(0, draft.media.duration - 0.1)}
                    step={0.1}
                    inputMode="decimal"
                    value={draft.start}
                    onChange={(e) =>
                      setDraft({ ...draft, start: Number(e.target.value) })
                    }
                  />
                </label>
                <p className="sf-note">
                  원본 {seconds(draft.media.duration)}. 남은 길이보다 길게
                  설정해도 원본 끝까지만 사용해요.
                </p>
              </>
            ) : null}
            <label className="sf-checkbox">
              <input
                type="checkbox"
                checked={draft.keepAudio}
                onChange={(e) =>
                  setDraft({ ...draft, keepAudio: e.target.checked })
                }
              />
              현장음 유지
            </label>
            <p className="sf-note">
              설정 시간은 편집 길이예요. 촬영은 최대 60초까지 이어갈 수 있어요.
            </p>
            <div className="sf-form-buttons">
              <button
                onClick={() => {
                  keyboard.hide();
                  setSheet("");
                }}
              >
                취소
              </button>
              <button
                className="sf-primary"
                disabled={!draft.label.trim()}
                onClick={() => {
                  const normalized = {
                    ...draft,
                    label: draft.label.trim(),
                    seconds: clampSeconds(draft.seconds),
                    start: Math.max(
                      0,
                      Math.min(
                        Number(draft.start) || 0,
                        draft.media ? draft.media.duration - 0.1 : 0,
                      ),
                    ),
                  };
                  setProject((p) => ({
                    ...p,
                    parts: p.parts.some((x) => x.id === draft.id)
                      ? p.parts.map((x) => (x.id === draft.id ? normalized : x))
                      : [...p.parts, normalized].slice(0, PART_LIMIT),
                  }));
                  keyboard.hide();
                  setSheet("");
                }}
              >
                설정 적용
              </button>
            </div>
          </div>
        ) : null}
        {sheet === "remove" && draft ? (
          <div className="sf-exit">
            <p>
              {draft.label} 부위를 삭제할까요? 이 편집에서 원본 클립도 빠집니다.
              이전에 저장한 초안은 바뀌지 않아요.
            </p>
            <button onClick={() => setSheet("")}>취소</button>
            <button
              className="sf-primary"
              onClick={() => {
                releaseMedia(draft);
                setProject((p) => ({
                  ...p,
                  parts: p.parts.filter((x) => x.id !== draft.id),
                }));
                setSheet("");
              }}
            >
              이 부위 삭제
            </button>
          </div>
        ) : null}
        {sheet === "exit" ? (
          <div className="sf-exit">
            <p>
              초안에는 부위·시간 설정과 촬영 원본이 함께 저장돼요. 브라우저
              데이터를 지우면 사라질 수 있어요.
            </p>
            <button
              className="sf-primary"
              disabled={!!working}
              onClick={() => void save()}
            >
              현재 초안 저장
            </button>
            <button disabled={!!working} onClick={() => void restore()}>
              저장한 초안으로 교체
            </button>
            <p className="sf-note">
              불러오기는 현재 편집을 저장한 초안으로 바꿔요.
            </p>
            <button disabled={!!working} onClick={() => void save(true)}>
              저장 후 등록 화면으로
            </button>
            <button
              disabled={!!working}
              onClick={() => {
                setSheet("");
                onClose();
              }}
            >
              등록 화면으로 · 현재 편집은 유지
            </button>
            <button disabled={!!working} onClick={() => setSheet("")}>
              계속 편집
            </button>
          </div>
        ) : null}
        {sheet === "library" ? (
          <button
            className="sf-primary sf-sheet-done"
            onClick={() => setSheet("")}
          >
            선택 완료
          </button>
        ) : null}
      </BottomSheet>
      {capturePart && open ? (
        <Capture
          part={capturePart}
          onClose={() => setCaptureId("")}
          onAlbum={() => {
            setCaptureId("");
            chooseFile(capturePart.id);
          }}
          onDone={(blob) => {
            const id = capturePart.id;
            setCaptureId("");
            void attach(id, blob);
          }}
        />
      ) : null}
      {working ? (
        <div className="sf-busy" role="status">
          <div>
            <b>{working}</b>
            {controller.current ? (
              <>
                <progress max={1} value={progress} />
                <span>{Math.round(progress * 100)}% · 앱을 열어 두세요</span>
                <button onClick={() => controller.current?.abort()}>
                  생성 취소
                </button>
              </>
            ) : (
              <p>잠시만 기다려 주세요.</p>
            )}
          </div>
        </div>
      ) : null}
      {notice ? (
        <div className="sf-toast" role="status">
          {notice}
        </div>
      ) : null}
    </section>
  );
}

function Capture({
  part,
  onClose,
  onAlbum,
  onDone,
}: {
  part: StudioPart;
  onClose: () => void;
  onAlbum: () => void;
  onDone: (blob: Blob) => void;
}) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [mic, setMic] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const video = useRef<HTMLVideoElement>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const discard = useRef(false);
  const streamRef = useRef<MediaStream | null>(null);
  const timer = useRef(0);
  useEffect(() => {
    let cancelled = false;
    let owned: MediaStream | null = null;
    let hasTimedOut = false;
    setError("");
    setReady(false);
    const timeout = window.setTimeout(() => {
      hasTimedOut = true;
      setError(
        "카메라가 응답하지 않아요. 권한을 확인하거나 앨범 영상을 선택해 주세요.",
      );
    }, 12000);
    const constraints = {
      video: {
        facingMode: { ideal: "environment" },
        width: { ideal: 1080 },
        height: { ideal: 1920 },
        aspectRatio: { ideal: 9 / 16 },
      },
      audio: part.keepAudio,
    };
    if (!navigator.mediaDevices?.getUserMedia) {
      clearTimeout(timeout);
      setError(
        "이 브라우저에서 카메라를 사용할 수 없어요. 앨범 영상을 선택해 주세요.",
      );
      return;
    }
    navigator.mediaDevices
      .getUserMedia(constraints)
      .catch((error) => {
        if (!part.keepAudio) throw error;
        return navigator.mediaDevices.getUserMedia({
          ...constraints,
          audio: false,
        });
      })
      .then((s) => {
        if (cancelled || hasTimedOut) {
          s.getTracks().forEach((t) => t.stop());
          return;
        }
        clearTimeout(timeout);
        owned = s;
        streamRef.current = s;
        setStream(s);
        setMic(s.getAudioTracks().length > 0);
      })
      .catch(() => {
        clearTimeout(timeout);
        if (!cancelled)
          setError(
            "카메라 권한이 없거나 카메라를 열 수 없어요. 브라우저 권한을 확인하거나 앨범을 이용해 주세요.",
          );
      });
    return () => {
      cancelled = true;
      discard.current = true;
      clearTimeout(timeout);
      clearInterval(timer.current);
      if (recorder.current?.state === "recording") recorder.current.stop();
      owned?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [attempt]);
  useEffect(() => {
    const v = video.current;
    if (v) {
      v.srcObject = stream;
      if (stream)
        void v
          .play()
          .catch(() =>
            setError(
              "카메라 미리보기를 재생하지 못했어요. 앨범을 이용해 주세요.",
            ),
          );
    }
  }, [stream]);
  function stop() {
    if (recorder.current?.state === "recording") {
      clearInterval(timer.current);
      recorder.current.stop();
      setRecording(false);
    }
  }
  function start() {
    if (!stream || !ready || error) return;
    try {
      discard.current = false;
      const chunks: Blob[] = [];
      const mimeType = pickRecorderType();
      const r = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      recorder.current = r;
      r.ondataavailable = (e) => {
        if (e.data.size) chunks.push(e.data);
      };
      r.onerror = () => {
        discard.current = true;
        clearInterval(timer.current);
        setRecording(false);
        setError(
          "녹화하지 못했어요. 다시 시도하거나 앨범 영상을 사용해 주세요.",
        );
      };
      r.onstop = () => {
        if (!discard.current && chunks.length)
          onDone(new Blob(chunks, { type: r.mimeType || "video/webm" }));
      };
      r.start(250);
      setRecording(true);
      setElapsed(0);
      const startTime = performance.now();
      timer.current = window.setInterval(() => {
        const t = (performance.now() - startTime) / 1000;
        setElapsed(t);
        if (t >= 60) stop();
      }, 100);
    } catch {
      setError(
        "이 기기는 브라우저 녹화를 지원하지 않아요. 앨범 영상을 사용해 주세요.",
      );
    }
  }
  return (
    <section className="sf-camera" aria-label={`${part.label} 촬영`}>
      <header>
        <button aria-label="촬영 닫기" onClick={onClose}>
          <Cross2Icon />
        </button>
        <b>{part.label}</b>
        <span>{seconds(elapsed)}</span>
      </header>
      <div className="sf-viewfinder">
        <video
          ref={video}
          muted
          playsInline
          autoPlay
          onLoadedData={() => setReady(true)}
        />
        {!ready || error ? (
          <div className="sf-camera-error">
            <CameraIcon />
            <p>{error || "카메라 권한을 확인하고 있어요"}</p>
            {error ? (
              <button onClick={() => setAttempt((n) => n + 1)}>
                카메라 다시 열기
              </button>
            ) : null}
            <button onClick={onAlbum}>앨범에서 영상 선택</button>
          </div>
        ) : (
          <span className="sf-camera-guide">
            세로 9:16 · 중앙에 부위를 담아주세요
          </span>
        )}
      </div>
      <div className="sf-camera-bottom">
        <p>{part.guide}</p>
        <small>
          편집 사용 {part.seconds}초 · 촬영 최대 60초 ·{" "}
          {mic ? "마이크 켜짐" : "음성 없이 촬영"}
        </small>
        {!mic && ready && part.keepAudio ? (
          <p className="sf-warning">
            마이크를 사용할 수 없어 소리가 녹음되지 않아요.
          </p>
        ) : null}
        <button
          className={`sf-record ${recording ? "is-recording" : ""}`}
          aria-label={recording ? "녹화 종료·이 부위 사용" : "녹화 시작"}
          disabled={!ready || !!error || typeof MediaRecorder === "undefined"}
          onClick={recording ? stop : start}
        >
          {recording ? "녹화 종료" : "녹화 시작"}
        </button>
        <button disabled={recording} onClick={onAlbum}>
          앨범에서 선택
        </button>
      </div>
    </section>
  );
}
