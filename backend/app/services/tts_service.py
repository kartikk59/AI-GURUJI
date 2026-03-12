# pyre-ignore-all-errors
import os
import contextlib
import wave
import math
import uuid
from typing import Any

class TTSService:
    def __init__(self):
        self.output_dir = os.path.join(os.getcwd(), "data", "outputs", "audio")
        os.makedirs(self.output_dir, exist_ok=True)
        self.tts: Any = None
        self.device = "cpu"
        self.model_name = "tts_models/en/ljspeech/glow-tts"

    def generate_audio(self, text: str, output_filename: str) -> tuple[str, float]:
        """
        Generates audio Robustly using Multi-Provider Strategy (Cascade):
        1. Edge TTS (Microsoft Neural - Best Free Quality)
        2. Coqui TTS (Local Fallback)
        3. gTTS (Google Cloud Fallback)
        4. Silent/Mock (Ultimate failsafe)
        """
        # Ensure filename ends in mp3
        if not output_filename.endswith(".mp3"):
            output_filename = output_filename.rsplit('.', 1)[0] + ".mp3"
            
        file_path = os.path.join(self.output_dir, output_filename)
        
        # --- ATTEMPT 1: Edge TTS (High Quality, Online) ---
        try:
            # print(f"🎙️ Generating with Edge TTS for {output_filename}...")
            import subprocess
            import sys
            voice = "en-US-JennyNeural" 
            
            cmd = [sys.executable, "-m", "edge_tts", "--text", text, "--write-media", file_path, "--voice", voice]
            
            # Run blocking
            subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            
            if os.path.exists(file_path) and os.path.getsize(file_path) > 0:
                 print(f"✅ [Slide TTS] Generated with EdgeTTS (Microsoft Neural): {output_filename}")
                 return self._get_mp3_duration(file_path)
            else:
                 raise Exception("File not created by edge-tts")
                 
        except Exception as e:
            print(f"⚠️ [Slide TTS] Edge TTS Failed: {e}. Switching to Coqui...")

        # --- ATTEMPT 2: Coqui TTS ---
        try:
            if not self.tts:
                # pyre-ignore[21]
                import torch
                # pyre-ignore[21]
                from TTS.api import TTS
                self.device = "cuda" if torch.cuda.is_available() else "cpu"
                print(f"Initializing Coqui TTS on {self.device} (Lazy Load)...")
                self.tts = TTS(self.model_name).to(self.device)
                print("✅ Coqui TTS Initialized (Backup).")

            # Coqui usually outputs wav by default
            wav_path = file_path.replace(".mp3", ".wav")
            self.tts.tts_to_file(text=text, file_path=wav_path)
            
            # Convert to MP3
            # pyre-ignore[21]
            from pydub import AudioSegment
            sound = AudioSegment.from_wav(wav_path)
            sound.export(file_path, format="mp3")
            
            if os.path.exists(wav_path):
                os.remove(wav_path)
                
            print(f"✅ Generated with Coqui TTS: {output_filename}")
            return self._get_mp3_duration(file_path)
        except Exception as e:
            print(f"⚠️ Coqui TTS Failed: {e}. Switching to gTTS...")
        
        # --- ATTEMPT 3: gTTS (Google TTS) ---
        try:
            # pyre-ignore[21]
            from gtts import gTTS
            tts = gTTS(text=text, lang='en')
            tts.save(file_path) 
            print(f"✅ Generated with gTTS: {output_filename}")
            return self._get_mp3_duration(file_path)

        except Exception as e:
            print(f"⚠️ gTTS Failed: {e}. Switching to Silent Mode...")

        # --- ATTEMPT 4: Silent Fallback ---
        print(f"🔇 Using Silent Fallback for {output_filename}")
        word_count = len(text.split())
        approx_duration = max(2.0, word_count / 2.5) 
        self._create_silent_mp3(file_path, duration_sec=approx_duration)
        return file_path, approx_duration
        
    def _get_mp3_duration(self, file_path: str) -> tuple[str, float]:
        # pyre-ignore[21]
        from pydub import AudioSegment
        audio = AudioSegment.from_mp3(file_path)
        return file_path, len(audio) / 1000.0

    def _create_silent_mp3(self, file_path: str, duration_sec: float):
        # pyre-ignore[21]
        from pydub import AudioSegment
        silence = AudioSegment.silent(duration=int(duration_sec * 1000))
        silence.export(file_path, format="mp3")

    def _get_wav_duration(self, file_path: str) -> tuple[str, float]:
        """Helper to measure WAV duration."""
        try:
            with contextlib.closing(wave.open(file_path, 'r')) as f:
                frames = f.getnframes()
                rate = f.getframerate()
                duration = frames / float(rate)
            return file_path, duration
        except Exception as e:
            print(f"⚠️ Failed to reading wav duration: {e}")
            return file_path, 5.0

    def _create_silent_wav(self, file_path, duration_sec=1.0, sample_rate=22050):
        """Creates a silent wav file of given duration."""
        n_frames = int(sample_rate * duration_sec)
        data = b'\x00\x00' * n_frames
        try:
            with wave.open(file_path, 'w') as f:
                f.setnchannels(1)
                f.setsampwidth(2)
                f.setframerate(sample_rate)
                f.writeframes(data)
        except Exception as e:
            print(f"Failed to create silent wav: {e}")

    def generate_podcast_audio(self, dialogue: list, final_filename: str) -> tuple[str, float, list]:
        """
        Takes a list of dicts: [{"speaker": "ZIVA", "text": "..."}] 
        Generates individual TTS using Edge TTS, stitches them, and measures timings.
        """
        # pyre-ignore[21]
        from pydub import AudioSegment
        import subprocess
        import sys
        
        # Ensure it ends in mp3
        if not final_filename.endswith(".mp3"):
            final_filename = final_filename.rsplit('.', 1)[0] + ".mp3"
            
        final_path = os.path.join(self.output_dir, final_filename)
        
        # Temp directory for individual chunks
        temp_dir = os.path.join(self.output_dir, "temp_podcast")
        os.makedirs(temp_dir, exist_ok=True)
        
        combined_audio = AudioSegment.empty()
        timings = []
        current_time_ms = 0.0
        
        print(f"🎙️ Generating Podcast Audio ({len(dialogue)} turns) using Edge TTS...")
        
        for idx, turn in enumerate(dialogue):
            speaker = turn.get("speaker", "ZIVA").upper()
            text = turn.get("text", "")
            if not text.strip():
                continue
                
            # Choose voice based on speaker (both female but different)
            voice = "en-US-JennyNeural" if speaker == "ZIVA" else "en-US-AriaNeural"
            
            # Generate TTS segment via Edge TTS
            # pyre-ignore[16]
            segment_filename = f"temp_{uuid.uuid4().hex[:8]}.mp3"
            mp3_path = os.path.join(temp_dir, segment_filename)
            
            try:
                cmd = [sys.executable, "-m", "edge_tts", "--text", text, "--write-media", mp3_path, "--voice", voice]
                subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                
                if os.path.exists(mp3_path) and os.path.getsize(mp3_path) > 0:
                    # pyre-ignore[16]
                    segment_audio = AudioSegment.from_mp3(mp3_path)
                    
                    # Store timing
                    duration_ms = float(len(segment_audio))
                    # pyre-ignore[58]
                    start_sec = current_time_ms / 1000.0
                    # pyre-ignore[58]
                    end_sec = (current_time_ms + duration_ms) / 1000.0
                    
                    timings.append({
                        "speaker": speaker,
                        "start": start_sec,
                        "end": end_sec,
                        "text": text
                    })
                    
                    # pyre-ignore[16]
                    pause = AudioSegment.silent(duration=300)
                    # pyre-ignore[58]
                    combined_audio += segment_audio + pause
                    # pyre-ignore[58]
                    current_time_ms += duration_ms + 300
                    
                else:
                    print(f"⚠️ segment creation missing for {speaker}: {text[:20]}")
            except Exception as e:
                print(f"⚠️ Edge TTS failed for podcast turn {idx}: {e}")
                
            # Cleanup temp mp3
            if os.path.exists(mp3_path):
                try:
                    os.remove(mp3_path)
                except:
                    pass
                
        # Export final audio
        if len(combined_audio) > 0:
            # pyre-ignore[16]
            combined_audio.export(final_path, format="mp3")
            total_duration_sec = len(combined_audio) / 1000.0
            print(f"✅ Generated Podcast Audio: {final_path} ({total_duration_sec}s)")
            return final_path, total_duration_sec, timings
        else:
            raise Exception("No audio generated successfully for the podcast.")

tts_service = TTSService()
