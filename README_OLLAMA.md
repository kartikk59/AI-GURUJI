# 🦙 Logic: Running with Ollama

If you do not have a Google Gemini API Key, **AI Guruji** automatically falls back to **Ollama** for local inference.

## 1. Install Ollama
Download and install Ollama from [ollama.com](https://ollama.com).

## 2. Pull the Model
Open your terminal (PowerShell/CMD) and run the following command to download the model we use (`mistral` is recommended for teaching):

```bash
ollama pull mistral
```
*(Or use `llama3`, `gemma:7b` etc. but ensure you update `llm_service.py` if you switch)*

## 3. Run the Server
Ollama acts as a local API server. Ensure it is running:
- **Windows**: It usually runs in the system tray automatically after installation.
- **Manual Start**: Run `ollama serve` in a terminal window.

## 4. Verify Connection
To check if Ollama is ready to accept requests from AI Guruji:
1.  Open your browser.
2.  Go to [http://localhost:11434](http://localhost:11434).
3.  You should see the message: `Ollama is running`.

## 5. Usage in AI Guruji
Simply **leave the `GEMINI_API_KEY` empty** (or remove it) in your `backend/.env` file. The system will detect this and print:
`⚠️ GEMINI_API_KEY not found/invalid. Switching to provider: OLLAMA`
