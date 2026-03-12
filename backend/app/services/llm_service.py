import os
import json
import ast
from dotenv import load_dotenv
import google.generativeai as genai

from app.core.prompts import PODCAST_SYSTEM_PROMPT

# Optional OpenAI Import
try:
    from openai import OpenAI
    HAS_OPENAI_LIB = True
except ImportError:
    HAS_OPENAI_LIB = False
    print("[WARN] OpenAI library not found. OpenAI fallback disabled.")

class LLMService:
    def __init__(self):
        # --- HARDCODE SECTION ---
        # Paste your key inside the quotes below to bypass .env issues
        self.HARDCODED_GEMINI_KEY = None
        
        # 1. Explicitly load .env from backend root
        from pathlib import Path
        env_path = Path(__file__).resolve().parent.parent.parent / '.env'
        load_dotenv(dotenv_path=env_path)
        
        # 2. Load Keys (Prioritize Hardcoded if set)
        self.gemini_api_key = self.HARDCODED_GEMINI_KEY or os.getenv("GEMINI_API_KEY")
        self.openai_api_key = os.getenv("OPENAI_API_KEY")

        # --- DEBUGGING BLOCK ---
        print("--- KEY DIAGNOSTICS ---")
        if not self.gemini_api_key:
             print("[ERROR] GEMINI_API_KEY is Missing/None")
        else:
             masked_key = self.gemini_api_key[:6] + "..." if len(self.gemini_api_key) > 6 else "***"
             print(f"[OK] GEMINI_API_KEY Loaded: {masked_key}")
             
        if not self.openai_api_key:
             print("[WARN] OPENAI_API_KEY is Missing/None (Fallback Disabled)")
        else:
             masked_key = self.openai_api_key[:6] + "..." if len(self.openai_api_key) > 6 else "***"
             print(f"[OK] OPENAI_API_KEY Loaded: {masked_key}")
        print("-----------------------")

        self.providers = []
        
        # 1. Initialize OpenAI (Primary for now if key exists, or Fallback)
        if HAS_OPENAI_LIB and self.openai_api_key:
            try:
                self.openai_client = OpenAI(api_key=self.openai_api_key)
                self.providers.append("openai")
                print("[OK] OpenAI LLM Initialized.")
            except Exception as e:
                print(f"[ERROR] Failed to configure OpenAI: {e}")
        else:
             print("[WARN] OpenAI API Key or library missing.")

        # 1.5. Initialize Groq
        self.groq_api_key = os.getenv("GROQ_API_KEY")
        if self.groq_api_key:
            try:
                from groq import Groq
                self.groq_client = Groq(api_key=self.groq_api_key)
                # Put Groq FIRST in priority line before Gemini
                self.providers.insert(0, "groq")
                print("[OK] Groq LLM Initialized (Blazing Fast Inference).")
            except Exception as e:
                print(f"[ERROR] Failed to configure Groq: {e}")
        else:
             print("[WARN] Groq API Key missing. Skipping Groq.")

        # 2. Smart Gemini Initialization (Try latest, fallback to older)
        if self.gemini_api_key:
            try:
                genai.configure(api_key=self.gemini_api_key)
                # List of models to try in order of preference
                candidate_models = ['gemini-pro', 'gemini-1.5-flash', 'gemini-1.0-pro']
                self.gemini_model = None # Placeholder
                
                # Try the most likely public stable model first
                self.gemini_model = genai.GenerativeModel('gemini-1.5-flash')
                
                self.providers.append("gemini")
                print(f"[OK] Gemini LLM Initialized (Model: gemini-1.5-flash)")
            except Exception as e:
                print(f"[ERROR] Failed to configure Gemini: {e}")
        else:
            print("[WARN] Gemini API Key missing.")

        if not self.providers:
            print("[ERROR] CRITICAL: No LLM providers available.")

    def generate_lecture_content(self, system_prompt: str, user_context: str) -> dict:
        """
        Generates lecture content trying providers in sequence (OpenAI -> Gemini).
        Returns STRICT JSON.
        """
        full_prompt = (
            f"{system_prompt}\n\n"
            f"CONTEXT FROM DOCUMENT:\n{user_context}\n\n"
            "STRICT OUTPUT INSTRUCTIONS:\n"
            "You MUST return valid JSON only. No markdown formatting like ```json ... ```.\n"
            "The JSON structure must be:\n"
            "{\n"
            '  "lecture_title": "Title String",\n'
            '  "slides": [\n'
            '    {\n'
            '      "heading": "Slide Title",\n'
            '      "summary": "Brief summary",\n'
            '      "important_points": ["Point 1", "Point 2"],\n'
            '      "script": "Natural spoken script, approx 150 words.",\n'
            '      "code": "Optional code snippet or empty string"\n'
            "    }\n"
            "  ]\n"
            "}"
        )
        
        errors = []

        for provider in self.providers:
            print(f"[TURN] Generating with {provider.upper()}...")
            try:
                if provider == "groq":
                    return self._generate_groq(full_prompt)
                elif provider == "gemini":
                    return self._generate_gemini_robust(full_prompt)
                elif provider == "openai":
                    return self._generate_openai(full_prompt)
            except Exception as e:
                error_msg = f"{provider} failed: {e}"
                print(f"[ERROR] {error_msg}")
                errors.append(error_msg)
                continue
        
        # If all fail
        print(f"[ERROR] All LLM providers failed. Errors: {errors}")
        raise Exception(f"All LLM providers failed: {errors}")

    def generate_podcast_dialogue(self, user_context: str) -> dict:
        """
        Generates strict Dual-Host (Ziva & Zyro) podcast dialogue JSON based on context.
        """
        full_prompt = f"{PODCAST_SYSTEM_PROMPT}\n{user_context}"
        
        errors = []

        for provider in self.providers:
            print(f"[POD] Generating Podcast Script with {provider.upper()}...")
            try:
                if provider == "groq":
                    return self._generate_groq(full_prompt)
                elif provider == "gemini":
                    return self._generate_gemini_robust(full_prompt)
                elif provider == "openai":
                    return self._generate_openai(full_prompt)
            except Exception as e:
                error_msg = f"{provider} failed (Podcast): {e}"
                print(f"[ERROR] {error_msg}")
                errors.append(error_msg)
                continue
        
        # If all fail
        print(f"[ERROR] All LLM providers failed for podcast. Errors: {errors}")
        raise Exception(f"All LLM providers failed: {errors}")

    def _generate_groq(self, prompt: str) -> dict:
        """Use ultra-fast Groq LLaMA models"""
        response = self.groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": "You are a helpful AI teacher helper. output JSON only."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            response_format={"type": "json_object"}
        )
        content = response.choices[0].message.content
        return self._clean_and_parse_json(content)

    def _generate_gemini_robust(self, prompt: str) -> dict:
        """
        Tries multiple Gemini models in sequence.
        """
        # PRIORITIZE STABLE MODELS
        candidate_models = [
            'gemini-1.5-flash',
            'gemini-2.5-flash', 
            'gemini-2.0-flash'
        ]
        last_error = None
        
        for model_name in candidate_models:
            print(f"   👉 Trying Gemini Model: {model_name}...")
            try:
                model = genai.GenerativeModel(model_name)
                response = model.generate_content(prompt)
                
                if not response.text:
                    raise ValueError(f"Empty response from Gemini ({model_name})")
                    
                return self._clean_and_parse_json(response.text)
                
            except Exception as e:
                error_str = str(e)
                print(f"   ⚠️ {model_name} failed: {error_str}")
                last_error = e
                # If we hit a 429 quota/rate limit on 1.5-flash, do NOT keep hammering the API 
                # as other experimental models usually have a limit of 0 on free tier anyway.
                if "429" in error_str and "Quota" in error_str:
                     print(f"   🛑 Rate Limited or Out of Quota. Aborting Gemini fallback.")
                     raise Exception(f"Gemini Rate Limit Exceeded: Please wait 1 minute before generating again. Details: {error_str}")
                     
                continue
        
        raise Exception(f"All Gemini models failed. Last error: {last_error}")

    def _generate_openai(self, prompt: str) -> dict:
        # Simplified Client usage
        response = self.openai_client.chat.completions.create(
            model="gpt-4o", # Or gpt-3.5-turbo depending on budget/availability
            messages=[
                {"role": "system", "content": "You are a helpful AI teacher helper. output JSON only."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7
        )
        content = response.choices[0].message.content
        return self._clean_and_parse_json(content)

    def _clean_and_parse_json(self, text: str) -> dict:
        # Remove markdown code blocks if present
        clean_text = text.replace("```json", "").replace("```", "").strip()
        
        try:
            return json.loads(clean_text)
        except json.JSONDecodeError:
            # Try to salvage partial JSON or use AST if it's single-quoted
            try:
                return ast.literal_eval(clean_text)
            except:
                raise ValueError(f"Failed to parse JSON response: {text[:100]}...")

llm_service = LLMService()
