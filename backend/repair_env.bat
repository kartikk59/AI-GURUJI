@echo off
TITLE AI Guruji Environment Repair

echo ====================================================
echo      AI GURUJI - ENVIRONMENT REPAIR TOOL
echo ====================================================
echo.

echo 1. Upgrading PIP...
python -m pip install --upgrade pip

echo.
echo 2. Installing Core Dependencies...
pip install -r requirements.txt --no-cache-dir

echo.
echo 3. Installing Critical Libraries Explicitly...
pip install python-pptx TTS ffmpeg-python Pillow google-generativeai

echo.
echo 4. Verifying FFmpeg...
ffmpeg -version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] FFmpeg is NOT installed or not in PATH.
    echo Please run: winget install Gyan.FFmpeg
) else (
    echo [OK] FFmpeg found.
)

echo.
echo ====================================================
echo REPAIR COMPLETE. TRY RUNNING THE SERVER NOW.
echo ====================================================
pause
