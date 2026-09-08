import { useEffect } from "react";

export default function useAtmosphere(rootRef) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const finePointer = window.matchMedia("(pointer: fine)");
    let frame = 0;
    let observer;

    function onMove(event) {
      if (motion.matches || !finePointer.matches) return;
      const bounds = root.querySelector(".lounge-hero").getBoundingClientRect();
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        root.style.setProperty("--drift-x", `${(event.clientX / window.innerWidth - 0.5) * 12}px`);
        root.style.setProperty("--drift-y", `${Math.max(-1, Math.min(1, (event.clientY - bounds.top) / bounds.height - 0.5)) * 10}px`);
      });
    }

    function configureMotion() {
      observer?.disconnect();
      cancelAnimationFrame(frame);
      root.style.removeProperty("--drift-x");
      root.style.removeProperty("--drift-y");
      root.querySelectorAll(".will-reveal").forEach((element) => element.classList.remove("will-reveal"));
      if (motion.matches || !("IntersectionObserver" in window)) return;
      observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.remove("will-reveal");
          observer.unobserve(entry.target);
        });
      }, { threshold: 0.08 });
      root.querySelectorAll("[data-reveal]").forEach((element) => {
        if (element.getBoundingClientRect().top < window.innerHeight) return;
        element.classList.add("will-reveal");
        observer.observe(element);
      });
    }

    configureMotion();
    root.addEventListener("pointermove", onMove, { passive: true });
    motion.addEventListener("change", configureMotion);
    return () => {
      cancelAnimationFrame(frame);
      observer?.disconnect();
      root.removeEventListener("pointermove", onMove);
      motion.removeEventListener("change", configureMotion);
    };
  }, [rootRef]);
}
