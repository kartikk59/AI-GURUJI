from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.rag_service import rag_service
from app.services.flashcard_service import flashcard_service

router = APIRouter()


class FlashcardRequest(BaseModel):
    topic: str = ""   # Optional topic filter; if blank uses broad important-concepts query
    count: int = 8    # Number of flashcards to generate (clamped 1–20)


@router.post("/generate-flashcards")
async def generate_flashcards(request: FlashcardRequest):
    """
    RAG-powered flashcard generation pipeline:
    1. Check that a PDF has been uploaded and indexed.
    2. Retrieve the most relevant chunks from the vector store.
    3. Pass rich context to the LLM to generate important-topic flashcards.
    """

    # Check if any content is indexed
    if rag_service.index.ntotal == 0:
        raise HTTPException(
            status_code=400,
            detail="No PDF uploaded yet. Please upload and ingest a PDF/PPT first."
        )

    # Build retrieval query — focus on important/key content if no specific topic given
    topic = request.topic.strip()
    queries = []

    if topic:
        # User specified a topic — target it directly
        queries.append(topic)
    else:
        # Broad sweep: multiple queries to cover different important concept types
        queries = [
            "key concepts definitions and terminology",
            "important formulas equations and laws",
            "core principles processes and mechanisms",
            "critical facts figures and comparisons",
        ]

    # Retrieve chunks (deduplicated by content)
    seen = set()
    all_chunks = []
    k_per_query = max(3, 12 // len(queries))  # distribute k across queries

    for q in queries:
        chunks = rag_service.search(q, k=k_per_query)
        for chunk in chunks:
            # Deduplicate
            key = chunk[:80]
            if key not in seen:
                seen.add(key)
                all_chunks.append(chunk)

    if not all_chunks:
        raise HTTPException(
            status_code=400,
            detail="No relevant content found. Try uploading a PDF with more content."
        )

    # Combine retrieved chunks into a single rich context block
    context = "\n\n---\n\n".join(all_chunks)
    count = max(1, min(request.count, 20))

    print(f"[Flashcards] Generating {count} cards from {len(all_chunks)} chunks ({len(context)} chars)")

    try:
        cards = flashcard_service.generate_flashcards(context, count=count)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    if not cards:
        raise HTTPException(status_code=500, detail="LLM returned no valid flashcards. Try again.")

    return {"flashcards": cards, "total": len(cards), "chunks_used": len(all_chunks)}
