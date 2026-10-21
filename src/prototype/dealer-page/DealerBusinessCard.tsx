import { useEffect, useState, type CSSProperties } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { cardPng, cardThemes, cardUrl, cardVcf, defaultCardStyle, downloadBlob, profileUrl, readCardStyle, type CardContact, type CardStyle } from "./business-card";
import "./business-card.css";

type Props = { contact: CardContact; shop: string; emp: string; standalone?: boolean };

function CardPreview({ contact, style }: { contact: CardContact; style: CardStyle }) {
  const palette = cardThemes[style.theme];
  const [photoFailed, setPhotoFailed] = useState(false);
  return <article className="dbc-card" style={{ "--dbc-bg": palette.background, "--dbc-ink": palette.ink } as CSSProperties} aria-label={`${contact.name} 딜러 명함`}>
    <div className="dbc-brand"><strong>보배드림</strong><small>DEALER BUSINESS CARD</small></div>
    <div className="dbc-identity"><h2>{contact.name}</h2><p>{contact.company} · {contact.role}</p></div>
    {!photoFailed ? <img className="dbc-photo" src={contact.photo} alt={`${contact.name} 프로필`} onError={() => setPhotoFailed(true)} /> : null}
    <p className="dbc-intro">{style.intro}</p>
    <div className="dbc-contact"><strong>{contact.phone || "판매자 페이지에서 상담하기"}</strong><span>{contact.address}</span></div>
    <small className="dbc-gallery">서울오토갤러리</small>
  </article>;
}

export function DealerBusinessCard({ contact, shop, emp, standalone = false }: Props) {
  const key = `bobaedream:dealer-card:${shop}:${emp}`;
  const [open, setOpen] = useState(false);
  const [style, setStyle] = useState<CardStyle>(() => {
    if (standalone) return readCardStyle(window.location.hash);
    try { const saved = localStorage.getItem(key); return saved ? readCardStyle(saved) : defaultCardStyle; } catch { return defaultCardStyle; }
  });
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [manualLink, setManualLink] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const url = cardUrl(window.location.href, shop, emp, style);
  const dealerUrl = profileUrl(window.location.href, shop, emp);

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
    const update = () => setStyle(readCardStyle(window.location.hash));
    window.addEventListener("hashchange", update);
    document.title = `${contact.name} · ${contact.company} | 보배드림 명함`;
    return () => window.removeEventListener("hashchange", update);
  }, [standalone, contact.name, contact.company]);

  const updateStyle = (next: CardStyle) => {
    setStyle(next); setStatus("");
    try { localStorage.setItem(key, new URLSearchParams({ theme: next.theme, intro: next.intro }).toString()); } catch { /* The current card can still be shared without storage. */ }
  };
  const copy = async () => {
    try { await navigator.clipboard.writeText(url); setManualLink(false); setStatus("명함 링크를 복사했어요. 원하는 대화방에 붙여 넣으세요."); }
    catch { setManualLink(true); setStatus("아래 명함 링크를 선택해 복사해 주세요."); }
  };
  const share = async () => {
    if (!navigator.share) { await copy(); return; }
    try { await navigator.share({ title: `${contact.name} · ${contact.company}`, text: `${contact.name} 딜러의 보배드림 명함입니다.`, url }); setStatus("명함을 공유했어요."); }
    catch (error) { if (!(error instanceof DOMException && error.name === "AbortError")) await copy(); }
  };
  const saveImage = async () => {
    setBusy(true); setStatus("");
    try { setImageUrl(URL.createObjectURL(await cardPng(contact, style))); setStatus("아래 이미지를 확인하고 PNG 파일로 저장하세요."); }
    catch { setStatus("이미지를 저장하지 못했어요. 링크 공유를 이용해 주세요."); }
    finally { setBusy(false); }
  };
  const saveContact = () => {
    downloadBlob(new Blob([cardVcf(contact, dealerUrl)], { type: "text/vcard;charset=utf-8" }), `${contact.name}-보배드림.vcf`);
    setStatus("연락처 파일을 열면 주소록에 저장할 수 있어요.");
  };
  const content = <>
    <CardPreview contact={contact} style={style} />
    {!standalone ? <div className="dbc-editor">
      <fieldset><legend>명함 색상</legend><div className="dbc-swatches">{Object.entries(cardThemes).map(([theme, palette]) => <button type="button" key={theme} aria-pressed={style.theme === theme} onClick={() => updateStyle({ ...style, theme: theme as CardStyle["theme"] })}><i style={{ background: palette.background }} />{palette.label}{style.theme === theme ? <span aria-hidden="true">✓</span> : null}</button>)}</div></fieldset>
      <label>소개 문구<textarea maxLength={60} rows={2} value={style.intro} onChange={(event) => updateStyle({ ...style, intro: event.target.value.replace(/[\r\n]/g, " ") })} /><small>{style.intro.length}/60</small></label>
      <p>명함 설정은 이 기기에 저장돼요. 공유한 링크에는 선택한 문구와 색상이 담겨요.</p>
    </div> : null}
    <div className="dbc-actions"><button type="button" className="dbc-primary" onClick={share}>명함 공유하기</button><button type="button" onClick={copy}>링크 복사</button><button type="button" disabled={busy} onClick={saveImage}>{busy ? "이미지 만드는 중…" : "이미지 저장"}</button><button type="button" onClick={saveContact}>연락처 저장</button></div>
    {imageUrl ? <div className="dbc-export"><img src={imageUrl} alt={`${contact.name} 저장용 명함 이미지`} /><a href={imageUrl} download={`${contact.name}-보배드림-명함.png`}>PNG 다운로드</a></div> : null}
    {manualLink ? <label className="dbc-manual-link">명함 링크<input readOnly value={url} onFocus={(event) => event.target.select()} /></label> : null}
    <p className="dbc-status" role="status">{status}</p>
    {standalone ? <div className="dbc-visit">{contact.phone ? <a href={`tel:${contact.phone.replace(/[^+\d]/g, "")}`}>전화 상담</a> : null}<a href={dealerUrl}>판매자 페이지 · 판매 차량 보기 →</a></div> : null}
  </>;

  if (standalone) return <main className="dbc-page"><div className="dbc-page-wrap"><a className="dbc-home" href={dealerUrl}>← 판매자 페이지</a><header><h1>딜러 명함</h1><p>차량 상담부터 거래까지, 편하게 연락하세요.</p></header>{content}</div></main>;
  return <Dialog.Root open={open} onOpenChange={(value) => { setOpen(value); setStatus(""); setManualLink(false); }}>
    <Dialog.Trigger asChild><button type="button" className="dp-businesscard-trigger">명함 만들기 · 공유 <span aria-hidden="true">↗</span></button></Dialog.Trigger>
    <Dialog.Portal><Dialog.Overlay className="dbc-overlay" /><Dialog.Content className="dbc-dialog"><header className="dbc-dialog-head"><div><Dialog.Title>딜러 명함 만들기</Dialog.Title><Dialog.Description>나를 소개하는 명함을 만들고 공유해 보세요.</Dialog.Description></div><Dialog.Close aria-label="명함 닫기">×</Dialog.Close></header><div className="dbc-dialog-body">{content}</div></Dialog.Content></Dialog.Portal>
  </Dialog.Root>;
}
