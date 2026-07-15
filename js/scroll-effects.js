/* Shared scroll effects: Lenis smooth scrolling + reveal-on-scroll.
   Include after the Lenis CDN script. Both effects are skipped when the
   user prefers reduced motion. */
(function () {
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── Lenis smooth scrolling ──────────────────────────────────
     Falls back silently to native scrolling if the CDN script
     failed to load. The instance is exposed on window.__lenis so
     page scripts (e.g. back-to-top buttons) can reuse it. */
  if (!reduced && typeof window.Lenis === 'function') {
    var lenis = new window.Lenis();
    window.__lenis = lenis;
    var raf = function (time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    };
    requestAnimationFrame(raf);
  }

  /* ── Reveal on scroll ────────────────────────────────────────
     Elements marked with [data-reveal] start hidden (see the page
     CSS, gated on the html.js class) and animate in the first time
     they enter the viewport. Elements that intersect in the same
     observer batch get a small stagger. Each element is unobserved
     after revealing, so the animation runs exactly once. */
  var els = document.querySelectorAll('[data-reveal]');
  if (!els.length) return;

  if (reduced || !('IntersectionObserver' in window)) {
    els.forEach(function (el) { el.classList.add('is-revealed'); });
    return;
  }

  var io = new IntersectionObserver(function (entries) {
    var delay = 0;
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      entry.target.style.transitionDelay = delay + 'ms';
      entry.target.classList.add('is-revealed');
      io.unobserve(entry.target);
      delay += 90;
    });
  }, { threshold: 0, rootMargin: '0px 0px -60px 0px' });

  els.forEach(function (el) { io.observe(el); });
})();
