// Content management bootstrap for Dekel Hillel's portfolio site
//
// This script loads structured content from `content.json` and injects it
// into the static Webflow markup. The goal is to let non-technical editors
// update the copy, links and imagery by editing a single JSON file instead
// of touching the HTML. Once the content is in place we emit a custom
// `content:ready` event so that other scripts (like the hero carousel)
// can react to the dynamically added elements.

(function () {
  const CONTENT_PATH = 'content.json';

  function setTextContent(selector, text, useHtml = false) {
    const element = document.querySelector(selector);
    if (!element || text == null) {
      return;
    }

    if (useHtml) {
      element.innerHTML = text;
    } else {
      element.textContent = text;
    }
  }

  function buildPreviousRoles(roles) {
    const container = document.querySelector('#previous-roles');
    if (!container || !Array.isArray(roles)) {
      return;
    }

    container.innerHTML = '';

    roles.forEach((role) => {
      const wrapper = document.createElement('div');
      wrapper.className = 'split-title-position-wrapper';

      const linkWrapper = document.createElement('div');
      linkWrapper.className = 'text-block-body-16px';

      const link = document.createElement('a');
      link.href = role.companyUrl || '#';
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      if (role.linkClass) {
        link.className = role.linkClass;
      }

      const strong = document.createElement('strong');
      strong.textContent = role.companyName || '';
      strong.className = role.companyStrongClass || '';
      link.appendChild(strong);

      linkWrapper.appendChild(link);
      wrapper.appendChild(linkWrapper);

      const detailsWrapper = document.createElement('div');
      detailsWrapper.className = 'flex-vertical gap-row-8px';

      const title = document.createElement('div');
      if (role.titleClass) {
        title.className = role.titleClass;
      }
      if (role.titleHtml) {
        title.innerHTML = role.titleHtml;
      } else if (role.title) {
        title.textContent = role.title;
      }
      detailsWrapper.appendChild(title);

      const years = document.createElement('div');
      const yearsSpan = document.createElement('span');
      if (role.yearsClass) {
        yearsSpan.className = role.yearsClass;
      }
      if (role.years) {
        yearsSpan.textContent = role.years;
      }
      years.appendChild(yearsSpan);
      detailsWrapper.appendChild(years);

      wrapper.appendChild(detailsWrapper);
      container.appendChild(wrapper);
    });
  }

  function buildSocialLinks(links) {
    const container = document.querySelector('#social-links');
    if (!container || !Array.isArray(links)) {
      return;
    }

    container.innerHTML = '';

    links.forEach((linkData) => {
      const link = document.createElement('a');
      link.href = linkData.url || '#';
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = linkData.label || '';

      if (linkData.id) {
        link.id = linkData.id;
      }
      if (linkData.className) {
        link.className = linkData.className;
      }

      container.appendChild(link);
    });
  }

  function buildHeroImages(images) {
    const container = document.querySelector('#hero-image-container');
    if (!container || !Array.isArray(images)) {
      return;
    }

    const loadBar = container.querySelector('.load-bar');
    const existingImages = container.querySelectorAll('.image-hero');
    existingImages.forEach((image) => image.remove());

    images.forEach((imageData) => {
      const img = document.createElement('img');

      if (Array.isArray(imageData.classList) && imageData.classList.length) {
        img.className = imageData.classList.join(' ');
      }

      if (imageData.loading) {
        img.loading = imageData.loading;
      }

      if (imageData.alt) {
        img.alt = imageData.alt;
      }

      if (imageData.width) {
        img.width = imageData.width;
      }

      if (imageData.src) {
        img.src = imageData.src;
      }

      if (imageData.srcset) {
        img.setAttribute('srcset', imageData.srcset);
      }

      if (imageData.sizes) {
        img.setAttribute('sizes', imageData.sizes);
      }

      if (imageData.dataAttributes) {
        Object.entries(imageData.dataAttributes).forEach(([name, value]) => {
          img.setAttribute(name, value);
        });
      }

      if (loadBar) {
        container.insertBefore(img, loadBar);
      } else {
        container.appendChild(img);
      }
    });
  }

  async function loadContent() {
    try {
      const response = await fetch(CONTENT_PATH, { cache: 'no-cache' });
      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const content = await response.json();

      const hero = content.hero || {};
      setTextContent('#hero-title', hero.title || '');
      setTextContent('#hero-subtitle', hero.subtitleHtml || '', true);
      buildPreviousRoles(content.previousRoles);
      buildSocialLinks(content.socialLinks);
      buildHeroImages(content.heroImages);

      document.dispatchEvent(new Event('content:ready'));
    } catch (error) {
      console.error('Failed to load site content:', error);
    }
  }

  document.addEventListener('DOMContentLoaded', loadContent);
})();
