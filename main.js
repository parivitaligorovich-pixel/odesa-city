(() => {
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Entrance reveal is triggered by intro.js (adds .is-ready to <body>)

  // Count-up numbers in the offer block
  const countUp = (el) => {
    const end = +el.dataset.count;
    if (reduce) return (el.textContent = end);
    const dur = 1400, t0 = performance.now();
    const tick = (t) => {
      const p = Math.min((t - t0) / dur, 1);
      el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(tick);
    };
    el.textContent = '0';
    setTimeout(() => requestAnimationFrame(tick), 1100);
  };
  const startCounts = () => document.querySelectorAll('.hero [data-count]').forEach(countUp);
  if (document.body.classList.contains('is-ready')) startCounts();
  else document.addEventListener('hero:ready', startCounts, { once: true });

  // Subtle parallax on pointer move / scroll
  const media = document.querySelector('[data-parallax]');
  if (media && !reduce && matchMedia('(pointer: fine)').matches) {
    let tx = 0, ty = 0, cx = 0, cy = 0;
    addEventListener('pointermove', (e) => {
      tx = (e.clientX / innerWidth - .5) * -18;
      ty = (e.clientY / innerHeight - .5) * -12;
    });
    const loop = () => {
      cx += (tx - cx) * .06;
      cy += (ty - cy) * .06;
      media.style.transform = `translate3d(${cx}px, ${cy + scrollY * .25}px, 0)`;
      requestAnimationFrame(loop);
    };
    loop();
  }

  // Mobile menu
  const burger = document.querySelector('[data-burger]');
  const drawer = document.querySelector('[data-drawer]');
  burger?.addEventListener('click', () => {
    const open = burger.getAttribute('aria-expanded') !== 'true';
    burger.setAttribute('aria-expanded', open);
    drawer.hidden = !open;
  });
  drawer?.addEventListener('click', (e) => {
    if (e.target.closest('a')) { burger.setAttribute('aria-expanded', 'false'); drawer.hidden = true; }
  });

  // Lead form dialog
  const dialog = document.querySelector('[data-lead]');
  const form = document.querySelector('[data-lead-form]');
  document.querySelectorAll('[data-open-form]').forEach((a) =>
    a.addEventListener('click', (e) => {
      if (!dialog?.showModal) return;
      e.preventDefault();
      dialog.showModal();
      dialog.querySelector('input[name="name"]').focus();
    })
  );
  dialog?.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); });

  // Simple phone mask: +38 (0XX) XXX XX XX
  const phone = form?.querySelector('input[type="tel"]');
  phone?.addEventListener('input', () => {
    let d = phone.value.replace(/\D/g, '').replace(/^38/, '').slice(0, 10);
    const p = [d.slice(0, 3), d.slice(3, 6), d.slice(6, 8), d.slice(8, 10)];
    phone.value = d ? `+38 (${p[0]}${p[1] ? ') ' + p[1] : ''}${p[2] ? ' ' + p[2] : ''}${p[3] ? ' ' + p[3] : ''}` : '';
  });

  form?.addEventListener('submit', (e) => {
    if (e.submitter?.value === 'close') return;
    e.preventDefault();
    if (!form.reportValidity()) return;
    form.querySelector('.lead__done').hidden = false;
    form.querySelector('.lead__submit').disabled = true;
    setTimeout(() => { dialog.close(); form.reset(); form.querySelector('.lead__done').hidden = true; form.querySelector('.lead__submit').disabled = false; }, 2200);
  });
})();
