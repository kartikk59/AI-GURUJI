import os
import subprocess
import shutil

class AvatarService:
    def __init__(self):
        self.output_dir = os.path.join(os.getcwd(), "data", "outputs", "avatar")
        # Standard path if cloned into backend/Eunoic
        self.eunoic_path = os.path.join(os.getcwd(), "Eunoic") 
        os.makedirs(self.output_dir, exist_ok=True)

    def check_eunoic(self) -> bool:
        """Checks if Eunoic repository is present."""
        if os.path.exists(self.eunoic_path) and os.path.isdir(self.eunoic_path):
            return True
        return False

    def generate_avatar_video(self, audio_path: str, slide_image_path: str = None) -> str:
        """
        Generates avatar video using Eunoic.
        
        Args:
            audio_path: Path to the TTS audio file.
            slide_image_path: Optional path to slide image (not used by Eunoic directly usually, 
                              but maybe for composition later if Eunoic supports it).
                              
        Returns:
            Path to the generated video file.
        """
        if not self.check_eunoic():
             print(f"CRITICAL: Eunoic repository not found at {self.eunoic_path}.")
             # Try one level up?
             parent = os.path.dirname(os.getcwd())
             alt_path = os.path.join(parent, "Eunoic")
             if os.path.exists(alt_path):
                 self.eunoic_path = alt_path
             else:
                 raise RuntimeError("Avatar Service Error: Eunoic repository is missing. Please clone https://github.com/Snepard/Eunoic.git into backend/Eunoic.")
        
        # Determine inference script
        inference_script = os.path.join(self.eunoic_path, "inference.py")
        if not os.path.exists(inference_script):
             # Try run.py as fallback
             inference_script = os.path.join(self.eunoic_path, "run.py")
             if not os.path.exists(inference_script):
                 print(f"⚠️ Eunoic 'inference.py' NOT found in {self.eunoic_path}.")
                 print("ℹ️ It seems 'Snepard/Eunoic' is a Web App, not a command-line Video Generator.")
                 print("➡️ Skipping Avatar Generation (Fallback to Slides Only).")
                 return None 

        voice_name = os.path.basename(audio_path).split('.')[0]
        output_filename = f"avatar_{voice_name}.mp4"
        output_path = os.path.join(self.output_dir, output_filename)
        
        # Base avatar video (the 'teacher') - Optional check
        base_video_path = os.path.join(os.getcwd(), "data", "avatar", "teacher_base.mp4")
        
        # Construct Eunoic command
        cmd = [
            "python", inference_script,
            "--audio", audio_path,
            "--output", output_path,
        ]
        
        if os.path.exists(base_video_path):
            cmd.extend(["--source_video", base_video_path]) 

        print(f"Running Eunoic Avatar Generation: {' '.join(cmd)}")
        
        try:
            # Run in the Eunoic directory to avoid path issues
            subprocess.run(cmd, check=True, cwd=self.eunoic_path)
            
            if not os.path.exists(output_path):
                 print("⚠️ Eunoic ran but generated no output file.")
                 return None
                 
            return output_path
            
        except subprocess.CalledProcessError as e:
            print(f"❌ Eunoic Execution Failed: {e}")
            return None # Fallback safely


avatar_service = AvatarService()
