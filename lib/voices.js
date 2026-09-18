/**
 * Curated list of high quality Voices (Amazon Polly, Microsoft Cloud, RHVoice & Edge Neural)
 * Grouped by language and locale with natural voice characteristics and clear gender tags.
 */

export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', defaultVoice: 'Amazon US English (Kendra)' },
  { code: 'vi', name: 'Tiếng Việt (Vietnamese)', defaultVoice: 'Microsoft Vietnamese (An)' },
  { code: 'es', name: 'Español (Spanish)', defaultVoice: 'Amazon Castilian Spanish (Conchita)' },
  { code: 'fr', name: 'Français (French)', defaultVoice: 'Amazon French (Celine)' },
  { code: 'de', name: 'Deutsch (German)', defaultVoice: 'Amazon German (Marlene)' },
  { code: 'ja', name: '日本語 (Japanese)', defaultVoice: 'Amazon Japanese (Mizuki)' },
  { code: 'ko', name: '한국어 (Korean)', defaultVoice: 'ko-KR-SunHiNeural' },
  { code: 'zh', name: '中文 (Chinese - Mandarin)', defaultVoice: 'Amazon Chinese (Zhiyu)' },
  { code: 'pt', name: 'Português (Portuguese)', defaultVoice: 'Amazon Brazilian Portuguese (Vitoria)' },
  { code: 'id', name: 'Bahasa Indonesia', defaultVoice: 'id-ID-GadisNeural' },
  { code: 'hi', name: 'हिन्दी (Hindi)', defaultVoice: 'Amazon Indian English (Raveena)' },
  { code: 'ar', name: 'العربية (Arabic)', defaultVoice: 'ar-SA-ZariyahNeural' }
];

export const VOICES = [
  // ================= English (US & UK) =================
  // Amazon Polly Voices
  { id: 'Amazon US English (Kendra)', name: 'Kendra (US Female - Amazon Polly)', lang: 'en', gender: 'Female', locale: 'en-US', provider: 'amazon' },
  { id: 'Amazon US English (Joey)', name: 'Joey (US Male - Amazon Polly)', lang: 'en', gender: 'Male', locale: 'en-US', provider: 'amazon' },
  { id: 'Amazon US English (Ivy)', name: 'Ivy (US Female - Cheerful Polly)', lang: 'en', gender: 'Female', locale: 'en-US', provider: 'amazon' },
  { id: 'Amazon US English (Justin)', name: 'Justin (US Male - Casual Polly)', lang: 'en', gender: 'Male', locale: 'en-US', provider: 'amazon' },
  { id: 'Amazon British English (Amy)', name: 'Amy (UK Female - Amazon Polly)', lang: 'en', gender: 'Female', locale: 'en-GB', provider: 'amazon' },
  { id: 'Amazon British English (Brian)', name: 'Brian (UK Male - Amazon Polly)', lang: 'en', gender: 'Male', locale: 'en-GB', provider: 'amazon' },
  { id: 'Amazon Australian English (Nicole)', name: 'Nicole (AU Female - Amazon Polly)', lang: 'en', gender: 'Female', locale: 'en-AU', provider: 'amazon' },
  { id: 'Amazon Australian English (Russell)', name: 'Russell (AU Male - Amazon Polly)', lang: 'en', gender: 'Male', locale: 'en-AU', provider: 'amazon' },
  // Microsoft Cloud Voices
  { id: 'Microsoft US English (David)', name: 'David (US Male - Microsoft)', lang: 'en', gender: 'Male', locale: 'en-US', provider: 'microsoft' },
  { id: 'Microsoft US English (Zira)', name: 'Zira (US Female - Microsoft)', lang: 'en', gender: 'Female', locale: 'en-US', provider: 'microsoft' },
  // Microsoft Edge Neural Voices
  { id: 'en-US-JennyNeural', name: 'Jenny (US Female - Edge Neural)', lang: 'en', gender: 'Female', locale: 'en-US', provider: 'edge' },
  { id: 'en-US-GuyNeural', name: 'Guy (US Male - Edge Neural)', lang: 'en', gender: 'Male', locale: 'en-US', provider: 'edge' },
  { id: 'en-US-AriaNeural', name: 'Aria (US Female - Expressive Neural)', lang: 'en', gender: 'Female', locale: 'en-US', provider: 'edge' },
  { id: 'en-US-ChristopherNeural', name: 'Christopher (US Male - Narrative Neural)', lang: 'en', gender: 'Male', locale: 'en-US', provider: 'edge' },

  // ================= Vietnamese =================
  { id: 'Microsoft Vietnamese (An)', name: 'An (Việt Nam - Nam Microsoft Cloud)', lang: 'vi', gender: 'Male', locale: 'vi-VN', provider: 'microsoft' },
  { id: 'RHVoice Vietnamese (Vi-Vu)', name: 'Vi Vũ (Việt Nam - Nữ RHVoice)', lang: 'vi', gender: 'Female', locale: 'vi-VN', provider: 'rhvoice' },
  { id: 'vi-VN-HoaiMyNeural', name: 'Hoài My (Việt Nam - Nữ Edge Neural)', lang: 'vi', gender: 'Female', locale: 'vi-VN', provider: 'edge' },
  { id: 'vi-VN-NamMinhNeural', name: 'Nam Minh (Việt Nam - Nam Edge Neural)', lang: 'vi', gender: 'Male', locale: 'vi-VN', provider: 'edge' },

  // ================= Spanish =================
  { id: 'Amazon Castilian Spanish (Conchita)', name: 'Conchita (España - Femenino Polly)', lang: 'es', gender: 'Female', locale: 'es-ES', provider: 'amazon' },
  { id: 'Amazon Castilian Spanish (Enrique)', name: 'Enrique (España - Masculino Polly)', lang: 'es', gender: 'Male', locale: 'es-ES', provider: 'amazon' },
  { id: 'Amazon Mexican Spanish (Mia)', name: 'Mia (México - Femenino Polly)', lang: 'es', gender: 'Female', locale: 'es-MX', provider: 'amazon' },
  { id: 'es-ES-ElviraNeural', name: 'Elvira (España - Femenino Edge)', lang: 'es', gender: 'Female', locale: 'es-ES', provider: 'edge' },
  { id: 'es-ES-AlvaroNeural', name: 'Álvaro (España - Masculino Edge)', lang: 'es', gender: 'Male', locale: 'es-ES', provider: 'edge' },

  // ================= French =================
  { id: 'Amazon French (Celine)', name: 'Céline (France - Féminin Polly)', lang: 'fr', gender: 'Female', locale: 'fr-FR', provider: 'amazon' },
  { id: 'Amazon French (Mathieu)', name: 'Mathieu (France - Masculin Polly)', lang: 'fr', gender: 'Male', locale: 'fr-FR', provider: 'amazon' },
  { id: 'fr-FR-DeniseNeural', name: 'Denise (France - Féminin Edge)', lang: 'fr', gender: 'Female', locale: 'fr-FR', provider: 'edge' },
  { id: 'fr-FR-HenriNeural', name: 'Henri (France - Masculin Edge)', lang: 'fr', gender: 'Male', locale: 'fr-FR', provider: 'edge' },

  // ================= German =================
  { id: 'Amazon German (Marlene)', name: 'Marlene (Deutschland - Weiblich Polly)', lang: 'de', gender: 'Female', locale: 'de-DE', provider: 'amazon' },
  { id: 'Amazon German (Hans)', name: 'Hans (Deutschland - Männlich Polly)', lang: 'de', gender: 'Male', locale: 'de-DE', provider: 'amazon' },
  { id: 'de-DE-KatjaNeural', name: 'Katja (Deutschland - Weiblich Edge)', lang: 'de', gender: 'Female', locale: 'de-DE', provider: 'edge' },
  { id: 'de-DE-ConradNeural', name: 'Conrad (Deutschland - Männlich Edge)', lang: 'de', gender: 'Male', locale: 'de-DE', provider: 'edge' },

  // ================= Japanese =================
  { id: 'Amazon Japanese (Mizuki)', name: 'Mizuki (日本 - 女性 Polly)', lang: 'ja', gender: 'Female', locale: 'ja-JP', provider: 'amazon' },
  { id: 'Amazon Japanese (Takumi)', name: 'Takumi (日本 - 男性 Polly)', lang: 'ja', gender: 'Male', locale: 'ja-JP', provider: 'amazon' },
  { id: 'ja-JP-NanamiNeural', name: 'Nanami (日本 - 女性 Edge)', lang: 'ja', gender: 'Female', locale: 'ja-JP', provider: 'edge' },
  { id: 'ja-JP-KeitaNeural', name: 'Keita (日本 - 男性 Edge)', lang: 'ja', gender: 'Male', locale: 'ja-JP', provider: 'edge' },

  // ================= Korean =================
  { id: 'ko-KR-SunHiNeural', name: 'SunHi (한국 - 여성 Edge)', lang: 'ko', gender: 'Female', locale: 'ko-KR', provider: 'edge' },
  { id: 'ko-KR-InJoonNeural', name: 'InJoon (한국 - 남성 Edge)', lang: 'ko', gender: 'Male', locale: 'ko-KR', provider: 'edge' },

  // ================= Chinese (Mandarin) =================
  { id: 'Amazon Chinese (Zhiyu)', name: 'Zhiyu (中国 - 女性 Polly)', lang: 'zh', gender: 'Female', locale: 'zh-CN', provider: 'amazon' },
  { id: 'Microsoft Chinese (Kangkang)', name: 'Kangkang (中国 - 男性 Microsoft)', lang: 'zh', gender: 'Male', locale: 'zh-CN', provider: 'microsoft' },
  { id: 'Microsoft Chinese (Yaoyao)', name: 'Yaoyao (中国 - 女性 Microsoft)', lang: 'zh', gender: 'Female', locale: 'zh-CN', provider: 'microsoft' },
  { id: 'zh-CN-XiaoxiaoNeural', name: 'Xiaoxiao (中国 - 女性 Edge)', lang: 'zh', gender: 'Female', locale: 'zh-CN', provider: 'edge' },
  { id: 'zh-CN-YunxiNeural', name: 'Yunxi (中国 - 男性 Edge)', lang: 'zh', gender: 'Male', locale: 'zh-CN', provider: 'edge' },

  // ================= Portuguese =================
  { id: 'Amazon Brazilian Portuguese (Vitoria)', name: 'Vitória (Brasil - Feminino Polly)', lang: 'pt', gender: 'Female', locale: 'pt-BR', provider: 'amazon' },
  { id: 'Amazon Brazilian Portuguese (Ricardo)', name: 'Ricardo (Brasil - Masculino Polly)', lang: 'pt', gender: 'Male', locale: 'pt-BR', provider: 'amazon' },
  { id: 'pt-BR-FranciscaNeural', name: 'Francisca (Brasil - Feminino Edge)', lang: 'pt', gender: 'Female', locale: 'pt-BR', provider: 'edge' },
  { id: 'pt-BR-AntonioNeural', name: 'Antônio (Brasil - Masculino Edge)', lang: 'pt', gender: 'Male', locale: 'pt-BR', provider: 'edge' },

  // ================= Indonesian =================
  { id: 'id-ID-GadisNeural', name: 'Gadis (Indonesia - Wanita Edge)', lang: 'id', gender: 'Female', locale: 'id-ID', provider: 'edge' },
  { id: 'id-ID-ArdiNeural', name: 'Ardi (Indonesia - Pria Edge)', lang: 'id', gender: 'Male', locale: 'id-ID', provider: 'edge' },

  // ================= Hindi =================
  { id: 'Amazon Indian English (Raveena)', name: 'Raveena (India - Female Polly)', lang: 'hi', gender: 'Female', locale: 'hi-IN', provider: 'amazon' },
  { id: 'hi-IN-SwaraNeural', name: 'Swara (India - Female Edge)', lang: 'hi', gender: 'Female', locale: 'hi-IN', provider: 'edge' },

  // ================= Arabic =================
  { id: 'ar-SA-ZariyahNeural', name: 'Zariyah (Saudi Arabia - Female Edge)', lang: 'ar', gender: 'Female', locale: 'ar-SA', provider: 'edge' }
];
