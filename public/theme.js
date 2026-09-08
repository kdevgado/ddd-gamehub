(function () {
  const STORAGE_KEY = "ddd-game-hub-theme";
  const root = document.documentElement;
  const systemTheme = window.matchMedia("(prefers-color-scheme: dark)");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  function getSavedTheme() {
    try {
      const savedTheme = window.localStorage.getItem(STORAGE_KEY);
      return savedTheme === "dark" || savedTheme === "light" ? savedTheme : null;
    } catch {
      return null;
    }
  }

  function preferredTheme() {
    return getSavedTheme() || root.dataset.defaultTheme || (systemTheme.matches ? "dark" : "light");
  }

  function updateThemeMetadata(theme) {
    const themeColor = document.querySelector('meta[name="theme-color"]');
    if (themeColor) {
      const isLounge = root.dataset.defaultTheme === "dark";
      themeColor.setAttribute("content", isLounge
        ? (theme === "dark" ? "#111315" : "#efede6")
        : (theme === "dark" ? "#161b19" : "#4f6653"));
    }
  }

  function updateToggle(button, theme) {
    if (!button) return;
    const nextTheme = theme === "dark" ? "light" : "dark";
    const label = `Switch to ${nextTheme} mode`;
    button.setAttribute("aria-label", label);
    button.setAttribute("title", label);
    button.setAttribute("aria-pressed", String(theme === "dark"));
    button.querySelector(".theme-toggle-label").textContent = label;
  }

  function applyTheme(theme, persist) {
    root.dataset.theme = theme;
    updateThemeMetadata(theme);
    updateToggle(document.querySelector(".theme-toggle"), theme);

    if (persist) {
      try {
        window.localStorage.setItem(STORAGE_KEY, theme);
      } catch {
        // The selected theme still applies for this visit when storage is unavailable.
      }
    }
  }

  function switchTheme(button) {
    const nextTheme = root.dataset.theme === "dark" ? "light" : "dark";

    if (reduceMotion.matches || root.dataset.defaultTheme === "dark") {
      applyTheme(nextTheme, true);
      return;
    }

    if (!document.startViewTransition) {
      root.classList.add("theme-colors-animating");
      void root.offsetWidth;
      applyTheme(nextTheme, true);
      window.setTimeout(() => root.classList.remove("theme-colors-animating"), 520);
      return;
    }

    const bounds = button.getBoundingClientRect();
    const originX = bounds.left + bounds.width / 2;
    const originY = bounds.top + bounds.height / 2;
    const radius = Math.hypot(
      Math.max(originX, window.innerWidth - originX),
      Math.max(originY, window.innerHeight - originY)
    );

    root.style.setProperty("--theme-origin-x", `${originX}px`);
    root.style.setProperty("--theme-origin-y", `${originY}px`);
    root.style.setProperty("--theme-reveal-radius", `${radius}px`);
    root.classList.add("theme-is-transitioning");

    const transition = document.startViewTransition(() => applyTheme(nextTheme, true));
    transition.finished.finally(() => root.classList.remove("theme-is-transitioning"));
  }

  function mountToggle() {
    if (document.querySelector(".theme-toggle")) return;

    const button = document.createElement("button");
    button.className = "theme-toggle";
    button.type = "button";
    button.innerHTML = `
      <span class="theme-toggle-label"></span>
      <span class="theme-toggle-track" aria-hidden="true">
        <span class="theme-toggle-stars"><i></i><i></i><i></i></span>
        <span class="theme-toggle-thumb">
          <span class="theme-toggle-sun"></span>
          <span class="theme-toggle-moon"></span>
        </span>
      </span>
    `;
    button.addEventListener("click", () => switchTheme(button));
    document.body.appendChild(button);
    updateToggle(button, root.dataset.theme);
  }

  applyTheme(preferredTheme(), false);

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mountToggle, { once: true });
  } else {
    mountToggle();
  }

  systemTheme.addEventListener("change", () => {
    if (!getSavedTheme()) applyTheme(preferredTheme(), false);
  });

  window.addEventListener("storage", (event) => {
    if (event.key === STORAGE_KEY || event.key === null) applyTheme(preferredTheme(), false);
  });
})();
