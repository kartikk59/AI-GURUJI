1. PDF Upload
   ↓
2. RAG extracts:
   - Headings
   - Main topics
   - Key explanations
   ↓
3. RAG → LLM Prompt
   (Only retrieved context)
   ↓
4. LLM generates:
   - Teaching script (spoken language)
   - Scene-wise structure
   - Code / text for PPT slides
   ↓
5. Scene Planner:
   - Split into 15–20 min lecture
   - Calculate duration per scene
   ↓
6. Slide Generator:
   - Code/Text → PPT-style images
   - Deterministic (no AI art)
   ↓
7. TTS:
   - Generate audio for each scene
   - Teacher-style voice
   ↓
8. Avatar (Teacher):
   - Lip-sync avatar using scene audio
   ↓
9. Video / Live Playback:
   - Avatar explains
   - Slides change with scenes
