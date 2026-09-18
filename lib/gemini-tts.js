/**
 * Optional Google Gemini API TTS Client
 * Uses Google AI Studio Generative Language API (gemini-2.0-flash)
 * for users who prefer Gemini voice generation.
 */

export async function synthesizeGeminiSpeech({ text, apiKey, voice = 'Puck' }) {
  if (!apiKey) {
    throw new Error('Gemini API key is required to use Gemini TTS');
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(apiKey)}`;

  const prompt = `Read the following text aloud with a natural presentation tone:\n\n${text}`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: voice
            }
          }
        }
      }
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Gemini API returned status ${response.status}`);
  }

  const data = await response.json();
  const candidate = data.candidates?.[0];
  const audioPart = candidate?.content?.parts?.find(p => p.inlineData?.mimeType?.startsWith('audio/'));

  if (!audioPart || !audioPart.inlineData?.data) {
    throw new Error('Gemini did not return an audio part in the response');
  }

  const mimeType = audioPart.inlineData.mimeType || 'audio/mp3';
  const base64Data = audioPart.inlineData.data;
  const dataUrl = `data:${mimeType};base64,${base64Data}`;

  return {
    dataUrl,
    mimeType
  };
}
