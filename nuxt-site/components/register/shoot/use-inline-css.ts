// 리액트 src/prototype/register/shoot/use-inline-css.ts 의 useInlineCss(./react-compat 훅으로).
// 촬영 화면 스타일은 화면이 떠 있는 동안만 <style>로 넣는다(?register=shoot 과 ?register=shootkit 이 같은 클래스 이름을 쓰므로).
import { useInsertionEffect } from "./react-compat";

export function useInlineCss(id: string, css: string) {
  useInsertionEffect(() => {
    let el = document.getElementById(id) as HTMLStyleElement | null;
    if (!el) {
      el = document.createElement("style");
      el.id = id;
      el.textContent = css;
      document.head.appendChild(el);
    }
    return () => el?.remove();
  }, [id, css]);
}
