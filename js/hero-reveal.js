/* Pinned hero → work reveal.
   On desktop (and only when the user hasn't asked for reduced motion),
   the hero pins in place while the work section scrolls up and over it,
   with the hero content easing back for depth — a restrained take on
   GSAP's pinned-panels-with-overscroll pattern.
   Integrates with the site's Lenis smooth scrolling and pauses cleanly
   on mobile / reduced-motion, where normal scrolling is kept. */
(function () {
  'use strict';
  if (!window.gsap || !window.ScrollTrigger) return;

  gsap.registerPlugin(ScrollTrigger);

  /* Keep ScrollTrigger's position in sync with Lenis's smooth scroll. */
  if (window.__lenis && typeof window.__lenis.on === 'function') {
    window.__lenis.on('scroll', ScrollTrigger.update);
  }

  var mm = gsap.matchMedia();

  mm.add('(min-width: 1024px) and (prefers-reduced-motion: no-preference)', function () {
    var hero = document.querySelector('.hero');
    var heroInner = document.querySelector('.hero-inner');
    var heroBg = document.querySelector('.hero-bg');
    if (!hero || !heroInner) return;

    var tl = gsap.timeline({
      scrollTrigger: {
        trigger: hero,
        start: 'top top',
        end: 'bottom top',
        pin: true,
        pinSpacing: false,   /* let the work section scroll over the pinned hero */
        scrub: 0.6,          /* slight catch-up for an overscroll-like feel */
        invalidateOnRefresh: true
      }
    });

    /* Hero content recedes as the work curtain rises. */
    tl.to(heroInner, { yPercent: -14, opacity: 0, scale: 0.94, ease: 'power1.in' }, 0);
    /* Background drifts a touch for parallax depth. */
    if (heroBg) tl.to(heroBg, { scale: 1.06, ease: 'none' }, 0);

    /* matchMedia cleanup: fully revert when leaving the breakpoint. */
    return function () {
      if (tl.scrollTrigger) tl.scrollTrigger.kill();
      tl.kill();
      gsap.set([heroInner, heroBg], { clearProps: 'all' });
    };
  });

  /* Recompute pin distances once images and fonts have settled. */
  window.addEventListener('load', function () { ScrollTrigger.refresh(); });
})();
