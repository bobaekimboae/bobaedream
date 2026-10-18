import React from "react";
import ReactDOM from "react-dom/client";
import "@fontsource/roboto/latin-500.css";
import App from "./App";
import "./styles.css";
import "./prototype.css";

// 독립 보배드림 트럭 사이트(/truck/): 트럭·특장 목록으로 시작한다.
const url = new URL(window.location.href);
url.searchParams.set("qf", "guazi");
url.searchParams.set("pc", "1");

const truckParts = url.searchParams.get("category") === "부품 · 용품" && url.searchParams.get("truckMenu") === "parts";
if (!truckParts) {
  url.searchParams.set("category", "트럭 · 특장");
  url.searchParams.delete("truckMenu");
}

window.history.replaceState({}, "", url);
document.documentElement.dataset.site = "truck";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
