import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { cardPng, cardThemes, cardVcf, defaultCardStyle, downloadBlob, profileUrl, readCardStyle, serializeCardStyle, cardFields, cardFieldHref, loadCardLogo, type CardContact, type CardStyle } from "./business-card";
import "./business-card.css";
import { stockCategories, stockUrl } from "./dealer-stock";
import { cardQr, cardServiceOrigin, fetchPublishedCard, publishingUrl, sharingUrl, type PublishedCard } from "./card-sharing";

type Props = { contact: CardContact; shop: string; emp: string; standalone?: boolean; trigger?: ReactNode };

function CardSocials({ style }: { style: CardStyle }) {
  const socials = cardFields.filter(({ id }) => id !== "mobile" && cardFieldHref(id, style.fields[id]));
  return socials.length ? <nav className="dbc-socials" aria-label="명함 SNS">{socials.map(({ id, label }) => <a key={id} href={cardFieldHref(id, style.fields[id])!} target="_blank" rel="noopener noreferrer"><span>{label}</span><strong>{style.fields[id]}</strong><span aria-hidden="true">↗</span></a>)}</nav> : null;
}

function CardPreview({ contact, style }: { contact: CardContact; style: CardStyle }) {
  const palette = cardThemes[style.theme];
  const [photoFailed, setPhotoFailed] = useState(false);
  const company = contact.company.replace(/\(주\)|\(유\)|주식회사/g, "").trim();
  const title = style.title.trim() || company;
  return <article className="dbc-card" style={{ "--dbc-bg": palette.background, "--dbc-ink": palette.ink } as CSSProperties} aria-label={`${contact.name} 딜러 명함`}>
    <div className="dbc-brand">{style.logo ? <img src={style.logo} alt="명함 로고" /> : null}<strong>{title}</strong></div>
    <div className="dbc-identity"><h2>{contact.name}</h2><p>{title.replace(/\s/g, "") !== company.replace(/\s/g, "") ? `${company} · ` : ""}{contact.role}</p></div>
    {!photoFailed ? <img className="dbc-photo" src={contact.photo} alt={`${contact.name} 프로필`} onError={() => setPhotoFailed(true)} /> : null}
    <p className="dbc-intro">{style.intro}</p>
    <div className="dbc-contact">{cardFieldHref("mobile", style.fields.mobile) || contact.phone ? <strong>{cardFieldHref("mobile", style.fields.mobile) ? style.fields.mobile : contact.phone}</strong> : null}<span>{contact.address}</span></div>
    <small className="dbc-gallery">서울오토갤러리</small>
  </article>;
}

export function DealerBusinessCard({ contact, shop, emp, standalone = false, trigger }: Props) {
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
  const [sharing, setSharing] = useState(false);
  const [qrUrl, setQrUrl] = useState("");
  const [qrBusy, setQrBusy] = useState(false);
  const draftChanged = useRef(false);
  const hashFields = new URLSearchParams(window.location.hash.slice(1));
  const legacy = standalone && ["theme", "intro", "title", "logo", ...cardFields.map(({ id }) => id)].some(id => hashFields.has(id));
  const requiresPublished = standalone && !legacy && new URLSearchParams(window.location.search).get("published") === "1";
  const receiverContact = standalone && !legacy && published ? { ...published.contact, listingCount: contact.listingCount } : contact;
  const url = sharingUrl(window.location.href, shop, emp, style, published);
  const isFixed = !!published && url === published.url;
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
    window.open(publishingUrl(shop, emp, contact, style), "_blank", "noopener,noreferrer");
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
    try { await navigator.share({ title: `${contact.name} · ${style.title.trim() || contact.company}`, text: `${contact.name} 딜러의 명함입니다.`, url }); setStatus("공유 창을 닫았어요."); }
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
    downloadBlob(new Blob([cardVcf(receiverContact, isFixed ? url : dealerUrl, style)], { type: "text/vcard;charset=utf-8" }), `${contact.name}-연락처.vcf`);
    setStatus("연락처 파일을 열면 주소록에 저장할 수 있어요.");
  };
  const content = <div className={`dbc-layout${editing ? " is-editing" : ""}`}>
    <CardPreview contact={receiverContact} style={style} />
    {!editing ? <><div className="dbc-recipient-contact" role="group" aria-label="딜러 연락처">{phoneHref ? <a href={phoneHref}>전화 상담</a> : null}<button type="button" onClick={saveContact}>연락처 저장</button></div>
    <nav className="dbc-stock" aria-label="판매차량 바로가기">
      <a className="dbc-stock-total" href={stockUrl(window.location.href, shop, emp)}>판매차량 <strong>{contact.listingCount ?? 0}대</strong><span aria-hidden="true">→</span></a>
      <div>{stockCategories.map((category) => <a key={category} href={stockUrl(window.location.href, shop, emp, category)}>{category}<span aria-hidden="true">↗</span></a>)}</div>
    </nav>
    <CardSocials style={style} /></> : null}
    {!standalone && editing ? <div className="dbc-editor">
      <fieldset className="dbc-brand-editor"><legend>로고 · 타이틀</legend>
        <div className="dbc-logo-edit">{style.logo ? <img src={style.logo} alt="선택한 로고" /> : null}<label className="dbc-upload">{logoBusy ? "로고 불러오는 중…" : style.logo ? "로고 변경" : "로고 추가"}<input type="file" accept="image/png,image/jpeg,image/webp" aria-label="로고 파일" disabled={logoBusy} onChange={async (event) => {
          const file = event.target.files?.[0]; event.target.value = ""; if (!file) return;
          setLogoBusy(true);
          try { const logo = await loadCardLogo(file); draftChanged.current = true; setStyle((current) => { const next = { ...current, logo }; try { localStorage.setItem(key, serializeCardStyle(next)); } catch { /* Session only. */ } return next; }); setStatus(""); }
          catch (error) { setStatus(error instanceof Error ? error.message : "로고를 불러올 수 없어요."); }
          finally { setLogoBusy(false); }
        }} /></label>{style.logo ? <button type="button" onClick={() => updateStyle({ ...style, logo: "" })}>로고 삭제</button> : null}<small>PNG·JPG·WebP · 최대 2MB</small></div>
        <label>명함 타이틀<input type="text" maxLength={30} placeholder={contact.company} value={style.title} onChange={(event) => updateStyle({ ...style, title: event.target.value })} /></label>
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
    {!editing ? <section className="dbc-tools" aria-label="명함 공유 및 저장">
      <button type="button" className="dbc-share-toggle" aria-expanded={sharing} aria-controls={`dbc-share-${shop}-${emp}`} onClick={() => setSharing(!sharing)}>명함 공유하기 <span aria-hidden="true">{sharing ? "−" : "+"}</span></button>
      {sharing ? <div className="dbc-share-menu" id={`dbc-share-${shop}-${emp}`}>
        <p className="dbc-share-note">{isFixed ? "고정 주소 · 저장한 최신 명함으로 연결돼요." : "현재 명함 링크 · 수정 내용은 새 링크로 공유해 주세요."}</p>
        <div className="dbc-actions"><button type="button" className="dbc-kakao" onClick={() => share(true)}>카카오톡으로 전달</button><button type="button" onClick={() => share()}>다른 앱으로 공유</button><button type="button" onClick={copy}>링크 복사</button><button type="button" disabled={qrBusy} onClick={showQr}>{qrBusy ? "QR 만드는 중…" : "QR 보기·저장"}</button><button type="button" disabled={busy} onClick={saveImage}>{busy ? "이미지 만드는 중…" : "명함 이미지 저장"}</button></div>
        <p className="dbc-share-help">카카오톡으로 전달하려면 공유 창에서 카카오톡을 선택하거나 복사한 링크를 대화방에 붙여 넣으세요.</p>
        {qrUrl ? <div className="dbc-qr"><img src={qrUrl} alt={`${contact.name} 딜러 모바일 명함 QR 코드`} /><p>카메라로 QR을 비추면 명함이 열려요.</p><a href={qrUrl} download={`${contact.name}-명함-QR.png`}>QR 이미지 저장</a></div> : null}
        {!standalone && !isFixed ? <button type="button" className="dbc-publish" onClick={publish}>고정 주소 만들기·업데이트 ↗</button> : null}
      </div> : null}
    </section> : null}
    {standalone && !legacy && serverError ? <p className="dbc-status" role="alert">{serverError}</p> : null}
    {imageUrl ? <div className="dbc-export"><img src={imageUrl} alt={`${contact.name} 저장용 명함 이미지`} /><a href={imageUrl} download={`${contact.name}-명함.png`}>PNG 다운로드</a></div> : null}
    {manualLink ? <label className="dbc-manual-link">명함 링크<input readOnly value={url} onFocus={(event) => event.target.select()} /></label> : null}
    <p className="dbc-status" role="status">{status}</p>
    {!standalone ? <div className="dbc-edit-footer"><button type="button" className="dbc-edit-toggle" disabled={logoBusy} onClick={() => { if (editing && !valid()) return; setEditing(!editing); setStatus(""); setImageUrl(""); setManualLink(false); }}>{editing ? "편집 완료" : "명함 편집하기"}</button></div> : null}
  </div>;

  if (requiresPublished && (!published || serverError)) return <main className="dbc-page"><div className="dbc-page-wrap"><a className="dbc-home" href={dealerUrl}>← 판매자 페이지</a><header><h1>{contact.name} 딜러님 모바일 명함</h1></header><p role="status">{serverError || "최신 명함을 불러오고 있어요."}</p>{serverError ? <button type="button" className="dbc-publish" onClick={() => window.location.reload()}>다시 불러오기</button> : null}</div></main>;
  if (standalone) return <main className="dbc-page"><div className="dbc-page-wrap"><a className="dbc-home" href={dealerUrl}>← 판매자 페이지</a><header><h1>{contact.name} 딜러님 모바일 명함</h1></header>{content}</div></main>;
  return <Dialog.Root open={open} onOpenChange={(value) => { setOpen(value); setEditing(false); setSharing(false); setQrUrl(""); setImageUrl(""); setStatus(""); setManualLink(false); }}>
    <Dialog.Trigger asChild>{trigger ?? <button type="button" className="dp-businesscard-trigger">명함 만들기 · 공유 <span aria-hidden="true">↗</span></button>}</Dialog.Trigger>
    <Dialog.Portal><Dialog.Overlay className="dbc-overlay" /><Dialog.Content ref={dialogRef} className="dbc-dialog"><header className="dbc-dialog-head"><div><Dialog.Title>{contact.name} 딜러님 모바일 명함</Dialog.Title><Dialog.Description className="dbc-sr-only">{editing ? "명함 정보를 수정하고 편집 완료를 눌러 주세요." : "연락처와 판매차량을 확인하고 명함을 공유하세요."}</Dialog.Description></div><Dialog.Close aria-label="명함 닫기">×</Dialog.Close></header><div className="dbc-dialog-body">{content}</div></Dialog.Content></Dialog.Portal>
  </Dialog.Root>;
}
