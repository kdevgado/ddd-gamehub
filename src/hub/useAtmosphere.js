import { useEffect } from "react";

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

// Layout offsets exclude the transforms used by the entrance animations.
function pageTop(element) {
  let top = 0;
  for (let node = element; node; node = node.offsetParent) top += node.offsetTop;
  return top;
}

export default function useAtmosphere(rootRef) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    const hero = root.querySelector(".lounge-hero");
    const animations = new Map();
    const observed = new Map();
    let scenes = [];
    let frame = 0;
    let needsMeasure = true;
    let lastY = window.scrollY;
    let lastTime = 0;
    let direction = 1;
    let impulse = 0;
    let heroTop = 0;
    let heroHeight = 1;
    let pageHeight = 1;
    let hoveredCard = null;

    const observer = "IntersectionObserver" in window ? new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const wasVisible = observed.get(entry.target);
        observed.set(entry.target, entry.isIntersecting);
        if (!entry.isIntersecting || wasVisible || motion.matches || document.hidden || entry.target.contains(document.activeElement)) return;
        animations.get(entry.target)?.cancel();
        const animation = entry.target.animate([
          { opacity: 0.45, transform: `translate3d(0, ${direction * 24}px, 0) scale(.98)` },
          { opacity: 1, transform: "translate3d(0, 0, 0) scale(1)" }
        ], { duration: 620, easing: "cubic-bezier(.22, 1, .36, 1)" });
        animations.set(entry.target, animation);
        animation.onfinish = () => animations.delete(entry.target);
      });
    }, { threshold: 0.08, rootMargin: "24px 0px 24px 0px" }) : null;

    function measure() {
      needsMeasure = false;
      heroTop = pageTop(hero);
      heroHeight = hero.offsetHeight;
      pageHeight = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      scenes = Array.from(root.querySelectorAll("[data-scroll-scene]"), (element) => ({ element, top: pageTop(element), height: element.offsetHeight }));
      for (const [element] of observed) {
        if (root.contains(element)) continue;
        observer?.unobserve(element);
        animations.get(element)?.cancel();
        animations.delete(element);
        observed.delete(element);
      }
      root.querySelectorAll("[data-scroll-reveal]").forEach((element) => {
        if (observed.has(element)) return;
        const top = pageTop(element) - window.scrollY;
        observed.set(element, top < window.innerHeight && top + element.offsetHeight > 0);
        observer?.observe(element);
      });
    }

    function render(time) {
      frame = 0;
      if (motion.matches) {
        if (root.dataset.scrollMotion !== "off") configureMotion();
        return;
      }
      if (document.hidden) return;
      if (needsMeasure) measure();
      const y = Math.max(0, window.scrollY);
      const delta = y - lastY;
      const elapsed = clamp(time - lastTime || 16, 8, 64);
      if (Math.abs(delta) > 0.5) direction = delta > 0 ? 1 : -1;
      impulse += (clamp(delta / elapsed, -2, 2) - impulse) * 0.22;
      if (Math.abs(impulse) < 0.003) impulse = 0;
      lastY = y;
      lastTime = time;
      root.style.setProperty("--scroll-progress", clamp(y / pageHeight, 0, 1).toFixed(4));
      root.style.setProperty("--scroll-turn", `${(y * 0.12).toFixed(2)}deg`);
      root.style.setProperty("--scroll-lean", `${(impulse * 2).toFixed(3)}deg`);
      root.style.setProperty("--hero-progress", clamp((y - heroTop) / heroHeight, 0, 1).toFixed(4));
      scenes.forEach(({ element, top, height }) => {
        if (top > y + window.innerHeight + 80 || top + height < y - 80) return;
        const position = clamp((y + window.innerHeight / 2 - top - height / 2) / ((window.innerHeight + height) / 2), -1, 1);
        element.style.setProperty("--scene-position", position.toFixed(4));
        element.classList.toggle("is-scene-active", Math.abs(position) < 0.42);
      });
      // Run only while scrolling or settling, rather than an idle animation loop.
      if (impulse) schedule();
    }

    function schedule() {
      // Recheck during interaction too: some browsers delay media change events.
      if (motion.matches !== (root.dataset.scrollMotion === "off")) {
        configureMotion();
        return;
      }
      if (!frame && !motion.matches && !document.hidden) frame = requestAnimationFrame(render);
    }

    function invalidate() {
      needsMeasure = true;
      schedule();
    }

    function resetPointer() {
      if (hoveredCard) {
        hoveredCard.style.removeProperty("--tilt-x");
        hoveredCard.style.removeProperty("--tilt-y");
        hoveredCard = null;
      }
      root.style.removeProperty("--drift-x");
      root.style.removeProperty("--drift-y");
    }

    function onMove(event) {
      if (motion.matches || !finePointer.matches || event.pointerType === "touch") return;
      const card = event.target.closest(".lounge-grid .lounge-game");
      if (card !== hoveredCard) resetPointer();
      hoveredCard = card;
      if (card) {
        const bounds = card.getBoundingClientRect();
        card.style.setProperty("--tilt-x", `${((event.clientX - bounds.left) / bounds.width - 0.5) * 10}deg`);
        card.style.setProperty("--tilt-y", `${((event.clientY - bounds.top) / bounds.height - 0.5) * -8}deg`);
      }
      if (hero.contains(event.target)) {
        root.style.setProperty("--drift-x", `${(event.clientX / window.innerWidth - 0.5) * 18}px`);
        root.style.setProperty("--drift-y", `${clamp((event.clientY + window.scrollY - heroTop) / heroHeight - 0.5, -0.5, 0.5) * 14}px`);
      }
    }

    function onFocus(event) {
      const target = event.target.closest("[data-scroll-reveal]");
      animations.get(target)?.cancel();
      animations.delete(target);
    }

    function configureMotion() {
      cancelAnimationFrame(frame);
      frame = 0;
      impulse = 0;
      lastY = window.scrollY;
      observer?.disconnect();
      observed.clear();
      animations.forEach((animation) => animation.cancel());
      animations.clear();
      resetPointer();
      root.dataset.scrollMotion = motion.matches ? "off" : "on";
      ["--scroll-progress", "--scroll-turn", "--scroll-lean", "--hero-progress"].forEach((property) => root.style.removeProperty(property));
      scenes.forEach(({ element }) => {
        element.style.removeProperty("--scene-position");
        element.classList.remove("is-scene-active");
      });
      invalidate();
    }

    const resizeObserver = "ResizeObserver" in window ? new ResizeObserver(invalidate) : null;
    const mutationObserver = new MutationObserver(invalidate);
    resizeObserver?.observe(root);
    mutationObserver.observe(root, { childList: true, subtree: true });
    configureMotion();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", invalidate, { passive: true });
    root.addEventListener("pointermove", onMove, { passive: true });
    root.addEventListener("pointerleave", resetPointer);
    root.addEventListener("focusin", onFocus);
    root.addEventListener("toggle", invalidate, true);
    document.addEventListener("visibilitychange", configureMotion);
    motion.addEventListener("change", configureMotion);
    finePointer.addEventListener("change", resetPointer);
    return () => {
      cancelAnimationFrame(frame);
      observer?.disconnect();
      resizeObserver?.disconnect();
      mutationObserver.disconnect();
      animations.forEach((animation) => animation.cancel());
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", invalidate);
      root.removeEventListener("pointermove", onMove);
      root.removeEventListener("pointerleave", resetPointer);
      root.removeEventListener("focusin", onFocus);
      root.removeEventListener("toggle", invalidate, true);
      document.removeEventListener("visibilitychange", configureMotion);
      motion.removeEventListener("change", configureMotion);
      finePointer.removeEventListener("change", resetPointer);
      delete root.dataset.scrollMotion;
    };
  }, [rootRef]);
}
