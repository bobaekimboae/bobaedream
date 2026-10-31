// 로그인 · 가입(autohaus-video 로그인 화면과 같은 흐름: 구글 · 이메일 로그인, 가입 → 확인 메일 → 시작).
// 시안: 서버가 없어 이 브라우저(localStorage)에 「가입한 이메일 목록」과 「지금 로그인한 이메일」만 둔다.
// 비밀번호는 어디에도 저장하지 않는다(길이만 확인). 실서비스는 Laravel 12 인증 + 메일 확인으로 바꾼다.
import { reactive } from "vue";

const SESSION_KEY = "bbm-sf-session";
const ACCOUNTS_KEY = "bbm-sf-accounts";
export const GOOGLE_DEMO = "google@demo.bobaedream";

function read<T>(k: string, d: T): T {
  try {
    const v = localStorage.getItem(k);
    return v == null ? d : (JSON.parse(v) as T);
  } catch {
    return d;
  }
}
function write(k: string, v: unknown) {
  try {
    if (v == null) localStorage.removeItem(k);
    else localStorage.setItem(k, JSON.stringify(v));
  } catch {
    /* 저장이 막혀도 화면은 계속 */
  }
}

export const auth = reactive({ email: "" as string });
export const loadSession = () => (auth.email = read<string>(SESSION_KEY, ""));
const accounts = () => read<string[]>(ACCOUNTS_KEY, []);
const norm = (e: string) => e.trim().toLowerCase();
export const validEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());

export function signIn(email: string, password: string) {
  const e = norm(email);
  if (!validEmail(e)) throw new Error("이메일 형식을 확인해 주세요.");
  if (!password) throw new Error("비밀번호를 입력해 주세요.");
  if (!accounts().includes(e)) throw new Error("가입하지 않은 이메일이에요. 「가입하기」를 눌러 주세요.");
  auth.email = e;
  write(SESSION_KEY, e);
}

/** 가입: 확인 메일 화면으로 넘어간다. 확인을 누르면 confirmSignUp으로 로그인된다 */
export function signUp(email: string, password: string) {
  const e = norm(email);
  if (!validEmail(e)) throw new Error("이메일 형식을 확인해 주세요.");
  if (password.length < 8) throw new Error("비밀번호는 8자 이상이에요.");
  if (accounts().includes(e)) throw new Error("이미 가입한 이메일이에요. 로그인해 주세요.");
  return e;
}
export function confirmSignUp(email: string) {
  const e = norm(email);
  write(ACCOUNTS_KEY, [...new Set([...accounts(), e])]);
  auth.email = e;
  write(SESSION_KEY, e);
}

/** 구글 로그인(시안): 실제 구글 연결 대신 시험 계정으로 들어간다 */
export function signInWithGoogle() {
  write(ACCOUNTS_KEY, [...new Set([...accounts(), GOOGLE_DEMO])]);
  auth.email = GOOGLE_DEMO;
  write(SESSION_KEY, GOOGLE_DEMO);
}

export function signOut() {
  auth.email = "";
  write(SESSION_KEY, null);
}
