# Game hub redesign

The hub is now a quiet, cinematic game lounge: charcoal surfaces, warm ivory typography, muted sage and clay accents, original floating game artwork, and an asymmetrical seven-game collection.

## Implementation

- `src/hub/GameHub.jsx`: navigation, collection filters, accessible native suggestion dialog, and launch actions.
- `src/hub/games.js`: game names, play styles, minimum players, and durations grounded in the existing games.
- `src/hub/HeroArtwork.jsx`: theme-aware hero artwork.
- `src/hub/GameArtwork.jsx`, `artwork.js`, and `passArtwork.js`: one set of lightweight CSS and SVG game motifs shared by React and the local game page.
- `src/hub/Icons.jsx`: shared decorative interface icons.
- `src/hub/HowToPlay.jsx`, `gameGuides.js`, and `how-to-play.css`: setup instructions for both play styles, seven expandable game guides, win conditions, tips, and direct launch buttons.
- `src/hub/useAtmosphere.js`: pointer depth and scroll reveals, with cleanup and reduced-motion support.
- `src/hub/hub.css`: responsive lounge styles, light palette, motion, and dialog presentation.
- `public/lounge-tokens.css` and `lounge-art.css`: shared palette, theme control, and sculptural artwork styles.
- `public/game-lounge.css`: matching local and online game surfaces, typography, controls, role cards, timers, and voting states, with responsive light/dark layouts.
- `src/TriviaRoom.jsx`: responsive room entry with a sculptural introduction, game selection, and accessible create/join button states.
- `src/App.jsx`: deferred online room loading and selected game/action handoff.
- `pass-the-phone.html`: validated `?game=` navigation into the selected game's setup.
- `public/sw.js` and `vite.config.js`: build-manifest caching, including deferred room code and both artworks.

Existing game rules and Firebase room operations remain in their original modules. Online play still needs an internet connection.

## Artwork

Generated and edited with the built-in Imagegen tool, then encoded as WebP without changing image dimensions. The game-card motifs are authored in code.

- `public/images/lounge-orbit.webp` — dark hero, 1536 × 1024, approximately 90 KB.
- `public/images/lounge-orbit-light.webp` — light hero, 1536 × 1024, approximately 99 KB.

### Dark hero prompt

Use case: stylized-concept
Asset type: original hero artwork for a premium minimalist party-game website, landscape 1536x1024 composition.
Primary request: An extraordinary, serene still life of game objects suspended in an impossible orbit in a dark void. Museum-grade tactile 3D render, art directed like an Aesop campaign meets a surreal design sculpture.
Scene/backdrop: seamless matte almost-black charcoal #111315 background, no room, no horizon, no typography. A massive tilted thin stone ring in warm ivory, with its hole clearly visible, occupies the center-right. In and around this ring float a large softly beveled sage-green die with engraved dark pips, one small warm ivory die, a muted terracotta sphere, a small brushed-champagne metallic sphere, and two curved matte charcoal playing cards with simple tiny cream suit marks. The objects feel delicately balanced and sculptural, with convincing three-dimensionality, subtle stone pores and soft rough ceramic materials.
Composition: main sculpture fills 75 percent of frame, centered slightly right, fully within frame with breathing room. Ring tilted obliquely in three dimensions. Strong diagonal relationship between floating objects, varied sizes. Clean, intentional negative space. Sophisticated, crisp silhouette.
Lighting/mood: beautiful large softbox light from upper left, delicate warm edge highlights, deep realistic shadows, calm and atmospheric, high-end product photography, subtle film grain.
Color palette: obsidian, warm sand, muted sage, desaturated clay, brushed champagne. Restrained and elegant.
Constraints: no words, no letters, no watermark, no people, no neon, no glowing edges, no lens flare, no purple, no busy starfield, no interface. This is finished artwork, not a website mockup.

### Light hero edit prompt

Use case: lighting-weather
Edit target: the supplied sculptural game artwork. Create its complementary light-theme version for the same premium minimalist website.
Change only: replace the almost-black void/background with a seamless warm ivory studio background #efede6. Adapt the lighting to a serene, softly sunlit product photograph on a pale neutral backdrop, with very gentle pale grey cast shadows. Keep the image bright, clear, earthy and refined.
Preserve: the exact tilted stone ring, all ceramic dice, their shapes, dark engraved pips, terracotta sphere, champagne metal sphere, charcoal playing cards, their positions, the camera perspective, scale, arrangement and framing. Preserve the realistic tactile material detail and restrained palette.
Constraints: no text, no watermark, no interface, no new objects, no black backdrop or dramatic dark vignette. The entire image background including the ring's hole is warm ivory.

## Validation

Production build: `npm run build -- --configLoader runner`. The runner option avoids an esbuild configuration-loading restriction in this Windows sandbox; the normal project scripts remain available.

Browser checks cover the seven direct game launches, table/online filters, filtered random suggestions, reroll behavior, Escape and focus restoration, light/dark persistence, reduced motion, and horizontal overflow at 320, 390, 768, 1024, and 1440 pixels. Desktop, mobile, picker, and light-theme screenshots were inspected.

The initial hub JavaScript, including the how-to-play section and shared artwork module, is approximately 170 KB (55 KB gzip), down from approximately 871 KB before online-room code was deferred. Vite still reports its large-chunk advisory for the deferred Firebase/online-room bundle. No dependencies were added.

Browser validation does not create multiplayer rooms or claim to test a live multiplayer match.

The mode styling passed 66 browser checks covering all five local game starts, private role reveal and clearing between players, voting and results, saved players, changing the online game and its artwork, create/join state, light theme, and responsive layouts at 320, 390, 768, and 1440 pixels. The original 30 hub checks also pass. Desktop, mobile, role, category, Bomb, and light-theme screenshots were inspected.

The production service worker passed 13 further checks, including 56 cached resources and an actual origin-server shutdown. With the server unavailable, the hub reloaded, light artwork loaded, the deferred room code displayed its offline state, and the Imposter setup opened through its direct URL without page errors. The shared mode styles and artwork module are included in cache version 22.

## Mobile usability

- Visible collection and how-to-play navigation, a shorter hero, and full-width game rows with readable play style, player count, and duration labels.
- Larger navigation, filter, player-removal, and form controls. Game guides and setup instructions start collapsed on phones and retain native keyboard interaction.
- Compact online room selection with direct create/join instructions. At 320, 390, and 430 pixels wide in an 844-pixel viewport, the Create button is visible without scrolling.
- Less nested padding in local setup, an explicit missing-player count, and keyboard focus retained while adding names. Enter in the online join name field advances to the room code without submitting; composition input is respected.
- New local steps scroll immediately to the top and focus their headings, dismissing the name keyboard. Private role flipping and clearing between players remain intact.
- Scrollable suggestion dialogs retain a reachable Close button on short screens.

Validation includes 66 dedicated mobile browser checks across 320, 390, 430, 768, and 1440 pixels, plus 320 × 568 portrait and 667 × 375 landscape dialog checks. Light/dark screenshots, the original 30 hub checks, production build, and offline cache were also checked. Browser emulation verifies layout and focus behavior; physical iOS/Android keyboard behavior was not tested.

## Commit message

```text
feat(hub): redesign the game hub as a cinematic lounge

Add original theme-aware artwork, responsive game cards, subtle motion,
play-style filters, and an accessible random game picker.
Launch each local or online game directly and preserve installed offline
access while deferring the online-room code.
```

Additional how-to-play change:

```text
feat(hub): add practical how-to-play guides for all seven games

Explain both play styles and each game's setup, rules, win conditions,
and beginner tips in keyboard-accessible accordions with direct launches.
```

Additional game mode styling change:

```text
feat(games): extend lounge styling across local and online modes

Share the hub palette, sculptural artwork, and theme control with the
local collection and online room entry. Restyle setup, private roles,
timers, voting, and game surfaces with responsive light and dark layouts.
Preserve game interactions and cache the shared assets for offline play.
```

Additional mobile usability change:

```text
feat(mobile): simplify game browsing and setup on phones

Add visible navigation, readable game rows, larger touch targets, and
compact room forms. Collapse guides initially on phones, clarify roster
requirements, improve input and screen focus, and keep dialog close
controls reachable. Refresh the offline cache for the mobile styles.
```
