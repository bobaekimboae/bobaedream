import { createApp } from "vue";
import Harness from "./Harness.vue";
export function mountHarness() {
  const old = document.getElementById("root")!;
  const el = document.createElement("div"); el.id = "root"; old.replaceWith(el);
  document.documentElement.classList.add("bbm-register-page");
  createApp(Harness).mount(el);
}
