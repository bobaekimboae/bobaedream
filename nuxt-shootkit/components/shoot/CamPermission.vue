<script setup lang="ts">
// 권한 거절과 카메라 없음(또는 5초 넘게 안 뜸)을 나눠 안내한다. Esc로 닫고, 포커스는 이 화면 안에서만 돈다.
// 2026-10-31 「카메라 권한 허용 버튼 자체가 안먹어」: 한 번 차단하면 브라우저가 다시 묻지 않는다.
// 누르면 「확인 중」을 잠깐 보이고, 그래도 막혀 있으면 지금 브라우저에 맞는 설정 순서와 「새로고침」을 크게 보인다.
import { computed, onMounted, ref } from "vue";
import Mask from "./Mask.vue";
import { useDialogFocus } from "../../composables/useDialogFocus";
import { permGuide, permHelp } from "../../lib/core";
import { rd } from "../../lib/site";

const props = withDefaults(defineProps<{ kind: "denied" | "unavailable"; what?: "video" | "photo"; showCourse?: boolean; checking?: boolean; blocked?: number }>(), {
  what: "video",
  showCourse: false,
  checking: false,
  blocked: 0,
});
const emit = defineEmits<{ retry: []; album: []; course: []; close: [] }>();
const box = ref<HTMLElement | null>(null);
useDialogFocus(box, () => emit("close"));
const denied = () => props.kind === "denied";
const guide = permGuide();
// 앱 안 브라우저는 처음부터, 그 밖은 한 번 눌러도 막혀 있을 때 설정 순서를 보인다
// 브라우저가 이미 「차단」으로 기억하고 있으면(권한 상태 denied) 버튼은 소용없으니 처음부터 설정 순서를 보인다
const permDenied = ref(false);
onMounted(() => {
  void navigator.permissions
    ?.query({ name: "camera" as PermissionName })
    .then((st) => (permDenied.value = st.state === "denied"))
    .catch(() => undefined);
});
const showSteps = computed(() => denied() && (props.blocked > 0 || permDenied.value || Boolean(guide.openOther)));
const reload = () => window.location.reload();
</script>
<template>
  <div ref="box" :class="`shoot-perm ${showSteps ? 'is-steps' : ''}`" role="alertdialog" aria-modal="true" aria-labelledby="shoot-perm-t" aria-describedby="shoot-perm-d">
    <button type="button" class="shoot-icon-btn shoot-perm__close" aria-label="닫기" @click="emit('close')"><Mask :src="rd('close-outline')" /></button>
    <Mask :src="rd(what === 'photo' ? 'camera-outline-24' : 'video-camera-outline')" cls="shoot-perm__icon" />
    <strong id="shoot-perm-t">{{ denied() ? (showSteps ? "카메라가 막혀 있어요" : "카메라 사용 권한이 필요해요") : "카메라를 쓸 수 없어요" }}</strong>
    <template v-if="showSteps">
      <p id="shoot-perm-d">{{ guide.openOther ? "이 화면은 다른 앱 안에서 열렸어요." : `전에 「차단」을 눌러서 브라우저가 다시 묻지 않아요. ${guide.where} 설정에서 직접 풀어 주세요.` }}</p>
      <ol class="shoot-perm__steps">
        <li v-for="(s, i) in guide.steps" :key="i">{{ s }}</li>
      </ol>
      <button type="button" class="is-ok" data-autofocus="" @click="reload">허용했어요 · 새로고침</button>
    </template>
    <template v-else>
      <p id="shoot-perm-d">{{ denied() ? permHelp() : `다른 앱이 카메라를 쓰고 있거나 카메라가 없는 기기예요. 다시 시도하거나 찍어 둔 ${what === "photo" ? "사진" : "영상"}을 올려 주세요.` }}</p>
      <button type="button" class="is-ok" data-autofocus="" :disabled="checking" :aria-busy="checking" @click="emit('retry')">
        {{ checking ? "확인 중…" : denied() ? "카메라 권한 허용" : "다시 시도" }}
      </button>
    </template>
    <button type="button" @click="emit('album')">{{ denied() ? (what === "photo" ? "앨범에서 사진 올리기" : "찍어 둔 영상 올리기") : "앨범에서 선택" }}</button>
    <button v-if="showCourse" type="button" class="shoot-perm__link" @click="emit('course')">촬영 코스 먼저 고르기</button>
    <span class="shoot-sr" role="status" aria-live="polite">{{ checking ? "카메라 권한을 다시 확인하고 있어요" : showSteps ? "카메라가 막혀 있어요. 설정에서 허용해 주세요" : "" }}</span>
  </div>
</template>
