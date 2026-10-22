import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { asset } from "../data";
import { dealerInstagramPosts, type DealerInstagramPost } from "../data/seoul-autogallery-instagram-v01";
import { seoulAutoGallerySiteRows, type SeoulAutoGallerySiteRow } from "../data/seoul-autogallery-site-v01";
import "./video-listing-viewer.css";

type VideoListingViewerProps = {
  onClose: () => void;
  onNotify: (message: string) => void;
};

type VideoListing = {
  code: string;
  date: string;
  maker: string;
  model: string;
  video: string;
  poster: string;
  row: SeoulAutoGallerySiteRow;
};

const icon = (name: string) => asset(`icons/chotot/${name}.svg`);
const posts = dealerInstagramPosts["450560:한지훈"] ?? [];
const rows = seoulAutoGallerySiteRows.filter((row) => row.company === "(주)플로시모터스" && row.price !== null);

const normalizedMaker = (value: string) => value.replace("메르세데스-벤츠", "벤츠").replaceAll(/[^가-힣A-Za-z0-9]/g, "").toLocaleLowerCase("ko-KR");
const rowForPost = (post: DealerInstagramPost, index: number) => {
  const maker = normalizedMaker(post.maker ?? "");
  const candidates = rows.filter((row) => normalizedMaker(row.maker) === maker);
  const model = (post.model ?? "").replaceAll(/[^가-힣A-Za-z0-9]/g, "").toLocaleLowerCase("ko-KR");
  return candidates.find((row) => model.includes(row.model.replaceAll(/[^가-힣A-Za-z0-9]/g, "").toLocaleLowerCase("ko-KR")))
    ?? candidates[index % Math.max(candidates.length, 1)]
    ?? rows[index % rows.length];
};

const VIDEO_LISTINGS: readonly VideoListing[] = posts
  .filter((post): post is DealerInstagramPost & Required<Pick<DealerInstagramPost, "video" | "poster" | "maker" | "model">> => Boolean(post.video && post.poster && post.maker && post.model))
  .slice(0, 15)
  .map((post, index) => ({ ...post, maker: post.maker, model: post.model, video: post.video, poster: post.poster, row: rowForPost(post, index) }));

const priceLabel = (price: number | null) => price === null ? "가격 상담" : `${price.toLocaleString("ko-KR")}만원`;
const specLabel = (item: VideoListing) => `${item.row.year}년식 · ${item.row.mileage.toLocaleString("ko-KR")}km · ${item.row.fuel} · 자동`;
const dateLabel = (date: string) => {
  const days = Math.max(0, Math.floor((Date.now() - Date.parse(`${date}T00:00:00+09:00`)) / 86_400_000));
  if (days === 0) return "오늘";
  if (days === 1) return "1일 전";
  return `${days}일 전`;
};
const seconds = (value: number) => {
  if (!Number.isFinite(value)) return "0:00";
  const minute = Math.floor(value / 60);
  return `${minute}:${String(Math.floor(value % 60)).padStart(2, "0")}`;
};

function SvgChevron({ direction }: { direction: "up" | "down" }) {
  const path = direction === "up"
    ? "M11.3993 9.20119C11.7802 8.91389 12.3183 8.9342 12.6766 9.26271L17.6757 13.8467C18.0825 14.2198 18.11 14.8518 17.7372 15.2588C17.3639 15.6659 16.7312 15.6936 16.3241 15.3203L11.9999 11.3565L7.67565 15.3203C7.19021 15.6887 6.61241 15.6405 6.26257 15.2588C5.8897 14.8517 5.91729 14.2198 6.32409 13.8467L11.3251 9.26271L11.3993 9.20119Z"
    : "M6.26267 9.32433C6.61242 8.94273 7.1903 8.89456 7.59666 9.19737L12 13.2237L16.3242 9.2628C16.8096 8.89457 17.3875 8.94271 17.7373 9.32433C18.087 9.70608 18.0842 10.2858 17.747 10.6642L12.6767 15.3175C12.2945 15.6677 11.7074 15.6676 11.3252 15.3175L6.25291 10.6651C5.9153 10.2868 5.91286 9.70628 6.26267 9.32433Z";
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d={path} fill="currentColor" /></svg>;
}

function HorizontalChevron({ direction }: { direction: "left" | "right" }) {
  const path = direction === "left"
    ? "M8.22438 12.6309C7.90403 12.2382 7.92662 11.6592 8.29274 11.293L13.2927 6.29304L13.3689 6.22469C13.7617 5.90433 14.3407 5.92693 14.7068 6.29304C15.0729 6.65916 15.0955 7.23816 14.7752 7.63094L14.7068 7.70711L10.4138 12.0001L14.7068 16.293C15.0973 16.6836 15.0973 17.3166 14.7068 17.7071C14.3163 18.0976 13.6833 18.0976 13.2927 17.7071L8.29274 12.7071L8.22438 12.6309Z"
    : "M16 11.9999C16 12.2651 15.8946 12.5194 15.707 12.707L10.707 17.707L10.6309 17.7753C10.2381 18.0957 9.65908 18.0731 9.29297 17.707C8.92685 17.3408 8.90426 16.7618 9.22461 16.3691L9.29297 16.2929L13.5859 11.9999L9.29297 7.70696C8.90244 7.31643 8.90244 6.68342 9.29297 6.29289C9.68349 5.90237 10.3165 5.90237 10.707 6.29289L15.707 11.2929L15.7734 11.3661C15.9193 11.5441 16 11.7674 16 11.9999Z";
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d={path} fill="currentColor" /></svg>;
}

function VideoActionIcon({ kind }: { kind: "like" | "comment" | "favorite" | "share" }) {
  if (kind === "like") return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12.1201 2C12.9158 2 13.6786 2.3163 14.2412 2.87891C14.8038 3.44151 15.1201 4.20435 15.1201 5V9H18.8838L19.0752 9.00586C19.5201 9.03426 19.9539 9.162 20.3447 9.37988C20.7913 9.62885 21.1667 9.98794 21.4355 10.4229C21.7043 10.8576 21.8577 11.3537 21.8809 11.8643C21.901 12.3112 21.8209 12.7564 21.6475 13.167L21.5674 13.3408L18.0674 20.3408C17.8182 20.8395 17.4351 21.2587 16.9609 21.5518C16.5459 21.8082 16.0755 21.9597 15.5908 21.9932L15.3828 22H11.3662C11.1215 22 10.876 21.9704 10.6367 21.9102L8.12012 21.2803V7.69531L9.67969 5.35645L9.68066 5.35547L9.78223 5.19141C10.0035 4.80044 10.1201 4.35748 10.1201 3.90527C10.1201 2.85299 10.9731 2 12.0254 2H12.1201Z" fill="currentColor"/><path d="M6.12012 21H5.12012C4.32447 21 3.56163 20.6837 2.99902 20.1211C2.43641 19.5585 2.12012 18.7957 2.12012 18V12C2.12012 11.2044 2.43641 10.4415 2.99902 9.87891C3.56163 9.3163 4.32447 9 5.12012 9H6.12012V21Z" fill="currentColor"/></svg>;
  if (kind === "comment") return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11.9995 1.3999C17.8536 1.3999 22.5999 6.14547 22.6001 11.9995C22.6001 13.4157 22.3176 14.768 21.812 16.0054L22.5913 21.4575C22.6384 21.7871 22.5182 22.1183 22.271 22.3413C22.0238 22.5642 21.6818 22.6496 21.3589 22.5688L16.8296 21.436C15.3801 22.1793 13.7377 22.6001 11.9995 22.6001C6.14547 22.5999 1.3999 17.8536 1.3999 11.9995C1.40011 6.1456 6.1456 1.40011 11.9995 1.3999ZM8.40186 12.1987C7.84964 12.1987 7.40196 12.6465 7.40186 13.1987C7.40186 13.751 7.84957 14.1987 8.40186 14.1987H12.6021L12.7036 14.1938C13.2081 14.1429 13.6021 13.7167 13.6021 13.1987C13.602 12.6809 13.2081 12.2546 12.7036 12.2036L12.6021 12.1987H8.40186ZM8.40186 7.3999C7.84957 7.3999 7.40186 7.84762 7.40186 8.3999C7.40186 8.95219 7.84957 9.3999 8.40186 9.3999H15.6021L15.7036 9.39502C16.2081 9.34404 16.602 8.91784 16.6021 8.3999C16.6021 7.88196 16.2081 7.45576 15.7036 7.40479L15.6021 7.3999H8.40186Z" fill="currentColor"/></svg>;
  if (kind === "favorite") return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16.8071 3.00022C17.5772 2.99353 18.3414 3.14024 19.0542 3.43186C19.767 3.72349 20.4149 4.15486 20.9595 4.69944C21.5038 5.24389 21.9345 5.89118 22.2261 6.60373C22.5177 7.31653 22.6644 8.08069 22.6577 8.8508C22.651 9.62075 22.4909 10.3816 22.187 11.0891C21.8853 11.7914 21.447 12.4266 20.8989 12.9592L12.7056 21.1545C12.518 21.342 12.2637 21.4475 11.9985 21.4475C11.7334 21.4474 11.479 21.342 11.2915 21.1545L3.09814 12.9602C2.0109 11.8726 1.40001 10.3974 1.3999 8.85959C1.3999 7.32172 2.01091 5.84665 3.09814 4.75901C4.18576 3.67178 5.66088 3.05983 7.19873 3.05979C8.73656 3.05979 10.2117 3.67086 11.2993 4.75803L11.9985 5.45725L12.6987 4.75803C13.2312 4.21016 13.8668 3.77251 14.5688 3.47092C15.2763 3.16706 16.0372 3.00695 16.8071 3.00022Z" fill="currentColor"/></svg>;
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12.6237 20.4978C12.4563 20.4978 12.2972 20.4653 12.1382 20.4003C11.6945 20.2132 11.4098 19.7903 11.4098 19.3187V15.6511C6.32822 15.9032 5.38223 17.7329 4.29391 19.8473C4.05113 20.3271 3.4986 20.5873 2.9377 20.4734H2.92933C2.37679 20.3433 2.00007 19.8717 2.00007 19.3268C1.9917 13.8051 2.7284 8.82818 11.4098 8.4053V4.68077C11.4098 4.20911 11.6945 3.78623 12.1382 3.59919C12.5819 3.41215 13.0925 3.49347 13.4441 3.81063L21.6065 11.1296C21.8577 11.3491 22 11.6663 22 11.9916C22 12.3169 21.8577 12.634 21.6065 12.8617L13.4441 20.1807C13.2181 20.384 12.9251 20.4978 12.6237 20.4978Z" fill="currentColor"/></svg>;
}

function VideoListingViewer({ onClose, onNotify }: VideoListingViewerProps) {
  const [index, setIndex] = useState(0);
  const [muted, setMuted] = useState(false);
  const volume = 0.72;
  const [audioBlocked, setAudioBlocked] = useState(false);
  const [paused, setPaused] = useState(false);
  const [liked, setLiked] = useState<Set<string>>(() => new Set());
  const [saved, setSaved] = useState<Set<string>>(() => new Set());
  const [tab, setTab] = useState<"info" | "comments">("info");
  const [elapsed, setElapsed] = useState(0);
  const [duration, setDuration] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const item = VIDEO_LISTINGS[index];
  const thumbs = useMemo(() => Array.from({ length: 7 }, (_, offset) => ({ offset, item: VIDEO_LISTINGS[(index + offset) % VIDEO_LISTINGS.length] })), [index]);

  const choose = (next: number) => {
    setIndex((next + VIDEO_LISTINGS.length) % VIDEO_LISTINGS.length);
    setElapsed(0);
    setDuration(0);
    setPaused(false);
    setTab("info");
  };
  const move = (delta: number) => choose(index + delta);
  const toggleSet = (setter: typeof setLiked, code: string) => setter((current) => {
    const next = new Set(current);
    if (next.has(code)) next.delete(code); else next.add(code);
    return next;
  });
  const togglePlayback = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.muted = false;
      setMuted(false);
      void video.play().then(() => setAudioBlocked(false)).catch(() => setAudioBlocked(true));
    } else video.pause();
  };
  const toggleSound = () => {
    const video = videoRef.current;
    const nextMuted = !muted;
    setMuted(nextMuted);
    if (!video) return;
    video.muted = nextMuted;
    video.volume = volume;
    if (!nextMuted) void video.play().then(() => setAudioBlocked(false)).catch(() => setAudioBlocked(true));
  };

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, []);
  useEffect(() => {
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowUp") move(-1);
      if (event.key === "ArrowDown") move(1);
      if (event.key === " ") { event.preventDefault(); togglePlayback(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = muted;
    video.volume = volume;
    const promise = video.play();
    promise?.then(() => setAudioBlocked(false)).catch(() => { setAudioBlocked(!muted); setPaused(true); });
  }, [index, muted, volume]);

  if (!item) return null;
  const isLiked = liked.has(item.code);
  const isSaved = saved.has(item.code);

  return <main className="vlf" aria-label="영상 매물">
    <section className="vlf-shell">
      <div className="vlf-stage">
        <video
          key={item.code}
          ref={videoRef}
          src={asset(item.video)}
          poster={asset(item.poster)}
          autoPlay
          muted={muted}
          playsInline
          preload="metadata"
          onClick={togglePlayback}
          onPlay={() => { setPaused(false); setAudioBlocked(false); }}
          onPause={() => setPaused(true)}
          onLoadedMetadata={(event) => setDuration(event.currentTarget.duration)}
          onTimeUpdate={(event) => setElapsed(event.currentTarget.currentTime)}
          onEnded={() => move(1)}
        />
        <div className="vlf-stage-shade" />
        <button type="button" className="vlf-close" aria-label="영상 매물 닫기" onClick={onClose}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15.2929 7.29301C15.6834 6.90249 16.3164 6.90249 16.707 7.29301C17.0975 7.68354 17.0975 8.31655 16.707 8.70708L13.414 12L16.707 15.293L16.7753 15.3692C17.0957 15.762 17.0731 16.341 16.707 16.7071C16.3408 17.0732 15.7618 17.0958 15.3691 16.7754L15.2929 16.7071L11.9999 13.4141L8.70696 16.7071C8.31643 17.0976 7.68342 17.0976 7.29289 16.7071C6.90237 16.3166 6.90237 15.6835 7.29289 15.293L10.5859 12L7.29289 8.70708L7.22453 8.63091C6.90418 8.23813 6.92678 7.65913 7.29289 7.29301C7.65901 6.9269 8.23801 6.9043 8.63078 7.22466L8.70696 7.29301L11.9999 10.586L15.2929 7.29301Z" fill="currentColor" /></svg>
        </button>
        <nav className="vlf-discovery" aria-label="영상 추천 방식"><button type="button" className="is-active">영상매물</button><button type="button">추천매물</button></nav>
        <button type="button" className="vlf-more" aria-label="영상 설정 더보기" onClick={() => onNotify("영상 설정 메뉴입니다")}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13.7813 11.9924C13.7813 11.0081 12.9844 10.2112 12 10.2112C11.0156 10.2112 10.2188 11.0081 10.2188 11.9924C10.2188 12.9768 11.0156 13.7737 12 13.7737C12.9844 13.7737 13.7813 12.9768 13.7813 11.9924Z" fill="currentColor"/><path d="M13.7813 4.78149C13.7813 3.79712 12.9844 3.00024 12 3.00024C11.0156 3.00024 10.2188 3.79712 10.2188 4.78149C10.2188 5.76587 11.0156 6.56274 12 6.56274C12.9844 6.56274 13.7813 5.76587 13.7813 4.78149Z" fill="currentColor"/><path d="M13.7812 19.219C13.7812 18.2346 12.9844 17.4377 12 17.4377C11.0156 17.4377 10.2187 18.2346 10.2187 19.219C10.2187 20.2034 11.0156 21.0002 12 21.0002C12.9844 21.0002 13.7812 20.2034 13.7812 19.219Z" fill="currentColor"/></svg>
        </button>
        <div className="vlf-volume">
          <button type="button" className="vlf-sound" aria-label={muted ? "소리 켜기" : "음소거"} aria-pressed={!muted} onClick={toggleSound}>
            {muted ? <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11.3926 5.21814C11.6929 4.97875 12.1042 4.93235 12.4502 5.099C12.7963 5.26567 13.0156 5.61625 13.0156 6.00036V18.0004C13.0156 18.3845 12.7963 18.7351 12.4502 18.9017C12.1042 19.0683 11.6929 19.022 11.3926 18.7826L7.29004 15.5101L3 15.5121C2.73488 15.5121 2.48049 15.4065 2.29297 15.2191C2.10546 15.0317 2.0001 14.7772 2 14.5121V9.48864C2.0002 8.93653 2.44784 8.48864 3 8.48864H7.29199L11.3926 5.21814ZM20.3018 9.00818C20.6972 8.62279 21.3303 8.63137 21.7158 9.02673C22.1013 9.42219 22.0936 10.0553 21.6982 10.4408L20.1826 11.9174L21.6982 13.3949L21.7676 13.4691C22.0932 13.8577 22.0773 14.4381 21.7158 14.809C21.3303 15.2041 20.6971 15.2119 20.3018 14.8265L18.75 13.3138L17.1982 14.8265C16.8029 15.2119 16.1697 15.2041 15.7842 14.809C15.3988 14.4136 15.4066 13.7804 15.8018 13.3949L17.3164 11.9174L15.8018 10.4408C15.4064 10.0553 15.3987 9.42219 15.7842 9.02673C16.1697 8.63137 16.8028 8.62279 17.1982 9.00818L18.75 10.5199L20.3018 9.00818Z" fill="currentColor"/></svg> : <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11.393 5.218a1 1 0 0 1 1.623.782v12a1 1 0 0 1-1.623.782L7.29 15.51H3a1 1 0 0 1-1-1V9.489a1 1 0 0 1 1-1h4.292l4.101-3.27Zm4.9 2.575a1 1 0 0 1 1.414 0 5.95 5.95 0 0 1 0 8.414 1 1 0 0 1-1.414-1.414 3.95 3.95 0 0 0 0-5.586 1 1 0 0 1 0-1.414Zm2.828-2.121a1 1 0 0 1 1.415 0 8.95 8.95 0 0 1 0 12.656 1 1 0 0 1-1.415-1.414 6.95 6.95 0 0 0 0-9.828 1 1 0 0 1 0-1.414Z" fill="currentColor"/></svg>}
          </button>
        </div>
        {paused ? <button type="button" className={`vlf-play${audioBlocked ? " is-audio-blocked" : ""}`} aria-label={audioBlocked ? "소리 켜고 재생" : "영상 재생"} onClick={togglePlayback}><span />{audioBlocked ? <b>소리 켜고 재생</b> : null}</button> : null}
        <div className="vlf-progress">
          <input aria-label="재생 위치" type="range" min="0" max={Math.max(duration, 1)} step="0.1" value={Math.min(elapsed, Math.max(duration, 1))} onChange={(event) => { const value = Number(event.currentTarget.value); if (videoRef.current) videoRef.current.currentTime = value; setElapsed(value); }} style={{ "--vlf-progress": `${duration ? elapsed / duration * 100 : 0}%` } as CSSProperties} />
          <b>{seconds(elapsed)} / {seconds(duration)}</b>
        </div>
        <div className="vlf-filmstrip" aria-label={`${index + 1} / ${VIDEO_LISTINGS.length}`}>
          <button type="button" className="vlf-film-arrow" aria-label="이전 영상" disabled={index === 0} onClick={() => move(-1)}><HorizontalChevron direction="left" /></button>
          <div>{VIDEO_LISTINGS.map((video, dot) => <button key={video.code} type="button" className={dot === index ? "is-active" : undefined} aria-label={`${dot + 1}번 영상`} onClick={() => choose(dot)} />)}</div>
          <button type="button" className="vlf-film-arrow" aria-label="다음 영상" onClick={() => move(1)}><HorizontalChevron direction="right" /></button>
        </div>
        <article className="vlf-mobile-summary">
          <strong>{item.maker} {item.model}</strong><span>{specLabel(item)}</span><b>{priceLabel(item.row.price)}</b>
        </article>
      </div>

      <aside className="vlf-actions" aria-label="영상 매물 동작">
        <div className="vlf-actions-list">
          <div className="vlf-action-item"><button type="button" className={isLiked ? "is-active" : undefined} aria-label="좋아요" aria-pressed={isLiked} onClick={() => toggleSet(setLiked, item.code)}><VideoActionIcon kind="like" /></button><small>{isLiked ? 1 : 0}</small></div>
          <div className="vlf-action-item"><button type="button" aria-label="댓글" onClick={() => setTab("comments")}><VideoActionIcon kind="comment" /></button></div>
          <div className="vlf-action-item"><button type="button" className={isSaved ? "is-active" : undefined} aria-label="저장" aria-pressed={isSaved} onClick={() => toggleSet(setSaved, item.code)}><VideoActionIcon kind="favorite" /></button><small>저장</small></div>
          <div className="vlf-action-item"><button type="button" aria-label="공유" onClick={() => onNotify("영상 매물 링크를 복사했어요")}><VideoActionIcon kind="share" /></button><small>공유</small></div>
        </div>
        <div className="vlf-stepper"><button type="button" aria-label="이전 매물" disabled={index === 0} onClick={() => move(-1)}><SvgChevron direction="up" /></button><button type="button" aria-label="다음 매물" onClick={() => move(1)}><SvgChevron direction="down" /></button></div>
      </aside>

      <article className="vlf-detail">
        <header>
          <h1>{item.maker} {item.model}</h1>
          <p className="vlf-specs"><span>{item.row.year}년식</span><span>{item.row.mileage.toLocaleString("ko-KR")}km</span><span>{item.row.fuel}</span><span>자동</span></p>
          <strong>{priceLabel(item.row.price)}</strong>
          <span><img src={icon("chotot-list-detail-address-location")} alt="" />서울 서초구 · 서울오토갤러리</span>
          <span><img src={icon("chotot-common-clock")} alt="" />{dateLabel(item.date)}</span>
        </header>
        <div className="vlf-thumbs" aria-label="다른 영상 매물">
          {thumbs.map(({ offset, item: thumb }) => <button key={`${item.code}-${thumb.code}-${offset}`} type="button" className={offset === 0 ? "is-active" : undefined} aria-label={`${thumb.maker} ${thumb.model}`} onClick={() => choose(index + offset)}><img src={asset(thumb.poster)} alt="" /></button>)}
        </div>
        <section className="vlf-seller">
          <span className="vlf-avatar">한</span><span><strong>한지훈 <img src={icon("chotot-list-detail-verified-dealer-wavy-badge")} alt="인증" /></strong><small>보배드림 인증딜러 · 판매 중 15대</small></span><b>플로시모터스</b>
        </section>
        <nav className="vlf-tabs" role="tablist"><button type="button" role="tab" aria-selected={tab === "info"} className={tab === "info" ? "is-active" : undefined} onClick={() => setTab("info")}>정보</button><button type="button" role="tab" aria-selected={tab === "comments"} className={tab === "comments" ? "is-active" : undefined} onClick={() => setTab("comments")}>댓글 (0)</button></nav>
        <div className="vlf-detail-body">
          {tab === "info" ? <><h2>상세 설명</h2><p>{item.row.year}년 {item.row.month}월 등록 · {item.row.mileage.toLocaleString("ko-KR")}km 실주행 차량입니다.<br />{item.row.fuel} · {item.row.color} · {item.row.cc ? `${item.row.cc.toLocaleString("ko-KR")}cc` : "친환경차"}<br />공개 판매 영상으로 차량의 외관과 실내 상태를 확인해 보세요.</p><dl><div><dt>판매자</dt><dd>한지훈 인증딜러</dd></div><div><dt>매매단지</dt><dd>서울오토갤러리</dd></div></dl></> : <div className="vlf-empty-comment"><img src={icon("chotot-list-detail-listing-comment")} alt="" /><strong>첫 댓글을 남겨보세요</strong><p>차량에 궁금한 점은 채팅으로 바로 문의할 수 있어요.</p></div>}
        </div>
        <footer><button type="button" onClick={() => onNotify("한지훈 딜러와 채팅을 시작할 수 있어요")}>채팅</button><button type="button" onClick={() => onNotify("전화번호는 정식 서비스에서 확인할 수 있어요")}><img src={icon("chotot-list-detail-phone")} alt="" />전화번호 보기</button></footer>
      </article>
    </section>
  </main>;
}

export { VideoListingViewer, VIDEO_LISTINGS };
