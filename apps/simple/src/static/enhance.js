/**
 * Progressive Enhancement Script
 * Adds real-time search and copy-to-clipboard functionality
 * The site works fully without this script - this just improves the UX
 */

(function () {
  'use strict';

  // Only run if browser supports fetch
  if (!window.fetch) return;

  const form = document.getElementById('search-form');
  const input = document.getElementById('search-input');
  const resultsContainer = document.getElementById('results');

  let debounceTimer = null;

  /**
   * Setup search-as-you-type functionality
   */
  function setupSearchAsYouType() {
    if (!form || !input) return;

    // Intercept form submission for async update
    input.addEventListener('input', function (e) {
      clearTimeout(debounceTimer);

      debounceTimer = setTimeout(async function () {
        const query = e.target.value;

        // Update URL without full page reload
        const url = new URL(window.location);
        if (query) {
          url.searchParams.set('q', query);
        } else {
          url.searchParams.delete('q');
        }
        history.replaceState({}, '', url);

        // Fetch HTML fragment
        try {
          const response = await fetch('/?q=' + encodeURIComponent(query), {
            headers: { Accept: 'text/html-partial' },
          });

          if (response.ok && resultsContainer) {
            resultsContainer.outerHTML = await response.text();
          }
        } catch (err) {
          console.error('Search failed:', err);
        }
      }, 200);
    });

    // Prevent default form submission when JS is enabled
    form.addEventListener('submit', function (e) {
      // Only prevent if we're doing async search
      if (resultsContainer) {
        e.preventDefault();
        // Trigger the search immediately
        input.dispatchEvent(new Event('input'));
      }
    });
  }

  /**
   * Setup copy-to-clipboard functionality
   */
  function setupCopyButtons() {
    document.addEventListener('click', function (e) {
      const button = e.target.closest('[data-copy]');
      if (!button) return;

      const text = button.dataset.copy;
      if (!text) return;

      navigator.clipboard
        .writeText(text)
        .then(function () {
          const originalText = button.textContent;
          button.textContent = 'Copied!';
          setTimeout(function () {
            button.textContent = originalText;
          }, 2000);
        })
        .catch(function (err) {
          console.error('Copy failed:', err);
        });
    });
  }

  /**
   * Setup keyboard navigation through results
   */
  function setupKeyboardNavigation() {
    document.addEventListener('keydown', function (e) {
      // Focus search input on '/' key (common search shortcut)
      if (e.key === '/' && document.activeElement !== input) {
        e.preventDefault();
        if (input) input.focus();
        return;
      }

      // Escape clears search and blurs input
      if (e.key === 'Escape' && document.activeElement === input) {
        if (input) {
          input.value = '';
          input.blur();
          // Update URL
          const url = new URL(window.location);
          url.searchParams.delete('q');
          history.replaceState({}, '', url);
        }
      }
    });
  }

  // Initialize all enhancements
  setupSearchAsYouType();
  setupCopyButtons();
  setupKeyboardNavigation();
})();
