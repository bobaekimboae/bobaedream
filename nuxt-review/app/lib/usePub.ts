// 6개 새 글쓰기 화면 공용 흐름: 임시저장(0.8초 뒤 자동) · 다시 들어오면 「불러올까요?」 · 닫을 때 「그만 쓸까요?」 · 등록.
// 원본(동처띠): 닫기에서 내용이 있으면 「就差一步，是否放弃？ 保存的草稿可下次继续编辑」 放弃 / 继续.
import { onBeforeUnmount, onMounted, watch, type WatchSource } from "vue";
import { deleteDraft, getDraft, saveDraft, savePost, type Post } from "./publish";
import { KIND_LABEL } from "./publish";
import { ask, toast } from "./ui";
import { back, replace, setLeaveGuard, type Kind } from "./route";

export function usePub<T>(kind: Kind, o: { snapshot: () => T; restore: (d: T) => void; dirty: () => boolean; watchOn: (WatchSource | object)[] }) {
  let saveT: ReturnType<typeof setTimeout> | undefined;
  let posted = false;
  const save = () => { if (o.dirty()) saveDraft(kind, o.snapshot()); };
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
  const publish = (p: Omit<Post, "id" | "kind" | "createdAt">) => {
    const post: Post = { ...p, id: `p${Date.now().toString(36)}`, kind, createdAt: new Date().toISOString() };
    if (!savePost(post)) { toast("저장 공간이 부족해 등록하지 못했어요"); return; }
    posted = true;
    clearTimeout(saveT);
    deleteDraft(kind);
    setLeaveGuard(null);
    toast(`${KIND_LABEL[kind]} 글을 등록했어요`);
    replace({ board: kind, view: "detail", id: post.id });
  };
  onMounted(async () => {
    setLeaveGuard(() => { clearTimeout(saveT); if (!posted) save(); return true; });
    const d = getDraft<T>(kind);
    if (!d) return;
    const load = await ask(`${KIND_LABEL[kind]} 글 임시저장이 있어요. 불러올까요?`, "불러오지 않기", "불러오기");
    if (load) o.restore(d.payload); else deleteDraft(kind);
  });
  onBeforeUnmount(() => { clearTimeout(saveT); setLeaveGuard(null); });
  return { close, publish, saveNow: () => { save(); toast("임시저장했어요"); } };
}
