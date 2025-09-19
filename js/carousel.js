// Custom carousel logic for Dekel Hillel's portfolio site
//
// The carousel relies on hero images being injected dynamically by
// `content.js`. To avoid race conditions we listen for a custom
// `content:ready` event and fall back to a MutationObserver if no images
// exist when the DOM is ready.

(() => {
  const CAROUSEL_INTERVAL = 5000;
  const IMAGE_SELECTOR = '.image-hero';
  const CONTAINER_SELECTOR = '#hero-image-container';

  const requestFrame =
    typeof window.requestAnimationFrame === 'function'
      ? window.requestAnimationFrame.bind(window)
      : (callback) => window.setTimeout(callback, 16);

  let intervalId = null;
  let observer = null;
  let activeImages = [];
  let currentIndex = 0;
  let mutationFrame = null;

  function emitEvent(name, detail) {
    document.dispatchEvent(
      new CustomEvent(name, {
        detail,
      })
    );
  }

  function collectImages(container) {
    return Array.from(container.querySelectorAll(IMAGE_SELECTOR));
  }

  function stopRotation() {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }

    if (activeImages.length) {
      emitEvent('carousel:stopped', {
        total: activeImages.length,
        index: currentIndex,
      });
    }
  }

  function showSlide(images, index) {
    if (!images.length) {
      return;
    }

    const normalizedIndex = Math.min(Math.max(index, 0), images.length - 1);
    if (normalizedIndex !== index) {
      currentIndex = normalizedIndex;
    }

    images.forEach((img, i) => {
      const isVisible = i === normalizedIndex;
      const displayValue = isVisible ? 'block' : 'none';

      if (img.style.display !== displayValue) {
        img.style.display = displayValue;
      }

      const ariaHiddenValue = String(!isVisible);
      if (img.getAttribute('aria-hidden') !== ariaHiddenValue) {
        img.setAttribute('aria-hidden', ariaHiddenValue);
      }
    });

    emitEvent('carousel:cycle', {
      total: images.length,
      index: currentIndex,
      interval: CAROUSEL_INTERVAL,
    });
  }

  function startRotation(images) {
    stopRotation();
    showSlide(images, currentIndex);

    if (images.length <= 1) {
      return;
    }

    intervalId = window.setInterval(() => {
      currentIndex = (currentIndex + 1) % images.length;
      showSlide(images, currentIndex);
    }, CAROUSEL_INTERVAL);
  }

  function imagesChanged(newImages) {
    if (activeImages.length !== newImages.length) {
      return true;
    }

    return newImages.some((image, index) => image !== activeImages[index]);
  }

  function initCarousel() {
    const container = document.querySelector(CONTAINER_SELECTOR);
    if (!container) {
      return false;
    }

    const images = collectImages(container);
    if (!images.length) {
      activeImages = [];
      currentIndex = 0;
      stopRotation();
      emitEvent('carousel:reset', { total: 0 });
      return false;
    }

    if (!imagesChanged(images)) {
      if (!intervalId) {
        startRotation(activeImages);
      }
      return true;
    }

    activeImages = images;
    currentIndex = Math.min(currentIndex, activeImages.length - 1);
    startRotation(activeImages);
    return true;
  }

  function scheduleInit() {
    if (mutationFrame != null) {
      return;
    }

    mutationFrame = requestFrame(() => {
      mutationFrame = null;
      initCarousel();
    });
  }

  function watchForChanges(container) {
    if (observer) {
      observer.disconnect();
    }

    observer = new MutationObserver(scheduleInit);

    observer.observe(container, { childList: true });
  }

  function bootstrap() {
    const container = document.querySelector(CONTAINER_SELECTOR);
    if (!container) {
      return;
    }

    initCarousel();
    watchForChanges(container);
  }

  document.addEventListener('DOMContentLoaded', bootstrap);
  document.addEventListener('content:ready', bootstrap);

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      stopRotation();
      return;
    }

    if (activeImages.length) {
      startRotation(activeImages);
    }
  });
})();
