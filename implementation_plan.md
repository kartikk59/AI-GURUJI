# Implementation Plan - AI Guruji (Teacher Mode)

## Overview
Build a professional AI teaching system that converts PDF documents into long-form educational lectures with an AI avatar and PPT-style slides.

## Tech Stack
- **Backend**: Python (FastAPI)
  - **PDF Parsing**: PyMuPDF / pdfplumber
  - **RAG**: sentence-transformers, FAISS
  - **LLM**: Gemini / Ollama (for script generation)
  - **TTS**: Coqui TTS
  - **Avatar**: Wav2Lip
  - **Slides**: Python-PPTX or Playwright (HTML -> Image)
- **Frontend**: React (Vite) + Tailwind CSS
  - Premium design with glassmorphism and animations.

## Architecture
1. **Ingestion**: Upload PDF -> Parse Text -> Chunk -> Embed -> Store in FAISS.
2. **Generation**:
   - Retrieve context based on topic (or effectively use whole doc if small).
   - Use `TEACHER_SYSTEM_PROMPT` to generate Lecture Script & Slide Concepts.
   - Parse LLM Output.
3. **Production**:
   - **Audio**: Generate TTS audio for each slide script.
   - **Visuals**: Generate Slide Images (using HTML templates or PPTX).
   - **Avatar**: Sync Audio with Avatar Video (Wav2Lip).
   - **Assembly**: Merge Slide Video + Avatar Video.

## Next Steps
1.  Set up Backend (`fastapi`, `langchain` or direct `faiss`/`sentence-transformers`).
2.  Set up Frontend (`React`, `Tailwind`).
3.  Implement `LectureGenerator` class using the stored prompt.
