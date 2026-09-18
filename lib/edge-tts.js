/**
 * Microsoft Edge Neural TTS WebSocket Client
 * Uses the Edge Read Aloud endpoint with dynamic Sec-MS-GEC DRM tokens.
 */

const TRUSTED_CLIENT_TOKEN = '6A5AA1D4EAFF4E9FB37E23D68491D6F4';
const EDGE_WS_BASE = 'wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1';

function generateUUID() {
  return 'xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

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
  const percentage = Math.round((num - 1.0) * 100);
  return percentage >= 0 ? `+${percentage}%` : `${percentage}%`;
}

/**
 * Generate Microsoft Sec-MS-GEC time-based authentication token
 * Required by Microsoft Edge TTS service to prevent 403 Forbidden errors
 */
async function generateSecMsGec() {
  const unixSec = Math.floor(Date.now() / 1000);
  let ticks = BigInt(unixSec + 11644473600);
  ticks -= (ticks % 300n);
  ticks = ticks * 10000000n;
  const strToHash = `${ticks}${TRUSTED_CLIENT_TOKEN}`;

  const encoder = new TextEncoder();
  const data = encoder.encode(strToHash);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('').toUpperCase();
}

/**
 * Synthesize speech from text using Microsoft Edge Neural TTS
 */
export async function synthesizeSpeech({
  text,
  voice = 'en-US-JennyNeural',
  rate = 1.0,
  pitch = '+0Hz',
  locale = 'en-US'
}) {
  if (!text || !text.trim()) {
    throw new Error('Text to synthesize cannot be empty');
  }

  const cleanText = text.trim();
  const connectionId = generateUUID();
  const requestId = generateUUID();
  const secMsGec = await generateSecMsGec();

  const CHROMIUM_FULL_VERSION = '143.0.3650.75';
  const wsUrl = `${EDGE_WS_BASE}?TrustedClientToken=${TRUSTED_CLIENT_TOKEN}&Sec-MS-GEC=${secMsGec}&Sec-MS-GEC-Version=1-${CHROMIUM_FULL_VERSION}&ConnectionId=${connectionId}`;

  const audioChunks = [];
  const rateStr = formatRate(rate);

  return new Promise((resolve, reject) => {
    let ws;
    let timeoutId;

    try {
      ws = new WebSocket(wsUrl);
      ws.binaryType = 'arraybuffer';
    } catch (err) {
      return reject(new Error(`Failed to create WebSocket: ${err.message}`));
    }

    const cleanup = () => {
      clearTimeout(timeoutId);
      if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
        ws.close();
      }
    };

    timeoutId = setTimeout(() => {
      cleanup();
      reject(new Error('Edge TTS request timed out after 20s'));
    }, 20000);

    ws.onopen = () => {
      const dateStr = new Date().toString();
      const speechConfig = JSON.stringify({
        context: {
          synthesis: {
            audio: {
              metadataoptions: {
                sentenceBoundaryEnabled: 'false',
                wordBoundaryEnabled: 'false'
              },
              outputFormat: 'audio-24khz-48kbitrate-mono-mp3'
            }
          }
        }
      });

      const configPayload =
        `X-Timestamp:${dateStr}\r\n` +
        `Content-Type:application/json; charset=utf-8\r\n` +
        `Path:speech.config\r\n\r\n` +
        speechConfig;

      ws.send(configPayload);

      const ssml =
        `<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='${locale}'>` +
        `<voice name='${voice}'>` +
        `<prosody pitch='${pitch}' rate='${rateStr}'>` +
        xmlEscape(cleanText) +
        `</prosody>` +
        `</voice>` +
        `</speak>`;

      const ssmlPayload =
        `X-RequestId:${requestId}\r\n` +
        `Content-Type:application/ssml+xml\r\n` +
        `X-Timestamp:${dateStr}Z\r\n` +
        `Path:ssml\r\n\r\n` +
        ssml;

      ws.send(ssmlPayload);
    };

    ws.onmessage = async (event) => {
      if (typeof event.data === 'string') {
        if (event.data.includes('Path:turn.end')) {
          cleanup();
          if (audioChunks.length === 0) {
            return reject(new Error('Edge TTS finished without returning audio'));
          }

          const audioBlob = new Blob(audioChunks, { type: 'audio/mp3' });
          const reader = new FileReader();
          reader.onloadend = () => {
            const words = cleanText.split(/\s+/).length;
            const estimatedSeconds = Math.max(1, Math.round((words / 2.5) / (typeof rate === 'number' ? rate : 1.0)));
            resolve({
              blob: audioBlob,
              dataUrl: reader.result,
              size: audioBlob.size,
              estimatedSeconds,
              engineUsed: 'Edge Neural TTS'
            });
          };
          reader.onerror = () => reject(new Error('Failed to convert audio blob to Data URL'));
          reader.readAsDataURL(audioBlob);
        }
      } else if (event.data instanceof ArrayBuffer) {
        const buffer = event.data;
        const view = new DataView(buffer);
        if (buffer.byteLength < 2) return;

        const headerLength = view.getUint16(0);
        if (buffer.byteLength < 2 + headerLength) return;

        const headerBytes = new Uint8Array(buffer, 2, headerLength);
        const headerStr = new TextDecoder().decode(headerBytes);

        if (headerStr.includes('Path:audio')) {
          const audioBody = buffer.slice(2 + headerLength);
          if (audioBody.byteLength > 0) {
            audioChunks.push(audioBody);
          }
        }
      }
    };

    ws.onerror = (event) => {
      cleanup();
      reject(new Error('WebSocket 403 or handshake error on Edge TTS'));
    };

    ws.onclose = (event) => {
      clearTimeout(timeoutId);
      if (audioChunks.length === 0 && !event.wasClean) {
        reject(new Error(`WebSocket closed unexpectedly (code: ${event.code})`));
      }
    };
  });
}
