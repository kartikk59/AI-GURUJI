import re
import asyncio
import os
import concurrent.futures
import subprocess
from typing import List, Dict

class OrchestratorService:
    def parse_llm_output(self, llm_data: dict) -> List[Dict]:
        """
        Parses JSON output from LLM Service.
        """
        scenes = []
        try:
            # Ensure we have a list of slides
            slides = llm_data.get("slides", [])
            
            for i, slide in enumerate(slides):
                scene_id = i + 1
                heading = slide.get("heading", f"Slide {scene_id}")
                summary = slide.get("summary", "")
                
                # Handle points (list or string)
                points_raw = slide.get("important_points", [])
                if isinstance(points_raw, str):
                    points = [points_raw]
                else:
                    points = points_raw
                
                script = slide.get("script", "")
                code = slide.get("code", "")
                
                scenes.append({
                    "scene_id": scene_id,
                    "heading": heading,
                    "summary": summary,
                    "important_points": points,
                    "script": script,
                    "code": code
                })
            
            if not scenes:
                print("⚠️ No slides found in LLM data.")
                
            return scenes
            
        except Exception as e:
            print(f"Error parsing LLM JSON: {e}")
            return []

    async def execute_pipeline(self, 
                               llm_data: dict, 
                               slide_service, 
                               tts_service, 
                               avatar_service) -> Dict:
        
        scenes = self.parse_llm_output(llm_data)
        
        # Extract title from JSON
        lecture_title = llm_data.get("lecture_title", "AI_Guruji_Lecture").replace(" ", "_")

        # 1. Generate PPTX (For Download)
        print("Step 1: Generating PPTX...")
        pptx_path = ""
        try:
             pptx_path = slide_service.generate_presentation(lecture_title, scenes)
        except Exception as e:
             print(f"PPTX Generation failed: {e}")

        # 2. Process Scenes
        print("Step 2: Processing Scenes (Audio/Video)...")
        loop = asyncio.get_running_loop()
        final_segments = []
        
        with concurrent.futures.ThreadPoolExecutor() as pool:
            for scene in scenes:
                print(f"Processing Scene {scene['scene_id']}...")
                
                # A. Generate Slide Image
                slide_img = await loop.run_in_executor(pool, slide_service.generate_slide_image, scene, scene['scene_id'])
                
                # B. Generate TTS
                audio_filename = f"scene_{scene['scene_id']}.wav"
                try:
                    audio_path, duration = await loop.run_in_executor(
                        pool, tts_service.generate_audio, scene["script"], audio_filename
                    )
                except Exception as e:
                    import traceback
                    traceback.print_exc()
                    print(f"Skipping Scene {scene['scene_id']} due to TTS error: {e}")
                    continue

                # C. Generate Avatar (Eunoic)
                avatar_video = None
                try:
                    avatar_video = await loop.run_in_executor(
                        pool, avatar_service.generate_avatar_video, audio_path
                    )
                except Exception as e:
                    import traceback
                    print(f"Avatar error for Scene {scene['scene_id']} (Safe to ignore if intentional): {e}")
                    # Continue without avatar (Audio + Slide only)

                # D. Composite Scene
                output_segment = os.path.join(os.getcwd(), "data", "outputs", "segments", f"segment_{scene['scene_id']}.mp4")
                os.makedirs(os.path.dirname(output_segment), exist_ok=True)
                
                self._composite_scene(slide_img, avatar_video, audio_path, output_segment)
                if os.path.exists(output_segment):
                    final_segments.append(output_segment)
        
        # 3. Concatenate
        print("Step 3: Assembling Final Video...")
        # ... logic to concat segments using ffmpeg ...
        # For now return segment URLs so frontend can play them sequentially or we concat later
        
        segment_urls = []
        for path in final_segments:
            # path is d:\...\data\outputs\segments\seg.mp4
            # rel path from data/outputs: segments\seg.mp4
            filename = os.path.basename(path)
            segment_urls.append(f"/files/segments/{filename}")

        return {
            "pptx_url": f"/files/slides/{os.path.basename(pptx_path)}" if pptx_path else None,
            "scene_count": len(scenes),
            "segments": segment_urls
        }

    def _composite_scene(self, slide_img, avatar_video, audio_path, output_path):
        """
        Uses ffmpeg to composite Slide (Left) + Avatar (Right).
        """
        try:
            if avatar_video and os.path.exists(avatar_video):
                # SPLIT SCREEN LAYOUT
                # Canvas: 1920x1080
                # Slide: Scaled to fit Left (~1400px width)
                # Avatar: Scaled to fit Right (~520px width)
                # We will place Slide at 0,0 and Avatar at 1400, (centered vertically or bottom aligned)
                
                cmd = [
                    "ffmpeg", "-y",
                    "-i", slide_img, # Input 0
                    "-i", avatar_video, # Input 1
                    "-filter_complex", 
                    # 1. Scale Slide to 1420x800 (keep aspect approx) pad to 1420x1080
                    # 2. Scale Avatar to 500 width
                    # 3. Stack horizontally or overlay? Overlay is easier on a canvas.
                    # Let's simple overlay:
                    # [0:v] is 1920x1080 background (Slide)
                    # We crop slide to left 1420? Or Scale it?
                    # Better: Scale Slide to 1420 width.
                    "[0:v]scale=1420:-1[slide];"
                    "[1:v]scale=500:-1[avatar];"
                    # Create black background 1920x1080
                    "color=c=black:s=1920x1080[bg];"
                    # Overlay Slide on Left
                    "[bg][slide]overlay=0:(H-h)/2[bg2];"
                    # Overlay Avatar on Right
                    "[bg2][avatar]overlay=1420:(H-h)/2[v]",
                    "-map", "[v]",
                    "-map", "1:a", # Use avatar's audio
                    "-c:v", "libx264",
                    "-c:a", "aac",
                    "-shortest", # End when audio ends
                    output_path
                ]
            else:
                # Static Image + Audio (No Avatar)
                cmd = [
                    "ffmpeg", "-y",
                    "-loop", "1",
                    "-i", slide_img,
                    "-i", audio_path,
                    "-c:v", "libx264",
                    "-c:a", "aac",
                    "-tune", "stillimage",
                    "-shortest",
                    output_path
                ]
            
            subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
            
        except Exception as e:
            print(f"Composition failed: {e}")

orchestrator_service = OrchestratorService()
