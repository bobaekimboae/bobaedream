import { useEffect, useRef, useState, type CSSProperties, type FormEvent, type ReactNode } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { cardContact, cardCompanyName, cardPng, cardThemes, cardVcf, defaultCardStyle, downloadBlob, profileUrl, readCardStyle, serializeCardStyle, cardFields, cardFieldHref, loadCardLogo, type CardContact, type CardExtras, type CardStyle } from "./business-card";
import "./business-card.css";
import { stockUrl } from "./dealer-stock";
import { cardQr, cardServiceOrigin, fetchPublishedCard, publishingUrl, sharingUrl, type PublishedCard } from "./card-sharing";

type Props = { contact: CardContact; shop: string; emp: string; standalone?: boolean; trigger?: ReactNode; extras?: CardExtras };

const publicBase = typeof document === "undefined" ? "/" : new URL(".", document.location.href).pathname;
// 아이콘은 노션 오토스카우트24·초톳 원본 파일을 그대로 쓰고, 색만 mask로 글자색에 맞춘다(2026-10-22 명함 벤치마킹 적용).
const icons = {
  phone: "icons/dealer-profile/phone-as24.svg", sms: "icons/dealer-profile/speech-bubble-as24.svg", chat: "icons/chotot/chotot-common-chat.svg",
  consult: "icons/dealer-profile/speech-bubble-text-as24.svg", verified: "icons/chotot/chotot-list-detail-verified-check-circle.svg",
  location: "icons/dealer-profile/location-as24.svg", valuation: "icons/dealer-profile/car-sale-as24.svg", contact: "icons/chotot/chotot-common-contact-list.svg",
  share: "icons/chotot/chotot-common-share.svg", link: "icons/chotot/chotot-common-copy.svg", image: "icons/chotot/chotot-common-image.svg", clock: "icons/dealer-profile/clock.svg",
} as const;
const Ico = ({ name }: { name: keyof typeof icons }) => <i className="dbc-ico" aria-hidden="true" style={{ "--dbc-ico": `url("${publicBase}${icons[name]}")` } as CSSProperties} />;
const contactTimes = ["언제든", "오전", "오후", "저녁"] as const;
const withCar = (href: string, car?: number) => { if (!car) return href; const url = new URL(href); url.searchParams.set("car", String(car)); return url.href; };

const cardRoleLabel = (role: string) => role === "소속딜러" || role === "딜러" || role === "인증딜러" ? "중고차 딜러" : role === "대표" ? "대표 딜러" : role;

function CardPreview({ contact, style }: { contact: CardContact; style: CardStyle }) {
  contact = cardContact(contact, style);
  const palette = cardThemes[style.theme];
  const [photoFailed, setPhotoFailed] = useState(false);
  const company = cardCompanyName(contact.company);
  const title = style.title.trim() || company;
  const separateTitle = title.replace(/\s/g, "") !== company.replace(/\s/g, "");
  return <article className="dbc-card" style={{ "--dbc-bg": palette.background, "--dbc-ink": palette.ink } as CSSProperties} aria-label={`${contact.name} 딜러 명함`}>
    <div className={`dbc-heading${photoFailed || !contact.photo ? " is-text-only" : ""}`}>
      <div className="dbc-heading-copy"><div className="dbc-brand-block">{contact.gallery ? <small className="dbc-affiliation" aria-label="단지명">{contact.gallery}</small> : null}<div className="dbc-brand">{style.logo ? <img src={style.logo} alt="명함 로고" /> : null}<strong aria-label={separateTitle ? "명함 타이틀" : "상사명"}>{title}</strong></div>{separateTitle ? <p className="dbc-company" aria-label="상사명">{company}</p> : null}</div>
      <div className="dbc-identity"><h2>{contact.name}</h2><p>{cardRoleLabel(contact.role)}</p></div></div>
      {!photoFailed && contact.photo ? <div className="dbc-photo-frame"><img className="dbc-photo" src={contact.photo} alt={`${contact.name} 프로필`} onError={() => setPhotoFailed(true)} /></div> : null}
    </div>
    <p className="dbc-intro">{style.intro}</p>
    <div className="dbc-contact">{cardFieldHref("mobile", style.fields.mobile) || contact.phone ? <strong>{cardFieldHref("mobile", style.fields.mobile) ? style.fields.mobile : contact.phone}</strong> : null}<span>{contact.address}</span></div>
  </article>;
}

export function DealerBusinessCard({ contact, shop, emp, standalone = false, trigger, extras }: Props) {
  const key = `bobaedream:dealer-card:${shop}:${emp}`;
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<CardStyle>(() => {
    if (standalone) return readCardStyle(window.location.hash);
    try { const saved = localStorage.getItem(key); return saved ? readCardStyle(saved) : defaultCardStyle; } catch { return defaultCardStyle; }
  });
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [manualLink, setManualLink] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [logoBusy, setLogoBusy] = useState(false);
  const [published, setPublished] = useState<PublishedCard | null>(null);
  const [serverError, setServerError] = useState("");
  const [moreShare, setMoreShare] = useState(false);
  const [qrUrl, setQrUrl] = useState("");
  const [qrBusy, setQrBusy] = useState(false);
  const [shareCar, setShareCar] = useState<number | undefined>(() => standalone ? Number(new URLSearchParams(window.location.search).get("car")) || undefined : undefined);
  const [consultOpen, setConsultOpen] = useState(false);
  const [consult, setConsult] = useState<{ car: string; time: (typeof contactTimes)[number]; phone: string; agree: boolean; sent: boolean; error: string }>({ car: "", time: "언제든", phone: "", agree: false, sent: false, error: "" });
  const draftChanged = useRef(false);
  const hashFields = new URLSearchParams(window.location.hash.slice(1));
  const legacy = standalone && ["theme", "intro", "title", "logo", "gallery", "company", ...cardFields.map(({ id }) => id)].some(id => hashFields.has(id));
  const requiresPublished = standalone && !legacy && new URLSearchParams(window.location.search).get("published") === "1";
  const receiverContact = standalone && !legacy && published ? { ...published.contact, listingCount: contact.listingCount } : contact;
  const effectiveContact = cardContact(receiverContact, style);
  const baseUrl = sharingUrl(window.location.href, shop, emp, style, published);
  const isFixed = !!published && baseUrl === published.url;
  const url = withCar(baseUrl, shareCar);
  const featuredId = standalone ? Number(new URLSearchParams(window.location.search).get("car")) || undefined : undefined;
  const featured = featuredId ? extras?.listings?.find((car) => car.id === featuredId) : undefined;
  const dealerUrl = profileUrl(window.location.href, shop, emp);
  const phoneHref = cardFieldHref("mobile", style.fields.mobile) || (receiverContact.phone ? `tel:${receiverContact.phone.replace(/[^+\d]/g, "")}` : null);

  useEffect(() => { if (open) dialogRef.current?.scrollTo({ top: 0 }); }, [editing, open]);
  useEffect(() => { setQrUrl(""); setImageUrl(""); setManualLink(false); }, [url]);

  useEffect(() => {
    if (!open && !standalone) return;
    const controller = new AbortController();
    const refresh = async () => {
      try {
        const result = await fetchPublishedCard(shop, emp, controller.signal);
        if (controller.signal.aborted) return;
        setPublished(result); setServerError(!result && requiresPublished ? "아직 공개되지 않은 명함이에요. 판매자 페이지에서 확인해 주세요." : "");
        if (result && !draftChanged.current && !legacy) {
          let localDraft = false;
          try { localDraft = !!localStorage.getItem(key); } catch { /* The published card works without local storage. */ }
          if (standalone || !localDraft) setStyle(result.style);
        }
      } catch {
        if (!controller.signal.aborted) setServerError("서버 명함을 불러오지 못했어요. 잠시 후 다시 열어 주세요.");
      }
    };
    void refresh();
    const message = (event: MessageEvent) => {
      if (event.origin === cardServiceOrigin && event.data?.type === "dealer-card-published" && event.data.shop === shop && event.data.emp === emp) void refresh();
    };
    window.addEventListener("focus", refresh);
    window.addEventListener("message", message);
    return () => { controller.abort(); window.removeEventListener("focus", refresh); window.removeEventListener("message", message); };
  }, [open, standalone, shop, emp, key, legacy, requiresPublished]);

  useEffect(() => () => { if (imageUrl) URL.revokeObjectURL(imageUrl); }, [imageUrl]);
  useEffect(() => { setImageUrl(""); }, [style]);
  useEffect(() => {
    if (!open) return;
    const back = (event: Event) => { event.preventDefault(); setOpen(false); };
    window.addEventListener("bbm-app-back", back);
    return () => window.removeEventListener("bbm-app-back", back);
  }, [open]);

  useEffect(() => {
    if (!standalone) return;
    const update = () => { setStyle(readCardStyle(window.location.hash)); setStatus(""); setManualLink(false); };
    window.addEventListener("hashchange", update);
    document.title = `${contact.name} · ${contact.company} | 디지털 명함`;
    return () => window.removeEventListener("hashchange", update);
  }, [standalone, contact.name, contact.company]);

  const updateStyle = (next: CardStyle) => {
    draftChanged.current = true;
    setStyle(next); setStatus("");
    try { localStorage.setItem(key, serializeCardStyle(next)); } catch { /* The current card can still be shared without storage. */ }
  };
  const publish = () => {
    if (!valid()) return;
    window.open(publishingUrl(shop, emp, effectiveContact, style), "_blank", "noopener,noreferrer");
    setStatus("새 창에서 관리자 로그인 후 명함을 저장해 주세요. 저장 후 돌아오면 고정 주소가 적용돼요.");
  };
  const showQr = async () => {
    if (!valid()) return;
    setQrBusy(true); setStatus("");
    try { setQrUrl(await cardQr(url)); }
    catch (error) { setStatus(error instanceof Error ? error.message : "QR을 만들지 못했어요. 링크 복사를 이용해 주세요."); }
    finally { setQrBusy(false); }
  };
  const valid = () => {
    if (!effectiveContact.company) { setStatus("상사명을 입력해 주세요."); return false; }
    const invalid = cardFields.find(({ id }) => style.fields[id] !== undefined && !cardFieldHref(id, style.fields[id]));
    if (invalid) { setStatus(`${invalid.label} 입력값을 확인하거나 선택을 해제해 주세요.`); return false; }
    return true;
  };
  const copy = async () => {
    if (!valid()) return;
    try { await navigator.clipboard.writeText(url); setManualLink(false); setStatus("명함 링크를 복사했어요. 원하는 대화방에 붙여 넣으세요."); }
    catch { setManualLink(true); setStatus("아래 명함 링크를 선택해 복사해 주세요."); }
  };
  const share = async (kakao = false) => {
    if (!valid()) return;
    if (!navigator.share) { await copy(); if (kakao) setStatus("명함 링크를 카카오톡 대화방에 붙여 넣어 주세요. 복사가 안 되면 아래 링크를 직접 복사하세요."); return; }
    const car = shareCar ? extras?.listings?.find((item) => item.id === shareCar) : undefined;
    try { await navigator.share({ title: `${contact.name} · ${style.title.trim() || effectiveContact.company}`, text: car ? `${car.title} · ${car.price} — ${contact.name} 딜러가 추천하는 차량이에요.` : `${contact.name} 딜러의 명함입니다.`, url }); setStatus("공유 창을 닫았어요."); }
    catch (error) { if (!(error instanceof DOMException && error.name === "AbortError")) await copy(); }
  };
  const saveImage = async () => {
    if (!valid()) return;
    setBusy(true); setStatus("");
    try { setImageUrl(URL.createObjectURL(await cardPng(receiverContact, style))); setStatus("아래 이미지를 확인하고 PNG 파일로 저장하세요."); }
    catch { setStatus("이미지를 저장하지 못했어요. 링크 공유를 이용해 주세요."); }
    finally { setBusy(false); }
  };
  const saveContact = () => {
    if (!valid()) return;
    downloadBlob(new Blob([cardVcf(receiverContact, isFixed ? baseUrl : dealerUrl, style)], { type: "text/vcard;charset=utf-8" }), `${contact.name}-연락처.vcf`);
    setStatus("연락처 파일을 열면 주소록에 저장할 수 있어요.");
  };
  const reels = (extras?.reels ?? []).filter((reel) => reel.poster).slice(0, 3);
  const sns = { instagram: cardFieldHref("instagram", style.fields.instagram) ?? extras?.sns?.instagram, youtube: cardFieldHref("youtube", style.fields.youtube) ?? extras?.sns?.youtube, tiktok: cardFieldHref("tiktok", style.fields.tiktok) ?? undefined };
  // 문자는 휴대폰 번호(01X)일 때만. 상사·단지 대표 일반전화(02-…)로는 문자를 보낼 수 없다.
  const smsHref = phoneHref && /^tel:(\+?82|0)1[016789]/.test(phoneHref) ? phoneHref.replace(/^tel:/, "sms:") : null;
  const trust = [extras?.rating ? `★ ${extras.rating.toFixed(1)}` : "", extras?.reviewCount ? `리뷰 ${extras.reviewCount.toLocaleString("ko-KR")}` : "", extras?.sold ? `판매완료 ${extras.sold.toLocaleString("ko-KR")}대` : ""].filter(Boolean);
  const mapQuery = effectiveContact.gallery || receiverContact.address;
  const valuationUrl = (() => { const target = new URL(dealerUrl); target.searchParams.set("tab", "valuation"); return target.href; })();
  const sendConsult = (event: FormEvent) => {
    event.preventDefault();
    const digits = consult.phone.replace(/\D/g, "");
    if (!/^01[016789]\d{7,8}$/.test(digits)) { setConsult({ ...consult, error: "휴대폰 번호를 확인해 주세요." }); return; }
    if (!consult.agree) { setConsult({ ...consult, error: "번호 전달에 동의해 주세요." }); return; }
    setConsult({ ...consult, sent: true, error: "" });
  };
  const openConsult = (car?: string) => { setConsult((current) => ({ ...current, car: car ?? current.car, sent: false, error: "" })); setConsultOpen(true); window.setTimeout(() => document.querySelector(".dbc-consult")?.scrollIntoView({ block: "center", behavior: "smooth" }), 0); };
  // 고객이 받는 명함(2026-10-22 국내외 딜러·중개사 명함 벤치마킹 적용):
  // ① 문의 차량(차 한 대 붙여 보낸 경우) → ② 누가(명함) → ③ 믿을 만한지 → ④ 바로 연락 + 상담 남기기 → ⑤ 무슨 차가 있는지 → ⑥ 어디로 가면 되는지 → ⑦ 내 차 팔기 → ⑧ 쇼츠 → ⑨ 연락처 저장.
  const customer = <>
    {trust.length || effectiveContact.gallery ? <p className="dbc-trust" aria-label="딜러 확인 정보">{effectiveContact.gallery ? <b className="dbc-verified"><Ico name="verified" />{effectiveContact.gallery} 등록 딜러</b> : null}{trust.map((item) => <span key={item}>{item}</span>)}</p> : null}
    <div className="dbc-cta" role="group" aria-label="딜러에게 연락">
      {phoneHref ? <a className="is-primary" href={phoneHref}><Ico name="phone" />전화</a> : <button type="button" onClick={() => setStatus("등록된 전화번호가 없어요. 채팅으로 문의해 주세요.")}><Ico name="phone" />전화</button>}
      {smsHref ? <a href={smsHref}><Ico name="sms" />문자</a> : null}
      <a href={dealerUrl}><Ico name="chat" />채팅</a>
    </div>
    <section className={`dbc-consult${consultOpen ? " is-open" : ""}`} aria-label="상담 남기기">
      {!consultOpen ? <button type="button" className="dbc-consult-open" onClick={() => openConsult()}><Ico name="consult" /><span><b>전화가 어려우면 상담 남기기</b><small>번호를 남기면 딜러가 먼저 연락드려요</small></span><i aria-hidden="true">›</i></button>
      : consult.sent ? <div className="dbc-consult-done" role="status"><b>상담 요청을 남겼어요</b><p>{contact.name} 딜러가 {consult.time === "언제든" ? "확인하는 대로" : `${consult.time}에`} 연락드릴 거예요.</p><small>시안 화면이라 실제로 전달되지는 않아요.</small><button type="button" onClick={() => { setConsultOpen(false); setConsult({ car: "", time: "언제든", phone: "", agree: false, sent: false, error: "" }); }}>닫기</button></div>
      : <form className="dbc-consult-form" onSubmit={sendConsult} noValidate>
        <p className="dbc-consult-title"><Ico name="consult" />상담 남기기</p>
        <label>관심 차량<select value={consult.car} onChange={(event) => setConsult({ ...consult, car: event.target.value })}><option value="">아직 정하지 않았어요</option>{(extras?.listings ?? []).map((car) => <option key={car.id} value={car.title}>{car.title}</option>)}</select></label>
        <fieldset><legend>연락받을 시간</legend><div className="dbc-consult-times">{contactTimes.map((time) => <button key={time} type="button" aria-pressed={consult.time === time} onClick={() => setConsult({ ...consult, time })}>{time}</button>)}</div></fieldset>
        <label>휴대폰 번호<input type="tel" inputMode="tel" autoComplete="tel" maxLength={13} placeholder="010-0000-0000" value={consult.phone} onChange={(event) => setConsult({ ...consult, phone: event.target.value, error: "" })} /></label>
        <label className="dbc-consult-agree"><input type="checkbox" checked={consult.agree} onChange={(event) => setConsult({ ...consult, agree: event.target.checked, error: "" })} /><span>상담을 위해 번호를 {contact.name} 딜러에게 전달하는 데 동의해요</span></label>
        {consult.error ? <p className="dbc-consult-error" role="alert">{consult.error}</p> : null}
        <div className="dbc-consult-actions"><button type="button" onClick={() => setConsultOpen(false)}>취소</button><button type="submit">상담 남기기</button></div>
      </form>}
    </section>
    {contact.listingCount ? <section className="dbc-stock" aria-label="판매차량">
      <a className="dbc-stock-head" href={stockUrl(window.location.href, shop, emp)}><b>판매차량 {contact.listingCount ?? 0}대</b><span>전체 보기 <i aria-hidden="true">›</i></span></a>
      {extras?.categories?.length ? <div className="dbc-stock-chips">{extras.categories.map((item) => <a key={item.label} href={stockUrl(window.location.href, shop, emp, item.label)}>{item.label}<span>{item.count}</span></a>)}</div> : null}
      {extras?.listings?.length ? <div className="dbc-stock-thumbs">{extras.listings.filter((car) => car.id !== featured?.id).slice(0, 3).map((car) => <a key={car.id} href={car.href}><span className="dbc-stock-photo"><img src={car.image} alt="" loading="lazy" /></span><b>{car.title}</b><strong>{car.price}</strong></a>)}</div> : null}
    </section> : null}
    {mapQuery ? <section className="dbc-visit" aria-label="방문 안내">
      <p className="dbc-visit-place"><Ico name="location" /><span><b>{effectiveContact.gallery || "방문 안내"}</b><small>{receiverContact.address}</small></span></p>
      <div className="dbc-visit-maps"><a href={`https://map.kakao.com/link/search/${encodeURIComponent(mapQuery)}`} target="_blank" rel="noopener noreferrer">카카오맵 길찾기</a><a href={`https://map.naver.com/p/search/${encodeURIComponent(mapQuery)}`} target="_blank" rel="noopener noreferrer">네이버지도 길찾기</a></div>
    </section> : null}
    <a className="dbc-row-link" href={valuationUrl}><Ico name="valuation" /><span><b>내 차 팔 때 시세 견적 받기</b><small>{contact.name} 딜러가 무료로 견적을 드려요</small></span><i aria-hidden="true">›</i></a>
    {reels.length || sns.instagram || sns.youtube || sns.tiktok ? <section className="dbc-sns" aria-label="SNS">
      <p className="dbc-sns-title">SNS</p>
      {reels.length ? <><div className="dbc-reels">{reels.map((reel) => <a key={reel.href} href={reel.href} target="_blank" rel="noopener noreferrer" aria-label={`${reel.label ?? "인스타그램 릴스"} 보기`}><img src={reel.poster} alt="" loading="lazy" /><span aria-hidden="true">▶</span></a>)}</div></> : null}
      <div className="dbc-sns-links">{sns.instagram ? <a href={sns.instagram} target="_blank" rel="noopener noreferrer">인스타그램</a> : null}{sns.youtube ? <a href={sns.youtube} target="_blank" rel="noopener noreferrer">유튜브</a> : null}{sns.tiktok ? <a href={sns.tiktok} target="_blank" rel="noopener noreferrer">틱톡</a> : null}</div>
    </section> : null}
    <button type="button" className="dbc-save-contact" onClick={saveContact}><Ico name="contact" />연락처 저장</button>
  </>;
  const featuredBlock = featured && !editing ? <a className="dbc-featured" href={featured.href} aria-label={`${contact.name} 딜러가 보낸 차량 ${featured.title}`}><small>{contact.name} 딜러가 보낸 차량</small><span className="dbc-featured-photo"><img src={featured.image} alt="" /></span><b>{featured.title}</b><strong>{featured.price}</strong></a> : null;
  const featuredAsk = featured && !editing ? <button type="button" className="dbc-featured-ask" onClick={() => openConsult(featured.title)}>이 차 상담 남기기</button> : null;
  // 딜러 본인: 큰 카카오톡 버튼 하나 + 나머지 공유 수단은 작은 줄. 고정 주소 저장은 편집 화면에만 둔다.
  // 명함 창 아래에 늘 붙어 있는 공유 막대: 카카오톡 하나를 크게, 나머지는 「더보기」로(2026-10-22 「공유하기 이런거 없잖아」).
  const shareBar = editing ? null : <section className="dbc-sharebar" aria-label="명함 공유">
    {moreShare ? <div className="dbc-share-more">
        {!standalone && extras?.listings?.length ? <div className="dbc-share-car"><p>함께 보낼 차량 <small>선택하면 명함 위에 이 차가 크게 보여요</small></p><div className="dbc-share-car-list">{extras.listings.map((car) => <button key={car.id} type="button" aria-pressed={shareCar === car.id} onClick={() => setShareCar(shareCar === car.id ? undefined : car.id)}><img src={car.image} alt="" loading="lazy" /><span>{car.title}</span></button>)}</div></div> : null}
        <div className="dbc-share-icons"><button type="button" onClick={() => share()}><Ico name="share" />다른 앱</button><button type="button" onClick={copy}><Ico name="link" />링크 복사</button><button type="button" disabled={qrBusy} onClick={showQr}><span className="dbc-qr-mark" aria-hidden="true" />{qrBusy ? "만드는 중" : "QR 코드"}</button><button type="button" disabled={busy} onClick={saveImage}><Ico name="image" />{busy ? "만드는 중" : "이미지 저장"}</button></div>
        {qrUrl ? <div className="dbc-qr"><img src={qrUrl} alt={`${contact.name} 딜러 모바일 명함 QR 코드`} /><p>카메라로 QR을 비추면 명함이 열려요.</p><a href={qrUrl} download={`${contact.name}-명함-QR.png`}>QR 이미지 저장</a></div> : null}
    </div> : null}
    <div className="dbc-sharebar-row"><button type="button" className="dbc-kakao-main" onClick={() => share(true)}>{shareCar ? "카카오톡으로 차량+명함 보내기" : "카카오톡으로 명함 보내기"}</button><button type="button" className="dbc-share-more-toggle" aria-expanded={moreShare} onClick={() => setMoreShare(!moreShare)}>{moreShare ? "닫기" : "더보기"}</button></div>
  </section>;
  const content = <div className={`dbc-layout${editing ? " is-editing" : ""}`}>
    {featuredBlock}
    <CardPreview contact={receiverContact} style={style} />
    {featuredAsk}
    {!editing ? customer : null}
    {!standalone && editing ? <div className="dbc-editor">
      <fieldset className="dbc-brand-editor"><legend>단지 · 상사 정보</legend>
        <label>단지명<input type="text" maxLength={80} placeholder="실제 소속 단지명" value={effectiveContact.gallery ?? ""} onChange={(event) => updateStyle({ ...style, gallery: event.target.value })} /></label>
        <label>상사명<input type="text" maxLength={80} placeholder="실제 소속 상사명" value={style.company ?? cardCompanyName(receiverContact.company)} onChange={(event) => updateStyle({ ...style, company: event.target.value })} /></label>
      </fieldset>
      <fieldset className="dbc-brand-editor"><legend>로고 · 타이틀</legend>
        <div className="dbc-logo-edit">{style.logo ? <img src={style.logo} alt="선택한 로고" /> : null}<label className="dbc-upload">{logoBusy ? "로고 불러오는 중…" : style.logo ? "로고 변경" : "로고 추가"}<input type="file" accept="image/png,image/jpeg,image/webp" aria-label="로고 파일" disabled={logoBusy} onChange={async (event) => {
          const file = event.target.files?.[0]; event.target.value = ""; if (!file) return;
          setLogoBusy(true);
          try { const logo = await loadCardLogo(file); draftChanged.current = true; setStyle((current) => { const next = { ...current, logo }; try { localStorage.setItem(key, serializeCardStyle(next)); } catch { /* Session only. */ } return next; }); setStatus(""); }
          catch (error) { setStatus(error instanceof Error ? error.message : "로고를 불러올 수 없어요."); }
          finally { setLogoBusy(false); }
        }} /></label>{style.logo ? <button type="button" onClick={() => updateStyle({ ...style, logo: "" })}>로고 삭제</button> : null}<small>PNG·JPG·WebP · 최대 2MB</small></div>
        <label>명함 타이틀<input type="text" maxLength={30} placeholder={cardCompanyName(effectiveContact.company)} value={style.title} onChange={(event) => updateStyle({ ...style, title: event.target.value })} /></label>
      </fieldset>
      <fieldset className="dbc-optional"><legend>선택 정보 추가</legend>{cardFields.map(({ id, label, placeholder }) => {
        const enabled = style.fields[id] !== undefined;
        return <div key={id} className="dbc-optional-row"><label className="dbc-field-toggle"><input type="checkbox" checked={enabled} onChange={(event) => { const fields = { ...style.fields }; if (event.target.checked) fields[id] = ""; else delete fields[id]; updateStyle({ ...style, fields }); }} />{label}</label>{enabled ? <label className="dbc-field-input"><span className="dbc-sr-only">{label} 입력</span><input type={id === "mobile" ? "tel" : "text"} inputMode={id === "mobile" ? "tel" : "text"} maxLength={id === "mobile" ? 30 : 180} autoComplete="off" placeholder={placeholder} value={style.fields[id]} onChange={(event) => updateStyle({ ...style, fields: { ...style.fields, [id]: event.target.value } })} /></label> : null}</div>;
      })}</fieldset>
      <fieldset><legend>명함 색상</legend><div className="dbc-swatches">{Object.entries(cardThemes).map(([theme, palette]) => <button type="button" key={theme} aria-pressed={style.theme === theme} onClick={() => updateStyle({ ...style, theme: theme as CardStyle["theme"] })}><i style={{ background: palette.background }} />{palette.label}{style.theme === theme ? <span aria-hidden="true">✓</span> : null}</button>)}</div></fieldset>
      <label>소개 문구<textarea maxLength={60} rows={2} value={style.intro} onChange={(event) => updateStyle({ ...style, intro: event.target.value.replace(/[\r\n]/g, " ") })} /><small>{style.intro.length}/60</small></label>
      <p>편집 내용은 이 기기에 임시 저장돼요. ‘고정 주소에 저장’을 누르면 관리자 확인 후 공개 명함에 반영돼요.</p>
      <button type="button" className="dbc-publish" disabled={logoBusy} onClick={publish}>고정 주소에 저장 ↗</button>
      {published && !isFixed ? <button type="button" className="dbc-publish dbc-restore" onClick={() => updateStyle(published.style)}>공개 명함 내용 불러오기</button> : null}
      {serverError ? <p>{serverError}</p> : null}
    </div> : null}
    {imageUrl ? <div className="dbc-export"><img src={imageUrl} alt={`${contact.name} 저장용 명함 이미지`} /><a href={imageUrl} download={`${contact.name}-명함.png`}>PNG 다운로드</a></div> : null}
    {manualLink ? <label className="dbc-manual-link">명함 링크<input readOnly value={url} onFocus={(event) => event.target.select()} /></label> : null}
    <p className="dbc-status" role="status">{status}</p>
    {!standalone && editing ? <div className="dbc-edit-footer"><button type="button" className="dbc-edit-toggle" disabled={logoBusy} onClick={() => { if (!valid()) return; setEditing(false); setStatus(""); setImageUrl(""); setManualLink(false); }}>편집 완료</button></div> : null}
  </div>;

  if (requiresPublished && (!published || serverError)) return <main className="dbc-page"><div className="dbc-page-wrap"><a className="dbc-home" href={dealerUrl}>← 판매자 페이지</a><header><h1>{contact.name} · {cardCompanyName(effectiveContact.company)}</h1></header><p role="status">{serverError || "최신 명함을 불러오고 있어요."}</p>{serverError ? <button type="button" className="dbc-publish" onClick={() => window.location.reload()}>다시 불러오기</button> : null}</div></main>;
  if (standalone) return <main className="dbc-page"><div className="dbc-page-wrap"><div className="dbc-page-top"><a className="dbc-home" href={dealerUrl}>← 판매자 페이지</a></div><header><h1>{contact.name} · {cardCompanyName(effectiveContact.company)}</h1><p>중고차 딜러 명함</p></header>{content}</div>{shareBar}</main>;
  return <Dialog.Root open={open} onOpenChange={(value) => { setOpen(value); setEditing(false); setMoreShare(false); setShareCar(undefined); setConsultOpen(false); setQrUrl(""); setImageUrl(""); setStatus(""); setManualLink(false); }}>
    <Dialog.Trigger asChild>{trigger ?? <button type="button" className="dp-businesscard-trigger">명함 만들기 · 공유 <span aria-hidden="true">↗</span></button>}</Dialog.Trigger>
    <Dialog.Portal><Dialog.Overlay className="dbc-overlay" /><Dialog.Content ref={dialogRef} className="dbc-dialog"><header className="dbc-dialog-head"><div><Dialog.Title>{editing ? "명함 편집" : `${contact.name} · ${cardCompanyName(effectiveContact.company)}`}</Dialog.Title><Dialog.Description className="dbc-sr-only">{editing ? "명함 정보를 수정하고 편집 완료를 눌러 주세요." : "고객에게 보낼 명함을 확인하고 카카오톡으로 보내세요."}</Dialog.Description></div>{!editing ? <button type="button" className="dbc-head-edit" disabled={logoBusy} onClick={() => { setEditing(true); setMoreShare(false); setStatus(""); setImageUrl(""); setManualLink(false); }}>편집</button> : null}<Dialog.Close aria-label="명함 닫기">×</Dialog.Close></header><div className="dbc-dialog-body">{content}</div>{shareBar}</Dialog.Content></Dialog.Portal>
  </Dialog.Root>;
}
