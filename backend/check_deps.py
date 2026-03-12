import sys
import subprocess
import shutil

def check_import(module_name, display_name=None):
    try:
        __import__(module_name)
        print(f"✅ {display_name or module_name} imported successfully")
        return True
    except ImportError as e:
        print(f"❌ {display_name or module_name} error: {e}")
        return False

def check_command(command):
    if shutil.which(command):
        print(f"✅ {command} found in PATH")
        return True
    else:
        print(f"❌ {command} NOT found in PATH (Install FFmpeg!)")
        return False

# Core
check_import("pydantic")
check_import("fastapi")

# New Stack
check_import("sentence_transformers", "Sentence Transformers")
check_import("pptx", "python-pptx")
check_import("TTS", "Coqui TTS")

# System
check_command("ffmpeg")

# Eunoic Check
import os
if os.path.exists("Eunoic"):
    print("✅ Eunoic folder found")
else:
    print("⚠️ Eunoic folder NOT found (Clone it!)")
