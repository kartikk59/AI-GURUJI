from fastapi import FastAPI, Request
from app.api.endpoints import upload, generate, flashcards, auth
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.core.errors import global_exception_handler
import os
import shutil

app = FastAPI(title="AI Guruji Backend", version="1.0.0")

# Register Global Exception Handler
app.add_exception_handler(Exception, global_exception_handler)

# Configure CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["Cross-Origin-Opener-Policy"] = "same-origin-allow-popups"
    return response

app.include_router(upload.router, prefix="/api", tags=["Upload"])
app.include_router(generate.router, prefix="/api", tags=["Generate"])
app.include_router(flashcards.router, prefix="/api", tags=["Flashcards"])
app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])

# Serve generated files (Slides, Audio, Avatar)
output_dir = os.path.join(os.getcwd(), "data", "outputs")
os.makedirs(output_dir, exist_ok=True)
app.mount("/files", StaticFiles(directory=output_dir), name="files")

@app.on_event("startup")
async def startup_check():
    """Perform self-checks on startup."""
    print("[START] AI Guruji Backend Starting Up...")
    
    # Check FFmpeg
    if not shutil.which("ffmpeg"):
         print("[ERROR] CRITICAL: FFmpeg not found in PATH. Audio/Video features will fail.")
    else:
         print("[OK] FFmpeg Check Passed.")
         

         
    print("[OK] System Ready.")

@app.get("/")
def read_root():
    return {"message": "AI Guruji Teacher System API is ready."}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
