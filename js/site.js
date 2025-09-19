(() => {
  const THEME_STORAGE_KEY = 'portfolio:theme';
  const LIGHT_MODE_CLASS = 'is-light-mode';
  const prefersLightScheme =
    typeof window.matchMedia === 'function'
      ? window.matchMedia('(prefers-color-scheme: light)')
      : null;

  let toggleButton = null;
  let loadBar = null;

  function readStoredTheme() {
    try {
      return localStorage.getItem(THEME_STORAGE_KEY);
    } catch (error) {
      console.warn('Unable to read theme from storage:', error);
      return null;
    }
  }

  function persistTheme(theme) {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch (error) {
      console.warn('Unable to save theme preference:', error);
    }
  }

  function updateToggleButton(isLight) {
    if (!toggleButton) {
      return;
    }

    toggleButton.setAttribute('aria-pressed', String(isLight));
    toggleButton.setAttribute(
      'aria-label',
      isLight ? 'Switch to dark mode' : 'Switch to light mode'
    );

    const icon = toggleButton.querySelector('img');
    if (icon) {
      icon.alt = isLight ? 'Dark mode button' : 'Light mode button';
    }
  }

  function applyTheme(theme) {
    const body = document.body;
    if (!body) {
      return;
    }

    const normalizedTheme = theme === 'light' ? 'light' : 'dark';
    const isLight = normalizedTheme === 'light';

    body.classList.toggle(LIGHT_MODE_CLASS, isLight);
    updateToggleButton(isLight);
  }

  function resolveInitialTheme() {
    const storedTheme = readStoredTheme();
    if (storedTheme) {
      return storedTheme;
    }

    if (prefersLightScheme && typeof prefersLightScheme.matches === 'boolean') {
      return prefersLightScheme.matches ? 'light' : 'dark';
    }

    return 'dark';
  }

  function toggleTheme(event) {
    event.preventDefault();

    const shouldEnableLight = !document.body.classList.contains(LIGHT_MODE_CLASS);
    const nextTheme = shouldEnableLight ? 'light' : 'dark';

    applyTheme(nextTheme);
    persistTheme(nextTheme);
  }

  function handleSystemThemeChange(event) {
    if (readStoredTheme()) {
      return;
    }

    applyTheme(event.matches ? 'light' : 'dark');
  }

  function ensureLoadBar() {
    if (!loadBar) {
      loadBar = document.querySelector('.load-bar');
    }

    return loadBar;
  }

  function hideLoadBar() {
    const bar = ensureLoadBar();
    if (!bar) {
      return;
    }

    bar.style.transition = 'none';
    bar.style.width = '0%';
    bar.style.display = 'none';
  }

  function animateLoadBar(interval, totalSlides) {
    const bar = ensureLoadBar();
    if (!bar) {
      return;
    }

    if (!totalSlides || totalSlides <= 1 || !interval) {
      hideLoadBar();
      return;
    }

    bar.style.display = 'block';
    bar.style.transition = 'none';
    bar.style.width = '0%';

    // Force a reflow so the browser recognises the reset width before animating.
    bar.getBoundingClientRect();

    bar.style.transition = `width ${interval}ms linear`;
    bar.style.width = '100%';
  }

  function handleCarouselCycle(event) {
    const detail = event.detail || {};
    const interval = typeof detail.interval === 'number' ? detail.interval : 0;
    animateLoadBar(interval, detail.total);
  }

  document.addEventListener('DOMContentLoaded', () => {
    toggleButton = document.querySelector('.light-switch-button');

    const initialTheme = resolveInitialTheme();
    applyTheme(initialTheme);

    if (toggleButton) {
      const tagName = toggleButton.tagName.toLowerCase();
      const isNativeButton = tagName === 'button';

      if (!isNativeButton) {
        toggleButton.setAttribute('role', 'button');
        toggleButton.setAttribute('tabindex', '0');
      }

      toggleButton.addEventListener('click', toggleTheme);

      if (!isNativeButton) {
        toggleButton.addEventListener('keydown', (event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            toggleTheme(event);
          }
        });
      }
    }

    animateLoadBar(0, 0);
  });

  document.addEventListener('carousel:cycle', handleCarouselCycle);
  document.addEventListener('carousel:reset', hideLoadBar);
  document.addEventListener('carousel:stopped', handleCarouselCycle);

  if (prefersLightScheme) {
    const listener = (event) => handleSystemThemeChange(event);
    if (typeof prefersLightScheme.addEventListener === 'function') {
      prefersLightScheme.addEventListener('change', listener);
    } else if (typeof prefersLightScheme.addListener === 'function') {
      prefersLightScheme.addListener(listener);
    }
  }
})();
