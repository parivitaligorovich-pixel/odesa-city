(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fmt = (n) => n.toLocaleString('uk-UA');
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const ease = (t) => 1 - Math.pow(1 - t, 3);

  // --- Split statement into words for staggered reveal ---
  document.querySelectorAll('[data-split]').forEach((el) => {
    let i = 0;
    el.querySelectorAll('span').forEach((part) => {
      const words = part.textContent.trim().split(/\s+/);
      part.innerHTML = words.map((w) => `<span class="w" style="--i:${i++}">${w}</span>`).join(' ');
    });
  });

  // --- Count-up ---
  const countUp = (el) => {
    if (el.dataset.counted) return;
    el.dataset.counted = '1';
    const end = +el.dataset.count;
    if (reduce) return (el.textContent = fmt(end));
    const dur = 1600, t0 = performance.now();
    const tick = (t) => {
      const p = Math.min((t - t0) / dur, 1);
      el.textContent = fmt(Math.round(end * ease(p)));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  // --- Founder: sticky circle-mask reveal (desktop only) ---
  const sec = document.querySelector('[data-founder]');
  const desktop = matchMedia('(min-width: 1025px)');
  const masked = () => sec && !reduce && desktop.matches;
  const setMode = () => sec?.classList.toggle('is-masked', masked());
  setMode();
  desktop.addEventListener?.('change', setMode);

  // --- Reveal on scroll ---
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add('is-in');
      e.target.querySelectorAll?.('[data-count]').forEach(countUp);
      if (e.target.dataset.count) countUp(e.target);
      io.unobserve(e.target);
    });
  }, { threshold: 0.25 });

  document.querySelectorAll('[data-split], .stats, .big-stat').forEach((el) => io.observe(el));
  document.querySelectorAll('[data-reveal-on-scroll], [data-fx]').forEach((el) => {
    if (!masked()) io.observe(el);
  });

  if (!sec || reduce) return;

  const sticky = sec.querySelector('.founder__sticky');
  const scene = sec.querySelector('[data-scene]');
  const photo = sec.querySelector('[data-photo]');
  const title = sec.querySelector('[data-founder-title]');
  const cards = sec.querySelectorAll('[data-fx]');
  const shapes = [...sec.querySelectorAll('.mk')].map((el) => ({ el, d: +el.dataset.depth }));
  let mx = 0, cx = 0, csp = 0, visible = false, cardsShown = false;

  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(sec);
  sec.addEventListener('pointermove', (e) => {
    const r = sec.getBoundingClientRect();
    mx = ((e.clientX - r.left) / r.width - 0.5) * 2;
  });
  sec.addEventListener('pointerleave', () => { mx = 0; });

  // Founder position inside the generated image (fractions of image size)
  const FIG = { x: 0.508, headTop: 0.079, chest: 0.52, headW: 0.13 };
  const POS_Y = 0.24; // matches object-position: 50% 24%

  const updateMask = (p) => {
    const W = sticky.clientWidth, H = sticky.clientHeight;
    const iw = photo.naturalWidth, ih = photo.naturalHeight;
    if (!iw || !W) return;

    // object-fit: cover geometry
    const s = Math.max(W / iw, H / ih);
    const rw = iw * s, rh = ih * s;
    const ox = (W - rw) * 0.5, oy = (H - rh) * POS_Y;

    const cx = ox + rw * FIG.x;
    const cy = oy + rh * FIG.chest;
    const r0 = rh * (FIG.chest - FIG.headTop) * 0.82;   // circle top sits on the forehead
    const rMax = Math.hypot(Math.max(cx, W - cx), Math.max(cy, H - cy)) + 8;
    const r = r0 + (rMax - r0) * ease(p);
    const hw = rw * FIG.headW;

    scene.style.setProperty('--r', `${r}px`);
    scene.style.setProperty('--cx', `${cx}px`);
    scene.style.setProperty('--cy', `${cy}px`);
    photo.style.setProperty('--pcx', `${cx}px`);
    photo.style.setProperty('--pcy', `${cy}px`);
    photo.style.setProperty('--pr', `${r}px`);
    photo.style.setProperty('--hw', `${hw}px`);
    photo.style.setProperty('--hx', `${cx - hw / 2}px`);
  };

  const loop = () => {
    if (visible) {
      const r = sec.getBoundingClientRect();
      const isMasked = sec.classList.contains('is-masked');
      // Progress through the sticky track: 0 at section top, 1 at the end of the expand phase
      const track = Math.max(1, r.height - innerHeight);
      const prog = clamp(-r.top / track);
      const pMask = isMasked ? clamp(prog / 0.6) : 1;      // first 60% of track = expansion
      const pCards = isMasked ? clamp((prog - 0.55) / 0.3) : 1;

      if (isMasked) {
        updateMask(pMask);
        sec.style.setProperty('--p', pMask.toFixed(3));
        sec.style.setProperty('--cp', ease(pCards).toFixed(3));
        if (pCards > 0.5 && !cardsShown) {
          cardsShown = true;
          sec.classList.add('cards-on');
          cards.forEach((c) => c.querySelectorAll('[data-count]').forEach(countUp));
        } else if (pCards <= 0.5 && cardsShown) {
          cardsShown = false;
          sec.classList.remove('cards-on');
        }
      }

      // Parallax for logo shapes + background
      const sp = isMasked ? prog * 2 - 1 : clamp((innerHeight / 2 - (r.top + r.height / 2)) / innerHeight, -1, 1);
      cx += (mx - cx) * 0.08;
      csp += (sp - csp) * 0.12;
      shapes.forEach(({ el, d }) => {
        const tx = cx * d * 16;
        const ty = csp * d * 48;
        const rot = csp * d * 8 + cx * d * 2;
        el.style.transform = `translate(${tx}px, ${ty}px) rotate(${rot}deg)`;
      });
      sec.style.setProperty('--mx', cx.toFixed(3));
      sec.style.setProperty('--sp', csp.toFixed(3));
    }
    requestAnimationFrame(loop);
  };
  loop();
})();
