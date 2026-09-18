/**
 * Canva Timeline Injector
 * Coordinates audio injection, synthetic drag-and-drop onto Canva's bottom timeline,
 * and handles draggable chips and download utilities.
 */

export class CanvaTimelineInjector {
  /**
   * Convert Base64 data URL or Blob to an audio File object
   * @param {string|Blob} source
   * @param {string} filename
   * @returns {Promise<File>}
   */
  static async dataUrlToFile(source, filename = 'slide_voice.wav') {
    if (source instanceof Blob) {
      const mimeType = source.type || (filename.endsWith('.mp3') ? 'audio/mp3' : 'audio/wav');
      return new File([source], filename, { type: mimeType });
    }
    const res = await fetch(source);
    const blob = await res.blob();
    const mimeType = blob.type || (filename.endsWith('.mp3') ? 'audio/mp3' : 'audio/wav');
    return new File([blob], filename, { type: mimeType });
  }

  /**
   * Attempt auto-upload via Canva's native file input.
   * If the Uploads panel is not open, it finds and clicks Canva's left "Uploads" button first.
   * @param {File} audioFile
   * @returns {Promise<boolean>}
   */
  static async attemptCanvaUpload(audioFile) {
    try {
      let fileInputs = Array.from(document.querySelectorAll('input[type="file"]'));

      // If no file input is currently mounted, trigger Canva's Uploads side panel
      if (fileInputs.length === 0) {
        const uploadNavBtn = Array.from(document.querySelectorAll('button, [role="tab"], [role="button"]')).find((el) => {
          const aria = (el.getAttribute('aria-label') || '').toLowerCase();
          const text = (el.innerText || el.textContent || '').toLowerCase();
          const testId = (el.getAttribute('data-testid') || '').toLowerCase();
          return (
            aria.includes('upload') ||
            text.includes('upload') ||
            testId.includes('upload') ||
            aria.includes('tải lên') ||
            text.includes('tải lên')
          );
        });

        if (uploadNavBtn) {
          uploadNavBtn.click();
          // Allow Canva a moment to mount the Uploads drawer and file input
          await new Promise((r) => setTimeout(r, 400));
          fileInputs = Array.from(document.querySelectorAll('input[type="file"]'));
        }
      }

      if (fileInputs.length > 0) {
        // Pick only ONE input (prefer audio/generic) to avoid multi-input triggering
        const targetInput = fileInputs.find((input) => {
          const accept = (input.getAttribute('accept') || '').toLowerCase();
          return accept.includes('audio') || accept.includes('*') || !accept;
        }) || fileInputs[0];

        const dt = new DataTransfer();
        dt.items.add(audioFile);

        targetInput.files = dt.files;
        targetInput.dispatchEvent(new Event('input', { bubbles: true }));
        targetInput.dispatchEvent(new Event('change', { bubbles: true }));
        console.log('[Canva Voice Injector] Uploaded audio via Canva file input:', audioFile.name);
        return true;
      }
      return false;
    } catch (err) {
      console.warn('Canva file input upload error:', err);
      return false;
    }
  }

  /**
   * Automatically attempt to drop audio onto Canva's bottom timeline
   * Dispatches to single target to prevent duplicate drop events
   * @param {File} audioFile
   * @returns {boolean}
   */
  static attemptAutoDrop(audioFile) {
    const timelineCandidates = document.querySelectorAll(
      '[data-testid*="timeline"], [data-testid*="track"], [data-testid*="footer"], [role="slider"], [aria-label*="Timeline" i]'
    );

    let dropTarget = null;
    for (const el of timelineCandidates) {
      const rect = el.getBoundingClientRect();
      if (rect.bottom > window.innerHeight - 200 && rect.width > 150) {
        dropTarget = el;
        break;
      }
    }

    const target = dropTarget || document.querySelector('main') || window;

    try {
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(audioFile);

      const clientY = dropTarget
        ? dropTarget.getBoundingClientRect().top + 20
        : window.innerHeight - 60;
      const clientX = window.innerWidth / 2;

      ['dragenter', 'dragover', 'drop'].forEach((eventType) => {
        const event = new DragEvent(eventType, {
          bubbles: true,
          cancelable: true,
          composed: true,
          dataTransfer,
          clientX,
          clientY
        });
        target.dispatchEvent(event);
      });

      console.log('[Canva Voice Injector] Dispatched drop event to target:', target);
      return true;
    } catch (err) {
      console.warn('Auto-drop dispatch failed:', err);
      return false;
    }
  }

  /**
   * Execute single insertion channel (exclusive fallback to prevent duplicate uploads)
   * @param {File} audioFile
   * @returns {Promise<{ success: boolean, method: string }>}
   */
  static async autoAddToSlide(audioFile) {
    // 1. Try Canva's native file input / Uploads panel first
    const uploaded = await this.attemptCanvaUpload(audioFile);
    if (uploaded) {
      // STOP immediately so we don't upload the file a second time via drop
      return { success: true, method: 'upload' };
    }

    // 2. Only if file input was not found or failed, try single drop
    const dropped = this.attemptAutoDrop(audioFile);
    return { success: dropped, method: 'drop' };
  }

  /**
   * One-click download utility for user convenience
   * @param {string} dataUrl
   * @param {string} filename
   */
  static downloadAudio(dataUrl, filename = 'slide_voice.mp3') {
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}
