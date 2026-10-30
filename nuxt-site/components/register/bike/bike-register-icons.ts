// 리액트 src/prototype/register/BikeRegister.tsx 맨 위 icons · asset · samplePhoto 와 같은 값(export 하지 않아 옮김, keep in sync).
// 코드에 글자 그대로 "/assets/"를 쓰지 않도록 "assets"로 시작하는 상대 경로만 쓴다.
const publicBase = typeof document === "undefined" ? import.meta.env.BASE_URL : new URL(".", document.baseURI).pathname;
export const asset = (path: string) => `${publicBase}${path}`;
export const chotot = (name: string) => asset(`assets/register/chotot-v01/${name}`);
export const icons = {
  back: asset("assets/bbm/m-header-back.svg"),
  close: chotot("close-window.svg"),
  search: chotot("search-gray.svg"),
  chevron: chotot("chevron-right.svg"),
  check: chotot("check-mark.svg"),
  pin: chotot("location-pin.svg"),
  info: chotot("info.svg"),
  upload: chotot("upload-media.png"),
  photoDelete: chotot("image-upload-delete.svg"),
  caret: chotot("caret-down.svg"),
  clear: chotot("clear-text.svg"),
  detail: chotot("detail-info.svg"),
};
export const samplePhoto = (index: number) => asset(`assets/bike/listings/v08/bike-v08-${String((index % 50) + 1).padStart(2, "0")}.webp`);
export const digits = (value: string) => value.replace(/[^\d]/g, "").replace(/^0+(?=\d)/, "");
export const withComma = (value: string) => value ? Number(value).toLocaleString("ko-KR") : "";
