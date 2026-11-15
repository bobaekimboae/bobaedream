import { useMemo, useState } from "react";
import { ChevronDownIcon, InfoCircledIcon, ReloadIcon } from "@radix-ui/react-icons";
import "./sns-crosspost.css";

// 매물 등록 → SNS 동시 업로드(시안 목업). 실제 계정 연결·발행은 하지 않는다.
// 벤치마킹: 오토포스트허브·아임리얼(국내 블로그·카페 자동 발행), AutoLister Pro·CARVID(해외 SNS 자동 게시),
// Push Property·Lofty(등록·가격 인하·판매완료 트리거 자동 게시).

export type SnsChannelId = "naverBlog" | "naverCafe" | "instagram" | "reels" | "kakao" | "facebook";

type Channel = {
  id: SnsChannelId;
  name: string;
  short: string;
  desc: string;
  tone: string;
  connected: boolean;
  video?: boolean;
};

const CHANNELS: Channel[] = [
  { id: "naverBlog", name: "네이버 블로그", short: "블로그", desc: "검색 노출용 매물 소개 글", tone: "green", connected: true },
  { id: "naverCafe", name: "네이버 카페", short: "카페", desc: "지역·차종 카페 게시판 선택", tone: "green", connected: false },
  { id: "instagram", name: "인스타그램 피드", short: "피드", desc: "대표 사진 포함 최대 10장 캐러셀", tone: "pink", connected: true },
  { id: "reels", name: "릴스 · 쇼츠", short: "숏폼", desc: "사진으로 15초 영상 자동 생성", tone: "red", connected: true, video: true },
  { id: "kakao", name: "카카오톡 채널", short: "채널", desc: "채널 친구에게 새 매물 소식", tone: "yellow", connected: false },
  { id: "facebook", name: "페이스북 페이지", short: "페이지", desc: "비즈니스 페이지 게시물", tone: "blue", connected: false },
];

const TRIGGERS = [
  { id: "priceDown", label: "가격을 내리면 '가격 인하' 게시물 자동 발행" },
  { id: "sold", label: "판매완료 시 게시물에 '판매완료' 표시" },
  { id: "renew", label: "7일마다 끌어올림(재게시)" },
] as const;

type Props = {
  title: string;
  price: string;
  mileage: string;
  year: string;
  maker: string;
  model: string;
  address: string;
  cover?: string;
  photoCount: number;
  notify: (message: string) => void;
  onChange?: (channels: SnsChannelId[]) => void;
};

const won = (value: string) => {
  const n = Number(value.replace(/[^0-9]/g, ""));
  return n ? `${n.toLocaleString("ko-KR")}만원` : "가격 협의";
};
const km = (value: string) => {
  const n = Number(value.replace(/[^0-9]/g, ""));
  return n ? `${n.toLocaleString("ko-KR")}km` : "";
};

function buildCaption({ title, price, mileage, year, maker, model, address }: Omit<Props, "notify" | "onChange" | "cover" | "photoCount">, style: number) {
  const region = address || "지역 미정";
  const head = [
    `🚗 ${title || `${maker} ${model}`}`,
    `🔥 새로 들어온 ${year}년식 ${maker} ${model}`,
    `✨ ${maker} ${model} ${year} 실매물 소개합니다`,
  ][style % 3];
  const tags = [maker, model, `${model}중고`, "중고차", region.replace(/(특별시|광역시|도)$/, "") + "중고차", "보배드림"]
    .filter(Boolean)
    .map((t) => `#${t.replace(/\s/g, "")}`)
    .join(" ");
  return `${head}\n\n· ${won(price) === "가격 협의" ? "가격 협의" : `가격 ${won(price)}`}\n· 연식 ${year}년 · 주행 ${km(mileage) || "-"}\n· 거래지역 ${region}\n\n보배드림에서 실차 사진과 성능기록부를 확인하세요 👉 프로필 링크\n\n${tags}`;
}

export default function SnsCrossPost(props: Props) {
  const { cover, photoCount, notify, onChange } = props;
  const [enabled, setEnabled] = useState(true);
  const [open, setOpen] = useState(true);
  const [connected, setConnected] = useState<Record<SnsChannelId, boolean>>(
    () => Object.fromEntries(CHANNELS.map((c) => [c.id, c.connected])) as Record<SnsChannelId, boolean>,
  );
  const [picked, setPicked] = useState<Set<SnsChannelId>>(new Set(["naverBlog", "instagram", "reels"]));
  const [timing, setTiming] = useState("등록 즉시");
  const [reserve, setReserve] = useState("오늘 19:00");
  const [triggers, setTriggers] = useState<Set<string>>(new Set(["priceDown", "sold"]));
  const [style, setStyle] = useState(0);
  const [edited, setEdited] = useState<string | null>(null);
  const [previewTab, setPreviewTab] = useState<"feed" | "blog">("feed");

  const autoCaption = useMemo(() => buildCaption(props, style), [props, style]);
  const caption = edited ?? autoCaption;
  const active = enabled ? CHANNELS.filter((c) => picked.has(c.id) && connected[c.id]) : [];

  const update = (next: Set<SnsChannelId>) => {
    setPicked(next);
    onChange?.(CHANNELS.filter((c) => next.has(c.id) && connected[c.id]).map((c) => c.id));
  };

  const toggleChannel = (channel: Channel) => {
    if (!connected[channel.id]) return;
    const next = new Set(picked);
    if (next.has(channel.id)) next.delete(channel.id);
    else next.add(channel.id);
    update(next);
  };

  const connect = (channel: Channel) => {
    setConnected((current) => ({ ...current, [channel.id]: true }));
    const next = new Set(picked).add(channel.id);
    setPicked(next);
    onChange?.(CHANNELS.filter((c) => next.has(c.id) && (connected[c.id] || c.id === channel.id)).map((c) => c.id));
    notify(`목업: ${channel.name} 계정을 연결했습니다.`);
  };

  const toggleEnabled = (next: boolean) => {
    setEnabled(next);
    onChange?.(next ? CHANNELS.filter((c) => picked.has(c.id) && connected[c.id]).map((c) => c.id) : []);
  };

  return (
    <section className={`ct-card sns-card${enabled ? "" : " is-off"}`} aria-labelledby="sns-card-title">
      <div className="sns-head">
        <button type="button" className="sns-head__toggle" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
          <h2 id="sns-card-title">SNS 동시 홍보</h2>
          <span className="sns-badge">딜러 이용권</span>
          <ChevronDownIcon className={`sns-head__chevron${open ? " is-open" : ""}`} aria-hidden="true" />
        </button>
        <label className="sns-switch">
          <span className="sns-sr">SNS 동시 홍보 사용</span>
          <input type="checkbox" checked={enabled} onChange={(e) => toggleEnabled(e.target.checked)} />
          <i aria-hidden="true" />
        </label>
      </div>
      <p className="sns-lead">
        {enabled
          ? active.length
            ? <>등록하면 <strong>{active.length}개 채널</strong>에 매물이 함께 올라가요.</>
            : "올릴 채널을 선택해주세요."
          : "보배드림에만 등록해요."}
      </p>

      {open && enabled && (
        <div className="sns-body">
          <ul className="sns-channels" aria-label="업로드 채널">
            {CHANNELS.map((channel) => {
              const isOn = picked.has(channel.id) && connected[channel.id];
              const needsVideo = channel.video && photoCount < 3;
              return (
                <li key={channel.id} className={`sns-channel${isOn ? " is-on" : ""}`}>
                  <button
                    type="button"
                    className="sns-channel__main"
                    role="checkbox"
                    aria-checked={isOn}
                    disabled={!connected[channel.id]}
                    onClick={() => toggleChannel(channel)}
                  >
                    <span className={`sns-mark sns-mark--${channel.tone}`} aria-hidden="true">{channel.short}</span>
                    <span className="sns-channel__text">
                      <strong>{channel.name}</strong>
                      <span>{needsVideo ? "사진 3장 이상이면 영상이 만들어져요" : channel.desc}</span>
                    </span>
                    {connected[channel.id] && <span className="sns-check" aria-hidden="true" />}
                  </button>
                  {!connected[channel.id] && (
                    <button type="button" className="sns-connect" onClick={() => connect(channel)}>계정 연결</button>
                  )}
                </li>
              );
            })}
          </ul>

          <fieldset className="ct-pills is-compact sns-timing">
            <legend>올리는 시점</legend>
            <div className="ct-pill-row">
              {["등록 즉시", "예약 발행"].map((option) => (
                <button key={option} type="button" className={timing === option ? "is-selected" : ""} aria-pressed={timing === option} onClick={() => setTiming(option)}>{option}</button>
              ))}
            </div>
          </fieldset>
          {timing === "예약 발행" && (
            <div className="sns-reserve">
              {["오늘 19:00", "오늘 21:00", "내일 09:00", "내일 12:00"].map((slot) => (
                <button key={slot} type="button" className={reserve === slot ? "is-selected" : ""} aria-pressed={reserve === slot} onClick={() => setReserve(slot)}>{slot}</button>
              ))}
              <span className="sns-reserve__hint">조회가 많은 저녁 7~9시를 추천해요.</span>
            </div>
          )}

          <div className="sns-block">
            <div className="sns-block__head">
              <strong>게시 문구</strong>
              <button type="button" className="sns-ghost" onClick={() => { setEdited(null); setStyle((s) => s + 1); notify("목업: 문구를 새로 만들었어요."); }}>
                <ReloadIcon aria-hidden="true" />다른 문구
              </button>
            </div>
            <textarea className="sns-caption" aria-label="SNS 게시 문구" value={caption} maxLength={2200} onChange={(e) => setEdited(e.target.value)} />
            <div className="sns-caption__meta">
              <span>{edited === null ? "매물 정보로 자동 작성됨" : "직접 수정함"}</span>
              <span>{caption.length}/2,200</span>
            </div>
          </div>

          <div className="sns-block">
            <div className="sns-block__head">
              <strong>미리보기</strong>
              <div className="sns-tabs" role="tablist" aria-label="미리보기 종류">
                <button type="button" role="tab" aria-selected={previewTab === "feed"} onClick={() => setPreviewTab("feed")}>피드</button>
                <button type="button" role="tab" aria-selected={previewTab === "blog"} onClick={() => setPreviewTab("blog")}>블로그</button>
              </div>
            </div>
            {previewTab === "feed" ? (
              <article className="sns-preview-feed">
                <header><span className="sns-avatar" aria-hidden="true">보</span><strong>bobae_dealer</strong><span>· 광고 아님</span></header>
                <div className="sns-preview-feed__img">
                  {cover ? <img src={cover} alt="" /> : <span>대표 사진</span>}
                  {photoCount > 1 && <em>1/{Math.min(photoCount, 10)}</em>}
                  <b>{won(props.price)}</b>
                </div>
                <p>{caption.split("\n").slice(0, 3).join(" ")}</p>
              </article>
            ) : (
              <article className="sns-preview-blog">
                <strong>{props.title || `${props.maker} ${props.model}`} | {won(props.price)}</strong>
                <span>보배드림 딜러 · 방금 전</span>
                <div className="sns-preview-blog__body">
                  {cover && <img src={cover} alt="" />}
                  <p>{props.year}년식 {props.maker} {props.model}, 주행 {km(props.mileage) || "-"}. 실차 사진 {photoCount}장과 성능기록부는 보배드림 매물 페이지에서 확인하세요.</p>
                </div>
              </article>
            )}
          </div>

          <div className="sns-block">
            <strong className="sns-block__title">자동 관리</strong>
            {TRIGGERS.map((t) => (
              <label key={t.id} className="ct-document-toggle sns-trigger">
                <span>{t.label}</span>
                <input type="checkbox" checked={triggers.has(t.id)} onChange={(e) => {
                  const next = new Set(triggers);
                  if (e.target.checked) next.add(t.id); else next.delete(t.id);
                  setTriggers(next);
                }} />
                <i aria-hidden="true" />
              </label>
            ))}
          </div>

          <p className="sns-notice">
            <InfoCircledIcon aria-hidden="true" />
            <span>게시물에는 보배드림 매물 링크가 붙고, 문의는 보배드림 채팅·050 안심번호로 연결돼요. 각 SNS의 운영정책을 어기는 게시물은 발행되지 않을 수 있어요.</span>
          </p>
        </div>
      )}
    </section>
  );
}
