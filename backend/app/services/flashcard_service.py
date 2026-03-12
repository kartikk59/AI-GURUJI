# pyre-ignore-all-errors
import json
import uuid


class FlashcardService:
    """
    Generates active-recall flashcards from RAG-retrieved context.
    Focuses on IMPORTANT topics only, using existing llm_service infrastructure.
    """

    FLASHCARD_PROMPT = """You are an expert educator specializing in active recall learning.
You will receive text extracted from a student's uploaded study material (PDF/PPT slides).

Your task:
1. First identify the MOST IMPORTANT concepts, definitions, formulas, and key facts in the material.
2. Ignore filler text, introductions, table of contents, and unimportant details.
3. Generate exactly {count} flashcards covering ONLY the most exam-worthy and critical concepts.

Rules for each flashcard:
- front_question: Must be a clear question or fill-in-the-blank. Never a statement.
- back_answer: Concise, direct answer sourced strictly from the context. No invented information.
- difficulty: "Easy" (basic recall), "Medium" (understanding required), "Hard" (analysis/application needed).
- topic_tag: Short 2-5 word label describing the concept topic.

IMPORTANT: Focus on:
- Key definitions and terminology
- Core formulas and equations
- Fundamental principles and laws
- Critical processes and steps
- Important distinctions and comparisons

Output ONLY valid JSON — no markdown fences, no extra text:
{{
  "flashcards": [
    {{
      "topic_tag": "<string>",
      "difficulty": "Easy|Medium|Hard",
      "front_question": "<string>",
      "back_answer": "<string>"
    }}
  ]
}}

Study Material Context:
---
{context}
---

Generate {count} high-value flashcards now. Output JSON only."""

    def __init__(self):
        pass

    def generate_flashcards(self, context: str, count: int = 8) -> list:
        """
        Takes RAG-retrieved context and returns a validated list of flashcard dicts.
        Uses llm_service._generate_gemini_robust for reliable generation.
        """
        from app.services.llm_service import llm_service

        prompt = self.FLASHCARD_PROMPT.format(context=context, count=count)

        try:
            # Use the robust Gemini generator (handles model fallbacks)
            parsed = llm_service._generate_gemini_robust(prompt)

            cards = parsed.get("flashcards", [])

            if not cards:
                raise ValueError("LLM returned empty flashcards list")

            # Sanitize + assign fresh UUIDs
            result = []
            for card in cards:
                q = card.get("front_question", "").strip()
                a = card.get("back_answer", "").strip()
                if not q or not a:
                    continue  # Skip malformed cards
                result.append({
                    "id": str(uuid.uuid4()),
                    "topic_tag": card.get("topic_tag", "General").strip(),
                    "difficulty": card.get("difficulty", "Medium"),
                    "front_question": q,
                    "back_answer": a,
                    "known": False,
                    "review": False,
                })

            print(f"[FlashcardService] Generated {len(result)} flashcards from {len(context)} chars of context.")
            return result

        except Exception as e:
            print(f"[FlashcardService] Generation failed: {e}")
            raise RuntimeError(f"Flashcard generation failed: {e}")


flashcard_service = FlashcardService()
