/* Hero → work scroll reveal (natural flow).
   On desktop (and only when the user hasn't asked for reduced motion),
   the hero scrolls away as usual while its content parallax-fades and
   recedes for depth, and the work section rises up over the hero's
   faded lower edge. No GSAP pin / fixed positioning / scroll-jacking,
   so it reverses cleanly on scroll-up and never desyncs or leaves a
   gap. Integrates with the site's Lenis smooth scrolling. */
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

    document.body.classList.add('reveal');

    /* Hero content recedes and fades as the hero scrolls out of view. */
    var innerTween = gsap.to(heroInner, {
      yPercent: 26,
      scale: 0.96,
      opacity: 0,
      ease: 'none',
      scrollTrigger: {
        trigger: hero,
        start: 'center center',
        end: 'bottom top',
        scrub: 0.6,
        invalidateOnRefresh: true
      }
    });

    /* Background drifts a touch slower for parallax depth. */
    var bgTween = heroBg ? gsap.to(heroBg, {
      yPercent: 14,
      ease: 'none',
      scrollTrigger: {
        trigger: hero,
        start: 'top top',
        end: 'bottom top',
        scrub: 0.6,
        invalidateOnRefresh: true
      }
    }) : null;

    /* matchMedia cleanup: fully revert when leaving the breakpoint. */
    return function () {
      document.body.classList.remove('reveal');
      [innerTween, bgTween].forEach(function (t) {
        if (!t) return;
        if (t.scrollTrigger) t.scrollTrigger.kill();
        t.kill();
      });
      gsap.set([heroInner, heroBg], { clearProps: 'all' });
    };
  });

  window.addEventListener('load', function () { ScrollTrigger.refresh(); });
})();
