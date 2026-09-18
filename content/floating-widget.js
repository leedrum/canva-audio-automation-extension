/**
 * Canva Voice Injector - Floating Widget Controller
 * Multi-Element Audio Generation, Per-Box Voice / Reader Selection,
 * and Direct Canva Native Timing & Timeline Integration.
 */

import { CanvaSlideScanner } from './slide-scanner.js';
import { CanvaTimelineInjector } from './timeline-injector.js';
import { VOICES, SUPPORTED_LANGUAGES } from '../lib/voices.js';

export class FloatingWidget {
  constructor() {
    this.scanner = new CanvaSlideScanner();
    this.currentSlideIndex = 1;

    // Detected slide text elements: [ { id, text, voice, audioDataUrl, audioFile, duration } ]
    this.elements = [];

    this.audioPlayer = new Audio();
    this.currentPlayingId = null; // null = master/all, or element id
    this.isPlaying = false;

    this.selectedLang = 'en';
    this.selectedVoice = 'Amazon US English (Kendra)';
    this.speechRate = 1.0;
    this.engine = 'auto';

    this.init();
  }

  async init() {
    if (chrome?.storage?.sync) {
      const data = await chrome.storage.sync.get([
        'selectedVoice',
        'selectedLang',
        'speechRate',
        'engine'
      ]);
      if (data.selectedLang) this.selectedLang = data.selectedLang;
      if (data.selectedVoice) this.selectedVoice = data.selectedVoice;
      if (data.speechRate) this.speechRate = data.speechRate;
      if (data.engine) this.engine = data.engine;
    }

    this.render();
    this.attachEventListeners();
  }

  render() {
    if (document.getElementById('canva-voice-injector-widget')) return;

    const widget = document.createElement('div');
    widget.id = 'canva-voice-injector-widget';
    widget.innerHTML = `
      <div class="cvi-header" id="cvi-drag-handle">
        <div class="cvi-title">
          <span class="cvi-logo-icon">🎙️</span>
          <span>Voice Injector</span>
        </div>
        <div class="cvi-header-actions">
          <button class="cvi-icon-btn" id="cvi-btn-minimize" title="Minimize">—</button>
          <button class="cvi-icon-btn" id="cvi-btn-close" title="Close">✕</button>
        </div>
      </div>

      <div class="cvi-body">
        <!-- Navigation & Current Slide -->
        <div class="cvi-nav-row">
          <div class="cvi-slide-badge" id="cvi-slide-indicator">Slide 1</div>
          <div class="cvi-nav-buttons">
            <button class="cvi-nav-btn" id="cvi-btn-prev">⬅ Prev</button>
            <button class="cvi-nav-btn" id="cvi-btn-next">Next ➡</button>
          </div>
        </div>

        <!-- Scan & Paste Actions -->
        <div style="display: flex; gap: 8px;">
          <button class="cvi-scan-btn" id="cvi-btn-scan" style="flex: 1.3;" title="Auto-detect all text boxes on current slide with 1 click">
            <span>🔍</span>
            <span id="cvi-scan-btn-label">Auto Scan Slide</span>
          </button>
          <button class="cvi-nav-btn" id="cvi-btn-paste" style="flex: 0.7; padding: 10px; font-weight: 600; font-size: 12px; background: rgba(0, 196, 204, 0.2); border: 1px solid #00c4cc; color: #00c4cc;" title="Paste copied text">
            <span>📋 Paste</span>
          </button>
        </div>

        <!-- Detected Slide Text Boxes Section -->
        <div class="cvi-text-section">
          <div class="cvi-label-row">
            <span id="cvi-elements-header-label">Slide Text Boxes:</span>
            <span id="cvi-total-char-count">0 characters</span>
          </div>

          <div class="cvi-elements-list" id="cvi-elements-list">
            <textarea 
              class="cvi-textarea" 
              id="cvi-fallback-input" 
              placeholder="Click 'Auto Scan Slide' above. All text boxes on this slide will appear here for your review..."
            ></textarea>
          </div>
        </div>

        <!-- Canva Native Timing Info Banner -->
        <div class="cvi-timing-hint">
          <div style="display: flex; align-items: center; gap: 6px; color: #00c4cc; font-weight: 600; font-size: 11px;">
            <span>💡</span><span>Canva Native Timing</span>
          </div>
          <div style="margin-top: 3px; font-size: 10.5px; color: #adb5bd; line-height: 1.35;">
            Each box generates its own audio file. Use Canva's bottom timeline to align, trim, and set delays between voices.
          </div>
        </div>

        <!-- Global Language & Default Voice -->
        <div class="cvi-settings-grid">
          <div class="cvi-field-group">
            <label class="cvi-label-row">Language</label>
            <select class="cvi-select" id="cvi-select-lang"></select>
          </div>
          <div class="cvi-field-group">
            <label class="cvi-label-row">Default Reader</label>
            <select class="cvi-select" id="cvi-select-voice"></select>
          </div>
        </div>

        <div class="cvi-field-group">
          <div class="cvi-label-row">
            <span>Speaking Speed</span>
            <span class="cvi-slider-value" id="cvi-speed-label">1.0x</span>
          </div>
          <div class="cvi-slider-row">
            <input type="range" class="cvi-slider" id="cvi-slider-speed" min="0.75" max="1.5" step="0.05" value="1.0">
          </div>
        </div>

        <!-- Master Audio Player / Preview in Sequence -->
        <div class="cvi-player-card" id="cvi-master-player" style="display: none;">
          <div class="cvi-player-row">
            <button class="cvi-play-btn" id="cvi-btn-play-master" title="Play All Clips in Sequence">▶</button>
            <div class="cvi-player-info" id="cvi-master-player-status">Preview: Click Play to check all voices</div>
          </div>
        </div>

        <!-- Action Buttons: Step 1 Generate, Step 2 Inject, with Retry buttons -->
        <div class="cvi-actions-col">
          <div style="display: flex; gap: 6px;">
            <button class="cvi-add-slide-btn" id="cvi-btn-generate" style="flex: 1;" title="Step 1: Synthesize speech so you can review audio first">
              <span>⚡</span>
              <span id="cvi-generate-text">1. Generate Voices</span>
            </button>
            <button class="cvi-icon-btn cvi-retry-btn" id="cvi-btn-retry-generate" style="display: none; height: 38px; width: 38px; border-radius: 8px; font-size: 14px;" title="Retry / Regenerate All Voices">
              <span>🔄</span>
            </button>
          </div>

          <div style="display: flex; gap: 6px;">
            <button class="cvi-auto-add-btn" id="cvi-btn-inject" style="display: none; flex: 1;" title="Step 2: Inject reviewed audio clips into Canva">
              <span>🚀</span>
              <span id="cvi-inject-text">2. Inject into Canva</span>
            </button>
            <button class="cvi-icon-btn cvi-retry-btn" id="cvi-btn-retry-inject" style="display: none; height: 38px; width: 38px; border-radius: 8px; font-size: 14px; background: rgba(0, 196, 204, 0.2); border: 1px solid #00c4cc; color: #00c4cc;" title="Retry / Re-Inject into Canva">
              <span>🔄</span>
            </button>
          </div>
        </div>

        <!-- Status Message -->
        <div class="cvi-status-badge" id="cvi-status-msg" style="display: none;"></div>
      </div>
    `;

    document.body.appendChild(widget);

    const pill = document.createElement('div');
    pill.id = 'canva-voice-injector-pill';
    pill.style.display = 'none';
    pill.innerHTML = `<span>🎙️</span><span>Voice Injector</span>`;
    document.body.appendChild(pill);

    this.populateLanguageOptions();
    this.populateVoiceOptions();
    this.updateSlideIndicator();
  }

  populateLanguageOptions() {
    const langSelect = document.getElementById('cvi-select-lang');
    if (!langSelect) return;

    langSelect.innerHTML = '';
    SUPPORTED_LANGUAGES.forEach((lang) => {
      const opt = document.createElement('option');
      opt.value = lang.code;
      opt.textContent = lang.name;
      if (lang.code === this.selectedLang) opt.selected = true;
      langSelect.appendChild(opt);
    });
  }

  populateVoiceOptions() {
    const voiceSelect = document.getElementById('cvi-select-voice');
    if (!voiceSelect) return;

    voiceSelect.innerHTML = '';
    const filteredVoices = VOICES.filter((v) => v.lang === this.selectedLang);

    filteredVoices.forEach((voice) => {
      const opt = document.createElement('option');
      opt.value = voice.id;
      opt.textContent = voice.name;
      if (voice.id === this.selectedVoice) opt.selected = true;
      voiceSelect.appendChild(opt);
    });

    if (filteredVoices.length > 0 && !filteredVoices.some((v) => v.id === this.selectedVoice)) {
      this.selectedVoice = filteredVoices[0].id;
      voiceSelect.value = this.selectedVoice;
    }
  }

  updateSlideIndicator() {
    const indicator = document.getElementById('cvi-slide-indicator');
    if (indicator) {
      indicator.textContent = this.scanner.detectSlideIndex();
    }
    this.currentSlideIndex = this.scanner.currentSlideIndex || 1;
  }

  showStatus(msg, type = 'info', timeout = 5000) {
    const statusEl = document.getElementById('cvi-status-msg');
    if (!statusEl) return;

    statusEl.innerHTML = msg;
    statusEl.className = `cvi-status-badge cvi-${type}`;
    statusEl.style.display = 'block';

    if (timeout > 0) {
      setTimeout(() => {
        if (statusEl.innerHTML === msg) {
          statusEl.style.display = 'none';
        }
      }, timeout);
    }
  }

  /**
   * Set scanned text elements, assign default readers, and render element cards
   * @param {string[]} texts
   */
  setElements(texts) {
    const availableVoices = VOICES.filter((v) => v.lang === this.selectedLang);

    this.elements = texts.map((t, idx) => {
      // Default Box 1 to default voice; for Box 2, alternate gender if available for dialogue
      let voiceId = this.selectedVoice;
      if (idx === 1 && availableVoices.length > 1) {
        const primary = availableVoices.find((v) => v.id === this.selectedVoice);
        const alt = availableVoices.find((v) => v.gender !== primary?.gender) || availableVoices[1];
        if (alt) voiceId = alt.id;
      }

      return {
        id: idx + 1,
        text: t.trim(),
        voice: voiceId,
        audioDataUrl: null,
        audioFile: null
      };
    });

    this.renderElementsList();
  }

  /**
   * Render the list of element cards with per-box Voice / Reader selector
   */
  renderElementsList() {
    const listContainer = document.getElementById('cvi-elements-list');
    const headerLabel = document.getElementById('cvi-elements-header-label');
    const totalCharCount = document.getElementById('cvi-total-char-count');
    if (!listContainer) return;

    if (this.elements.length === 0) {
      listContainer.innerHTML = `
        <textarea 
          class="cvi-textarea" 
          id="cvi-fallback-input" 
          placeholder="Click 'Auto Scan Slide' above. All text boxes on this slide will appear here for your review..."
        ></textarea>
      `;
      if (headerLabel) headerLabel.textContent = 'Slide Text:';
      if (totalCharCount) totalCharCount.textContent = '0 characters';
      return;
    }

    if (headerLabel) {
      headerLabel.textContent = `Slide Text Boxes (${this.elements.length} detected):`;
    }

    const availableVoices = VOICES.filter((v) => v.lang === this.selectedLang);
    let totalChars = 0;
    listContainer.innerHTML = '';

    this.elements.forEach((elem) => {
      totalChars += (elem.text || '').length;

      const card = document.createElement('div');
      card.className = 'cvi-element-card';
      card.dataset.id = String(elem.id);
      card.innerHTML = `
        <div class="cvi-element-header">
          <span class="cvi-element-tag">Box ${elem.id}</span>
          <div class="cvi-element-actions">
            ${
              elem.audioDataUrl
                ? `<button class="cvi-mini-btn cvi-btn-elem-play" data-id="${elem.id}">▶ Play</button>`
                : `<button class="cvi-mini-btn cvi-btn-elem-gen" data-id="${elem.id}" title="Generate voice for Box ${elem.id}">⚡ Gen</button>`
            }
            ${
              elem.audioDataUrl
                ? `<button class="cvi-mini-btn cvi-btn-elem-retry" data-id="${elem.id}" title="Retry / Regenerate Box ${elem.id}">🔄 Retry</button>`
                : ''
            }
            ${
              elem.audioFile
                ? `<button class="cvi-mini-btn cvi-btn-elem-inject" data-id="${elem.id}" title="Inject Box ${elem.id} to Canva">🚀 Inject</button>`
                : ''
            }
            ${
              elem.audioDataUrl
                ? `<button class="cvi-mini-btn cvi-btn-elem-dl" data-id="${elem.id}" title="Download Box ${elem.id} Audio">💾</button>`
                : ''
            }
          </div>
        </div>

        <textarea class="cvi-textarea cvi-elem-input" data-id="${elem.id}" style="height: 52px;">${elem.text}</textarea>

        <!-- Dedicated Voice / Reader Selection for this box -->
        <div class="cvi-elem-voice-row">
          <span class="cvi-elem-voice-label">🎙️ Reader:</span>
          <select class="cvi-elem-voice-select" data-id="${elem.id}">
            ${availableVoices
              .map(
                (v) =>
                  `<option value="${v.id}" ${v.id === elem.voice ? 'selected' : ''}>${v.name}</option>`
              )
              .join('')}
          </select>
        </div>
      `;

      listContainer.appendChild(card);

      // Text change listener
      const input = card.querySelector('.cvi-elem-input');
      input?.addEventListener('input', (e) => {
        elem.text = e.target.value;
        this.updateTotalCharCount();
      });

      // Voice / Reader change listener for this box
      const voiceSel = card.querySelector('.cvi-elem-voice-select');
      voiceSel?.addEventListener('change', (e) => {
        elem.voice = e.target.value;
      });

      // Generate single box
      const genBtn = card.querySelector('.cvi-btn-elem-gen');
      genBtn?.addEventListener('click', () => {
        this.generateSingleElement(elem.id);
      });

      // Retry / Regenerate single box
      const retryBtn = card.querySelector('.cvi-btn-elem-retry');
      retryBtn?.addEventListener('click', () => {
        this.generateSingleElement(elem.id);
      });

      // Inject single box to Canva
      const injectBtn = card.querySelector('.cvi-btn-elem-inject');
      injectBtn?.addEventListener('click', async () => {
        if (elem.audioFile) {
          await this.injectSingleElement(elem.id);
        }
      });

      // Play listener
      const playBtn = card.querySelector('.cvi-btn-elem-play');
      playBtn?.addEventListener('click', () => {
        this.playElementAudio(elem.id);
      });

      // Download listener
      const dlBtn = card.querySelector('.cvi-btn-elem-dl');
      dlBtn?.addEventListener('click', () => {
        if (elem.audioDataUrl) {
          const slideNum = this.currentSlideIndex || 1;
          CanvaTimelineInjector.downloadAudio(elem.audioDataUrl, `slide_${slideNum}_box_${elem.id}.mp3`);
        }
      });
    });

    if (totalCharCount) totalCharCount.textContent = `${totalChars} characters`;
  }

  updateTotalCharCount() {
    const totalCharCount = document.getElementById('cvi-total-char-count');
    if (!totalCharCount) return;
    const total = this.elements.reduce((acc, el) => acc + (el.text || '').length, 0);
    totalCharCount.textContent = `${total} characters`;
  }

  playElementAudio(id) {
    const elem = this.elements.find((e) => e.id === id);
    if (!elem || !elem.audioDataUrl) return;

    if (this.currentPlayingId === id && this.isPlaying) {
      this.audioPlayer.pause();
      this.isPlaying = false;
      this.updatePlayButtons();
    } else {
      this.audioPlayer.src = elem.audioDataUrl;
      this.audioPlayer.onended = () => {
        this.isPlaying = false;
        this.currentPlayingId = null;
        this.updatePlayButtons();
      };
      this.audioPlayer.play();
      this.isPlaying = true;
      this.currentPlayingId = id;
      this.updatePlayButtons();
    }
  }

  playAllSequential() {
    const playable = this.elements.filter((e) => e.audioDataUrl);
    if (playable.length === 0) return;

    if (this.currentPlayingId === 'all' && this.isPlaying) {
      this.audioPlayer.pause();
      this.isPlaying = false;
      this.currentPlayingId = null;
      this.updatePlayButtons();
      return;
    }

    this.currentPlayingId = 'all';
    this.isPlaying = true;
    let index = 0;

    const playNext = () => {
      if (index >= playable.length || !this.isPlaying || this.currentPlayingId !== 'all') {
        this.isPlaying = false;
        this.currentPlayingId = null;
        this.updatePlayButtons();
        return;
      }
      const item = playable[index];
      this.audioPlayer.src = item.audioDataUrl;
      this.audioPlayer.onended = () => {
        index++;
        playNext();
      };
      this.audioPlayer.play();
      this.updatePlayButtons();
    };

    playNext();
  }

  updatePlayButtons() {
    const masterBtn = document.getElementById('cvi-btn-play-master');
    if (masterBtn) {
      masterBtn.textContent = this.currentPlayingId === 'all' && this.isPlaying ? '⏸' : '▶';
    }

    document.querySelectorAll('.cvi-btn-elem-play').forEach((btn) => {
      const id = parseInt(btn.dataset.id, 10);
      btn.textContent = this.currentPlayingId === id && this.isPlaying ? '⏸ Pause' : '▶ Play';
    });
  }

  attachEventListeners() {
    this.setupDraggable();

    const btnMinimize = document.getElementById('cvi-btn-minimize');
    const btnClose = document.getElementById('cvi-btn-close');
    const pill = document.getElementById('canva-voice-injector-pill');
    const widget = document.getElementById('canva-voice-injector-widget');

    btnMinimize?.addEventListener('click', () => {
      widget.style.display = 'none';
      pill.style.display = 'flex';
    });

    pill?.addEventListener('click', () => {
      pill.style.display = 'none';
      widget.style.display = 'flex';
      this.updateSlideIndicator();
    });

    btnClose?.addEventListener('click', () => {
      widget.style.display = 'none';
      pill.style.display = 'none';
    });

    document.getElementById('cvi-btn-prev')?.addEventListener('click', () => {
      this.scanner.goToPrevSlide();
      setTimeout(() => this.updateSlideIndicator(), 300);
    });

    document.getElementById('cvi-btn-next')?.addEventListener('click', () => {
      this.scanner.goToNextSlide();
      setTimeout(() => this.updateSlideIndicator(), 300);
    });

    // 1-Click Paste from Clipboard
    document.getElementById('cvi-btn-paste')?.addEventListener('click', async () => {
      try {
        const text = await navigator.clipboard.readText();
        if (text && text.trim()) {
          this.setElements([text.trim()]);
          this.showStatus('✨ Pasted text into Box 1! Review it below, then click Generate.', 'success', 5000);
        } else {
          this.showStatus('Clipboard is empty. Copy text on slide with Cmd+C first.', 'info', 5000);
        }
      } catch (e) {
        this.showStatus('Please click inside text box and press <b>Cmd+V</b> to paste.', 'error');
      }
    });

    // 1-Click Auto Scan Slide (In-Memory React Fiber & DOM)
    document.getElementById('cvi-btn-scan')?.addEventListener('click', async () => {
      const scanBtn = document.getElementById('cvi-btn-scan');
      const scanLabel = document.getElementById('cvi-scan-btn-label');

      scanBtn.disabled = true;
      if (scanLabel) scanLabel.textContent = 'Scanning...';
      this.showStatus('🔍 Auto-detecting slide text boxes...', 'info', 0);

      try {
        const response = await new Promise((resolve) => {
          const timeout = setTimeout(() => {
            console.warn('[Canva Voice Injector] In-page auto scan timed out after 3500ms');
            resolve({ success: false, texts: [] });
          }, 3500);

          const messageHandler = (event) => {
            if (event.data && event.data.type === 'CVI_RESPONSE_AUTO_SCAN') {
              clearTimeout(timeout);
              window.removeEventListener('message', messageHandler);
              resolve(event.data);
            }
          };

          window.addEventListener('message', messageHandler);
          window.postMessage({ type: 'CVI_REQUEST_AUTO_SCAN' }, '*');
        });

        let foundTexts = response.texts || [];

        if (foundTexts.length > 0) {
          this.setElements(foundTexts);
          this.showStatus(
            `✨ Detected ${foundTexts.length} text box(es)! Each box has its own voice reader.`,
            'success',
            6000
          );
          this.updateSlideIndicator();
          return;
        }

        // Fallback: Check active selection / active element
        const activeScan = this.scanner.scanActiveTextBox();
        if (activeScan.text) {
          this.setElements([activeScan.text]);
          this.showStatus(`✨ Text detected from ${activeScan.source}! Review below before generating.`, 'success', 6000);
          this.updateSlideIndicator();
          return;
        }

        this.showStatus(
          `No text found on this slide.<br>👉 Make sure the slide has text, or copy with <b>Cmd+C</b> and click <b>[ 📋 Paste ]</b>.`,
          'info',
          7000
        );
        this.updateSlideIndicator();
      } catch (err) {
        console.error('Scan error:', err);
        this.showStatus(`Scan error: ${err.message}`, 'error', 5000);
      } finally {
        scanBtn.disabled = false;
        if (scanLabel) scanLabel.textContent = 'Auto Scan Slide';
      }
    });

    // Language & Voice
    const langSelect = document.getElementById('cvi-select-lang');
    langSelect?.addEventListener('change', (e) => {
      this.selectedLang = e.target.value;
      const langConfig = SUPPORTED_LANGUAGES.find((l) => l.code === this.selectedLang);
      if (langConfig) this.selectedVoice = langConfig.defaultVoice;
      this.populateVoiceOptions();

      // Update per-element reader dropdowns with the new language's voices
      this.elements.forEach((elem) => {
        elem.voice = this.selectedVoice;
      });
      this.renderElementsList();

      chrome?.storage?.sync?.set({ selectedLang: this.selectedLang, selectedVoice: this.selectedVoice });
    });

    const voiceSelect = document.getElementById('cvi-select-voice');
    voiceSelect?.addEventListener('change', (e) => {
      this.selectedVoice = e.target.value;
      chrome?.storage?.sync?.set({ selectedVoice: this.selectedVoice });
    });

    const speedSlider = document.getElementById('cvi-slider-speed');
    const speedLabel = document.getElementById('cvi-speed-label');
    speedSlider?.addEventListener('input', (e) => {
      this.speechRate = parseFloat(e.target.value);
      if (speedLabel) speedLabel.textContent = `${this.speechRate.toFixed(2)}x`;
      chrome?.storage?.sync?.set({ speechRate: this.speechRate });
    });

    // Step 1: Generate All Voices (Synthesizes speech so user can review before injecting)
    const btnGenerate = document.getElementById('cvi-btn-generate');
    const btnRetryGen = document.getElementById('cvi-btn-retry-generate');
    btnGenerate?.addEventListener('click', () => this.handleGenerateAll());
    btnRetryGen?.addEventListener('click', () => this.handleGenerateAll());

    // Step 2: Inject All Audios into Canva (with Retry)
    const btnInject = document.getElementById('cvi-btn-inject');
    const btnRetryInject = document.getElementById('cvi-btn-retry-inject');
    btnInject?.addEventListener('click', () => this.handleInjectAll());
    btnRetryInject?.addEventListener('click', () => this.handleInjectAll());

    // Master Player Controls (Play All Sequential)
    const btnPlayMaster = document.getElementById('cvi-btn-play-master');
    btnPlayMaster?.addEventListener('click', () => this.playAllSequential());
  }

  /**
   * Synthesize audio for a single element via Edge / Google TTS
   * @param {Object} elem
   * @returns {Promise<Object>}
   */
  async synthesizeElement(elem) {
    if (!elem || !elem.text) return null;
    const voiceToUse = elem.voice || this.selectedVoice;
    const voiceConfig = VOICES.find((v) => v.id === voiceToUse);
    const voiceLocale = voiceConfig?.locale || (this.selectedLang === 'en' ? 'en-US' : this.selectedLang);
    const slideNum = this.currentSlideIndex || 1;

    const response = await new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          action: 'GENERATE_TTS',
          text: elem.text,
          voice: voiceToUse,
          rate: this.speechRate,
          engine: this.engine || 'auto',
          locale: voiceLocale
        },
        (res) => {
          if (chrome.runtime.lastError) return reject(new Error(chrome.runtime.lastError.message));
          if (!res || !res.success) return reject(new Error(res?.error || 'TTS generation failed'));
          resolve(res);
        }
      );
    });

    elem.audioDataUrl = response.dataUrl;
    elem.audioFile = await CanvaTimelineInjector.dataUrlToFile(
      elem.audioDataUrl,
      `slide_${slideNum}_box_${elem.id}.mp3`
    );
    return elem;
  }

  /**
   * Step 1: Generate audio for all text boxes so user can review and listen first!
   * Does NOT inject into Canva yet.
   */
  async handleGenerateAll() {
    if (this.elements.length === 0) {
      const fallbackInput = document.getElementById('cvi-fallback-input');
      const text = fallbackInput?.value?.trim();
      if (!text) {
        this.showStatus('Please scan or enter slide text first', 'error');
        return;
      }
      this.elements = [
        { id: 1, text, voice: this.selectedVoice, audioDataUrl: null, audioFile: null }
      ];
    } else {
      document.querySelectorAll('.cvi-elem-input').forEach((input) => {
        const id = parseInt(input.dataset.id, 10);
        const elem = this.elements.find((e) => e.id === id);
        if (elem) elem.text = input.value.trim();
      });
      document.querySelectorAll('.cvi-elem-voice-select').forEach((sel) => {
        const id = parseInt(sel.dataset.id, 10);
        const elem = this.elements.find((e) => e.id === id);
        if (elem) elem.voice = sel.value;
      });
    }

    const btnGenerate = document.getElementById('cvi-btn-generate');
    const genText = document.getElementById('cvi-generate-text');
    const masterPlayer = document.getElementById('cvi-master-player');
    const btnInject = document.getElementById('cvi-btn-inject');
    const btnRetryGen = document.getElementById('cvi-btn-retry-generate');

    btnGenerate.disabled = true;
    if (btnRetryGen) {
      btnRetryGen.disabled = true;
      btnRetryGen.innerHTML = '<span class="cvi-spin">🔄</span>';
    }
    if (genText) genText.innerHTML = '<span class="cvi-spin">⏳</span> Generating Voices...';
    this.showStatus(`🎙️ Generating voices for ${this.elements.length} text box(es)...`, 'info', 0);

    try {
      for (let i = 0; i < this.elements.length; i++) {
        const elem = this.elements[i];
        if (!elem.text) continue;
        const voiceConfig = VOICES.find((v) => v.id === (elem.voice || this.selectedVoice));
        this.showStatus(`🎙️ Synthesizing Box ${elem.id} with ${voiceConfig?.name || elem.voice}...`, 'info', 0);
        await this.synthesizeElement(elem);
      }

      // Re-render element cards to reveal per-box Play, Retry, and Inject buttons
      this.renderElementsList();

      // Show preview player
      if (masterPlayer) masterPlayer.style.display = 'block';

      // Show Inject button and Retry button
      if (btnInject) btnInject.style.display = 'flex';
      if (btnRetryGen) btnRetryGen.style.display = 'flex';

      if (genText) genText.textContent = 'Regenerate All Voices';

      this.showStatus(
        `🎧 Voices generated! Click <b>▶ Play</b> on any box to check audio, or click <b>[ 🚀 2. Inject into Canva ]</b> when ready.`,
        'success',
        8000
      );
    } catch (err) {
      console.error('Audio generation error:', err);
      this.showStatus(`Error generating voices: ${err.message}`, 'error', 6000);
      if (genText) genText.textContent = 'Retry Generating Voices';
    } finally {
      btnGenerate.disabled = false;
      if (btnRetryGen) {
        btnRetryGen.disabled = false;
        btnRetryGen.innerHTML = '<span>🔄</span>';
      }
    }
  }

  /**
   * Step 2: Inject all generated audio files into Canva (with single uploader)
   */
  async handleInjectAll() {
    const readyElements = this.elements.filter((e) => e.audioFile);
    if (readyElements.length === 0) {
      this.showStatus('Please click [ ⚡ 1. Generate Voices ] first before injecting', 'info');
      return;
    }

    const btnInject = document.getElementById('cvi-btn-inject');
    const injectText = document.getElementById('cvi-inject-text');
    const btnRetryInject = document.getElementById('cvi-btn-retry-inject');

    btnInject.disabled = true;
    if (btnRetryInject) {
      btnRetryInject.disabled = true;
      btnRetryInject.innerHTML = '<span class="cvi-spin">🔄</span>';
    }
    if (injectText) injectText.innerHTML = '<span class="cvi-spin">⏳</span> Injecting into Canva...';
    this.showStatus(`🚀 Injecting ${readyElements.length} audio clip(s) into Canva...`, 'info', 0);

    try {
      for (let i = 0; i < readyElements.length; i++) {
        await CanvaTimelineInjector.autoAddToSlide(readyElements[i].audioFile);
        if (i < readyElements.length - 1) {
          await new Promise((r) => setTimeout(r, 800));
        }
      }

      if (injectText) injectText.textContent = 'Re-Inject All into Canva';
      if (btnRetryInject) btnRetryInject.style.display = 'flex';

      this.showStatus(
        `✨ Success! Injected ${readyElements.length} audio(s) into Canva.<br>Use Canva's bottom timeline to position or delay voices. You can also click <b>Re-Inject</b> if needed.`,
        'success',
        8000
      );
    } catch (err) {
      console.error('Inject error:', err);
      this.showStatus(`Inject error: ${err.message}`, 'error', 6000);
    } finally {
      btnInject.disabled = false;
      if (btnRetryInject) {
        btnRetryInject.disabled = false;
        btnRetryInject.innerHTML = '<span>🔄</span>';
      }
    }
  }

  /**
   * Generate or Retry a single box voice
   * @param {number} id
   */
  async generateSingleElement(id) {
    const elem = this.elements.find((e) => e.id === id);
    if (!elem) return;

    const card = document.querySelector(`.cvi-element-card[data-id="${id}"]`);
    const retryBtn = card?.querySelector('.cvi-btn-elem-retry');
    const genBtn = card?.querySelector('.cvi-btn-elem-gen');
    const targetBtn = retryBtn || genBtn;
    const origHtml = targetBtn?.innerHTML || '';

    const input = document.querySelector(`.cvi-elem-input[data-id="${id}"]`);
    if (input) elem.text = input.value.trim();
    const voiceSel = document.querySelector(`.cvi-elem-voice-select[data-id="${id}"]`);
    if (voiceSel) elem.voice = voiceSel.value;

    const voiceConfig = VOICES.find((v) => v.id === (elem.voice || this.selectedVoice));
    this.showStatus(`🎙️ Generating Box ${elem.id} with ${voiceConfig?.name || elem.voice}...`, 'info', 0);

    if (targetBtn) {
      targetBtn.disabled = true;
      targetBtn.innerHTML = '<span class="cvi-spin">🔄</span> Loading...';
    }

    try {
      await this.synthesizeElement(elem);
      this.renderElementsList();

      const btnInject = document.getElementById('cvi-btn-inject');
      if (btnInject) btnInject.style.display = 'flex';
      const masterPlayer = document.getElementById('cvi-master-player');
      if (masterPlayer) masterPlayer.style.display = 'block';

      this.showStatus(`✨ Box ${elem.id} voice ready! Click <b>▶ Play</b> to check audio or <b>🚀 Inject</b> to add.`, 'success', 5000);
    } catch (err) {
      this.showStatus(`Error generating Box ${elem.id}: ${err.message}`, 'error', 5000);
      if (targetBtn) {
        targetBtn.disabled = false;
        targetBtn.innerHTML = origHtml;
      }
    }
  }

  /**
   * Inject or Retry injecting a single box audio into Canva
   * @param {number} id
   */
  async injectSingleElement(id) {
    const elem = this.elements.find((e) => e.id === id);
    if (!elem || !elem.audioFile) return;

    const card = document.querySelector(`.cvi-element-card[data-id="${id}"]`);
    const injectBtn = card?.querySelector('.cvi-btn-elem-inject');
    if (injectBtn) {
      injectBtn.disabled = true;
      injectBtn.innerHTML = '<span class="cvi-spin">⏳</span> Injecting...';
    }

    this.showStatus(`🚀 Injecting Box ${elem.id} into Canva...`, 'info', 0);
    try {
      await CanvaTimelineInjector.autoAddToSlide(elem.audioFile);
      this.showStatus(`✨ Box ${elem.id} audio injected into Canva!`, 'success', 4000);
    } catch (err) {
      this.showStatus(`Error injecting Box ${elem.id}: ${err.message}`, 'error', 5000);
    } finally {
      if (injectBtn) {
        injectBtn.disabled = false;
        injectBtn.innerHTML = '<span>🔄</span> Re-Inject';
      }
    }
  }

  setupDraggable() {
    const handle = document.getElementById('cvi-drag-handle');
    const widget = document.getElementById('canva-voice-injector-widget');
    if (!handle || !widget) return;

    let isDragging = false;
    let startX, startY, initialLeft, initialTop;

    handle.addEventListener('mousedown', (e) => {
      if (e.target.closest('.cvi-header-actions')) return;
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;

      const rect = widget.getBoundingClientRect();
      initialLeft = rect.left;
      initialTop = rect.top;

      widget.style.right = 'auto';
      widget.style.left = `${initialLeft}px`;
      widget.style.top = `${initialTop}px`;
    });

    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      const newLeft = Math.max(10, Math.min(window.innerWidth - widget.offsetWidth - 10, initialLeft + dx));
      const newTop = Math.max(10, Math.min(window.innerHeight - widget.offsetHeight - 10, initialTop + dy));

      widget.style.left = `${newLeft}px`;
      widget.style.top = `${newTop}px`;
    });

    document.addEventListener('mouseup', () => {
      isDragging = false;
    });
  }
}
