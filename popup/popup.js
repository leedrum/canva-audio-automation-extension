/**
 * Canva Voice Injector - Extension Popup Controller
 */

import { VOICES, SUPPORTED_LANGUAGES } from '../lib/voices.js';

document.addEventListener('DOMContentLoaded', async () => {
  const langSelect = document.getElementById('popup-select-lang');
  const voiceSelect = document.getElementById('popup-select-voice');
  const engineSelect = document.getElementById('popup-tts-engine');
  const geminiKeyInput = document.getElementById('popup-gemini-key');
  const geminiKeyGroup = document.getElementById('gemini-key-group');
  const btnSave = document.getElementById('popup-btn-save');

  // Populate languages
  SUPPORTED_LANGUAGES.forEach((lang) => {
    const opt = document.createElement('option');
    opt.value = lang.code;
    opt.textContent = lang.name;
    langSelect.appendChild(opt);
  });

  function updateVoices(selectedLang, currentVoice) {
    voiceSelect.innerHTML = '';
    const filtered = VOICES.filter((v) => v.lang === selectedLang);
    filtered.forEach((voice) => {
      const opt = document.createElement('option');
      opt.value = voice.id;
      opt.textContent = voice.name;
      if (voice.id === currentVoice) opt.selected = true;
      voiceSelect.appendChild(opt);
    });
  }

  // Load saved preferences
  const stored = await chrome.storage.sync.get([
    'selectedLang',
    'selectedVoice',
    'engine',
    'geminiApiKey'
  ]);

  const currentLang = stored.selectedLang || 'en';
  const currentVoice = stored.selectedVoice || 'Amazon US English (Kendra)';
  const currentEngine = stored.engine || 'auto';

  langSelect.value = currentLang;
  updateVoices(currentLang, currentVoice);
  engineSelect.value = currentEngine;

  if (stored.geminiApiKey) {
    geminiKeyInput.value = stored.geminiApiKey;
  }

  if (currentEngine === 'gemini') {
    geminiKeyGroup.style.display = 'flex';
  }

  langSelect.addEventListener('change', (e) => {
    const newLang = e.target.value;
    const langConfig = SUPPORTED_LANGUAGES.find((l) => l.code === newLang);
    updateVoices(newLang, langConfig ? langConfig.defaultVoice : null);
  });

  engineSelect.addEventListener('change', (e) => {
    if (e.target.value === 'gemini') {
      geminiKeyGroup.style.display = 'flex';
    } else {
      geminiKeyGroup.style.display = 'none';
    }
  });

  btnSave.addEventListener('click', async () => {
    btnSave.textContent = 'Saving...';
    await chrome.storage.sync.set({
      selectedLang: langSelect.value,
      selectedVoice: voiceSelect.value,
      engine: engineSelect.value,
      geminiApiKey: geminiKeyInput.value.trim()
    });
    btnSave.textContent = 'Saved ✓';
    setTimeout(() => {
      btnSave.textContent = 'Save Settings';
    }, 1500);
  });
});
