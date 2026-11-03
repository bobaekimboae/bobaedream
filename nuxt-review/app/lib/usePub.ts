// 6개 새 글쓰기 화면 공용 흐름: 임시저장(0.8초 뒤 자동) · 다시 들어오면 「불러올까요?」 · 닫을 때 「그만 쓸까요?」 · 등록.
// 원본(동처띠): 닫기에서 내용이 있으면 「就差一步，是否放弃？ 保存的草稿可下次继续编辑」 放弃 / 继续.
import { onBeforeUnmount, onMounted, watch, type WatchSource } from "vue";
import type { Post } from "./publish";
import { pubApi, type PubKind } from "./api/publish-client";
import { ApiError } from "./api/client";
import { KIND_LABEL } from "./publish";
import { ask, toast } from "./ui";
import { back, replace, setLeaveGuard, type Kind } from "./route";

export function usePub<T>(kind: Kind, o: { snapshot: () => T; restore: (d: T) => void; dirty: () => boolean; watchOn: (WatchSource | object)[] }) {
  let saveT: ReturnType<typeof setTimeout> | undefined;
  let posted = false;
  const save = () => { if (o.dirty()) pubApi.saveDraft(kind, o.snapshot()).catch(() => { /* 자동 임시저장 실패는 다음 저장에서 다시 */ }); };
  watch(o.watchOn as WatchSource[], () => { clearTimeout(saveT); saveT = setTimeout(save, 800); }, { deep: true });

  /** 닫기 = 내용이 있으면 묻는다. 「계속 쓰기」가 기본(바깥 · Esc도 계속 쓰기) */
  const close = async () => {
    clearTimeout(saveT);
    if (!o.dirty()) { setLeaveGuard(null); back(); return; }
    const stay = await ask("한 걸음만 더 하면 돼요. 그만 쓸까요? 임시저장한 글은 다음에 이어서 쓸 수 있어요", "그만 쓰기", "계속 쓰기");
    if (stay) return;
    save();
    setLeaveGuard(null);
    back();
  };
  let sending = false;
  const publish = async (p: Omit<Post, "id" | "kind" | "createdAt">) => {
    if (sending) return;
    sending = true;
    try {
      const post = await pubApi.create(kind as PubKind, p, (d, a) => toast(`사진 · 영상을 올리는 중이에요 ${d}/${a}`));
      posted = true;
      clearTimeout(saveT);
      void pubApi.deleteDraft(kind).catch(() => {});
      setLeaveGuard(null);
      toast(`${KIND_LABEL[kind]} 글을 등록했어요`);
      replace({ board: kind, view: "detail", id: post.id });
    } catch (e) {
      toast(e instanceof ApiError ? (e.status === 401 ? "로그인한 뒤 다시 등록해 주세요" : e.message) : "등록하지 못했어요. 잠시 뒤 다시 해 주세요");
    } finally { sending = false; }
  };
  onMounted(async () => {
    setLeaveGuard(() => { clearTimeout(saveT); if (!posted) save(); return true; });
    const d = await pubApi.getDraft<T>(kind).catch(() => null);
    if (!d) return;
    const load = await ask(`${KIND_LABEL[kind]} 글 임시저장이 있어요. 불러올까요?`, "불러오지 않기", "불러오기");
    if (load) o.restore(d.payload); else void pubApi.deleteDraft(kind).catch(() => {});
  });
  onBeforeUnmount(() => { clearTimeout(saveT); setLeaveGuard(null); });
  return { close, publish, saveNow: () => { save(); toast("임시저장했어요"); } };
}
