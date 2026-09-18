/**
 * Canva Voice Injector - Main Content Script Loader
 * Injected into canva.com/design/* and initializes the in-editor assistant.
 */

(async () => {
  // Ensure we are inside a Canva design editor page
  if (!window.location.pathname.includes('/design/')) {
    return;
  }

  console.log('[Canva Voice Injector] Initializing...');

  // Ensure in-page scanner script is loaded into MAIN world as dual guarantee
  const injectPageScanner = () => {
    if (document.getElementById('cvi-main-scanner-script')) return;
    try {
      const script = document.createElement('script');
      script.id = 'cvi-main-scanner-script';
      script.src = chrome.runtime.getURL('content/page-scanner.js');
      (document.head || document.documentElement).appendChild(script);
    } catch (e) {
      console.warn('[Canva Voice Injector] Script tag fallback note:', e);
    }
  };

  injectPageScanner();

  // Wait for Canva app container to settle
  const init = async () => {
    try {
      injectPageScanner();
      const src = chrome.runtime.getURL('content/floating-widget.js');
      const { FloatingWidget } = await import(src);
      new FloatingWidget();
      console.log('[Canva Voice Injector] Widget successfully mounted.');
    } catch (err) {
      console.error('[Canva Voice Injector] Initialization error:', err);
    }
  };

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(init, 1500);
  } else {
    window.addEventListener('DOMContentLoaded', () => setTimeout(init, 1500));
  }
})();
