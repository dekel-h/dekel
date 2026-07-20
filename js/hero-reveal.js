/* Hero → work scroll reveal.
   On desktop (and only when the user hasn't asked for reduced motion),
   the hero is fixed behind while the work section scrolls up over it,
   with the hero content easing back and fading for depth.
   Uses a scroll-scrubbed timeline (no GSAP pin), so there's no width
   capture and no resize gaps. Mobile / reduced-motion keep normal
   scrolling. Integrates with the site's Lenis smooth scrolling. */
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

    /* Enables the fixed-hero CSS (see .reveal rules in the stylesheet). */
    document.body.classList.add('reveal');

    var tl = gsap.timeline({
      scrollTrigger: {
        trigger: document.documentElement,
        start: 0,
        end: function () { return window.innerHeight; },  /* recomputed on refresh/resize */
        scrub: 0.6,
        invalidateOnRefresh: true
      }
    });

    /* Hero content recedes as the work section rises over it. */
    tl.to(heroInner, { yPercent: -14, scale: 0.94, ease: 'power1.in' }, 0)
      /* Whole hero fades so the work sits on a clean background once covered. */
      .to(hero, { opacity: 0, ease: 'power1.in' }, 0);
    /* Background drifts a touch for parallax depth. */
    if (heroBg) tl.to(heroBg, { scale: 1.06, ease: 'none' }, 0);

    /* matchMedia cleanup: fully revert when leaving the breakpoint. */
    return function () {
      document.body.classList.remove('reveal');
      if (tl.scrollTrigger) tl.scrollTrigger.kill();
      tl.kill();
      gsap.set([hero, heroInner, heroBg], { clearProps: 'all' });
    };
  });

  /* Recompute distances once images and fonts have settled. */
  window.addEventListener('load', function () { ScrollTrigger.refresh(); });
})();
