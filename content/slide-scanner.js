/**
 * Canva Slide Scanner (Pure DOM / No AI)
 * Scans text boxes on the Canva presentation slide:
 * 1. Active / currently selected text box
 * 2. Click-to-scan mode (click any text box on the slide to extract)
 * 3. Open Presenter Notes
 * 4. DOM text overlays & contenteditable elements
 */

export class CanvaSlideScanner {
  constructor() {
    this.currentSlideIndex = 1;
    this.totalSlides = 1;
    this.isClickToScanActive = false;
  }

  /**
   * Scan currently active or selected text box on the slide
   * @returns {{ text: string, source: string }}
   */
  scanActiveTextBox() {
    // 1. Check if user highlighted text
    const selection = window.getSelection() ? window.getSelection().toString().trim() : '';
    if (selection) {
      return { text: selection, source: 'Selected text' };
    }

    // 2. Check currently focused / active element
    const activeEl = document.activeElement;
    if (activeEl && activeEl !== document.body && !activeEl.closest('#canva-voice-injector-widget')) {
      const activeText = this.getElementText(activeEl);
      if (activeText) {
        return { text: activeText, source: 'Active text box' };
      }
    }

    // 3. Check for any active contenteditable or textbox elements in the editor
    const textboxes = document.querySelectorAll(
      '[contenteditable="true"], [role="textbox"], textarea:not(#cvi-text-input):not(#cvi-input-api-key)'
    );

    for (const el of textboxes) {
      if (el.closest('#canva-voice-injector-widget')) continue;
      const text = this.getElementText(el);
      if (text) {
        return { text, source: 'Slide text box' };
      }
    }

    // 4. Check Presenter Notes
    const notesText = this.extractPresenterNotes();
    if (notesText) {
      return { text: notesText, source: 'Presenter notes' };
    }

    return { text: '', source: 'none' };
  }

  /**
   * Enable "Click-to-Scan" mode:
   * When user clicks on any text box on the Canva slide, extract its text!
   * @param {Function} callback - Called with extracted text
   */
  enableClickToScan(callback) {
    this.isClickToScanActive = true;
    document.body.style.cursor = 'crosshair';

    const clickHandler = (e) => {
      // Ignore clicks on our own widget
      if (e.target.closest('#canva-voice-injector-widget') || e.target.closest('#canva-voice-injector-pill')) {
        return;
      }

      // Cleanup listener and cursor
      document.removeEventListener('click', clickHandler, true);
      document.body.style.cursor = 'default';
      this.isClickToScanActive = false;

      // Give Canva 150ms to focus the clicked element or mount overlay
      setTimeout(() => {
        let extractedText = '';
        let source = 'Clicked text box';

        // Check active element
        if (document.activeElement && document.activeElement !== document.body) {
          extractedText = this.getElementText(document.activeElement);
        }

        // Check clicked element itself and its children
        if (!extractedText && e.target) {
          extractedText = this.getElementText(e.target);
        }

        // Check selection
        if (!extractedText && window.getSelection()) {
          extractedText = window.getSelection().toString().trim();
        }

        // Check any newly mounted contenteditable
        if (!extractedText) {
          const editables = document.querySelectorAll('[contenteditable="true"], [role="textbox"]');
          for (const el of editables) {
            if (el.closest('#canva-voice-injector-widget')) continue;
            const t = this.getElementText(el);
            if (t) {
              extractedText = t;
              break;
            }
          }
        }

        callback(extractedText, source);
      }, 150);
    };

    document.addEventListener('click', clickHandler, true);
  }

  /**
   * Helper to clean and extract text from an HTML element
   */
  getElementText(el) {
    if (!el) return '';
    let val = '';
    if (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT') {
      val = el.value || '';
    } else {
      val = el.innerText || el.textContent || '';
    }
    const clean = val.replace(/\s+/g, ' ').trim();
    if (clean.length > 0 && !this.isIgnoredCanvaUI(clean)) {
      return clean;
    }
    return '';
  }

  /**
   * Check if presenter notes are currently visible in DOM
   */
  extractPresenterNotes() {
    const openNotes = document.querySelector(
      '[data-testid*="notes"], textarea[placeholder*="notes" i], [aria-label*="Notes" i][contenteditable="true"]'
    );
    if (openNotes && !openNotes.closest('#canva-voice-injector-widget')) {
      const val = openNotes.value || openNotes.innerText || openNotes.textContent || '';
      return val.trim();
    }
    return '';
  }

  detectSlideIndex() {
    const elements = document.querySelectorAll('button, div, span');
    for (const el of elements) {
      const text = el.textContent || '';
      const match = text.match(/(?:Page\s+)?(\d+)\s*(?:\/|of)\s*(\d+)/i);
      if (match && match[1] && match[2]) {
        this.currentSlideIndex = parseInt(match[1], 10);
        this.totalSlides = parseInt(match[2], 10);
        return `Slide ${this.currentSlideIndex} of ${this.totalSlides}`;
      }
    }
    return `Slide ${this.currentSlideIndex}`;
  }

  goToNextSlide() {
    const event = new KeyboardEvent('keydown', {
      key: 'ArrowRight',
      code: 'ArrowRight',
      keyCode: 39,
      which: 39,
      bubbles: true
    });
    document.dispatchEvent(event);
    this.currentSlideIndex = Math.min(this.totalSlides, this.currentSlideIndex + 1);
  }

  goToPrevSlide() {
    const event = new KeyboardEvent('keydown', {
      key: 'ArrowLeft',
      code: 'ArrowLeft',
      keyCode: 37,
      which: 37,
      bubbles: true
    });
    document.dispatchEvent(event);
    this.currentSlideIndex = Math.max(1, this.currentSlideIndex - 1);
  }

  isIgnoredCanvaUI(text) {
    const ignored = [
      'Share', 'Present', 'File', 'Resize', 'Undo', 'Redo', 'Position',
      'Animate', 'Transparency', 'Add page', 'Duplicate page', 'Delete page',
      'Notes', 'Duration', 'Lock', 'Group', 'Ungroup', 'Elements', 'Text',
      'Uploads', 'Draw', 'Projects', 'Apps', 'Canva', 'Magic Write'
    ];
    return ignored.includes(text);
  }
}
