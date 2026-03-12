import sys
import importlib
import subprocess

def check_import(module_name, install_name=None):
    if install_name is None:
        install_name = module_name
    print(f"Checking {module_name}...", end=" ")
    try:
        importlib.import_module(module_name)
        print("✅ OK")
        return True
    except ImportError as e:
        print(f"❌ FAILED ({e})")
        return False
    except Exception as e:
        print(f"❌ CRITICAL FAIL ({e})")
        return False

def check_torch_cpu():
    print("Checking torch (CPU)...", end=" ")
    try:
        import torch
        print(f"✅ OK ({torch.__version__})")
        if torch.cuda.is_available():
            print("   ℹ️  CUDA is available, but assuming CPU usage is fine too.")
        return True
    except ImportError:
        print("❌ FAILED (not installed)")
        return False
    except Exception as e:
        print(f"❌ CRITICAL FAIL ({e})")
        return False

print("--- AI GURUJI DEPENDENCY CHECK ---\n")

modules = [
    ("fastapi", "fastapi"),
    ("uvicorn", "uvicorn"),
    ("dotenv", "python-dotenv"),
    ("fitz", "pymupdf"),  # fitz is package name for pymupdf
    ("pdfplumber", "pdfplumber"),
    ("pptx", "python-pptx"),
    ("google.generativeai", "google-generativeai"),
    ("openai", "openai"),
    ("faiss", "faiss-cpu"),  
    ("sentence_transformers", "sentence-transformers"),
    ("transformers", "transformers"),
    ("huggingface_hub", "huggingface_hub"),
    ("TTS.api", "TTS"),
    ("gtts", "gTTS"),
    ("pydub", "pydub"),
    ("PIL", "pillow"),
    ("cv2", "opencv-python"),
    ("numpy", "numpy") # basic check
]

missing = []

if not check_torch_cpu():
    missing.append("torch torchvision --index-url https://download.pytorch.org/whl/cpu")

for mod, pkg in modules:
    if not check_import(mod, pkg):
        missing.append(pkg)

print("\n--- SUMMARY ---")
if missing:
    print(f"❌ Missing or Broken Packages: {', '.join(missing)}")
    print("Attempting to fix automatically...")
    
    # Construct pip command
    cmd = [sys.executable, "-m", "pip", "install"] + missing
    if "torch" in str(missing):
         # Special handling for torch cpu if needed, but usually running the explicit command is better
         # We will run the simple install for missing packages first
         pass
         
    try:
        print(f"Running: {' '.join(cmd)}")
        subprocess.check_call(cmd)
        print("\n✅ Verification after install:")
        # Re-check
        for mod, pkg in modules:
             check_import(mod, pkg)
    except subprocess.CalledProcessError as e:
        print(f"❌ Auto-fix failed with exit code {e.returncode}")
        print("Please run manually: pip install -r requirements.txt")

else:
    print("✅ All Dependencies seem fine!")
