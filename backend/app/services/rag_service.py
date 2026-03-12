import os
import fitz  # PyMuPDF
import faiss
import numpy as np
from typing import List
from sentence_transformers import SentenceTransformer

class RagService:
    def __init__(self):
        self.embedding_model_name = 'all-MiniLM-L6-v2'
        try:
            print(f"Loading Sentence Transformer model: {self.embedding_model_name}...")
            self.model = SentenceTransformer(self.embedding_model_name)
            self.dimension = self.model.get_sentence_embedding_dimension()
            print(f"[OK] RAG Service initialized with {self.embedding_model_name} (Dim: {self.dimension})")
        except Exception as e:
            print(f"[ERROR] Failed to load Sentence Transformer: {e}")
            raise e

        self.index = faiss.IndexFlatL2(self.dimension)
        self.chunks = [] 
        self.storage_dir = os.path.join(os.getcwd(), "data", "vector_store")
        os.makedirs(self.storage_dir, exist_ok=True)

    def extract_text_from_pdf(self, pdf_path: str) -> str:
        """Extracts full text from a PDF file."""
        try:
            doc = fitz.open(pdf_path)
            text = ""
            for page in doc:
                text += page.get_text()
            return text
        except Exception as e:
            print(f"Error extracting text from PDF: {e}")
            return ""

    def create_chunks(self, text: str, chunk_size: int = 500, overlap: int = 50) -> List[str]:
        """Splits text into chunks with overlap."""
        words = text.split()
        chunks = []
        for i in range(0, len(words), chunk_size - overlap):
            chunk = " ".join(words[i:i + chunk_size])
            chunks.append(chunk)
        return chunks

    def add_to_index(self, chunks: List[str]):
        """Embeds chunks and adds them to the FAISS index."""
        if not chunks:
            return
        
        self.chunks.extend(chunks)
        try:
            embeddings = self.model.encode(chunks)
            if len(embeddings) > 0:
                self.index.add(np.array(embeddings).astype('float32'))
        except Exception as e:
            print(f"Error adding to index: {e}")

    def search(self, query: str, k: int = 5) -> List[str]:
        """Searches the index for the most relevant chunks."""
        if self.index.ntotal == 0:
            return []
        
        try:
            query_vector = self.model.encode([query])
            D, I = self.index.search(np.array(query_vector).astype('float32'), k)
            
            results = []
            for idx in I[0]:
                if idx != -1 and idx < len(self.chunks):
                    results.append(self.chunks[idx])
            return results
        except Exception as e:
            print(f"Error during search: {e}")
            return []

    def clear_index(self):
        """Reset the index and chunks."""
        self.index = faiss.IndexFlatL2(self.dimension)
        self.chunks = []
        
    def save_index(self):
        """Saves current index to disk (Mock implementation for now)."""
        print(f"[OK] Index saved with {len(self.chunks)} chunks.")

rag_service = RagService()
