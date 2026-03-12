# 📘 AI Guruji - User Guide

Welcome to **AI Guruji**, your personal AI Professor. This system converts any textbook or PDF document into a professional, engaging audio-visual lecture.

## 🌟 How It Works

The system follows a 9-step pipeline to transform your document into a lecture:

1.  **PDF Upload**: You provide the source material.
2.  **RAG Extraction**: The AI reads and extracts core topics, avoiding hallucinations.
3.  **Prompt Engineering**: The system constructs a strict "Teaching Prompt" for the AI.
4.  **Script Generation**: The AI writes a full lecture script (Teacher Avatar + Slide Content).
5.  **Scene Planning**: The lecture is split into timed scenes (Introduction, Concepts, Summary).
6.  **Slide Generation**: Professional HTML/CSS slides are created for each scene.
7.  **Voice Synthesis (TTS)**: A teacher-style voice narrates the script.
8.  **Avatar Lip-Sync**: (Optional) The avatar moves its lips in sync with the audio.
9.  **Playback**: You watch the final lecture in our interactive player.

## 🎓 How to Use

### 1. Start the System
Ensure both the Backend and Frontend are running (see `README.md` or `README_SETUP.md` for details).
- Open your browser to: **http://localhost:5173**

### 2. Upload Your Material
- Click the big **"Upload PDF"** area.
- Select your PDF file (Textbooks, Research Papers, Notes).
- **Tip**: For best results, ensure the PDF has clear, selectable text (not scanned images).

### 3. Generate Lecture
- Once the upload completes, you will see an **"Ingestion Report"** showing how many chunks were read.
- Click **"Proceed to Lecture Generation"**.
- ⏳ **Wait**: Use this time to grab a coffee. The AI is:
    - Reading your document.
    - Writing the lecture.
    - Painting the slides.
    - Recording the voiceover.

### 4. Attend the Class
- The **Player View** will open automatically.
- **Left Screen**: Shows the educational slides.
- **Right Screen**: Shows your AI Teacher (Avatar).
- The lecture will play automatically. You can Pause or Skip slides using the controls at the bottom.

## ❓ Troubleshooting

**Q: The generation is stuck.**
A: Check the backend terminal. If you are using Ollama, generating 10+ minutes of audio script might take 1-2 minutes on slower machines.

**Q: No voice is playing.**
A: Ensure your computer speakers are on. The backend generates `.wav` files in `backend/data/outputs/audio`.

**Q: The slides look empty.**
A: The Slide Generator uses Playwright. Ensure you ran `playwright install chromium` during setup.

---
*Class is in session!* 🍎
