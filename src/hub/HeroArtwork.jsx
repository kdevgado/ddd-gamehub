import { useEffect, useState } from "react";

export default function HeroArtwork() {
  const [theme, setTheme] = useState(() => document.documentElement.dataset.theme);

  useEffect(() => {
    const observer = new MutationObserver(() => setTheme(document.documentElement.dataset.theme));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);

  return (
    <div className="hero-art" aria-hidden="true">
      <div className="hero-art-image">
        <img
          src={theme === "light" ? "/images/lounge-orbit-light.webp" : "/images/lounge-orbit.webp"}
          width="1536"
          height="1024"
          alt=""
          fetchPriority="high"
        />
      </div>
      <span className="art-coordinate">EST. FOR GOOD TIMES <span>↗</span></span>
      <div className="art-caption">
        <span className="caption-cross">+</span>
        <span>A little out of the ordinary.<br /><strong>A lot better together.</strong></span>
      </div>
      <span className="art-edition">THE PLAY COLLECTION — 001</span>
    </div>
  );
}
