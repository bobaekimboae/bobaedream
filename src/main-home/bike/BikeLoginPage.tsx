import { useEffect, useState } from "react";
import "./bike-login.css";

const asset = (...parts: string[]) => parts.join("/");
const homeUrl = "./?home=as24";

function BikeWordmark() {
  return (
    <span className="bml-wordmark" aria-label="보배드림 바이크">
      <span className="bml-emblem"><img src={asset("..", "assets", "bike", "logo", "cycle-trader-symbol-orange.svg")} alt="" /></span>
      <span className="bml-word">보배드림</span>
      <span className="bml-badge">바이크</span>
    </span>
  );
}

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" fill="none" stroke="currentColor" strokeWidth="1.7"/><circle cx="12" cy="12" r="2.8" fill="none" stroke="currentColor" strokeWidth="1.7"/></svg>
  ) : (
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 3 18 18M10.6 6.2A9.5 9.5 0 0 1 12 6c6 0 9.5 6 9.5 6a16.1 16.1 0 0 1-3.1 3.8M6.1 6.1C3.8 7.7 2.5 12 2.5 12s3.5 6 9.5 6a9.5 9.5 0 0 0 3-.5M9.9 9.9a3 3 0 0 0 4.2 4.2" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>
  );
}

function SearchIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.6" fill="none" stroke="currentColor" strokeWidth="1.8"/><path d="m16 16 4.2 4.2" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>;
}

export default function BikeLoginPage() {
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberId, setRememberId] = useState(true);
  const [rememberLogin, setRememberLogin] = useState(false);
  const [toast, setToast] = useState("");
  const enabled = id.trim().length > 0 && password.length > 0;

  useEffect(() => {
    document.title = "로그인 - 보배드림 바이크";
    const targets = [document.documentElement, document.body, document.getElementById("root")].filter(Boolean) as HTMLElement[];
    const prev = targets.map((el) => [el.style.overflow, el.style.height] as const);
    targets.forEach((el) => { el.style.overflow = "visible"; el.style.height = "auto"; });
    return () => targets.forEach((el, i) => { el.style.overflow = prev[i][0]; el.style.height = prev[i][1]; });
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(""), 2200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!enabled) return;
    setToast("로그인 인증 연동 전 시안입니다.");
  };

  const social = (name: string) => setToast(`${name} 로그인 인증 연동 전 시안입니다.`);

  return (
    <div className="bml">
      <header className="bml-desktop-header" aria-label="보배드림 바이크">
        <div className="bml-header-main">
          <a className="bml-header-logo" href={homeUrl} aria-label="보배드림 바이크 처음으로"><BikeWordmark /></a>
          <form className="bml-header-search" onSubmit={(event) => event.preventDefault()}>
            <input aria-label="바이크 검색" placeholder="어떤 바이크를 찾으세요?" />
            <button type="submit" aria-label="검색"><SearchIcon /></button>
          </form>
          <nav className="bml-header-actions" aria-label="회원 메뉴">
            <a className="bml-heart" href={homeUrl} aria-label="관심 매물">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.5s-8-4.8-8-10.5A4.5 4.5 0 0 1 12 7a4.5 4.5 0 0 1 8 3c0 5.7-8 10.5-8 10.5Z" fill="none" stroke="currentColor" strokeWidth="1.8"/></svg>
            </a>
            <a className="bml-login-pill" href="./?home=as24&auth=login" aria-current="page">로그인/회원가입</a>
            <a className="bml-sell-pill" href="./?register=bike">바이크 판매</a>
            <button className="bml-account" type="button" aria-label="로그인 및 계정 메뉴">
              <span><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3.5" fill="none" stroke="currentColor" strokeWidth="1.7"/><path d="M5.5 19c.8-4 3-6 6.5-6s5.7 2 6.5 6" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg></span>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 9 5 5 5-5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
          </nav>
        </div>
        <div className="bml-header-nav">
          <nav aria-label="주 메뉴">
            <a href={homeUrl}>바이크 검색</a>
            <a href="./?condition=중고">중고 바이크</a>
            <a href="./?condition=신차">신차 바이크</a>
            <a href={homeUrl}>바이크샵</a>
            <a href="./?category=부품+·+용품&bikeMenu=parts">중고 용품·장비</a>
            <a href="../community/bobaedream-pc-board-list.html?layout=reddit">커뮤니티</a>
          </nav>
          <a className="bml-notice" href="../community/bobaedream-pc-board-list.html?layout=reddit"><b>공지</b><i /><span>새로운 보배드림 서비스 안내</span></a>
        </div>
      </header>

      <header className="bml-mobile-header">
        <span>로그인 - 보배드림 바이크</span>
        <a href={homeUrl} aria-label="닫기"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5l14 14M19 5 5 19" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg></a>
      </header>

      <main className="bml-main">
        <a className="bml-auth-logo" href={homeUrl}><BikeWordmark /><small>보배드림이 만든 바이크 전문 매매 플랫폼</small></a>
        <nav className="bml-tabs" aria-label="회원 인증">
          <a className="is-active" href="./?home=as24&auth=login" aria-current="page">로그인</a>
          <button type="button" onClick={() => setToast("회원가입 화면은 다음 단계에서 연결합니다.")}>회원가입</button>
        </nav>

        <form className="bml-form" onSubmit={submit}>
          <label className="bml-input">
            <span className="sr-only">아이디</span>
            <input type="text" autoComplete="username" placeholder="아이디를 입력해주세요" value={id} onChange={(event) => setId(event.currentTarget.value)} />
          </label>
          <label className="bml-input bml-password">
            <span className="sr-only">비밀번호</span>
            <input type={showPassword ? "text" : "password"} autoComplete="current-password" placeholder="비밀번호를 입력해주세요." value={password} onChange={(event) => setPassword(event.currentTarget.value)} />
            <button type="button" aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 보기"} aria-pressed={showPassword} onClick={() => setShowPassword((value) => !value)}><EyeIcon open={showPassword} /></button>
          </label>
          <div className="bml-options">
            <label><input type="checkbox" checked={rememberId} onChange={(event) => setRememberId(event.currentTarget.checked)} /><span>아이디 저장</span></label>
            <label><input type="checkbox" checked={rememberLogin} onChange={(event) => setRememberLogin(event.currentTarget.checked)} /><span>로그인 유지</span></label>
          </div>
          <button className="bml-submit" type="submit" disabled={!enabled}>로그인</button>
          <div className="bml-find"><span>계정을 잊으셨나요?</span><nav><button type="button" onClick={() => setToast("아이디 찾기는 인증 연동 후 제공합니다.")}>아이디찾기</button><i /><button type="button" onClick={() => setToast("비밀번호 찾기는 인증 연동 후 제공합니다.")}>비밀번호 찾기</button></nav></div>
        </form>

        <div className="bml-or"><span />또는<span /></div>
        <div className="bml-socials">
          <button type="button" onClick={() => social("네이버")}><b className="is-naver">N</b><span>네이버 로그인</span></button>
          <button type="button" onClick={() => social("구글")}><b className="is-google"><i>G</i></b><span>구글 로그인</span></button>
          <button type="button" onClick={() => social("카카오")}><b className="is-kakao"><svg viewBox="0 0 28 24" aria-hidden="true"><path d="M14 2C7.4 2 2 6.2 2 11.3c0 3.2 2.1 6 5.4 7.7l-1.1 4 4.8-2.7c.9.2 1.9.3 2.9.3 6.6 0 12-4.2 12-9.3S20.6 2 14 2Z" fill="currentColor"/></svg></b><span>카카오 로그인</span></button>
          <button type="button" onClick={() => social("애플")}><b className="is-apple"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16.8 12.8c0-2.2 1.8-3.3 1.9-3.4-1-1.5-2.7-1.7-3.3-1.7-1.4-.2-2.7.8-3.4.8-.7 0-1.8-.8-3-.8-1.5 0-3 .9-3.8 2.3-1.6 2.8-.4 6.9 1.1 9.1.7 1.1 1.6 2.3 2.8 2.2 1.1 0 1.6-.7 3.1-.7 1.4 0 1.9.7 3.1.7 1.3 0 2.1-1.1 2.8-2.2.9-1.2 1.2-2.4 1.2-2.5-.1 0-2.5-1-2.5-3.8ZM14.5 6.2c.6-.8 1.1-1.9 1-3-.9 0-2 .6-2.7 1.3-.6.7-1.1 1.8-1 2.9 1 .1 2-.5 2.7-1.2Z" fill="currentColor"/></svg></b><span>애플 로그인</span></button>
        </div>
      </main>
      {toast ? <div className="bml-toast" role="status">{toast}</div> : null}
    </div>
  );
}
