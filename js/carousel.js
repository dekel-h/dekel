// Custom carousel logic for Dekel Hillel's portfolio site
//
// This script replaces the broken Webflow carousel implementation with a
// straightforward mechanism that cycles through hero images on a timer.
// It assumes that the hero section contains multiple images with the
// class name `image-hero` and that only one image should be visible at
// a time. Each image is displayed for five seconds before transitioning
// to the next one. If users add or remove images from the hero section
// they will automatically be included in the rotation.

(() => {
  /**
   * Hide all hero images except the one at the specified index.
   *
   * @param {HTMLElement[]} images - Array of hero image elements.
   * @param {number} index - Index of the image to show.
   */
  function showSlide(images, index) {
    images.forEach((img, i) => {
      // Use inline styles rather than classes to avoid conflicts with
      // Webflow-generated styles. Only the current image should be
      // displayed; all others are hidden.
      img.style.display = i === index ? 'block' : 'none';
    });
  }

  /**
   * Initialise the carousel once the DOM is ready. This function locates
   * all images with the class `image-hero`, shows the first image, and
   * sets up a timer to automatically cycle through them.
   */
  function initCarousel() {
    const images = Array.from(document.querySelectorAll('.image-hero'));
    if (images.length === 0) {
      // No hero images found; nothing to initialise.
      return;
    }

    let currentIndex = 0;
    showSlide(images, currentIndex);

    // Cycle through slides every 5 seconds. Use modulo to wrap
    // around to the first slide when reaching the end.
    setInterval(() => {
      currentIndex = (currentIndex + 1) % images.length;
      showSlide(images, currentIndex);
    }, 5000);
  }

  // Run the init function after DOMContentLoaded to ensure that
  // all elements are available in the DOM.
  document.addEventListener('DOMContentLoaded', initCarousel);
})();