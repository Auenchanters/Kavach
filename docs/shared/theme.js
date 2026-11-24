// Light / dark theme. The pre-paint line in each page's <head> sets data-theme before first paint;
// this module wires the toggle buttons and keeps every open tab on the same theme.
const KEY = "kavach.theme";
const root = document.documentElement;
const meta = document.querySelector('meta[name="theme-color"]');

function apply(theme) {
  root.dataset.theme = theme;
  if (meta) meta.content = theme === "dark" ? "#07080D" : "#F4F4F5";
  document.querySelectorAll("[data-theme-toggle]").forEach((b) => {
    b.setAttribute("aria-pressed", String(theme === "dark"));
    b.setAttribute("aria-label", theme === "dark" ? "Switch to light mode" : "Switch to dark mode");
  });
  dispatchEvent(new CustomEvent("kavach-theme", { detail: theme }));
}

export const currentTheme = () => root.dataset.theme || "light";

export function bindThemeToggles() {
  document.querySelectorAll("[data-theme-toggle]").forEach((b) => (b.onclick = () => {
    const next = currentTheme() === "dark" ? "light" : "dark";
    try { localStorage.setItem(KEY, next); } catch { /* private mode */ }
    apply(next);
  }));
  addEventListener("storage", (e) => { if (e.key === KEY && e.newValue) apply(e.newValue); });
  apply(currentTheme());
}

bindThemeToggles();
