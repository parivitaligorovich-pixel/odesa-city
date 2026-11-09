// Intro: shows the brand mark with a load counter, then opens a circle onto the hero.
(() => {
  const html = document.documentElement;
  const intro = document.querySelector('[data-intro]');
  const counter = document.querySelector('[data-intro-count]');
  const heroImg = document.querySelector('.hero__media img');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const ready = () => {
    document.body.classList.add('is-ready');
    html.classList.remove('is-intro');
    document.dispatchEvent(new Event('hero:ready'));
  };

  if (!intro || reduce) {
    intro?.classList.add('is-gone');
    // body may not exist yet if this runs in <head>; scripts are at the end of <body>
    return ready();
  }

  // Wait for the hero image (max 3s) and a minimum show time so the mark can assemble
  const MIN = 1300, MAX = 3000, t0 = performance.now();
  let target = 0, done = false;

  const imgLoaded = heroImg?.decode ? heroImg.decode().catch(() => {}) : Promise.resolve();
  imgLoaded.then(() => { target = 100; });
  setTimeout(() => { target = 100; }, MAX);

  // Time-based counter: reaches 100% at MIN ms once the image is ready
  const tick = () => {
    const elapsed = performance.now() - t0;
    const p = Math.min(1, elapsed / MIN);
    const eased = 1 - Math.pow(1 - p, 3);
    const shown = target === 100 ? eased * 100 : Math.min(eased * 100, 92);
    if (counter) counter.textContent = Math.round(shown);
    if (target === 100 && p >= 1) return finish();
    requestAnimationFrame(tick);
  };
  // Safety net: never keep the intro longer than MAX + 0.5s
  setTimeout(() => { if (counter) counter.textContent = '100'; finish(); }, MAX + 500);

  const finish = () => {
    if (done) return;
    done = true;
    intro.classList.add('is-out');
    // let the hole start opening, then start the hero choreography underneath
    setTimeout(ready, 250);
    setTimeout(() => intro.classList.add('is-gone'), 1300);
  };

  requestAnimationFrame(tick);
})();
