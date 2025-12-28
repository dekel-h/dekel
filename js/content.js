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
  const elementCache = new Map();

  function getElement(selector) {
    if (!selector) {
      return null;
    }

    if (!elementCache.has(selector)) {
      elementCache.set(selector, document.querySelector(selector));
    }

    return elementCache.get(selector);
  }

  function setTextContent(selector, text, useHtml = false) {
    if (text == null) {
      return;
    }

    const element = getElement(selector);
    if (!element) {
      return;
    }

    if (useHtml) {
      if (element.innerHTML !== text) {
        element.innerHTML = text;
      }
    } else if (element.textContent !== text) {
      element.textContent = text;
    }
  }

  function buildCallToAction(callToAction) {
    const container = getElement('#hero-cta');
    if (!container) {
      return;
    }

    container.innerHTML = '';

    const {
      label = '',
      url = '',
      target = '_blank',
      rel = 'noopener noreferrer',
    } = callToAction || {};

    const trimmedLabel = typeof label === 'string' ? label.trim() : '';
    const trimmedUrl = typeof url === 'string' ? url.trim() : '';

    if (!trimmedLabel) {
      return;
    }

    const button = document.createElement('a');
    button.textContent = trimmedLabel;
    button.className = 'cta-button';
    button.href = trimmedUrl || '#';
    button.target = target;
    button.rel = rel;

    container.appendChild(button);
  }

  function buildPreviousRoles(roles) {
    const container = getElement('#previous-roles');
    if (!container || !Array.isArray(roles)) {
      return;
    }

    container.innerHTML = '';

    const fragment = document.createDocumentFragment();

    roles.forEach((role) => {
      const {
        companyName = '',
        companyStrongClass = '',
        companyUrl = '',
        dataAttributes = {},
        linkClass,
        title,
        titleClass,
        titleHtml,
        years,
        yearsClass,
      } = role || {};

      const wrapper = document.createElement('div');
      wrapper.className = 'split-title-position-wrapper';

      const linkWrapper = document.createElement('div');
      linkWrapper.className = 'text-block-body-16px';

      const link = document.createElement('a');
      const normalizedCompanyUrl =
        typeof companyUrl === 'string' ? companyUrl.trim() : '';
      if (normalizedCompanyUrl) {
        link.href = normalizedCompanyUrl;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
      } else {
        link.href = '#';
      }
      if (linkClass) {
        link.className = linkClass;
      }

      const strong = document.createElement('strong');
      strong.textContent = companyName;
      if (companyStrongClass) {
        strong.className = companyStrongClass;
      }
      link.appendChild(strong);

      if (dataAttributes && typeof dataAttributes === 'object') {
        Object.entries(dataAttributes).forEach(([name, value]) => {
          if (value != null) {
            link.setAttribute(name, value);
          }
        });
      }

      linkWrapper.appendChild(link);
      wrapper.appendChild(linkWrapper);

      const detailsWrapper = document.createElement('div');
      detailsWrapper.className = 'flex-vertical gap-row-8px';

      const titleElement = document.createElement('div');
      if (titleClass) {
        titleElement.className = titleClass;
      }
      if (titleHtml) {
        titleElement.innerHTML = titleHtml;
      } else if (title) {
        titleElement.textContent = title;
      }
      detailsWrapper.appendChild(titleElement);

      const yearsWrapper = document.createElement('div');
      const yearsSpan = document.createElement('span');
      if (yearsClass) {
        yearsSpan.className = yearsClass;
      }
      if (years) {
        yearsSpan.textContent = years;
      }
      yearsWrapper.appendChild(yearsSpan);
      detailsWrapper.appendChild(yearsWrapper);

      wrapper.appendChild(detailsWrapper);
      fragment.appendChild(wrapper);
    });

    container.appendChild(fragment);
  }

  function buildSocialLinks(links) {
    const container = getElement('#social-links');
    if (!container || !Array.isArray(links)) {
      return;
    }

    container.innerHTML = '';
    const fragment = document.createDocumentFragment();

    links.forEach((linkData) => {
      if (!linkData) {
        return;
      }

      const link = document.createElement('a');
      link.textContent = linkData.label || '';

      const url = typeof linkData.url === 'string' ? linkData.url.trim() : '';
      if (url) {
        link.href = url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
      }

      if (linkData.id) {
        link.id = linkData.id;
      }
      if (linkData.className) {
        link.className = linkData.className;
      }

      fragment.appendChild(link);
    });

    container.appendChild(fragment);
  }

  function applyImageAttributes(img, imageData) {
    if (!imageData) {
      return;
    }

    const {
      alt,
      classList,
      dataAttributes,
      decoding = 'async',
      loading,
      sizes,
      src,
      srcset,
      width,
    } = imageData;

    if (Array.isArray(classList) && classList.length) {
      img.className = classList.join(' ');
    }

    if (loading) {
      img.loading = loading;
    }

    if (alt) {
      img.alt = alt;
    }

    if (typeof width === 'number') {
      img.width = width;
    } else if (typeof width === 'string' && width.trim()) {
      img.setAttribute('width', width);
    }

    if (decoding) {
      img.decoding = decoding;
    }

    if (src) {
      img.src = src;
    }

    if (srcset) {
      img.setAttribute('srcset', srcset);
    }

    if (sizes) {
      img.setAttribute('sizes', sizes);
    }

    if (dataAttributes && typeof dataAttributes === 'object') {
      Object.entries(dataAttributes).forEach(([name, value]) => {
        if (value != null) {
          img.setAttribute(name, value);
        }
      });
    }
  }

  function buildHeroImages(images) {
    const container = getElement('#hero-image-container');
    if (!container || !Array.isArray(images)) {
      return;
    }

    const loadBar = container.querySelector('.load-bar');
    container.querySelectorAll('.image-hero').forEach((image) => image.remove());

    if (!images.length) {
      return;
    }

    const fragment = document.createDocumentFragment();

    images.forEach((imageData) => {
      const img = document.createElement('img');
      applyImageAttributes(img, imageData);
      fragment.appendChild(img);
    });

    if (loadBar) {
      container.insertBefore(fragment, loadBar);
    } else {
      container.appendChild(fragment);
    }
  }

  async function loadContent() {
    try {
      const response = await fetch(CONTENT_PATH, { cache: 'no-store' });
      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const content = await response.json();
      const {
        hero = {},
        previousRoles = [],
        socialLinks = [],
        heroImages = [],
      } = content || {};

      setTextContent('#hero-title', hero.title || '');
      setTextContent('#hero-subtitle', hero.subtitleHtml || '', true);
      buildCallToAction(hero.callToAction);
      buildPreviousRoles(previousRoles);
      buildSocialLinks(socialLinks);
      buildHeroImages(heroImages);

      document.dispatchEvent(new CustomEvent('content:ready', { detail: content }));
    } catch (error) {
      console.error('Failed to load site content:', error);
    }
  }

  document.addEventListener('DOMContentLoaded', loadContent);
})();
