/**
 * TTSTool / ReadAloud Client (Amazon Polly & Microsoft Cloud Voices)
 * 100% Free, Zero API Keys, Reliable HTTP REST Endpoint.
 * Generates direct MP3 audio files for all supported languages.
 */

function xmlEscape(str) {
  return (str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function formatRate(rate) {
  if (typeof rate === 'string' && rate.endsWith('%')) return rate;
  const num = typeof rate === 'number' ? rate : parseFloat(rate) || 1.0;
  const percentage = Math.round(num * 100);
  return `${percentage}%`;
}

/**
 * Synthesize speech using the TTSTool / ReadAloud endpoint (Amazon Polly / Microsoft)
 * @param {Object} options
 * @param {string} options.text - Text to synthesize
 * @param {string} options.voiceId - Voice identifier (e.g. 'Amazon US English (Joey)')
 * @param {string} options.lang - Locale (e.g. 'en-US', 'vi-VN')
 * @param {number} options.rate - Speaking rate (e.g. 1.0)
 * @returns {Promise<{ blob: Blob, dataUrl: string, size: number, estimatedSeconds: number, engineUsed: string }>}
 */
export async function synthesizeTTSToolSpeech({
  text,
  voiceId = 'Amazon US English (Joey)',
  lang = 'en-US',
  rate = 1.0
}) {
  if (!text || !text.trim()) {
    throw new Error('Text to synthesize cannot be empty');
  }

  const cleanText = text.trim();
  const rateStr = formatRate(rate);

  const ssml =
    `<speak version="1.0" xml:lang="${lang}">` +
    `<prosody rate="${rateStr}">` +
    xmlEscape(cleanText) +
    `</prosody>` +
    `</speak>`;

  const createUrl = 'https://support.readaloud.app/ttstool/createParts';
  const createResp = await fetch(createUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify([
      {
        voiceId: voiceId,
        ssml: ssml
      }
    ])
  });

  if (!createResp.ok) {
    throw new Error(`TTSTool createParts error (${createResp.status})`);
  }

  const partIds = await createResp.json();
  if (!Array.isArray(partIds) || partIds.length === 0) {
    throw new Error('TTSTool returned no audio parts');
  }

  const getUrl = `https://support.readaloud.app/ttstool/getParts?q=${partIds.join(',')}`;
  const getResp = await fetch(getUrl);
  if (!getResp.ok) {
    throw new Error(`TTSTool getParts error (${getResp.status})`);
  }

  const audioBlob = await getResp.blob();

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const words = cleanText.split(/\s+/).length;
      const estimatedSeconds = Math.max(1, Math.round((words / 2.5) / (typeof rate === 'number' ? rate : 1.0)));
      resolve({
        blob: audioBlob,
        dataUrl: reader.result,
        size: audioBlob.size,
        estimatedSeconds,
        engineUsed: `Amazon Polly / TTSTool (${voiceId.split(' ')[0]})`
      });
    };
    reader.onerror = () => reject(new Error('Failed to convert TTSTool audio to Data URL'));
    reader.readAsDataURL(audioBlob);
  });
}
