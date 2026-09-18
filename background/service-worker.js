/**
 * Canva Voice Injector - Background Service Worker (Manifest V3)
 * Coordinates TTS requests with multi-engine routing and automatic fallback:
 * Primary: TTSTool (Amazon Polly & Microsoft Cloud) -> Edge Neural TTS -> Google Free TTS
 */

import { synthesizeTTSToolSpeech } from '../lib/ttstool.js';
import { synthesizeSpeech } from '../lib/edge-tts.js';
import { synthesizeGoogleSpeech } from '../lib/google-tts.js';
import { synthesizeGeminiSpeech } from '../lib/gemini-tts.js';
import { VOICES, SUPPORTED_LANGUAGES } from '../lib/voices.js';

const audioCache = new Map();

chrome.runtime.onInstalled.addListener(() => {
  console.log('Canva Voice Injector Extension Installed');
  chrome.storage.sync.get(['selectedVoice', 'selectedLang', 'speechRate', 'engine'], (data) => {
    if (!data.selectedVoice) {
      chrome.storage.sync.set({
        selectedVoice: 'Amazon US English (Kendra)',
        selectedLang: 'en',
        speechRate: 1.0,
        engine: 'auto'
      });
    }
  });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'GET_VOICES') {
    sendResponse({ voices: VOICES, languages: SUPPORTED_LANGUAGES });
    return true;
  }

  if (message.action === 'GENERATE_TTS') {
    handleTTSGeneration(message)
      .then((result) => sendResponse({ success: true, ...result }))
      .catch((error) => {
        console.error('TTS Generation Error:', error);
        sendResponse({ success: false, error: error.message || 'Speech synthesis failed' });
      });
    return true;
  }

  if (message.action === 'CAPTURE_AND_OCR') {
    handleCaptureAndOCR(message, sender)
      .then((result) => sendResponse({ success: true, ...result }))
      .catch((error) => {
        console.error('OCR Error:', error);
        sendResponse({ success: false, error: error.message || 'OCR extraction failed' });
      });
    return true;
  }

  return false;
});

async function handleCaptureAndOCR({ geminiApiKey }, sender) {
  if (!geminiApiKey) {
    throw new Error('No Gemini API key provided for visual slide recognition.');
  }

  const dataUrl = await new Promise((resolve, reject) => {
    chrome.tabs.captureVisibleTab(sender.tab ? sender.tab.windowId : null, { format: 'png' }, (res) => {
      if (chrome.runtime.lastError) {
        return reject(new Error(chrome.runtime.lastError.message));
      }
      resolve(res);
    });
  });

  const base64Data = dataUrl.replace(/^data:image\/png;base64,/, '');
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(geminiApiKey)}`;

  const prompt = `This is a screenshot of a Canva presentation slide. Extract only the text that belongs to the current slide (such as slide titles, subtitles, bullet points, and body paragraphs). Do NOT include Canva editor buttons, toolbars, side panels, or menus. Return ONLY the extracted slide text.`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [
          { text: prompt },
          { inlineData: { mimeType: 'image/png', data: base64Data } }
        ]
      }]
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Gemini Vision error (${response.status})`);
  }

  const resultData = await response.json();
  const extractedText = resultData.candidates?.[0]?.content?.parts?.[0]?.text || '';

  return { text: extractedText.trim() };
}

async function handleTTSGeneration({ text, voice, rate, pitch, engine, geminiApiKey, locale }) {
  if (!text || !text.trim()) {
    throw new Error('No text provided for speech generation');
  }

  const voiceConfig = VOICES.find((v) => v.id === voice);
  const voiceLocale = voiceConfig?.locale || locale || 'en-US';
  const langCode = voiceLocale.split('-')[0];
  const cacheKey = `${engine || 'auto'}_${voice}_${rate}_${text.trim()}`;

  if (audioCache.has(cacheKey)) {
    return audioCache.get(cacheKey);
  }

  let result;

  // Option A: Explicit Gemini
  if (engine === 'gemini') {
    result = await synthesizeGeminiSpeech({ text, apiKey: geminiApiKey, voice });
  } else if (engine === 'google') {
    result = await synthesizeGoogleSpeech({ text, lang: langCode });
  } else {
    const isTTSToolVoice = voice && (voice.startsWith('Amazon ') || voice.startsWith('Microsoft ') || voice.startsWith('RHVoice '));
    const isEdgeVoice = voice && voice.endsWith('Neural');

    if (isTTSToolVoice) {
      try {
        result = await synthesizeTTSToolSpeech({
          text,
          voiceId: voice,
          lang: voiceLocale,
          rate: rate || 1.0
        });
      } catch (ttsErr) {
        console.warn('TTSTool returned error, attempting fallback:', ttsErr.message);
        // Fallback to Edge Neural TTS or Google TTS
        try {
          const edgeVoice = VOICES.find((v) => v.lang === langCode && v.gender === voiceConfig?.gender && v.provider === 'edge');
          result = await synthesizeSpeech({
            text,
            voice: edgeVoice ? edgeVoice.id : 'en-US-JennyNeural',
            rate: rate || 1.0,
            locale: voiceLocale
          });
        } catch (edgeErr) {
          console.warn('Edge fallback also failed, using Google TTS:', edgeErr.message);
          result = await synthesizeGoogleSpeech({ text, lang: langCode });
        }
      }
    } else if (isEdgeVoice) {
      try {
        result = await synthesizeSpeech({
          text,
          voice: voice || 'en-US-JennyNeural',
          rate: rate || 1.0,
          pitch: pitch || '+0Hz',
          locale: voiceLocale
        });
      } catch (edgeErr) {
        console.warn('Edge Neural TTS error, attempting TTSTool fallback:', edgeErr.message);
        try {
          const ttsAlt = VOICES.find((v) => v.lang === langCode && v.gender === voiceConfig?.gender && (v.provider === 'amazon' || v.provider === 'microsoft'));
          if (ttsAlt) {
            result = await synthesizeTTSToolSpeech({
              text,
              voiceId: ttsAlt.id,
              lang: voiceLocale,
              rate: rate || 1.0
            });
          } else {
            result = await synthesizeGoogleSpeech({ text, lang: langCode });
          }
        } catch (e2) {
          result = await synthesizeGoogleSpeech({ text, lang: langCode });
        }
      }
    } else {
      // Default: try TTSTool first, then Edge, then Google
      try {
        result = await synthesizeTTSToolSpeech({
          text,
          voiceId: voice || 'Amazon US English (Kendra)',
          lang: voiceLocale,
          rate: rate || 1.0
        });
      } catch (err1) {
        try {
          result = await synthesizeSpeech({
            text,
            voice: 'en-US-JennyNeural',
            rate: rate || 1.0,
            locale: voiceLocale
          });
        } catch (err2) {
          result = await synthesizeGoogleSpeech({ text, lang: langCode });
        }
      }
    }
  }

  if (audioCache.size > 30) {
    const firstKey = audioCache.keys().next().value;
    audioCache.delete(firstKey);
  }
  audioCache.set(cacheKey, result);

  return result;
}
