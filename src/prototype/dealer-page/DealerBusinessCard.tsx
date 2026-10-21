import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { cardPng, cardThemes, cardUrl, cardVcf, defaultCardStyle, downloadBlob, profileUrl, readCardStyle, serializeCardStyle, cardFields, cardFieldHref, loadCardLogo, type CardContact, type CardStyle } from "./business-card";
import "./business-card.css";
import { stockCategories, stockUrl } from "./dealer-stock";

type Props = { contact: CardContact; shop: string; emp: string; standalone?: boolean; trigger?: ReactNode };

function CardPreview({ contact, style }: { contact: CardContact; style: CardStyle }) {
  const palette = cardThemes[style.theme];
  const [photoFailed, setPhotoFailed] = useState(false);
  const socials = cardFields.filter(({ id }) => id !== "mobile" && cardFieldHref(id, style.fields[id]));
  return <><article className="dbc-card" style={{ "--dbc-bg": palette.background, "--dbc-ink": palette.ink } as CSSProperties} aria-label={`${contact.name} 딜러 명함`}>
    <div className="dbc-brand">{style.logo ? <img src={style.logo} alt="명함 로고" /> : null}<strong>{style.title.trim() || contact.company}</strong></div>
    <div className="dbc-identity"><h2>{contact.name}</h2><p>{contact.company} · {contact.role}</p></div>
    {!photoFailed ? <img className="dbc-photo" src={contact.photo} alt={`${contact.name} 프로필`} onError={() => setPhotoFailed(true)} /> : null}
    <p className="dbc-intro">{style.intro}</p>
    <div className="dbc-contact">{cardFieldHref("mobile", style.fields.mobile) || contact.phone ? <strong>{cardFieldHref("mobile", style.fields.mobile) ? style.fields.mobile : contact.phone}</strong> : null}<span>{contact.address}</span></div>
    <small className="dbc-gallery">서울오토갤러리</small>
  </article>{socials.length ? <nav className="dbc-socials" aria-label="명함 SNS">{socials.map(({ id, label }) => <a key={id} href={cardFieldHref(id, style.fields[id])!} target="_blank" rel="noopener noreferrer"><span>{label}</span><strong>{style.fields[id]}</strong><span aria-hidden="true">↗</span></a>)}</nav> : null}</>;
}

export function DealerBusinessCard({ contact, shop, emp, standalone = false, trigger }: Props) {
  const key = `bobaedream:dealer-card:${shop}:${emp}`;
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [style, setStyle] = useState<CardStyle>(() => {
    if (standalone) return readCardStyle(window.location.hash);
    try { const saved = localStorage.getItem(key); return saved ? readCardStyle(saved) : defaultCardStyle; } catch { return defaultCardStyle; }
  });
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [manualLink, setManualLink] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [logoBusy, setLogoBusy] = useState(false);
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
    const update = () => { setStyle(readCardStyle(window.location.hash)); setStatus(""); setManualLink(false); };
    window.addEventListener("hashchange", update);
    document.title = `${contact.name} · ${contact.company} | 디지털 명함`;
    return () => window.removeEventListener("hashchange", update);
  }, [standalone, contact.name, contact.company]);

  const updateStyle = (next: CardStyle) => {
    setStyle(next); setStatus("");
    try { localStorage.setItem(key, serializeCardStyle(next)); } catch { /* The current card can still be shared without storage. */ }
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
  const share = async () => {
    if (!valid()) return;
    if (!navigator.share) { await copy(); return; }
    try { await navigator.share({ title: `${contact.name} · ${style.title.trim() || contact.company}`, text: `${contact.name} 딜러의 명함입니다.`, url }); setStatus("명함을 공유했어요."); }
    catch (error) { if (!(error instanceof DOMException && error.name === "AbortError")) await copy(); }
  };
  const saveImage = async () => {
    if (!valid()) return;
    setBusy(true); setStatus("");
    try { setImageUrl(URL.createObjectURL(await cardPng(contact, style))); setStatus("아래 이미지를 확인하고 PNG 파일로 저장하세요."); }
    catch { setStatus("이미지를 저장하지 못했어요. 링크 공유를 이용해 주세요."); }
    finally { setBusy(false); }
  };
  const saveContact = () => {
    if (!valid()) return;
    downloadBlob(new Blob([cardVcf(contact, dealerUrl, style)], { type: "text/vcard;charset=utf-8" }), `${contact.name}-연락처.vcf`);
    setStatus("연락처 파일을 열면 주소록에 저장할 수 있어요.");
  };
  const content = <>
    <CardPreview contact={contact} style={style} />
    <nav className="dbc-stock" aria-label="판매차량 바로가기">
      <a className="dbc-stock-total" href={stockUrl(window.location.href, shop, emp)}>판매차량 <strong>{contact.listingCount ?? 0}대</strong><span aria-hidden="true">→</span></a>
      <div>{stockCategories.map((category) => <a key={category} href={stockUrl(window.location.href, shop, emp, category)}>{category}<span aria-hidden="true">↗</span></a>)}</div>
    </nav>
    {!standalone && editing ? <div className="dbc-editor">
      <fieldset className="dbc-brand-editor"><legend>로고 · 타이틀</legend>
        <div className="dbc-logo-edit">{style.logo ? <img src={style.logo} alt="선택한 로고" /> : null}<label className="dbc-upload">{logoBusy ? "로고 불러오는 중…" : style.logo ? "로고 변경" : "로고 추가"}<input type="file" accept="image/png,image/jpeg,image/webp" aria-label="로고 파일" disabled={logoBusy} onChange={async (event) => {
          const file = event.target.files?.[0]; event.target.value = ""; if (!file) return;
          setLogoBusy(true);
          try { const logo = await loadCardLogo(file); setStyle((current) => { const next = { ...current, logo }; try { localStorage.setItem(key, serializeCardStyle(next)); } catch { /* Session only. */ } return next; }); setStatus(""); }
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
      <p>명함 설정은 이 기기에 저장돼요. 공유한 링크에는 로고·타이틀과 선택한 연락처·SNS가 담겨요.</p>
    </div> : null}
    <div className="dbc-actions"><button type="button" className="dbc-primary" disabled={logoBusy} onClick={share}>명함 공유하기</button><button type="button" disabled={logoBusy} onClick={copy}>링크 복사</button><button type="button" disabled={busy || logoBusy} onClick={saveImage}>{busy ? "이미지 만드는 중…" : "이미지 저장"}</button><button type="button" onClick={saveContact}>연락처 저장</button></div>
    {imageUrl ? <div className="dbc-export"><img src={imageUrl} alt={`${contact.name} 저장용 명함 이미지`} /><a href={imageUrl} download={`${contact.name}-명함.png`}>PNG 다운로드</a></div> : null}
    {manualLink ? <label className="dbc-manual-link">명함 링크<input readOnly value={url} onFocus={(event) => event.target.select()} /></label> : null}
    <p className="dbc-status" role="status">{status}</p>
    {standalone && (cardFieldHref("mobile", style.fields.mobile) || contact.phone) ? <div className="dbc-visit"><a href={cardFieldHref("mobile", style.fields.mobile) || `tel:${contact.phone.replace(/[^+\d]/g, "")}`}>전화 상담</a></div> : null}
    {!standalone ? <button type="button" className="dbc-edit-toggle" disabled={logoBusy} onClick={() => { if (editing && !valid()) return; setEditing(!editing); setStatus(""); }}>{editing ? "편집 완료" : "명함 편집하기"}</button> : null}
  </>;

  if (standalone) return <main className="dbc-page"><div className="dbc-page-wrap"><a className="dbc-home" href={dealerUrl}>← 판매자 페이지</a><header><h1>{contact.name} 딜러님 모바일 명함</h1><p>차량 상담부터 거래까지, 편하게 연락하세요.</p></header>{content}</div></main>;
  return <Dialog.Root open={open} onOpenChange={(value) => { setOpen(value); setEditing(false); setStatus(""); setManualLink(false); }}>
    <Dialog.Trigger asChild>{trigger ?? <button type="button" className="dp-businesscard-trigger">명함 만들기 · 공유 <span aria-hidden="true">↗</span></button>}</Dialog.Trigger>
    <Dialog.Portal><Dialog.Overlay className="dbc-overlay" /><Dialog.Content className="dbc-dialog"><header className="dbc-dialog-head"><div><Dialog.Title>{contact.name} 딜러님 모바일 명함</Dialog.Title><Dialog.Description>{editing ? "명함 정보를 수정하고 편집 완료를 눌러 주세요." : "연락처와 판매차량을 확인하고 명함을 공유하세요."}</Dialog.Description></div><Dialog.Close aria-label="명함 닫기">×</Dialog.Close></header><div className="dbc-dialog-body">{content}</div></Dialog.Content></Dialog.Portal>
  </Dialog.Root>;
}
