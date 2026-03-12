
import sys
try:
    import accelerate
    print(f"Accelerate version: {accelerate.__version__}")
except ImportError as e:
    print(f"Accelerate error: {e}")

try:
    from transformers import Trainer
    print("Trainer imported successfully")
except ImportError as e:
    print(f"Trainer import error: {e}")

try:
    import torch
    print(f"Torch version: {torch.__version__}")
except ImportError:
    print("Torch not found")
