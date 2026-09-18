# 🎙️ Canva Voice Injector (Chrome Extension)

A lightweight, powerful Google Chrome Extension that lets you **scan slide text** and **automatically generate and add neural voiceovers** to your Canva presentations with 1 click.

---

## ✨ Features

- **100% Free Neural TTS**: Uses cloud neural AI voices (powered by Edge Neural Speech) directly from Google Chrome. No API keys, no sign-ups, and no payment required.
- **Natural Voices in 12+ Languages**:
  - **English (US/UK/AU)**: Jenny, Guy, Aria, Christopher, Sonia, Ryan, Natasha.
  - **Vietnamese**: Hoài My (Nữ nhẹ nhàng), Nam Minh (Nam truyền cảm).
  - **Japanese, Spanish, French, German, Korean, Chinese, Portuguese, etc.**
- **Slide Text & Notes Scanner**: Automatically detects and extracts text boxes, titles, and presenter notes on the active slide.
- **In-Canva Floating Widget**: Draggable, collapsible widget that sits right inside Canva while you edit.
- **Audio Preview**: Listen to the voiceover before adding it to your slide.
- **Timeline Injection & Draggable Chip**: Automatically drops the audio file onto Canva's bottom timeline, or drag the interactive `[ 🎵 Drag onto Timeline ]` chip directly onto the slide track.
- **Optional Gemini Mode**: Includes a toggle to use Google AI Studio Gemini API if you have a Gemini API key.

---

## 🚀 How to Install in Google Chrome (Takes 30 Seconds)

1. Open **Google Chrome**.
2. Go to `chrome://extensions` in your address bar.
3. Turn **ON** **"Developer mode"** (toggle in the top-right corner).
4. Click the **"Load unpacked"** button in the top-left.
5. Select this folder:
   ```
   /Users/fuyu/personal_project/voice-inject-canva
   ```
6. The **Canva Voice Injector** extension is now installed!

---

## 🎬 How to Use on Your Canva Slides

1. Open your Canva presentation in Chrome:
   - Example: [Your Canva Presentation](https://www.canva.com/design/DAHVb9Vw3lc/ffT46mD-B0WjbLlvI9Gvkg/edit)
2. You will see a sleek **🎙️ Voice Injector** widget floating on the right side of the screen.
3. **Select Slide**: Use `[ ⬅ Prev ]` and `[ Next ➡ ]` or click any slide on your Canva timeline.
4. **Scan Slide**: Click **`[ 🔍 Scan Slide Text ]`**. The text from that slide will automatically appear in the text area.
5. **Adjust Voice**:
   - Pick your desired **Language** and **Voice** (e.g. English Jenny or Vietnamese Hoài My).
   - Adjust the **Speaking Speed** slider if needed (e.g. `1.0x` or `1.1x`).
6. **Generate & Preview**:
   - Click **`[ ⚡ Generate Voice ]`**.
   - Within 1–2 seconds, the audio player appears. Click **`[ ▶ ]`** to preview.
7. **Add to Canva Timeline**:
   - The extension will attempt to drop the audio onto Canva's timeline automatically.
   - Alternatively, simply grab the teal **`[ 🎵 Drag onto Slide Timeline ]`** badge and drop it onto Canva's bottom timeline for that slide!
   - You can also click **`[ 💾 ]`** to download `slide_X_voice.mp3`.

---

## 💡 Tips for Best Results in Canva

- **Slide Timing**: In Canva, make sure the slide duration on the timeline is long enough to fit the spoken audio (e.g. if the audio is 6 seconds, set the slide duration to 6 or 7 seconds).
- **Presenter Notes**: If you have long speech scripts that aren't printed on the visual slide, you can write them in Canva's **Notes** tab (bottom left); the scanner will detect and read them!
