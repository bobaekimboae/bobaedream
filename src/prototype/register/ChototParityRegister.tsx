import { useEffect, useMemo, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import {
  ChatBubbleIcon,
  ChevronDownIcon,
  Cross2Icon,
  HamburgerMenuIcon,
  HeartIcon,
  ImageIcon,
  InfoCircledIcon,
  MagnifyingGlassIcon,
  PlusIcon,
} from "@radix-ui/react-icons";
import "./chotot-parity.css";

const publicAsset = (path: string) => `${import.meta.env.BASE_URL}assets/${path}`;
const initialPhoto = publicAsset("cars/supercar-sheet-v01/sc-019.jpg");

type MediaItem = { id: string; name: string; src: string; objectUrl?: boolean };

type FieldProps = {
  id: string;
  label: string;
  value: string;
  required?: boolean;
  placeholder?: string;
  error?: string;
  suffix?: string;
  clearable?: boolean;
  select?: boolean;
  options?: string[];
  onChange?: (value: string) => void;
  onClear?: () => void;
};

function Field({ id, label, value, required, placeholder, error, suffix, clearable, select, options, onChange, onClear }: FieldProps) {
  return (
    <div className={`ct-field-wrap${error ? " is-error" : ""}`}>
      <div className="ct-field">
        <label htmlFor={id}>{label}{required && <span aria-hidden="true"> *</span>}</label>
        {select ? (
          <div className="ct-field-button">
            <select id={id} aria-label={`${label} 선택`} value={value} onChange={(event) => onChange?.(event.target.value)}>
              <option value="">{placeholder || "선택"}</option>
              {(options ?? (value ? [value] : [])).map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
            <ChevronDownIcon aria-hidden="true" />
          </div>
        ) : (
          <input id={id} value={value} placeholder={placeholder} onChange={(event) => onChange?.(event.target.value)} />
        )}
        {suffix && <span className="ct-field-suffix">{suffix}</span>}
        {clearable && value && (
          <button type="button" className="ct-clear" aria-label={`${label} 지우기`} onClick={onClear}>
            <Cross2Icon />
          </button>
        )}
      </div>
      {error && <p className="ct-error" role="alert">{error}</p>}
    </div>
  );
}

function PillGroup({ label, value, options, onChange, compact }: { label: string; value: string; options: string[]; onChange: (value: string) => void; compact?: boolean }) {
  return (
    <fieldset className={`ct-pills${compact ? " is-compact" : ""}`}>
      <legend>{label}</legend>
      <div className="ct-pill-row">
        {options.map((option) => (
          <button key={option} type="button" className={value === option ? "is-selected" : ""} aria-pressed={value === option} onClick={() => onChange(option)}>{option}</button>
        ))}
      </div>
    </fieldset>
  );
}

export default function ChototParityRegister({ notify }: { notify: (message: string) => void }) {
  const [media, setMedia] = useState<MediaItem[]>([{ id: "sample", name: "차량 대표 사진", src: initialPhoto }]);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [description, setDescription] = useState("2022년식 현대 그랜저입니다. 주행거리 25,000km, 무사고 차량이며 깔끔하게 관리했습니다.");
  const [title, setTitle] = useState("현대 그랜저 2022 검정 25,000km");
  const [price, setPrice] = useState("");
  const [address, setAddress] = useState("");
  const [seller, setSeller] = useState("개인");
  const [condition, setCondition] = useState("중고");
  const [maker, setMaker] = useState("현대");
  const [model, setModel] = useState("그랜저");
  const [year, setYear] = useState("2022");
  const [variant, setVariant] = useState("");
  const [transmission, setTransmission] = useState("");
  const [fuel, setFuel] = useState("");
  const [mileage, setMileage] = useState("25000");
  const [origin, setOrigin] = useState("");
  const [seats, setSeats] = useState("");
  const [bodyType, setBodyType] = useState("");
  const [color, setColor] = useState("검정");
  const [ownerCount, setOwnerCount] = useState("1인 소유");
  const [accessories, setAccessories] = useState("없음");
  const [inspection, setInspection] = useState("있음");
  const [showDocument, setShowDocument] = useState(false);
  const [documentName, setDocumentName] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const documentRef = useRef<HTMLInputElement>(null);
  const objectUrlsRef = useRef<string[]>([]);

  const errors = useMemo(() => ({
    price: price && Number(price.replace(/[^0-9]/g, "")) >= 500 ? "" : "판매가격을 500만원 이상 입력해주세요.",
    address: address ? "" : "거래지역을 선택해주세요.",
    transmission: transmission ? "" : "변속기를 선택해주세요.",
    fuel: fuel ? "" : "연료를 선택해주세요.",
  }), [address, fuel, price, transmission]);

  useEffect(() => () => {
    objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
  }, []);

  const addMedia = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []).slice(0, Math.max(0, 10 - media.length));
    if (!files.length) return;
    const next = files.map((file) => {
      const src = URL.createObjectURL(file);
      objectUrlsRef.current.push(src);
      return { id: `${file.name}-${file.lastModified}-${Math.random()}`, name: file.name, src, objectUrl: true };
    });
    setMedia((current) => [...current, ...next]);
    event.target.value = "";
  };

  const removeMedia = (id: string) => {
    setMedia((current) => {
      const target = current.find((item) => item.id === id);
      if (target?.objectUrl) {
        URL.revokeObjectURL(target.src);
        objectUrlsRef.current = objectUrlsRef.current.filter((url) => url !== target.src);
      }
      return current.filter((item) => item.id !== id);
    });
  };

  const dropMedia = (targetId: string) => {
    if (!draggedId || draggedId === targetId) return;
    setMedia((current) => {
      const from = current.findIndex((item) => item.id === draggedId);
      const to = current.findIndex((item) => item.id === targetId);
      if (from < 0 || to < 0) return current;
      const next = [...current];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
    setDraggedId(null);
  };

  const saveDraft = () => {
    localStorage.setItem("bbm-register-draft", JSON.stringify({ description, title, price, address, seller, condition, maker, model, year, variant, transmission, fuel, mileage, origin, seats, bodyType, color, ownerCount, accessories, inspection, showDocument }));
    notify("임시저장했습니다.");
  };

  const submit = () => {
    const firstError = Object.values(errors).find(Boolean);
    if (firstError) {
      notify(firstError);
      document.querySelector(".ct-field-wrap.is-error")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    notify("등록 전 최종 확인이 완료되었습니다.");
  };

  return (
    <div className="ct-register-page">
      <header className="ct-register-header">
        <div className="ct-register-header__top">
          <button type="button" aria-label="전체 메뉴" onClick={() => notify("전체 메뉴") }><HamburgerMenuIcon /></button>
          <img src={publicAsset("bbm/header-logo.svg")} alt="보배드림" />
          <button type="button" className="ct-open-app" onClick={() => notify("보배드림 앱 열기")}>앱 열기</button>
        </div>
        <div className="ct-register-header__search">
          <div><MagnifyingGlassIcon aria-hidden="true" /><span>차량을 검색해보세요</span></div>
          <button type="button" aria-label="찜"><HeartIcon /></button>
          <button type="button" aria-label="채팅"><ChatBubbleIcon /></button>
        </div>
      </header>

      <main className="ct-register-main" aria-label="자동차 매물 등록">
        <section className="ct-card ct-primary-card">
          <div className="ct-section-title-row">
            <h1>사진/영상 <span>*</span></h1>
            <button type="button" aria-label="사진 및 영상 안내" onClick={() => notify("차량 전체가 잘 보이는 사진을 등록해주세요.")}><InfoCircledIcon /></button>
          </div>
          <div className="ct-media-row" aria-label="등록 사진과 영상">
            <button type="button" className="ct-media-add" aria-label="사진 또는 영상 추가" onClick={() => fileRef.current?.click()}>
              <span className="ct-media-add__icon"><ImageIcon /><PlusIcon /></span>
            </button>
            <input ref={fileRef} className="ct-native-file" type="file" accept="image/*,video/*" multiple onChange={addMedia} />
            {media.map((item, index) => (
              <div key={item.id} data-media-id={item.id} className="ct-media-thumb" draggable onDragStart={() => setDraggedId(item.id)} onDragOver={(event: DragEvent) => event.preventDefault()} onDrop={() => dropMedia(item.id)} onTouchStart={() => setDraggedId(item.id)} onTouchEnd={(event) => {
                const touch = event.changedTouches[0];
                const targetId = document.elementFromPoint(touch.clientX, touch.clientY)?.closest<HTMLElement>("[data-media-id]")?.dataset.mediaId;
                if (targetId) dropMedia(targetId);
              }}>
                <img src={item.src} alt={item.name} />
                <button type="button" className="ct-media-remove" aria-label={`${item.name} 삭제`} onClick={() => removeMedia(item.id)}><Cross2Icon /></button>
                {index === 0 && <span className="ct-cover-badge">대표</span>}
              </div>
            ))}
          </div>
          <p className="ct-media-help">길게 눌러 사진 순서를 변경할 수 있습니다.</p>

          <div className="ct-description-field">
            <label htmlFor="ct-description">매물 설명 <span>*</span></label>
            <textarea id="ct-description" maxLength={1500} value={description} onChange={(event) => setDescription(event.target.value)} />
            <span>{description.length}/1,500자</span>
          </div>

          <Field id="ct-title" label="매물 제목" required value={title} clearable onChange={setTitle} onClear={() => setTitle("")} />
          <Field id="ct-price" label="판매가격" required value={price} suffix="만원" error={errors.price} onChange={setPrice} />
          <Field id="ct-address" label="거래지역" required value={address} placeholder="지역 선택" error={errors.address} select options={["서울특별시", "경기도", "인천광역시", "부산광역시", "대구광역시"]} onChange={setAddress} />
          <PillGroup label="판매자 유형 *" value={seller} options={["개인", "전문 판매자"]} onChange={setSeller} />
        </section>

        <section className="ct-card ct-detail-card">
          <h2>상세 정보</h2>
          <div className="ct-detail-grid">
            <div className="ct-grid-full"><Field id="ct-category" label="카테고리" required value="자동차 / 승용차" select options={["자동차 / 승용차", "자동차 / SUV", "자동차 / 화물차", "자동차 / 기타"]} /></div>

            <div className="ct-grid-full ct-document-box">
              <div className="ct-document-head"><strong>차량 서류</strong><InfoCircledIcon aria-hidden="true" /></div>
              <button type="button" className="ct-document-upload" onClick={() => documentRef.current?.click()}><ImageIcon /><span>{documentName || "서류 추가"}</span></button>
              <input ref={documentRef} className="ct-native-file" type="file" accept="image/*,.pdf" onChange={(event) => setDocumentName(event.target.files?.[0]?.name ?? "")} />
              <label className="ct-document-toggle"><span>매물에 표시</span><input type="checkbox" checked={showDocument} onChange={(event) => setShowDocument(event.target.checked)} /><i aria-hidden="true" /></label>
            </div>

            <PillGroup label="차량 상태 *" value={condition} options={["중고", "신차"]} onChange={setCondition} compact />
            <Field id="ct-maker" label="제조사" required value={maker} clearable onChange={setMaker} onClear={() => setMaker("")} />
            <Field id="ct-model" label="모델" required value={model} clearable onChange={setModel} onClear={() => setModel("")} />
            <Field id="ct-year" label="연식" required value={year} clearable onChange={setYear} onClear={() => setYear("")} />
            <Field id="ct-variant" label="세부모델" value={variant} placeholder="선택" select options={["2.5 가솔린", "3.5 가솔린", "1.6 하이브리드"]} onChange={setVariant} />
            <Field id="ct-transmission" label="변속기" required value={transmission} placeholder="선택" error={errors.transmission} select options={["자동", "수동", "CVT"]} onChange={setTransmission} />
            <Field id="ct-fuel" label="연료" required value={fuel} placeholder="선택" error={errors.fuel} select options={["가솔린", "디젤", "하이브리드", "전기", "LPG"]} onChange={setFuel} />
            <Field id="ct-mileage" label="주행거리" required value={mileage} clearable onChange={setMileage} onClear={() => setMileage("")} />
            <Field id="ct-origin" label="수입구분" value={origin} placeholder="선택" select options={["국산", "정식수입", "병행수입"]} onChange={setOrigin} />
            <Field id="ct-seats" label="승차정원" value={seats} placeholder="선택" select options={["2인승", "4인승", "5인승", "7인승", "9인승 이상"]} onChange={setSeats} />
            <Field id="ct-body" label="차종" value={bodyType} placeholder="선택" select options={["세단", "SUV", "해치백", "쿠페", "왜건", "승합"]} onChange={setBodyType} />
            <Field id="ct-color" label="색상" value={color} clearable onChange={setColor} onClear={() => setColor("")} />
            <PillGroup label="소유자 변경" value={ownerCount} options={["1인 소유", "2인 이상"]} onChange={setOwnerCount} compact />
            <PillGroup label="부속품 포함" value={accessories} options={["있음", "없음"]} onChange={setAccessories} compact />
            <PillGroup label="검사 유효기간" value={inspection} options={["있음", "없음"]} onChange={setInspection} compact />
          </div>
        </section>
      </main>

      <footer className="ct-register-actions">
        <button type="button" onClick={() => setPreviewOpen(true)}>미리보기</button>
        <button type="button" onClick={saveDraft}>임시저장</button>
        <button type="button" className="is-primary" onClick={submit}>등록하기</button>
      </footer>

      {previewOpen && (
        <div className="ct-preview-backdrop" role="presentation" onClick={() => setPreviewOpen(false)}>
          <section className="ct-preview" role="dialog" aria-modal="true" aria-label="매물 미리보기" onClick={(event) => event.stopPropagation()}>
            <button type="button" aria-label="미리보기 닫기" onClick={() => setPreviewOpen(false)}><Cross2Icon /></button>
            {media[0] && <img src={media[0].src} alt="대표 차량" />}
            <h2>{title || "매물 제목"}</h2>
            <strong>{price ? `${price}만원` : "가격 미정"}</strong>
            <p>{description}</p>
          </section>
        </div>
      )}
    </div>
  );
}
