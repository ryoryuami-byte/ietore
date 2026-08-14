import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { installTheme } from "./theme.js";
import "./index.css";

/* 色（CSS 変数）を先に置く。React を描き始めてからだと、
   最初の一瞬だけ色の無い画面が見えてしまう */
installTheme();

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
