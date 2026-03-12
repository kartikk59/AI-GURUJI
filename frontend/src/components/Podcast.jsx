import React, { Suspense, useRef, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import { Ziva } from './Ziva';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { Loader, Play, Pause, SkipForward, SkipBack, Mic2, Presentation, MessageSquare, MessageSquareOff } from 'lucide-react';
import { Zyro } from './Zyro';
import Particles from './Particles';
import TextType from './TextType';

function Podcast() {
    const { lectureId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    // State
    const [lectureData, setLectureData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [playTick, setPlayTick] = useState(0); // Triggers re-renders/updates for Ziva
    const [isStarted, setIsStarted] = useState(false);

    // Podcast States
    const [podcastData, setPodcastData] = useState({}); // { slideIndex: podcastResponseData }
    const [isGeneratingPodcast, setIsGeneratingPodcast] = useState(false);
    const [activeSpeaker, setActiveSpeaker] = useState("ZIVA");
    const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
    const [isSpeedOpen, setIsSpeedOpen] = useState(false);
    const [progress, setProgress] = useState(0);
    const [showTranscript, setShowTranscript] = useState(true);

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
            // If podcast ended, stay or auto advance if you prefer
            setIsPlaying(false);
        };

        const setupAudio = async () => {
            let audioUrl = currentSlide.audio_url
                ? `http://127.0.0.1:8000${currentSlide.audio_url}`
                : '/sample.mp3';

            const pData = podcastData[currentSlideIndex];
            if (pData?.audio_url) {
                audioUrl = `http://127.0.0.1:8000${pData.audio_url}`;
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

    }, [currentSlide, currentSlideIndex, slides.length, podcastData]);

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

            const pData = podcastData[currentSlideIndex];
            if (pData && pData.timings) {
                const currentTiming = pData.timings.find(t => currentTime >= t.start && currentTime <= t.end);
                if (currentTiming) {
                    setActiveSpeaker(currentTiming.speaker.toUpperCase());
                }
            }
        }, 100);

        return () => clearInterval(interval);
    }, [isPlaying, podcastData, currentSlideIndex]);

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

    // Auto-generate ALL podcast data upfront
    const hasGeneratedAllRef = useRef(false);
    useEffect(() => {
        if (!slides || slides.length === 0) return;
        if (hasGeneratedAllRef.current || isGeneratingPodcast) return;

        const generateAll = async () => {
            setIsGeneratingPodcast(true);
            hasGeneratedAllRef.current = true;
            try {
                let newData = { ...podcastData };
                for (let i = 0; i < slides.length; i++) {
                    if (newData[i]) continue;
                    const slide = slides[i];
                    const content = slide.summary + " " + (slide.important_points?.join(" ") || "") + " " + slide.script;
                    const response = await axios.post("http://127.0.0.1:8000/api/generate-podcast", {
                        slide_content: content
                    });
                    newData = { ...newData, [i]: response.data };
                    // Set it progressively so UI is aware of background progress if needed
                    setPodcastData(newData);
                }
            } catch (err) {
                console.error("Failed to generate whole podcast", err);
            } finally {
                setIsGeneratingPodcast(false);
            }
        };

        generateAll();
    }, [slides]);
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
                    {isGeneratingPodcast || Object.keys(podcastData).length < slides.length ? (
                        <div className="flex flex-col items-center gap-5 my-4">
                            <Loader className="w-12 h-12 animate-spin text-purple-400 drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]" />
                            <p className="text-xl text-purple-400 font-semibold animate-pulse tracking-wide">
                                Podcast is under generation, it may take 3-5 mints
                            </p>
                            <p className="text-sm text-purple-400/60">
                                ({Object.keys(podcastData).length}/{slides.length} slides generated)
                            </p>
                        </div>
                    ) : (
                        <button
                            onClick={async () => {
                                setIsStarted(true);
                                setTimeout(() => setIsPlaying(true), 300);
                            }}
                            className="group relative px-8 py-4 bg-purple-500 border-[3px] border-purple-700 hover:bg-purple-400 hover:border-purple-600 text-white rounded-full text-xl font-bold transition-all hover:scale-105 shadow-[0_0_80px_rgba(168,85,247,0.6)] flex items-center gap-3"
                        >
                            <Play className="w-6 h-6 fill-current" />
                            Start Class
                        </button>
                    )}
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#111116] p-6 overflow-hidden flex flex-col font-sans">
            {/* Header / Nav */}
            <div className="flex items-center justify-between z-50 mb-4 h-10 w-full shrink-0">
                <button
                    onClick={() => navigate('/upload')}
                    className="px-4 py-1.5 border border-[#C15C77]/50 bg-[#C15C77]/10 hover:bg-[#C15C77]/20 rounded-md text-[#C15C77] font-medium transition-all flex items-center gap-2 text-sm"
                >
                    Exit Class
                </button>

                <div className="bg-black/40 px-4 py-1.5 rounded-xl flex items-center gap-2 border border-white/10 shadow-lg">
                    {isGeneratingPodcast && <Loader className="w-4 h-4 animate-spin text-purple-400" />}
                    <span className="text-sm font-bold text-white/90">
                        {isGeneratingPodcast ? 'Generating Audio...' : 'Podcast Mode'}
                    </span>
                </div>
            </div>

            {/* PODCAST UI: Full Page Cinematic View */}
            <div className="flex-1 relative rounded-2xl overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.8)] border border-white/10 h-[calc(100vh-104px)] min-h-0 flex items-center justify-center bg-[#0a0a0f]">
                {/* Background Layer */}
                <div
                    className="absolute inset-0 z-0 bg-cover bg-center opacity-80"
                    style={{ backgroundImage: "url('/podcast_bg.png')" }}
                />

                {/* 3D Canvas Layer with Models */}
                <div className="absolute inset-0 z-0">
                    <Canvas
                        camera={{ position: [0, 1.2, 3.2], fov: 45 }}
                        style={{ width: '100%', height: '100%' }}
                        shadows
                    >
                        <Suspense fallback={null}>
                            <ambientLight intensity={0.4} />
                            <spotLight position={[5, 10, 5]} angle={0.4} penumbra={1} intensity={0.8} castShadow />
                            <pointLight position={[-5, 5, -5]} intensity={0.3} color="#b19cd9" />

                            {/* Avatar Left (Ziva) */}
                            <Ziva
                                position={[-1.2, -2.5, 0]}
                                rotation={[0, 0.15, 0]}
                                scale={1.8}
                                audio={audioRef.current}
                                playTick={playTick}
                                isSpeaking={activeSpeaker === 'ZIVA' && isPlaying}
                            />

                            {/* Avatar Right (Zyro) */}
                            <Zyro
                                position={[1.2, -2.5, 0]}
                                rotation={[0, -0.15, 0]}
                                scale={1.8}
                                audio={audioRef.current}
                                playTick={playTick}
                                isSpeaking={activeSpeaker === 'ZYRO' && isPlaying}
                            />
                            <Environment preset="city" />
                        </Suspense>
                    </Canvas>
                </div>

                {/* HUD Layer (Overlays) */}
                <div className="absolute inset-0 z-10 pointer-events-none flex flex-col justify-between p-8">

                    {/* Top: Badges */}
                    <div className="flex justify-between items-start pointer-events-auto w-full">
                        <div className="flex gap-4">
                            <div className="bg-black/40 backdrop-blur-md border border-white/10 px-5 py-2.5 rounded-full flex items-center gap-3 shadow-lg">
                                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-[pulse_2s_cubic-bezier(0.4,0,0.6,1)_infinite] shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                                <span className="text-white/90 text-[13px] font-black tracking-[0.2em]">LIVE PODCAST</span>
                            </div>

                            <div className={`backdrop-blur-xl border px-6 py-2.5 rounded-full transition-all duration-500 ${activeSpeaker === 'ZIVA'
                                    ? 'bg-[#3b2b5c]/70 border-[#9581c7] shadow-[0_0_30px_rgba(149,129,199,0.4)]'
                                    : 'bg-[#4e3b6e]/70 border-[#b69aed] shadow-[0_0_30px_rgba(182,154,237,0.4)]'
                                }`}>
                                <span className="text-white text-sm font-bold tracking-widest flex items-center gap-2">
                                    <Mic2 className="w-4 h-4" />
                                    {activeSpeaker === 'ZIVA' ? 'ZIVA SPEAKING' : 'ZYRO SPEAKING'}
                                </span>
                            </div>
                        </div>

                        {/* Toggle Transcript Button */}
                        <button
                            onClick={() => setShowTranscript(!showTranscript)}
                            className="bg-black/40 hover:bg-black/60 backdrop-blur-md border border-white/10 px-4 py-2.5 rounded-full flex items-center gap-2 shadow-lg text-white/80 hover:text-white transition-all focus:outline-none focus:ring-2 focus:ring-white/20"
                        >
                            {showTranscript ? <MessageSquareOff className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
                            <span className="text-[13px] font-bold tracking-wider">{showTranscript ? 'HIDE TRANSCRIPT' : 'SHOW TRANSCRIPT'}</span>
                        </button>
                    </div>

                    {/* Bottom: Transcript and Controls */}
                    <div className={`flex gap-8 items-end w-full mt-6 h-full pb-2 transition-all duration-500 ${showTranscript ? 'justify-between' : 'justify-center'}`}>

                        {/* Left/Center: Floating Controls Bar */}
                        <div className={`flex-1 flex flex-col justify-end pointer-events-auto transition-all duration-500 ${showTranscript ? 'max-w-2xl translate-x-[4%]' : 'max-w-3xl'}`}>
                            <div className="bg-[#110f17]/30 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 shadow-[0_20px_60px_rgba(0,0,0,0.5)] transition-transform hover:bg-[#110f17]/40">
                                {/* Progress Bar */}
                                <div
                                    className="w-full h-1.5 bg-white/10 rounded-full mb-6 relative cursor-pointer group"
                                    onClick={(e) => {
                                        if (audioRef.current && audioRef.current.duration) {
                                            const rect = e.currentTarget.getBoundingClientRect();
                                            const ratio = (e.clientX - rect.left) / rect.width;
                                            audioRef.current.currentTime = ratio * audioRef.current.duration;
                                            setProgress(ratio * 100);
                                        }
                                    }}
                                >
                                    <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-purple-500 via-pink-400 to-orange-400 rounded-full point-events-none transition-all duration-100" style={{ width: `${progress}%` }} />
                                    <div className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-[0_0_15px_rgba(255,255,255,0.9)] opacity-0 group-hover:opacity-100 transition-opacity point-events-none" style={{ left: `calc(${progress}% - 8px)` }} />
                                </div>

                                {/* Playback Buttons */}
                                <div className="flex justify-between items-center w-full px-2">
                                    <button onClick={handlePrev} className="text-white/60 hover:text-white transition flex items-center font-semibold gap-1.5 focus:outline-none text-sm tracking-wide" disabled={currentSlideIndex === 0}>
                                        <SkipBack className="w-4 h-4" /> Prev Slide
                                    </button>

                                    <div className="flex items-center gap-6">
                                        <button onClick={() => { if (audioRef.current) audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 5); }} title="Rewind 5s" className="w-11 h-11 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/15 text-white/90 hover:text-white transition-all focus:outline-none backdrop-blur-sm font-semibold tracking-tighter text-sm">
                                            -5s
                                        </button>

                                        <button
                                            onClick={() => setIsPlaying(!isPlaying)}
                                            className="w-16 h-16 rounded-full flex items-center justify-center border-2 border-purple-400/50 bg-purple-500/20 text-white hover:scale-110 transition-transform focus:outline-none backdrop-blur-xl shadow-[0_0_30px_rgba(168,85,247,0.4)]"
                                        >
                                            {isPlaying ? (
                                                <Pause className="w-6 h-6 fill-current" />
                                            ) : (
                                                <Play className="w-7 h-7 fill-current translate-x-0.5" />
                                            )}
                                        </button>

                                        <button onClick={() => { if (audioRef.current) audioRef.current.currentTime = Math.min(audioRef.current.duration, audioRef.current.currentTime + 5); }} title="Forward 5s" className="w-11 h-11 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/15 text-white/90 hover:text-white transition-all focus:outline-none backdrop-blur-sm font-semibold tracking-tighter text-sm">
                                            +5s
                                        </button>
                                    </div>

                                    <div className="flex items-center gap-5">
                                        <div className="relative flex items-center" onMouseLeave={() => setIsSpeedOpen(false)}>
                                            <button
                                                onClick={() => setIsSpeedOpen(!isSpeedOpen)}
                                                className="px-2 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-md text-white/80 hover:text-white text-[13px] font-bold transition-colors cursor-pointer focus:outline-none w-[56px] text-center flex justify-center items-center"
                                                title="Playback Speed"
                                            >
                                                {playbackSpeed}x
                                            </button>

                                            <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-[60px] bg-[#110f17] border border-white/10 rounded-md shadow-xl overflow-hidden transition-all duration-300 ease-out origin-bottom flex flex-col ${isSpeedOpen ? 'opacity-100 scale-100 pointer-events-auto translate-y-0' : 'opacity-0 scale-90 pointer-events-none translate-y-2'}`}>
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
                                                        className={`py-1.5 text-center text-white/80 hover:text-white text-[13px] font-bold hover:bg-white/10 transition-colors ${playbackSpeed === speed ? 'bg-purple-500/30 text-white' : ''}`}
                                                    >
                                                        {speed}x
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <button onClick={handleNext} className="text-white/60 hover:text-white transition flex items-center font-semibold gap-1.5 focus:outline-none text-sm tracking-wide" disabled={currentSlideIndex === slides.length - 1}>
                                            Next Slide <SkipForward className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right: Floating Glass Transcript Panel */}
                        {showTranscript && (
                            <div className="w-[420px] h-[58vh] max-h-[500px] bg-[#110f17]/60 backdrop-blur-3xl border border-white/10 rounded-[32px] p-7 shadow-[0_20px_60px_rgba(0,0,0,0.6)] flex flex-col flex-shrink-0 pointer-events-auto animate-fade-in">
                                <h3 className="text-white/90 text-sm font-bold tracking-[0.15em] mb-5 border-b border-white/10 pb-5 flex items-center gap-3 uppercase">
                                    <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center border border-purple-500/30">
                                        <Presentation className="w-4 h-4 text-purple-300" />
                                    </div>
                                    Live Transcript
                                </h3>
                                <div ref={transcriptRef} className={`flex-1 ${isPlaying ? 'overflow-y-hidden' : 'overflow-y-auto'} custom-scrollbar pr-4 space-y-6`}>
                                    {podcastData[currentSlideIndex]?.dialogue?.map((turn, i) => {
                                        const isSpeakerActive = activeSpeaker === turn.speaker.toUpperCase() && isPlaying;
                                        const isZiva = turn.speaker.toUpperCase() === 'ZIVA';

                                        return (
                                            <div key={i} className={`flex flex-col gap-2 transition-all duration-500 ${!isSpeakerActive ? 'opacity-40 hover:opacity-100' : 'opacity-100 scale-[1.02] transform origin-left'}`}>
                                                <div className="flex items-center gap-2">
                                                    <span className={`w-1.5 h-1.5 rounded-full ${isSpeakerActive ? 'animate-pulse' : 'opacity-0'} ${isZiva ? 'bg-purple-400' : 'bg-pink-400'}`} />
                                                    <span className={`text-[11px] font-black tracking-widest uppercase ${isZiva ? 'text-purple-300' : 'text-pink-300'}`}>
                                                        {turn.speaker}
                                                    </span>
                                                </div>
                                                <p className="text-white/90 text-[15px] leading-relaxed font-light pl-3.5">
                                                    {turn.text}
                                                </p>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            </div>
        </div>
    );
}

export default Podcast;
