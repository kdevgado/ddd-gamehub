// Static, author-owned markup shared by the React hub and the vanilla game page.
// No player names or other user input is accepted as markup.
const SCENES = {
  imposter: '<div class="imposter-scene"><span class="pawn pawn-back"></span><span class="pawn pawn-front"><i></i><i></i></span><span class="pawn pawn-side"></span><span class="secret-mark">?</span></div>',
  uno: '<div class="card-fan"><span class="playing-card card-clay"><i>4</i><b>4</b></span><span class="playing-card card-sage"><i>7</i><b>7</b></span><span class="playing-card card-ivory"><i>+4</i><b>+4</b></span></div>',
  trivia: '<div class="trivia-sculpture"><span class="question-ring"></span><b>?</b><i></i></div>',
  werewolf: '<div class="night-sculpture"><span class="stone-moon"></span><svg viewBox="0 0 180 150"><path d="m47 140 10-56 10-29-2-37 30 25 24-16-3 36 17 27-13 50Z" fill="currentColor"/><path d="m78 80 11 6m19-8-10 8" stroke="var(--art-highlight)" stroke-width="3"/></svg></div>',
  mafia: '<div class="mafia-sculpture"><span class="hat-crown"></span><span class="hat-brim"></span><span class="mafia-card">♦</span></div>',
  bomb: '<div class="bomb-sculpture"><span class="bomb-fuse"></span><span class="bomb-body"></span><span class="fuse-spark">✧</span></div>',
  spyfall: '<div class="spy-sculpture"><span class="spy-globe"><i></i><i></i></span><span class="spy-pin"></span></div>',
};

export function gameArtworkMarkup(game) {
  if (!Object.hasOwn(SCENES, game)) return "";
  return '<span class="art-orbit orbit-one"></span><span class="art-orbit orbit-two"></span>'
    + SCENES[game] + '<span class="art-floor"></span>';
}
