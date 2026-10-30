// 공용 파일 속 react-dom 사용(포털 등)용 빈 대체품. 넉스트 판은 Vue <Teleport>를 쓴다.
export const createPortal = () => null;
export const flushSync = <T,>(fn: () => T) => fn();
export const createRoot = () => ({ render() {}, unmount() {} });
export default { createPortal, flushSync, createRoot };
