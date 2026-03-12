from fastapi import APIRouter, UploadFile, File, HTTPException
from app.services.rag_service import rag_service
import shutil
import os
import tempfile

router = APIRouter()

@router.post("/upload-pdf")
async def upload_pdf(file: UploadFile = File(...)):
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="File must be a PDF")
    
    # Save uploaded file temporarily
    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
        shutil.copyfileobj(file.file, tmp)
        tmp_path = tmp.name

    try:
        # Extract and Index
        text = rag_service.extract_text_from_pdf(tmp_path)
        chunks = rag_service.create_chunks(text)
        rag_service.clear_index() # Clear previous for a fresh start (optional based on use case)
        rag_service.add_to_index(chunks)
        rag_service.save_index() # Persist the new index
        
        return {
            "filename": file.filename, 
            "status": "Processed", 
            "chunks_count": len(chunks),
            "message": "PDF successfully ingested into RAG system."
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        os.remove(tmp_path)
