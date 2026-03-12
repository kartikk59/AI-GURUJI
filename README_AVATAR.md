# Avatar & Lip-Sync Setup

To enable the AI Teacher Avatar, you need to set up **Wav2Lip**.

## 1. Clone Wav2Lip
Execute this inside the `backend/` directory:
```bash
git clone https://github.com/Rudrabha/Wav2Lip.git
```

## 2. Download Model Weights
1.  Download `wav2lip_gan.pth` (High Quality).
2.  Place it in: `backend/data/weights/wav2lip_gan.pth`.

## 3. Add Base Avatar
1.  Find/Record a video of a teacher looking at the camera (quiet, minimal movement).
2.  Name it `teacher_base.mp4`.
3.  Place it in: `backend/data/avatar/teacher_base.mp4`.

## 4. Install Dependencies
Wav2Lip requires specific libraries. Ensure `librosa`, `opencv-python`, and `torch` are installed (already in `requirements.txt`).
You might need `ffmpeg` installed on your system path.
