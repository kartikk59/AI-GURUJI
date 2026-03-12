import google.generativeai as genai
import os
from dotenv import load_dotenv
from pathlib import Path

# Load env safely
env_path = Path(os.getcwd()) / '.env'
load_dotenv(dotenv_path=env_path)

api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    # Try hardcoded
    try:
        from app.services.llm_service import llm_service
        api_key = llm_service.HARDCODED_GEMINI_KEY
        print(f"Using Hardcoded Key: {api_key[:5]}...")
    except:
        print("❌ No API Key found in .env or Hardcoded")
        exit(1)

genai.configure(api_key=api_key)

print("--- Checking Available Gemini Models ---")
try:
    for m in genai.list_models():
        if 'generateContent' in m.supported_generation_methods:
            print(f"✅ Found Model: {m.name}")
except Exception as e:
    print(f"❌ Error Listing Models: {e}")
