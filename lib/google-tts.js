/**
 * Google Free TTS Client (100% Free, Zero API Keys, Reliable)
 * Directly generates MP3 audio streams for any language.
 * Automatically chunks sentences to support long slide text.
 */

/**
 * Split text into chunks that fit within Google Translate TTS limits (~180 chars)
 * @param {string} text
 * @returns {string[]}
 */
function chunkText(text, maxLength = 180) {
  if (!text || text.length <= maxLength) return [text];

  const sentences = text.match(/[^.!?\n]+[.!?\n]+/g) || [text];
  const chunks = [];
  let currentChunk = '';

  for (const sentence of sentences) {
    if ((currentChunk + ' ' + sentence).trim().length <= maxLength) {
      currentChunk = (currentChunk + ' ' + sentence).trim();
    } else {
      if (currentChunk) chunks.push(currentChunk);
      if (sentence.length <= maxLength) {
        currentChunk = sentence.trim();
      } else {
        // Break long sentence by comma or words
        const words = sentence.split(/\s+/);
        let subChunk = '';
        for (const word of words) {
          if ((subChunk + ' ' + word).trim().length <= maxLength) {
            subChunk = (subChunk + ' ' + word).trim();
          } else {
            if (subChunk) chunks.push(subChunk);
            subChunk = word;
          }
        }
        currentChunk = subChunk;
      }
    }
  }

  if (currentChunk) chunks.push(currentChunk);
  return chunks.filter(c => c.trim().length > 0);
}

/**
 * Synthesize speech using Google Cloud Free TTS endpoint
 * @param {Object} options
 * @param {string} options.text - Text to synthesize
 * @param {string} options.lang - 2-letter language code (e.g. 'en', 'vi', 'ja', 'es')
 * @returns {Promise<{ blob: Blob, dataUrl: string, size: number, estimatedSeconds: number }>}
 */
export async function synthesizeGoogleSpeech({ text, lang = 'en' }) {
  if (!text || !text.trim()) {
    throw new Error('Text to synthesize cannot be empty');
  }

  const cleanText = text.trim();
  const chunks = chunkText(cleanText);
  const audioBuffers = [];

  for (const chunk of chunks) {
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(chunk)}&tl=${encodeURIComponent(lang)}&client=tw-ob`;

    const res = await fetch(url);

    if (!res.ok) {
      throw new Error(`Google TTS request failed with status ${res.status}`);
    }

    const buffer = await res.arrayBuffer();
    audioBuffers.push(buffer);
  }

  const audioBlob = new Blob(audioBuffers, { type: 'audio/mp3' });

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const words = cleanText.split(/\s+/).length;
      const estimatedSeconds = Math.max(1, Math.round(words / 2.5));
      resolve({
        blob: audioBlob,
        dataUrl: reader.result,
        size: audioBlob.size,
        estimatedSeconds,
        engineUsed: 'Google TTS'
      });
    };
    reader.onerror = () => reject(new Error('Failed to convert Google TTS audio to data URL'));
    reader.readAsDataURL(audioBlob);
  });
}
