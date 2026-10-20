import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import "./listing-i18n.css";

export type ListingLocale = "ko" | "en" | "ru" | "ar";

type LocaleOption = {
  id: ListingLocale;
  code: string;
  native: string;
  dir: "ltr" | "rtl";
  intl: string;
};

export const listingLocaleOptions: readonly LocaleOption[] = [
  { id: "ko", code: "KR", native: "한국어", dir: "ltr", intl: "ko-KR" },
  { id: "en", code: "EN", native: "English", dir: "ltr", intl: "en-US" },
  { id: "ru", code: "RU", native: "Русский", dir: "ltr", intl: "ru-RU" },
  { id: "ar", code: "AR", native: "العربية", dir: "rtl", intl: "ar-SA" },
] as const;

type ForeignLocale = Exclude<ListingLocale, "ko">;
type Translation = Record<ForeignLocale, string>;

const words: Record<string, Translation> = {
  "로그인 상태 화면으로 전환했습니다.": { en: "Switched to the signed-in view.", ru: "Включён режим авторизованного пользователя.", ar: "تم التبديل إلى وضع تسجيل الدخول." },
  "미로그인 상태 화면으로 전환했습니다.": { en: "Switched to the guest view.", ru: "Включён гостевой режим.", ar: "تم التبديل إلى وضع الزائر." },
  "정식 서비스에서 이용해 주세요.": { en: "Available in the full service.", ru: "Доступно в полной версии сервиса.", ar: "متاح في الخدمة الكاملة." },
  "선택한 차종은 유지하고 검색어만 지워보세요.": { en: "Keep the vehicle type and clear only the search term.", ru: "Оставьте тип автомобиля и очистите поисковый запрос.", ar: "أبقِ نوع المركبة وامسح عبارة البحث فقط." },
  "필터를 초기화하고 다시 찾아보세요.": { en: "Reset the filters and search again.", ru: "Сбросьте фильтры и повторите поиск.", ar: "أعد ضبط عوامل التصفية وابحث مرة أخرى." },
  "조건에 맞는 차량이 없어요": { en: "No vehicles match your criteria", ru: "Автомобили по заданным условиям не найдены", ar: "لا توجد مركبات مطابقة للشروط" },
  "모델명, 트림으로 검색": { en: "Search by model or trim", ru: "Поиск по модели или комплектации", ar: "ابحث بالطراز أو الفئة" },
  "어떤 차를 찾으세요?": { en: "What car are you looking for?", ru: "Какой автомобиль вы ищете?", ar: "ما السيارة التي تبحث عنها؟" },
  "새로운 보배드림 서비스 안내": { en: "Discover the new BOBAEDREAM service", ru: "Новый сервис BOBAEDREAM", ar: "تعرّف على خدمة بوباي دريم الجديدة" },
  "제조사 · 모델 · 등급": { en: "Make · Model · Grade", ru: "Марка · Модель · Комплектация", ar: "الشركة · الطراز · الفئة" },
  "제조사 · 모델": { en: "Make · Model", ru: "Марка · Модель", ar: "الشركة · الطراز" },
  "로그인/회원가입": { en: "Sign in / Join", ru: "Войти / Регистрация", ar: "تسجيل الدخول / إنشاء حساب" },
  "차량 판매하기": { en: "Sell a car", ru: "Продать авто", ar: "بيع مركبة" },
  "차량 판매": { en: "Sell a car", ru: "Продать авто", ar: "بيع مركبة" },
  "전체 중고차": { en: "All used cars", ru: "Все автомобили с пробегом", ar: "جميع السيارات المستعملة" },
  "전체 차량": { en: "All vehicles", ru: "Все авто", ar: "كل المركبات" },
  "전체차량": { en: "All vehicles", ru: "Все авто", ar: "كل المركبات" },
  "중고차": { en: "Used cars", ru: "Авто с пробегом", ar: "سيارات مستعملة" },
  "국산차": { en: "Korean cars", ru: "Корейские авто", ar: "سيارات كورية" },
  "수입차": { en: "Imported cars", ru: "Импортные авто", ar: "سيارات مستوردة" },
  "전기차": { en: "Electric cars", ru: "Электромобили", ar: "سيارات كهربائية" },
  "트럭 · 특장": { en: "Trucks", ru: "Грузовики", ar: "شاحنات" },
  "트럭·특장": { en: "Trucks", ru: "Грузовики", ar: "شاحنات" },
  "바이크": { en: "Motorcycles", ru: "Мотоциклы", ar: "دراجات نارية" },
  "중고부품": { en: "Used parts", ru: "Запчасти", ar: "قطع مستعملة" },
  "부품 · 용품": { en: "Parts & accessories", ru: "Запчасти и аксессуары", ar: "قطع وإكسسوارات" },
  "부품·용품": { en: "Parts & accessories", ru: "Запчасти и аксессуары", ar: "قطع وإكسسوارات" },
  "커뮤니티": { en: "Community", ru: "Сообщество", ar: "المجتمع" },
  "더보기": { en: "More", ru: "Ещё", ar: "المزيد" },
  "캠핑카": { en: "Campers", ru: "Автодома", ar: "مركبات تخييم" },
  "건설기계": { en: "Construction", ru: "Спецтехника", ar: "معدات إنشائية" },
  "자재운반장비": { en: "Material handling", ru: "Складская техника", ar: "معدات مناولة" },
  "올드카": { en: "Classic cars", ru: "Классические авто", ar: "سيارات كلاسيكية" },
  "공지": { en: "Notice", ru: "Новости", ar: "إشعار" },
  "필터 초기화": { en: "Reset filters", ru: "Сбросить фильтры", ar: "إعادة ضبط الفلاتر" },
  "최근 필터 기록": { en: "Recent filters", ru: "Недавние фильтры", ar: "الفلاتر الأخيرة" },
  "필터 더보기": { en: "More filters", ru: "Ещё фильтры", ar: "المزيد من الفلاتر" },
  "검색어 지우기": { en: "Clear search", ru: "Очистить поиск", ar: "مسح البحث" },
  "추천 검색어": { en: "Suggested searches", ru: "Популярные запросы", ar: "عمليات بحث مقترحة" },
  "업데이트순": { en: "Recently updated", ru: "По обновлению", ar: "الأحدث تحديثاً" },
  "등록순": { en: "Newest listings", ru: "По дате публикации", ar: "الأحدث إضافة" },
  "가격 낮은순": { en: "Lowest price", ru: "Сначала дешевле", ar: "السعر: الأقل" },
  "가격 높은순": { en: "Highest price", ru: "Сначала дороже", ar: "السعر: الأعلى" },
  "연식 최신순": { en: "Newest year", ru: "Сначала новые", ar: "الأحدث سنة" },
  "주행거리 짧은순": { en: "Lowest mileage", ru: "Меньший пробег", ar: "الأقل مسافة" },
  "최고출력순": { en: "Highest power", ru: "По мощности", ar: "الأعلى قوة" },
  "가까운순": { en: "Nearest", ru: "Ближайшие", ar: "الأقرب" },
  "목록으로 보기": { en: "List view", ru: "Список", ar: "عرض القائمة" },
  "목록형": { en: "List", ru: "Список", ar: "قائمة" },
  "갤러리로 보기": { en: "Gallery view", ru: "Галерея", ar: "عرض المعرض" },
  "피드로 보기": { en: "Feed view", ru: "Лента", ar: "عرض الخلاصة" },
  "텍스트로 보기": { en: "Text view", ru: "Таблица", ar: "عرض نصي" },
  "한줄 광고로 보기": { en: "Compact view", ru: "Компактный вид", ar: "عرض مختصر" },
  "쇼츠 영상으로 보기": { en: "Short videos", ru: "Короткие видео", ar: "فيديوهات قصيرة" },
  "제조사": { en: "Make", ru: "Марка", ar: "الشركة" },
  "모델": { en: "Model", ru: "Модель", ar: "الطراز" },
  "인기모델": { en: "Popular models", ru: "Популярные модели", ar: "الطرازات الشائعة" },
  "세부모델": { en: "Generation", ru: "Поколение", ar: "الجيل" },
  "등급": { en: "Grade", ru: "Комплектация", ar: "الفئة" },
  "차종": { en: "Vehicle type", ru: "Тип кузова", ar: "نوع المركبة" },
  "차급": { en: "Class", ru: "Класс", ar: "الفئة الحجمية" },
  "바디타입": { en: "Body type", ru: "Кузов", ar: "نوع الهيكل" },
  "연식": { en: "Year", ru: "Год", ar: "السنة" },
  "주행거리": { en: "Mileage", ru: "Пробег", ar: "المسافة" },
  "가격": { en: "Price", ru: "Цена", ar: "السعر" },
  "옵션": { en: "Features", ru: "Опции", ar: "المواصفات" },
  "색상": { en: "Color", ru: "Цвет", ar: "اللون" },
  "외부색상": { en: "Exterior color", ru: "Цвет кузова", ar: "اللون الخارجي" },
  "연료": { en: "Fuel", ru: "Топливо", ar: "الوقود" },
  "변속기": { en: "Transmission", ru: "КПП", ar: "ناقل الحركة" },
  "지역": { en: "Location", ru: "Регион", ar: "المنطقة" },
  "매매단지": { en: "Auto complex", ru: "Автоцентр", ar: "مجمع السيارات" },
  "판매자유형": { en: "Seller type", ru: "Продавец", ar: "نوع البائع" },
  "판매자 유형": { en: "Seller type", ru: "Продавец", ar: "نوع البائع" },
  "판매 방식": { en: "Sale type", ru: "Тип продажи", ar: "طريقة البيع" },
  "판매방식": { en: "Sale type", ru: "Тип продажи", ar: "طريقة البيع" },
  "전체": { en: "All", ru: "Все", ar: "الكل" },
  "국산": { en: "Korean", ru: "Корейские", ar: "كورية" },
  "수입인기": { en: "Popular imports", ru: "Популярные импортные", ar: "المستوردة الشائعة" },
  "수입전체": { en: "All imports", ru: "Все импортные", ar: "كل المستوردة" },
  "기타 국산차": { en: "Other Korean cars", ru: "Другие корейские авто", ar: "سيارات كورية أخرى" },
  "기타 수입차": { en: "Other imports", ru: "Другие импортные авто", ar: "سيارات مستوردة أخرى" },
  "쉐보레(GM대우)": { en: "Chevrolet (GM Daewoo)", ru: "Chevrolet (GM Daewoo)", ar: "شيفروليه (GM دايو)" },
  "르노코리아(삼성)": { en: "Renault Korea (Samsung)", ru: "Renault Korea (Samsung)", ar: "رينو كوريا (سامسونغ)" },
  "KGM(쌍용)": { en: "KGM (SsangYong)", ru: "KGM (SsangYong)", ar: "KGM (سانغ يونغ)" },
  "도이치오토월드": { en: "Deutsche Autoworld", ru: "Дойче Аутоворлд", ar: "دويتشه أوتوورلد" },
  "람보르기니": { en: "Lamborghini", ru: "Lamborghini", ar: "لامبورغيني" },
  "롤스로이스": { en: "Rolls-Royce", ru: "Rolls-Royce", ar: "رولز رويس" },
  "제네시스": { en: "Genesis", ru: "Genesis", ar: "جينيسيس" },
  "르노코리아": { en: "Renault Korea", ru: "Renault Korea", ar: "رينو كوريا" },
  "쉐보레": { en: "Chevrolet", ru: "Chevrolet", ar: "شيفروليه" },
  "페라리": { en: "Ferrari", ru: "Ferrari", ar: "فيراري" },
  "포르쉐": { en: "Porsche", ru: "Porsche", ar: "بورشه" },
  "아우디": { en: "Audi", ru: "Audi", ar: "أودي" },
  "현대": { en: "Hyundai", ru: "Hyundai", ar: "هيونداي" },
  "기아": { en: "Kia", ru: "Kia", ar: "كيا" },
  "벤츠": { en: "Mercedes-Benz", ru: "Mercedes-Benz", ar: "مرسيدس بنز" },
  "볼보": { en: "Volvo", ru: "Volvo", ar: "فولفو" },
  "서울": { en: "Seoul", ru: "Сеул", ar: "سيول" },
  "경기": { en: "Gyeonggi", ru: "Кёнгидо", ar: "غيونغي" },
  "부산": { en: "Busan", ru: "Пусан", ar: "بوسان" },
  "개인": { en: "Private", ru: "Частное лицо", ar: "فرد" },
  "딜러": { en: "Dealer", ru: "Дилер", ar: "تاجر" },
  "브랜드": { en: "Certified", ru: "Брендовый дилер", ar: "معتمد" },
  "숏폼카": { en: "Video listings", ru: "Видеообъявления", ar: "إعلانات فيديو" },
  "가솔린": { en: "Gasoline", ru: "Бензин", ar: "بنزين" },
  "디젤": { en: "Diesel", ru: "Дизель", ar: "ديزل" },
  "하이브리드": { en: "Hybrid", ru: "Гибрид", ar: "هجين" },
  "전기": { en: "Electric", ru: "Электро", ar: "كهربائي" },
  "수동": { en: "Manual", ru: "Механика", ar: "يدوي" },
  "만원": { en: "₩10K", ru: "₩10 тыс.", ar: "₩10 آلاف" },
  "전국": { en: "Nationwide", ru: "Вся Корея", ar: "كل كوريا" },
  "필터": { en: "Filters", ru: "Фильтры", ar: "الفلاتر" },
  "초기화": { en: "Reset", ru: "Сбросить", ar: "إعادة ضبط" },
  "검색": { en: "Search", ru: "Поиск", ar: "بحث" },
  "채팅": { en: "Chat", ru: "Чат", ar: "محادثة" },
  "매물관리": { en: "Manage listings", ru: "Мои объявления", ar: "إدارة الإعلانات" },
  "로그아웃": { en: "Sign out", ru: "Выйти", ar: "تسجيل الخروج" },
  "로그인": { en: "Sign in", ru: "Войти", ar: "تسجيل الدخول" },
  "회원가입": { en: "Join", ru: "Регистрация", ar: "إنشاء حساب" },
  "고객센터": { en: "Support", ru: "Поддержка", ar: "الدعم" },
  "관심 매물": { en: "Saved cars", ru: "Избранное", ar: "المحفوظات" },
  "저장한 매물": { en: "Saved cars", ru: "Избранное", ar: "السيارات المحفوظة" },
  "페이지네이션": { en: "Pagination", ru: "Страницы", ar: "التنقل بين الصفحات" },
  "첫 페이지": { en: "First page", ru: "Первая страница", ar: "الصفحة الأولى" },
  "이전 페이지": { en: "Previous page", ru: "Предыдущая страница", ar: "الصفحة السابقة" },
  "다음 페이지": { en: "Next page", ru: "Следующая страница", ar: "الصفحة التالية" },
  "마지막 페이지": { en: "Last page", ru: "Последняя страница", ar: "الصفحة الأخيرة" },
  "회사소개": { en: "About us", ru: "О компании", ar: "من نحن" },
  "이용약관": { en: "Terms", ru: "Условия", ar: "الشروط" },
  "개인정보취급방침": { en: "Privacy", ru: "Конфиденциальность", ar: "الخصوصية" },
  "개인정보처리방침": { en: "Privacy", ru: "Конфиденциальность", ar: "الخصوصية" },
  "앱 설치": { en: "Get the app", ru: "Установить приложение", ar: "تثبيت التطبيق" },
};

const translateDynamic = (text: string, locale: ForeignLocale) => {
  const intl = listingLocaleOptions.find((option) => option.id === locale)?.intl ?? "en-US";
  const distanceUnit = locale === "en" ? "km" : locale === "ru" ? "км" : "كم";
  const ago = {
    en: { min: (n: string) => `${n} min ago`, hour: (n: string) => `${n} hr ago`, day: (n: string) => `${n} day${n === "1" ? "" : "s"} ago` },
    ru: { min: (n: string) => `${n} мин. назад`, hour: (n: string) => `${n} ч. назад`, day: (n: string) => `${n} дн. назад` },
    ar: { min: (n: string) => `منذ ${n} دقيقة`, hour: (n: string) => `منذ ${n} ساعة`, day: (n: string) => `منذ ${n} يوم` },
  }[locale];
  return text
    .replace(/(\d+)분\s*전/g, (_, n: string) => ago.min(n))
    .replace(/(\d+)시간\s*전/g, (_, n: string) => ago.hour(n))
    .replace(/(\d+)일\s*전/g, (_, n: string) => ago.day(n))
    .replace(/(\d{2,4})년(\d{1,2})월/g, (_, year: string, month: string) => `${month.padStart(2, "0")}/${year}`)
    .replace(/([\d,.]+)만km/g, (_, n: string) => `${(Number(n.replace(/,/g, "")) * 10000).toLocaleString(intl)} ${distanceUnit}`)
    .replace(/([\d,.]+)천km/g, (_, n: string) => `${(Number(n.replace(/,/g, "")) * 1000).toLocaleString(intl)} ${distanceUnit}`)
    .replace(/([\d,.]+)마력/g, (_, n: string) => locale === "en" ? `${n} hp` : locale === "ru" ? `${n} л.с.` : `${n} حصان`)
    .replace(/([\d,]+)만원/g, (_, n: string) => `₩${(Number(n.replace(/,/g, "")) * 10000).toLocaleString(intl)}`)
    .replace(/(\d+) 페이지/g, locale === "en" ? "Page $1" : locale === "ru" ? "Страница $1" : "الصفحة $1");
};

export function translateListingText(raw: string, locale: ListingLocale) {
  if (locale === "ko" || !raw.trim()) return raw;
  const leading = raw.match(/^\s*/)?.[0] ?? "";
  const trailing = raw.match(/\s*$/)?.[0] ?? "";
  let value = raw.slice(leading.length, raw.length - trailing.length || undefined);
  value = translateDynamic(value, locale);
  Object.keys(words).sort((a, b) => b.length - a.length).forEach((source) => {
    if (value.includes(source)) value = value.split(source).join(words[source][locale]);
  });
  return `${leading}${value}${trailing}`;
}

type ListingLocaleContextValue = {
  locale: ListingLocale;
  option: LocaleOption;
  setLocale: (locale: ListingLocale) => void;
  t: (text: string) => string;
};

const ListingLocaleContext = createContext<ListingLocaleContextValue | null>(null);

const readLocale = (): ListingLocale => {
  if (typeof window === "undefined") return "ko";
  const query = new URLSearchParams(window.location.search).get("lang");
  if (query === "ko" || query === "en" || query === "ru" || query === "ar") return query;
  const saved = window.localStorage.getItem("bbm-listing-language");
  return saved === "en" || saved === "ru" || saved === "ar" ? saved : "ko";
};

const titleByLocale: Record<ListingLocale, string> = {
  ko: "보배드림 중고차 — 중고차 매물 검색",
  en: "BOBAEDREAM Used Cars — Search car listings",
  ru: "BOBAEDREAM — автомобили с пробегом",
  ar: "بوباي دريم — سيارات مستعملة للبيع",
};

export function ListingLocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<ListingLocale>(readLocale);
  const option = listingLocaleOptions.find((item) => item.id === locale) ?? listingLocaleOptions[0];
  const originalText = useRef(new WeakMap<Node, string>());
  const originalAttrs = useRef(new WeakMap<Element, Map<string, string>>());

  useEffect(() => {
    const root = document.documentElement;
    root.lang = locale;
    root.dir = option.dir;
    root.dataset.listingLocale = locale;
    document.title = titleByLocale[locale];
    window.localStorage.setItem("bbm-listing-language", locale);
    const url = new URL(window.location.href);
    if (url.searchParams.get("lang") !== locale) {
      url.searchParams.set("lang", locale);
      window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
    }

    const translateNode = (node: Node) => {
      if (node.parentElement?.closest("[data-i18n-skip]")) return;
      const current = node.nodeValue ?? "";
      const stored = originalText.current.get(node);
      const knownTranslation = stored !== undefined && listingLocaleOptions.some((item) => current === translateListingText(stored, item.id));
      const original = stored === undefined || (current !== stored && !knownTranslation) ? current : stored;
      originalText.current.set(node, original);
      const translated = translateListingText(original, locale);
      if (current !== translated) node.nodeValue = translated;
    };
    const translateElement = (element: Element) => {
      if (element.closest("[data-i18n-skip]")) return;
      const attributes = ["aria-label", "placeholder", "title"];
      let stored = originalAttrs.current.get(element);
      if (!stored) { stored = new Map(); originalAttrs.current.set(element, stored); }
      attributes.forEach((name) => {
        const current = element.getAttribute(name);
        if (current === null) return;
        const previous = stored!.get(name);
        const knownTranslation = previous !== undefined && listingLocaleOptions.some((item) => current === translateListingText(previous, item.id));
        const original = previous === undefined || (current !== previous && !knownTranslation) ? current : previous;
        stored!.set(name, original);
        const translated = translateListingText(original, locale);
        if (translated !== current) element.setAttribute(name, translated);
      });
    };
    const translateTree = (node: Node) => {
      if (node.nodeType === Node.TEXT_NODE) { translateNode(node); return; }
      if (!(node instanceof Element) && node !== document.body) return;
      if (node instanceof Element) translateElement(node);
      const walker = document.createTreeWalker(node, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
      let current = walker.nextNode();
      while (current) {
        if (current.nodeType === Node.TEXT_NODE) translateNode(current);
        else if (current instanceof Element) translateElement(current);
        current = walker.nextNode();
      }
    };
    translateTree(document.body);
    const observer = new MutationObserver((records) => {
      records.forEach((record) => {
        if (record.type === "characterData") translateNode(record.target);
        record.addedNodes.forEach(translateTree);
        if (record.type === "attributes" && record.target instanceof Element) translateElement(record.target);
      });
    });
    observer.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ["aria-label", "placeholder", "title"] });
    return () => observer.disconnect();
  }, [locale, option.dir]);

  return <ListingLocaleContext.Provider value={{ locale, option, setLocale, t: (text) => translateListingText(text, locale) }}>{children}</ListingLocaleContext.Provider>;
}

export function useListingLocale() {
  const context = useContext(ListingLocaleContext);
  if (!context) throw new Error("useListingLocale must be used inside ListingLocaleProvider");
  return context;
}

export function ListingFlag({ locale }: { locale: ListingLocale }) {
  return <span className="listing-language-flag" aria-hidden="true"><svg viewBox="0 0 24 16" role="img">
    {locale === "ko" ? <><rect width="24" height="16" fill="#fff" /><g transform="rotate(33 12 8)"><path d="M8.1 8a3.9 3.9 0 0 1 7.8 0 1.95 1.95 0 0 0-3.9 0 1.95 1.95 0 0 1-3.9 0" fill="#cd2e3a" /><path d="M15.9 8a3.9 3.9 0 0 1-7.8 0A1.95 1.95 0 0 0 12 8a1.95 1.95 0 0 1 3.9 0" fill="#0047a0" /></g><g fill="#111"><path d="M2.1 3.1l4-2.1.48.9-4 2.1zm.65 1.2l4-2.1.48.9-4 2.1zm.65 1.2l4-2.1.48.9-4 2.1zM17.4 12l4-2.1.48.9-4 2.1zm.65 1.2l4-2.1.48.9-4 2.1zm.65 1.2l4-2.1.48.9-4 2.1zM17.5 4l4 2.1-.48.9-4-2.1zm-.65 1.2l1.55.82-.48.9-1.55-.82zm2.35 1.24l1.55.82-.48.9-1.55-.82zM2.5 10l1.55.82-.48.9-1.55-.82zm2.35 1.24l1.55.82-.48.9-1.55-.82zm-3 1.16l4 2.1-.48.9-4-2.1z" /></g></> : null}
    {locale === "en" ? <><rect width="24" height="16" fill="#fff" /><g fill="#b22234">{[0,2,4,6,8,10,12].map((y) => <rect key={y} y={y * 16 / 13} width="24" height={16 / 13} />)}</g><rect width="10.5" height="8.6" fill="#3c3b6e" /><g fill="#fff">{[2,5,8].map((x) => [2,4.3,6.6].map((y) => <circle key={`${x}-${y}`} cx={x} cy={y} r=".45" />))}</g></> : null}
    {locale === "ru" ? <><rect width="24" height="5.34" fill="#fff" /><rect y="5.33" width="24" height="5.34" fill="#0039a6" /><rect y="10.66" width="24" height="5.34" fill="#d52b1e" /></> : null}
    {locale === "ar" ? <><rect width="24" height="16" fill="#006c35" /><path d="M5 7.2h14M7 10.5h10" stroke="#fff" strokeWidth="1" strokeLinecap="round" /><circle cx="12" cy="5" r=".8" fill="#fff" /></> : null}
  </svg></span>;
}

export function ListingLanguageSelect({ compact = false }: { compact?: boolean }) {
  const { locale, option, setLocale } = useListingLocale();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent) => { if (!ref.current?.contains(event.target as Node)) setOpen(false); };
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("pointerdown", close); document.removeEventListener("keydown", escape); };
  }, [open]);
  return <div className={`listing-language${compact ? " is-compact" : ""}`} ref={ref} data-i18n-skip>
    <button type="button" className="listing-language-trigger" aria-label="Select language" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
      <ListingFlag locale={locale} /><span>{option.code}</span><i aria-hidden="true">⌄</i>
    </button>
    {open ? <div className="listing-language-menu" role="menu" aria-label="Select language">
      {listingLocaleOptions.map((item) => <button key={item.id} type="button" role="menuitemradio" aria-checked={item.id === locale} className={item.id === locale ? "is-active" : ""} onClick={() => { setLocale(item.id); setOpen(false); }}>
        <ListingFlag locale={item.id} /><strong>{item.native}</strong><small>{item.code}</small><i aria-hidden="true">{item.id === locale ? "✓" : ""}</i>
      </button>)}
    </div> : null}
  </div>;
}
