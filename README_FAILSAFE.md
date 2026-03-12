# AI Guruji System: Failsafe & Recovery Guide

## 🛡️ Robust Architecture (The "Uncrashable" Design)
This system is designed to **never crash**. It uses a **"Graceful Degradation"** strategy. If a specific component fails or a library is missing, the system automatically switches to a "Safe Mode" for that feature ensure the pipeline completes.

This means you will **ALWAYS** get a result, even if it is a simplified version of the full lecture.

## ⚡ Multi-Provider Redundancy
We use a **Tiered Backup System**. If the primary tool fails, the secondary one immediately takes over.

| Feature | Primary Provider | Backup Provider | Last Resort |
| :--- | :--- | :--- | :--- |
| **🧠 Brain** | **Google Gemini** | **Ollama** (Local AI) | **System Mock** (Placeholder Script) |
| **🗣️ Voice** | **Coqui TTS** (High Quality) | **Google TTS** (Cloud Standard) | **Silent Mode** (Text-only) |
| **📚 Memory** | **Gemini Embeddings** | *N/A* | **Keyword Search / No-Op** |
| **🎞️ Video** | **FFmpeg Split Screen** | *N/A* | **Static Slides** |

## 🔄 Failure Fallback Matrix
Here is exactly what happens if a specific part of the system breaks:

| Component | Function | Failure Condition | System Behavior (Safe Mode) | User Impact |
| :--- | :--- | :--- | :--- | :--- |
| **LLM (Brain)** | Generating Script | Gemini API fails or Quota exceeded | **1. Auto-switch to Ollama** (if running locally)<br>**2. Auto-switch to Mock Generator** | 1. Slower generation.<br>2. Lecture will be a generic "System Recovery" placeholder. |
| **TTS (Voice)** | Generating Audio | Coqui TTS error, Missing Model, or Import Error | **Generate Silent Audio Files** | The video generation continues, but the resulting video will have **NO Audio** (Silence). |
| **Slides (PPTX)** | Downloadable File | `python-pptx` library missing | **Skip PPTX Generation** | The user receives the lecture video, but the "Download PPT" feature/button will not work. |
| **Slides (Visuals)** | Video Backgrounds | `Pillow` library missing | **Skip Slide Images** | The final video composition may fail or show black screens, but the request will likely complete. |
| **RAG (Context)** | PDF Knowledge | Gemini API Key missing or Error | **Fallback to Keyword/No-Op** | The AI Teacher explains the topic using **General Knowledge**. |

## 🛠️ How to Fix Issues (Auto-Repair)
If you notice the system is running in "Safe Mode" (e.g., silent audio, generic content), it usually means a dependency is missing.

**We have included a 1-Click Repair Tool:**

*(Ensure you have activated your virtual environment first!)*

```batch-
d:\Projects\AI_Guruji - Copy\backend\repair_env.bat
```

**Running this script will:**
1.  Upgrade generic `pip` tools.
2.  **Force Install** all critical libraries (`TTS`, `pptx`, `google-generativeai`, etc.).
3.  **Verify FFmpeg** presence (required for video).

## 🔍 How to Debug
Watch the **Backend Console** (`uvicorn` terminal) while generating. The system prints clear status emojis:

*   ✅ **SUCCESS**: Component is working perfectly.
*   ⚠️ **WARNING**: Component failed/missing. System entering **Safe Mode** for this feature.
*   ❌ **CRITICAL**: Rare fatal error (usually network or disk permission).

---
**Philosophy:** "Better a silent video than a crashed server."
