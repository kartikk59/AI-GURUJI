import React, { Suspense, useRef, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import { Ziva } from './Ziva';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { Loader, Play, Pause, SkipForward, SkipBack, Mic2, Presentation } from 'lucide-react';
import { Zyro } from './Zyro';
import Plasma from './Plasma';
import DotGrid from './DotGrid';
import Particles from './Particles';
import TextType from './TextType';

function Show() {
    const { lectureId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    // State
    const [lectureData, setLectureData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [playTick, setPlayTick] = useState(0); // Triggers re-renders/updates for Ziva
    
    // Podcast States
    const [isPodcastMode, setIsPodcastMode] = useState(location.state?.initialMode === 'podcast' || false);
    const [podcastData, setPodcastData] = useState({}); // { slideIndex: podcastResponseData }
    const [isGeneratingPodcast, setIsGeneratingPodcast] = useState(false);
    const [activeSpeaker, setActiveSpeaker] = useState("ZIVA");
    const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
    const [isSpeedOpen, setIsSpeedOpen] = useState(false);
    const [progress, setProgress] = useState(0);

    // Refs
    const audioRef = useRef(new Audio());
    if (audioRef.current) {
        audioRef.current.crossOrigin = "anonymous";
    }

    // 1. Fetch Lecture Data
    useEffect(() => {
        const fetchLecture = async () => {
            if (!lectureId) return;
            try {
                const response = await axios.get(`http://127.0.0.1:8000/api/lecture/${lectureId}`);
                if (response.data) {
                    setLectureData(response.data);
                    setLoading(false);
                }
            } catch (err) {
                console.error("Failed to fetch lecture:", err);
                alert("Lecture data not found.");
                navigate('/upload');
            }
        };
        fetchLecture();

        // Cleanup audio on unmount
        return () => {
            audioRef.current.pause();
            audioRef.current.src = "";
        };
    }, [lectureId, navigate]);

    // Derived State
    const slides = lectureData?.slides || [];
    const currentSlide = slides[currentSlideIndex];

    // 2. Audio & Auto-Advance Logic
    useEffect(() => {
        if (!currentSlide) return;

        const handleAudioEnd = () => {
            if (isPodcastMode) {
                // If podcast ended, stay or auto advance if you prefer
                setIsPlaying(false);
            } else {
                if (currentSlideIndex < slides.length - 1) {
                    // Auto Advance
                    setCurrentSlideIndex(prev => prev + 1);
                } else {
                    // End of Lecture
                    setIsPlaying(false);
                }
            }
        };

        const setupAudio = async () => {
            let audioUrl = currentSlide.audio_url
                ? `http://127.0.0.1:8000${currentSlide.audio_url}`
                : '/sample.mp3';

            if (isPodcastMode) {
                const pData = podcastData[currentSlideIndex];
                if (pData?.audio_url) {
                    audioUrl = `http://127.0.0.1:8000${pData.audio_url}`;
                }
            }

            if (audioUrl) {
                console.log("▶️ Playing Audio:", audioUrl);
                audioRef.current.src = audioUrl;
                audioRef.current.addEventListener('ended', handleAudioEnd);

                // If it was already playing, start the new track immediately
                if (isPlaying) {
                    audioRef.current.playbackRate = playbackSpeed;
                    try {
                        const playPromise = audioRef.current.play();
                        if (playPromise !== undefined) {
                            playPromise.then(() => {
                                setPlayTick(t => t + 1); // Notify Avatar
                            }).catch(e => {
                                console.error("Autoplay blocked or failed:", e);
                                setIsPlaying(false);
                            });
                        }
                    } catch (e) {
                        console.error("Audio setup error:", e);
                    }
                }
            }
        };

        setupAudio();

        return () => {
            audioRef.current.removeEventListener('ended', handleAudioEnd);
            audioRef.current.pause();
        };

    }, [currentSlide, currentSlideIndex, slides.length, isPodcastMode, podcastData]);

    // Active Speaker Sync & Audio Progress Loop
    const transcriptRef = useRef(null);

    // Sync transcript scroll position cleanly when progress is scrubbed manually or during playback
    useEffect(() => {
        if (!transcriptRef.current) return;
        
        const el = transcriptRef.current;
        const scrollableDistance = el.scrollHeight - el.clientHeight;
        
        if (scrollableDistance > 0 && isPlaying) {
            // Apply progress percentage directly to scroll position continuously 
            // Also prevents overriding if it's paused allowing the user to read 
            el.scrollTop = (progress / 100) * scrollableDistance;
        }
    }, [progress, isPlaying]);

    useEffect(() => {
        if (!isPlaying) return;
        
        const interval = setInterval(() => {
            if (!audioRef.current) return;
            const currentTime = audioRef.current.currentTime;
            const duration = (!audioRef.current.duration || isNaN(audioRef.current.duration)) ? 1 : audioRef.current.duration;
            const currentProgress = (currentTime / duration) * 100;
            setProgress(currentProgress);

            // Frame-accurate auto scroll (runs at 100ms interval) guaranteeing fluid visuals
            if (transcriptRef.current && isPlaying) {
                const el = transcriptRef.current;
                const scrollableDistance = el.scrollHeight - el.clientHeight;
                if (scrollableDistance > 0) {
                    el.scrollTop = (currentProgress / 100) * scrollableDistance;
                }
            }

            if (isPodcastMode) {
                const pData = podcastData[currentSlideIndex];
                if (pData && pData.timings) {
                    const currentTiming = pData.timings.find(t => currentTime >= t.start && currentTime <= t.end);
                    if (currentTiming) {
                        setActiveSpeaker(currentTiming.speaker.toUpperCase());
                    }
                }
            }
        }, 100);

        return () => clearInterval(interval);
    }, [isPodcastMode, isPlaying, podcastData, currentSlideIndex]);

    // Handle Play/Pause toggle in current slide
    useEffect(() => {
        if (isPlaying) {
            audioRef.current.play().catch(e => console.log("Play interrupted", e));
        } else {
            audioRef.current.pause();
        }
    }, [isPlaying]);

    const handleNext = () => {
        if (currentSlideIndex < slides.length - 1) {
            setCurrentSlideIndex(prev => prev + 1);
            setIsPlaying(true); // Keep playing
        }
    };

    const handlePrev = () => {
        if (currentSlideIndex > 0) {
            setCurrentSlideIndex(prev => prev - 1);
            setIsPlaying(true);
        }
    };

    const togglePodcastMode = async () => {
        const newMode = !isPodcastMode;
        
        // Pause current audio safely
        setIsPlaying(false);
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            setProgress(0);
        }

        if (newMode && !podcastData[currentSlideIndex]) {
            // Need to generate podcast
            setIsGeneratingPodcast(true);
            try {
                const content = currentSlide.summary + " " + (currentSlide.important_points?.join(" ") || "") + " " + currentSlide.script;
                const response = await axios.post("http://127.0.0.1:8000/api/generate-podcast", {
                    slide_content: content
                });
                setPodcastData(prev => ({
                    ...prev,
                    [currentSlideIndex]: response.data
                }));
            } catch (err) {
                console.error("Failed to generate podcast", err);
                alert("Failed to generate podcast for this slide.");
                setIsGeneratingPodcast(false);
                return;
            }
            setIsGeneratingPodcast(false);
        }
        
        setIsPodcastMode(newMode);
        // Slight delay to let useEffect re-bind the new audio blob before playing
        setTimeout(() => setIsPlaying(true), 300);
    };

    const [isStarted, setIsStarted] = useState(false);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
                <Loader className="w-10 h-10 animate-spin text-blue-500 mb-4" />
                <span className="text-xl ml-4 font-semibold">Loading Lecture Room...</span>
            </div>
        );
    }

    if (!isStarted) {
        return (
            <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white p-8 text-center relative overflow-hidden">
                <div className="absolute inset-0 z-0 pointer-events-auto">
                    <Particles
                        particleColors={["#ffffff"]}
                        particleCount={200}
                        particleSpread={10}
                        speed={0.1}
                        particleBaseSize={100}
                        moveParticlesOnHover={false}
                        alphaParticles={false}
                        disableRotation={false}
                        pixelRatio={1}
                    />
                </div>
                <div className="relative z-10 flex flex-col items-center">
                    <TextType
                        as="h1"
                        text={lectureData?.lecture_title || "Lecture Ready"}
                        typingSpeed={75}
                        pauseDuration={5000}
                        showCursor
                        cursorCharacter="_"
                        className="text-6xl font-normal tracking-wide mb-6 text-purple-400 drop-shadow-[0_2px_10px_rgba(192,132,252,0.4)]"
                        style={{ fontFamily: '"Wendy One", sans-serif' }}
                    />
                    <p className="text-xl text-slate-400 mb-12 max-w-2xl">
                        Your AI teacher is ready. Click below to enter the classroom and start the session.
                    </p>
                    <button
                    onClick={async () => {
                        setIsStarted(true);
                        if (isPodcastMode && !podcastData[0] && slides[0]) {
                            setIsGeneratingPodcast(true);
                            try {
                                const content = slides[0].summary + " " + (slides[0].important_points?.join(" ") || "") + " " + slides[0].script;
                                const response = await axios.post("http://127.0.0.1:8000/api/generate-podcast", {
                                    slide_content: content
                                });
                                setPodcastData(prev => ({
                                    ...prev,
                                    [0]: response.data
                                }));
                            } catch (err) {
                                console.error("Failed to generate podcast", err);
                            }
                            setIsGeneratingPodcast(false);
                        }
                        setTimeout(() => setIsPlaying(true), 300);
                    }}
                    className="group relative px-8 py-4 bg-purple-500 border-[3px] border-purple-700 hover:bg-purple-400 hover:border-purple-600 text-white rounded-full text-xl font-bold transition-all hover:scale-105 shadow-[0_0_80px_rgba(168,85,247,0.6)] flex items-center gap-3"
                >
                    <Play className="w-6 h-6 fill-current" />
                    Start Class
                </button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#111116] p-6 overflow-hidden flex flex-col font-sans relative">
            
            {/* Interactive Plasma Background */}
            <div className="absolute inset-0 z-0 pointer-events-auto">
                <Plasma 
                    color="#9B64FA"
                    speed={0.6}
                    direction="forward"
                    scale={1.1}
                    opacity={0.8}
                    mouseInteractive={true}
                />
            </div>

            {/* Content Wrapper (Needs z-index to sit above background) */}
            <div className="relative z-10 flex flex-col h-full w-full flex-1">
                
                {/* Header / Nav */}
                <div className="flex items-center justify-between z-50 mb-4 h-10 w-full shrink-0">
                <button
                    onClick={() => navigate('/upload')}
                    className="px-4 py-1.5 bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-md rounded-md text-white font-medium transition-all flex items-center gap-2 text-sm"
                >
                    Exit Class
                </button>
            </div>

            <div className="flex-1 flex gap-6 h-[calc(100vh-104px)] min-h-0">

                {/* LEFT SIDE: Dynamic Slide Presentation OR Podcast Left Column */}
                <div className={`flex flex-col gap-4 transition-all duration-500 flex-[2] max-w-5xl`}>
                    
                    {/* SLIDES MODE VIEWER */}
                    <div className="flex-[0.85] rounded-2xl border border-white/10 bg-white/10 backdrop-blur-md relative shadow-2xl min-h-[65vh] max-h-[65vh] overflow-hidden">
                        
                        {/* Interactive DotGrid Background */}
                        <div className="absolute inset-0 z-0 pointer-events-auto opacity-70">
                            <DotGrid
                                dotSize={5}
                                gap={15}
                                baseColor="#271E37"
                                activeColor="#9B64FA"
                                proximity={120}
                                shockRadius={250}
                                shockStrength={5}
                                resistance={750}
                                returnDuration={1.5}
                            />
                        </div>

                        {/* Slide Content */}
                        <div className="relative z-10 p-8 lg:p-10 pr-12 flex flex-col justify-center h-full overflow-y-auto custom-scrollbar">
                            <div className="flex flex-col pl-4 animate-fade-in" style={{ fontFamily: '"Lilita One", sans-serif' }}>
                            <h2 className="text-[36px] lg:text-[40px] text-white mb-5 leading-tight text-shadow-sm tracking-wide">
                                {currentSlide.heading}
                            </h2>

                            {/* Summary */}
                            {currentSlide.summary && (
                                <p className="text-[16px] text-zinc-200 mb-5 leading-relaxed font-medium">
                                    "{currentSlide.summary}"
                                </p>
                            )}

                            {/* Points */}
                            <div className="space-y-3 ml-6">
                                {Array.isArray(currentSlide.important_points) ? (
                                    currentSlide.important_points.map((point, idx) => (
                                        <div key={idx} className="flex items-start gap-4">
                                            <span className="w-[6px] h-[6px] mt-2.5 rounded-full bg-blue-300 shrink-0 shadow-[0_0_5px_rgba(147,197,253,0.8)]" />
                                            <p className="text-[16px] xl:text-[17px] text-zinc-100 leading-relaxed font-medium">
                                                {point}
                                            </p>
                                        </div>
                                    ))
                                ) : (
                                    <div className="flex items-start gap-4">
                                        <span className="w-[6px] h-[6px] mt-2.5 rounded-full bg-blue-300 shrink-0 shadow-[0_0_5px_rgba(147,197,253,0.8)]" />
                                        <p className="text-[16px] xl:text-[17px] text-zinc-100 leading-relaxed font-medium">
                                            {currentSlide.important_points}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Code Snippet if Any */}
                            {currentSlide.code && (
                                <div className="mt-8 bg-black/40 backdrop-blur-md p-5 rounded-xl overflow-x-auto border border-white/10 shadow-inner">
                                    <pre className="text-sm font-mono text-green-300">
                                        <code>{currentSlide.code}</code>
                                    </pre>
                                </div>
                            )}
                            </div>
                        </div>
                    </div>

                    {/* Controls (Shared) */}
                    <div className="h-[96px] shrink-0 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 flex flex-col justify-center px-8 relative shadow-xl">
                        {/* Progress Bar */}
                        <div 
                            className="w-full h-[6px] bg-black/30 rounded-full mb-5 relative cursor-pointer group"
                            onClick={(e) => {
                                if (audioRef.current && audioRef.current.duration) {
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    const ratio = (e.clientX - rect.left) / rect.width;
                                    audioRef.current.currentTime = ratio * audioRef.current.duration;
                                    setProgress(ratio * 100);
                                }
                            }}
                        >
                            <div 
                                className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-400 to-purple-400 rounded-full point-events-none" 
                                style={{ width: `${progress}%` }}
                            />
                            <div 
                                className="absolute top-1/2 -translate-y-1/2 w-[14px] h-[14px] bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.8)] opacity-0 group-hover:opacity-100 transition-opacity point-events-none" 
                                style={{ left: `calc(${progress}% - 7px)` }}
                            /> 
                        </div>

                        {/* Control Buttons */}
                        <div className="flex justify-between items-center w-full">
                            <button onClick={handlePrev} className="text-white drop-shadow-md hover:text-blue-300 transition flex items-center font-bold gap-1.5 focus:outline-none" disabled={currentSlideIndex === 0}>
                                &lt; Previous
                            </button>

                            <div className="flex items-center gap-6">
                                <button onClick={() => { if(audioRef.current) audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 5); }} title="Rewind 5s" className="w-8 h-8 rounded-full border border-white/40 flex items-center justify-center bg-black/20 hover:bg-white/20 text-white text-xs font-medium transition-colors focus:outline-none backdrop-blur-sm tracking-tighter">
                                    -5
                                </button>
                                
                                <button
                                    onClick={() => setIsPlaying(!isPlaying)}
                                    className="w-[48px] h-[48px] rounded-full flex items-center justify-center border-2 border-white/50 bg-white/20 text-white hover:scale-105 transition-transform focus:outline-none backdrop-blur-md shadow-[0_0_15px_rgba(255,255,255,0.2)]"
                                >
                                    {isPlaying ? (
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                                    ) : (
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="translate-x-0.5"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                                    )}
                                </button>

                                <button onClick={() => { if(audioRef.current) audioRef.current.currentTime = Math.min(audioRef.current.duration, audioRef.current.currentTime + 5); }} title="Forward 5s" className="w-8 h-8 rounded-full border border-white/40 flex items-center justify-center bg-black/20 hover:bg-white/20 text-white text-xs font-medium transition-colors focus:outline-none backdrop-blur-sm tracking-tighter">
                                    +5
                                </button>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="relative flex items-center" onMouseLeave={() => setIsSpeedOpen(false)}>
                                    <button 
                                        onClick={() => setIsSpeedOpen(!isSpeedOpen)}
                                        className="px-2 py-1 bg-black/30 hover:bg-white/10 border border-white/20 rounded-md text-white text-[13px] font-bold transition-colors cursor-pointer focus:outline-none w-[54px] text-center flex justify-center items-center"
                                        title="Playback Speed"
                                    >
                                        {playbackSpeed}x
                                    </button>
                                    
                                    <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-[60px] bg-slate-800 border border-white/20 rounded-md shadow-xl overflow-hidden transition-all duration-300 ease-out origin-bottom flex flex-col ${isSpeedOpen ? 'opacity-100 scale-100 pointer-events-auto translate-y-0' : 'opacity-0 scale-95 pointer-events-none translate-y-2'}`}>
                                        {[2, 1.75, 1.5, 1.25, 1].map((speed) => (
                                            <button
                                                key={speed}
                                                onClick={() => {
                                                    setPlaybackSpeed(speed);
                                                    if (audioRef.current) {
                                                        audioRef.current.playbackRate = speed;
                                                    }
                                                    setIsSpeedOpen(false);
                                                }}
                                                className={`py-1.5 text-center text-white text-[13px] font-bold hover:bg-white/20 transition-colors ${playbackSpeed === speed ? 'bg-purple-500/50' : ''}`}
                                            >
                                                {speed}x
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <button onClick={handleNext} className="text-white drop-shadow-md hover:text-blue-300 transition flex items-center font-bold gap-1.5 focus:outline-none" disabled={currentSlideIndex === slides.length - 1}>
                                    Next &gt;
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT SIDE: Avatar (Zyro or Ziva) + Transcript */}
                <div className={`flex flex-col gap-4 transition-all duration-500 flex-[0.8] min-w-[360px]`}>
                    
                    {/* AVATAR BOX (Aspect Video) */}
                    <div className={`w-full aspect-[16/10] bg-white/5 backdrop-blur-lg rounded-2xl border border-white/20 shadow-2xl relative overflow-hidden shrink-0`}>

                        {/* Status Light */}
                        <div className="absolute top-4 right-4 z-10 flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-full border border-white/20 backdrop-blur-md">
                            <span className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.8)] animate-pulse' : 'bg-red-500'}`} />
                            <span className="text-xs font-bold text-white tracking-wider">LIVE</span>
                        </div>

                        <Canvas
                            camera={{ position: [0, 1.2, 3.2], fov: 45 }}
                            style={{ width: '100%', height: '100%' }}
                            shadows
                            className="bg-transparent"
                        >
                            <Suspense fallback={null}>
                                <ambientLight intensity={0.4} />
                                <spotLight position={[5, 10, 5]} angle={0.4} penumbra={1} intensity={1.0} castShadow />
                                <pointLight position={[-5, 5, -5]} intensity={0.3} color="#blue" />

                                <Ziva
                                    position={[0, -2.8, 1.0]}
                                    scale={2.2}
                                    audio={audioRef.current}
                                    playTick={playTick}
                                    isSpeaking={isPlaying}
                                />
                                <Environment preset="city" />
                            </Suspense>
                        </Canvas>
                    </div>

                    {/* Transcript / Subtitle Box */}
                    <div className="flex-1 min-h-0 max-h-[calc(50vh-20px)] bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 flex flex-col gap-4 shadow-xl">
                        <p className="text-white drop-shadow-sm text-[16px] font-bold pb-2 border-b border-white/20 mb-2 shrink-0">
                            Transcript
                        </p>
                        
                        <div ref={transcriptRef} className={`${isPlaying ? 'overflow-y-hidden' : 'overflow-y-auto'} custom-scrollbar pr-2 flex-1 min-h-0`}>
                            <p className="text-white text-[16px] leading-[1.8] font-medium drop-shadow-sm">
                                {currentSlide.script}
                            </p>
                        </div>
                    </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Show;
