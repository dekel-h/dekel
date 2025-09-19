// Custom carousel logic for Dekel Hillel's portfolio site
//
// The carousel relies on hero images being injected dynamically by
// `content.js`. To avoid race conditions we listen for a custom
// `content:ready` event and fall back to a MutationObserver if no images
// exist when the DOM is ready.

(() => {
  let intervalId = null;
  let observer = null;

  function showSlide(images, index) {
    images.forEach((img, i) => {
      img.style.display = i === index ? 'block' : 'none';
    });
  }

  function startRotation(images) {
    if (intervalId) {
      clearInterval(intervalId);
    }

    let currentIndex = 0;
    showSlide(images, currentIndex);

    if (images.length <= 1) {
      return;
    }

    intervalId = setInterval(() => {
      currentIndex = (currentIndex + 1) % images.length;
      showSlide(images, currentIndex);
    }, 5000);
  }

  function initCarousel() {
    const images = Array.from(document.querySelectorAll('.image-hero'));
    if (images.length === 0) {
      return false;
    }

    startRotation(images);

    if (observer) {
      observer.disconnect();
      observer = null;
    }

    return true;
  }

  function waitForImages() {
    if (observer) {
      return;
    }

    observer = new MutationObserver(() => {
      if (initCarousel()) {
        observer.disconnect();
        observer = null;
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }

  function onDomReady() {
    if (!initCarousel()) {
      waitForImages();
    }
  }

  document.addEventListener('DOMContentLoaded', onDomReady);
  document.addEventListener('content:ready', initCarousel);
})();
