/**
 * Canva Page Scanner (Runs in MAIN World)
 * Direct in-memory React Fiber & Stage DOM auto-scanner.
 * Extracts slide text with 1 click of "Auto Scan Slide".
 * Strictly isolates the active slide canvas, removes all Canva UI controls, and deduplicates text.
 */

(function () {
  if (window.__CVI_PAGE_SCANNER_LOADED) {
    console.log('[Canva Voice Injector] Page scanner already initialized.');
    return;
  }
  window.__CVI_PAGE_SCANNER_LOADED = true;

  const UI_KEYWORDS = new Set([
    'share', 'present', 'file', 'resize', 'position', 'animate', 'duration',
    'lock', 'group', 'ungroup', 'elements', 'text', 'uploads', 'draw', 'projects',
    'apps', 'canva', 'magic write', 'notes', 'duplicate', 'delete', 'zoom',
    'grid view', 'scroll view', 'full screen', 'canva sans', 'roboto', 'open sans',
    'layers', 'align', 'spacing', 'transparency', 'effects', 'flip',
    'undo', 'redo', 'copy', 'paste', 'download', 'comments', 'file menu',
    'add page', 'add title', 'add heading', 'add subheading', 'add body text',
    'page title', 'add notes', 'presenter notes', 'click to add title',
    'untitled design', 'standard', 'slide', 'slides', 'edit',
    'page thumbnails', 'skip to end of page thumbnails', 'back to start of page thumbnails'
  ]);

  /**
   * Find the main Canva slide canvas element in the editor
   */
  function getSlideCanvas() {
    const canvases = Array.from(document.querySelectorAll('canvas')).filter(
      (c) => c.clientWidth > 250 && c.clientHeight > 150
    );
    if (canvases.length === 0) return null;
    // Pick the largest canvas (the active presentation slide)
    canvases.sort((a, b) => b.clientWidth * b.clientHeight - a.clientWidth * a.clientHeight);
    return canvases[0];
  }

  /**
   * Check if an element is strictly inside the slide canvas bounds
   */
  function isInsideSlideCanvasBounds(el) {
    if (!el || !el.getBoundingClientRect) return false;
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return false;

    const slideCanvas = getSlideCanvas();
    if (slideCanvas) {
      const cRect = slideCanvas.getBoundingClientRect();
      // Allow a tiny 15px border margin around the slide canvas
      return (
        rect.left >= cRect.left - 15 &&
        rect.right <= cRect.right + 15 &&
        rect.top >= cRect.top - 10 &&
        rect.bottom <= cRect.bottom + 10
      );
    }

    // Fallback: exclude top header (> 110px), left sidebar (> 90px), bottom timeline (< winH - 120px)
    const winW = window.innerWidth;
    const winH = window.innerHeight;
    return (
      rect.top >= 110 &&
      rect.bottom <= winH - 120 &&
      rect.left >= 90 &&
      rect.right <= winW - 50
    );
  }

  /**
   * Check if element is a Canva UI control (toolbar, button, thumbnail strip, etc.)
   */
  function isCanvaUIElement(el) {
    if (!el || el.nodeType !== 1) return false;
    if (el.closest('#canva-voice-injector-widget') || el.closest('#canva-voice-injector-pill')) return true;

    // Reject buttons, toolbars, navigation, thumbnails, dialogs
    if (
      el.closest(
        'button, [role="button"], [role="toolbar"], [data-testid*="toolbar"], ' +
        '[aria-label*="thumbnail" i], [data-testid*="thumbnail"], [data-testid*="page-control"], ' +
        'nav, header, footer, aside, [role="navigation"], [role="menu"], [role="tooltip"], [role="dialog"]'
      )
    ) {
      return true;
    }

    return false;
  }

  /**
   * Check if a string is a Canva UI control label or timing metadata
   */
  function isUIString(str) {
    if (!str) return true;
    const s = str.trim().toLowerCase();

    // Timing metadata e.g. "8.0s", "5s", "0.5s"
    if (/^\d+(\.\d+)?s$/i.test(s)) return true;

    // Slide page number / label e.g. "2d", "1", "2"
    if (/^\d+[a-z]?$/i.test(s)) return true;

    // Thumbnail navigation labels
    if (
      s.includes('page thumbnail') ||
      s.includes('skip to end') ||
      s.includes('back to start') ||
      s.includes('page thumbnails')
    ) {
      return true;
    }

    // Exact match in UI keywords
    if (UI_KEYWORDS.has(s)) return true;

    // Multi-line concatenated toolbar actions e.g. "Edit\n8.0s\nAnimate\nPosition"
    const lines = s.split(/[\n\r]+/).map((l) => l.trim()).filter(Boolean);
    if (lines.length > 1 && lines.every((l) => UI_KEYWORDS.has(l) || /^\d+(\.\d+)?s$/i.test(l))) {
      return true;
    }

    // Every word is a UI keyword
    const words = s.split(/[\s,.-]+/).filter(Boolean);
    if (words.length > 0 && words.every((w) => UI_KEYWORDS.has(w))) {
      return true;
    }

    return false;
  }

  /**
   * Validate if a string looks like genuine slide presentation text
   */
  function isValidSlideText(str) {
    if (!str || typeof str !== 'string') return false;
    const t = str.trim();
    if (t.length < 2 || t.length > 3000) return false;

    // Filter pure numbers or dimensions (e.g. "1920 x 1080", "100%", "0.5")
    if (/^[\d\s.,:/xX%+-]+$/.test(t)) return false;

    // Filter URLs
    if (/^(https?:\/\/|data:|blob:|\/\/|www\.)/i.test(t)) return false;

    // Filter SVG path strings
    if (/^[MmLlHhVvCcSsQqTtAaZz0-9\s.,-]+$/.test(t) && (t.startsWith('M') || t.startsWith('m')) && /[LHVCSQTAZlhvcsqtaz]/.test(t)) {
      return false;
    }

    // Filter CSS / styles / font tokens
    if (/^(rgba?\(|hsla?\(|#|var\(|calc\(|none$|inherit$|flex$|inline|block|absolute|relative|sans-serif|serif|monospace)/i.test(t)) return false;
    if (/^#[0-9a-fA-F]{3,8}$/.test(t)) return false;
    if (/^[0-9a-fA-F-]{32,36}$/.test(t)) return false;

    // Filter code / HTML / JSON snippets
    if (t.startsWith('{') || t.startsWith('[') || t.startsWith('<') || t.includes('function(') || t.includes('=>') || t.includes('px;') || t.includes('rem;')) {
      return false;
    }

    if (isUIString(t)) return false;

    return true;
  }

  /**
   * Deep recursive inspection of objects / props for text strings
   */
  function inspectObjectForText(obj, foundList, depth = 0, seen = new WeakSet()) {
    if (!obj || depth > 5 || typeof obj !== 'object') return;
    if (seen.has(obj)) return;
    seen.add(obj);

    if (Array.isArray(obj)) {
      for (const item of obj) {
        if (typeof item === 'string' && isValidSlideText(item)) {
          foundList.push(item.trim());
        } else if (item && typeof item === 'object') {
          inspectObjectForText(item, foundList, depth + 1, seen);
        }
      }
      return;
    }

    // Check if this object represents a formatted text block / spans / lines
    if (Array.isArray(obj.spans)) {
      const combined = obj.spans
        .map((s) => (typeof s === 'string' ? s : s?.text || s?.content || ''))
        .join('')
        .trim();
      if (isValidSlideText(combined)) foundList.push(combined);
    }
    if (Array.isArray(obj.lines)) {
      const combined = obj.lines
        .map((l) => (typeof l === 'string' ? l : l?.text || l?.content || ''))
        .join(' ')
        .trim();
      if (isValidSlideText(combined)) foundList.push(combined);
    }

    // Direct text properties
    const textKeys = ['text', 'plainText', 'rawText', 'content', 'value'];
    for (const k of textKeys) {
      if (k in obj) {
        const val = obj[k];
        if (typeof val === 'string' && isValidSlideText(val)) {
          foundList.push(val.trim());
        }
      }
    }

    // Container properties (e.g. elements array in page, model)
    const containerKeys = ['element', 'elements', 'items', 'nodes', 'spans', 'lines', 'blocks', 'children', 'page', 'pages', 'slide', 'slides'];
    for (const k of containerKeys) {
      if (k in obj && obj[k] && typeof obj[k] === 'object') {
        inspectObjectForText(obj[k], foundList, depth + 1, seen);
      }
    }
  }

  /**
   * Targeted scan of React Fiber trees attached to stage canvas & container elements
   */
  function scanReactFibers() {
    const foundList = [];
    const seen = new WeakSet();

    const targetElements = [];
    document.querySelectorAll('canvas').forEach((el) => {
      if (el.clientWidth > 100 && el.clientHeight > 100) targetElements.push(el);
    });
    document
      .querySelectorAll('main, [role="main"], [data-testid*="stage"], [data-testid*="canvas"], [data-testid*="page"], [data-testid*="viewport"]')
      .forEach((el) => targetElements.push(el));

    for (const el of targetElements) {
      if (isCanvaUIElement(el)) continue;

      for (const key of Object.keys(el)) {
        if (key.startsWith('__reactFiber$') || key.startsWith('__reactInternalInstance$') || key.startsWith('__reactContainer$')) {
          let fiber = el[key];
          let depth = 0;

          // Traverse up to 25 levels to reach all slide element components
          while (fiber && depth < 25) {
            if (fiber.memoizedProps) {
              inspectObjectForText(fiber.memoizedProps, foundList, 0, seen);
            }
            if (fiber.memoizedState) {
              let state = fiber.memoizedState;
              let sDepth = 0;
              while (state && sDepth < 6) {
                if (state.memoizedState) {
                  inspectObjectForText(state.memoizedState, foundList, 0, seen);
                }
                state = state.next;
                sDepth++;
              }
            }
            if (fiber.stateNode && typeof fiber.stateNode === 'object' && !fiber.stateNode.nodeType) {
              inspectObjectForText(fiber.stateNode.state, foundList, 0, seen);
              inspectObjectForText(fiber.stateNode.props, foundList, 0, seen);
            }
            fiber = fiber.return;
            depth++;
          }
        }
      }
    }

    return foundList;
  }

  /**
   * Scan stage DOM elements strictly inside the slide canvas boundaries
   */
  function scanDOMStageText() {
    const foundList = [];
    const candidateNodes = document.querySelectorAll(
      'text, tspan, [contenteditable="true"], [role="textbox"], [data-testid*="text"], p, h1, h2, h3, h4, h5, h6, span, div'
    );

    for (const el of candidateNodes) {
      if (isCanvaUIElement(el)) continue;
      if (!isInsideSlideCanvasBounds(el)) continue;

      // Skip elements that contain nested block containers so we don't duplicate child elements
      const hasNestedBlocks = el.querySelector('div, p, h1, h2, h3, h4, h5, h6, [role="textbox"]') !== null;
      if (hasNestedBlocks) continue;

      const text = (el.innerText || el.textContent || '').trim();
      if (isValidSlideText(text)) {
        foundList.push(text);
      }
    }

    return foundList;
  }

  /**
   * Presenter notes if open
   */
  function scanPresenterNotes() {
    const notesEls = document.querySelectorAll(
      '[data-testid*="notes"], textarea[placeholder*="notes" i], [aria-label*="Notes" i][contenteditable="true"]'
    );
    for (const el of notesEls) {
      if (isCanvaUIElement(el)) continue;
      const text = (el.value || el.innerText || el.textContent || '').trim();
      if (isValidSlideText(text)) {
        return text;
      }
    }
    return '';
  }

  /**
   * Deduplicate texts by normalized signature so each slide text box appears exactly once
   */
  function cleanAndDeduplicate(texts) {
    const result = [];
    const seenNormalized = new Set();

    for (let raw of texts) {
      if (!raw || typeof raw !== 'string') continue;

      let cleaned = raw
        .split('\n')
        .map((line) => line.replace(/\s+/g, ' ').trim())
        .filter(Boolean)
        .join('\n')
        .trim();

      if (!isValidSlideText(cleaned)) continue;
      if (isUIString(cleaned)) continue;

      // Normalized signature: lowercase alphanumeric only
      const signature = cleaned
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .replace(/[^\w\s\u00C0-\u1EF9]/gi, '')
        .trim();

      if (!signature || signature.length < 2) continue;

      // Deduplicate identical or near-identical lines
      if (seenNormalized.has(signature)) continue;

      seenNormalized.add(signature);
      result.push(cleaned);
    }

    return result;
  }

  /**
   * Master auto-scanner: runs multi-layer extraction and returns clean, unique slide text
   */
  function performAutoScan() {
    const rawList = [];

    // 1. DOM text strictly bounded to slide canvas
    const domTexts = scanDOMStageText();
    rawList.push(...domTexts);

    // 2. React Fiber in-memory state attached to slide canvas & stage
    const fiberTexts = scanReactFibers();
    rawList.push(...fiberTexts);

    // 3. Presenter Notes if present
    const notes = scanPresenterNotes();
    if (notes) {
      rawList.push(notes);
    }

    // 4. Clean, filter UI controls, and deduplicate
    let finalTexts = cleanAndDeduplicate(rawList);

    // 5. Fallback to active selection if nothing found
    if (finalTexts.length === 0 && window.getSelection) {
      const sel = window.getSelection().toString().trim();
      if (isValidSlideText(sel)) {
        finalTexts = [sel];
      }
    }

    return finalTexts;
  }

  // Listen for scan requests from the extension widget
  window.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'CVI_REQUEST_AUTO_SCAN') {
      try {
        const texts = performAutoScan();
        console.log(`[Canva Voice Injector] In-Page Auto Scan completed: ${texts.length} unique slide text(s) found:`, texts);
        window.postMessage(
          {
            type: 'CVI_RESPONSE_AUTO_SCAN',
            success: true,
            texts
          },
          '*'
        );
      } catch (err) {
        console.error('[Canva Voice Injector] In-Page Auto Scan error:', err);
        window.postMessage(
          {
            type: 'CVI_RESPONSE_AUTO_SCAN',
            success: false,
            error: err.message || 'Auto scan failed'
          },
          '*'
        );
      }
    }
  });

  console.log('[Canva Voice Injector] In-Page Main World Scanner Ready.');
})();
