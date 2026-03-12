from fastapi import FastAPI
from app.api.endpoints import upload, generate, flashcards, auth
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="AI Guruji Backend", version="1.0.0")

# Configure CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Adjust in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(upload.router, prefix="/api", tags=["Upload"])
app.include_router(generate.router, prefix="/api", tags=["Generate"])
app.include_router(flashcards.router, prefix="/api", tags=["Flashcards"])
app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
from fastapi.staticfiles import StaticFiles
import os

# Serve generated files (Slides, Audio, Avatar)
output_dir = os.path.join(os.getcwd(), "data", "outputs")
os.makedirs(output_dir, exist_ok=True)
app.mount("/files", StaticFiles(directory=output_dir), name="files")

@app.get("/")
def read_root():
    return {"message": "AI Guruji Teacher System API is ready."}

if __name__ == "__main__":
    import uvicorn
    # Restrict reload to 'app' dir so generated file writes in 'data/' don't restart the server
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True, reload_dirs=["app"])
