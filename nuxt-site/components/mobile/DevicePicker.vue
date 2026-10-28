<script setup lang="ts">
// 리액트 src/mobile/Device.tsx 의 DevicePicker. Radix DropdownMenu 대신 같은 DOM · 같은 data-state 를 직접 그린다:
//  · 트리거 button[aria-haspopup=menu][aria-expanded][data-state=open|closed]
//  · 메뉴: body 로 Teleport 한 div[data-radix-popper-content-wrapper](고정 위치, 트리거 아래 8px · 오른쪽 맞춤 · 가장자리 12px)
//    안에 div.device-picker-menu[role=menu] > div[role=group] > div.device-picker-item[role=menuitemradio][aria-checked][data-state=checked|unchecked]
//    선택된 항목에만 span.device-picker-check(체크 아이콘)
//  · 열기: 왼쪽 버튼 누름(pointerdown) · Enter/Space/↓, 닫기: Esc · 바깥 누름 · 항목 선택(닫힌 뒤 트리거로 포커스), ↑↓ Home End 로 항목 이동.
import { computed, nextTick, onBeforeUnmount, ref, watch } from "vue";
import ChevronDownIcon from "../icons/ChevronDownIcon.vue";
import CheckIcon from "../icons/CheckIcon.vue";
import { mobileDevices, useMobileDevice, type MobileDeviceId } from "../../composables/mobile/useMobileDevice";

const ctx = useMobileDevice();
const open = ref(false);
const triggerRef = ref<HTMLButtonElement | null>(null);
const menuRef = ref<HTMLDivElement | null>(null);
const position = ref({ top: 0, left: 0 });
const options = Object.values(mobileDevices);
const uid = `bbm-device-menu-${Math.random().toString(36).slice(2, 9)}`;

function place() {
  const trigger = triggerRef.value;
  const menu = menuRef.value;
  if (!trigger) return;
  const rect = trigger.getBoundingClientRect();
  const width = menu?.offsetWidth ?? 0;
  const padding = 12;
  const left = Math.max(padding, Math.min(window.innerWidth - width - padding, rect.right - width));
  position.value = { top: rect.bottom + 8, left };
}

function items() {
  return Array.from(menuRef.value?.querySelectorAll<HTMLElement>(".device-picker-item") ?? []);
}

async function openMenu(focus: "checked" | "first" | "last" = "checked") {
  open.value = true;
  await nextTick();
  place();
  const list = items();
  const target = focus === "first" ? list[0] : focus === "last" ? list[list.length - 1] : list.find((item) => item.dataset.state === "checked") ?? list[0];
  (target ?? menuRef.value)?.focus({ preventScroll: true });
}

function closeMenu(returnFocus = true) {
  open.value = false;
  if (returnFocus) triggerRef.value?.focus({ preventScroll: true });
}

function onTriggerPointerDown(event: PointerEvent) {
  if (event.button !== 0 || event.ctrlKey) return;
  if (open.value) closeMenu(false);
  else void openMenu();
  if (event.pointerType === "mouse") event.preventDefault();
}

function onTriggerKeyDown(event: KeyboardEvent) {
  if (event.key === "Enter" || event.key === " " || event.key === "ArrowDown") {
    event.preventDefault();
    void openMenu(event.key === "ArrowDown" ? "first" : "checked");
  } else if (event.key === "ArrowUp") {
    event.preventDefault();
    void openMenu("last");
  }
}

function select(id: MobileDeviceId) {
  ctx.setDeviceId(id);
  closeMenu();
}

function onMenuKeyDown(event: KeyboardEvent) {
  const list = items();
  const index = list.indexOf(document.activeElement as HTMLElement);
  if (event.key === "Escape") {
    event.preventDefault();
    closeMenu();
  } else if (event.key === "ArrowDown") {
    event.preventDefault();
    list[Math.min(list.length - 1, index + 1)]?.focus();
  } else if (event.key === "ArrowUp") {
    event.preventDefault();
    list[Math.max(0, index - 1)]?.focus();
  } else if (event.key === "Home") {
    event.preventDefault();
    list[0]?.focus();
  } else if (event.key === "End") {
    event.preventDefault();
    list[list.length - 1]?.focus();
  } else if (event.key === "Tab") {
    event.preventDefault();
  }
}

function onItemKeyDown(event: KeyboardEvent, id: MobileDeviceId) {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    select(id);
  }
}

function onDocumentPointerDown(event: PointerEvent) {
  const target = event.target as Node | null;
  if (target && (menuRef.value?.contains(target) || triggerRef.value?.contains(target))) return;
  closeMenu(false);
}

watch(open, (value, _old, onCleanup) => {
  if (!value) return;
  document.addEventListener("pointerdown", onDocumentPointerDown, true);
  window.addEventListener("resize", place);
  window.addEventListener("scroll", place, true);
  onCleanup(() => {
    document.removeEventListener("pointerdown", onDocumentPointerDown, true);
    window.removeEventListener("resize", place);
    window.removeEventListener("scroll", place, true);
  });
});
onBeforeUnmount(() => { open.value = false; });

const wrapperStyle = computed(() => ({
  position: "fixed" as const,
  left: "0px",
  top: "0px",
  transform: `translate(${position.value.left}px, ${position.value.top}px)`,
  minWidth: "max-content",
  zIndex: 50,
}));
</script>
<template>
  <div class="device-menu-bar" data-testid="device-menu-bar">
    <button
      ref="triggerRef"
      class="device-picker-trigger"
      data-testid="device-picker"
      :aria-label="`Preview device: ${ctx.device.label}`"
      type="button"
      aria-haspopup="menu"
      :aria-expanded="open ? 'true' : 'false'"
      :aria-controls="open ? uid : undefined"
      :data-state="open ? 'open' : 'closed'"
      @pointerdown="onTriggerPointerDown"
      @keydown="onTriggerKeyDown"
    >
      <span>{{ ctx.device.label }}</span>
      <ChevronDownIcon aria-hidden="true" />
    </button>
  </div>
  <Teleport v-if="open" to="body">
    <div data-radix-popper-content-wrapper="" :style="wrapperStyle">
      <div
        :id="uid"
        ref="menuRef"
        class="device-picker-menu"
        role="menu"
        aria-orientation="vertical"
        data-state="open"
        data-side="bottom"
        data-align="end"
        data-orientation="vertical"
        tabindex="-1"
        @keydown="onMenuKeyDown"
      >
        <div role="group">
          <div
            v-for="option in options"
            :key="option.id"
            class="device-picker-item"
            role="menuitemradio"
            :aria-checked="ctx.deviceId === option.id ? 'true' : 'false'"
            :data-state="ctx.deviceId === option.id ? 'checked' : 'unchecked'"
            :data-testid="`device-option-${option.id}`"
            data-orientation="vertical"
            tabindex="-1"
            @click="select(option.id)"
            @keydown="onItemKeyDown($event, option.id)"
            @pointermove="($event.currentTarget as HTMLElement).focus({ preventScroll: true })"
          >
            <span>{{ option.label }}</span>
            <span v-if="ctx.deviceId === option.id" class="device-picker-check" data-state="checked">
              <CheckIcon aria-hidden="true" />
            </span>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>
