import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Maximize2, Volume2, SkipForward, SkipBack } from 'lucide-react';

const Player = ({ scenes }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
    const audioRef = useRef(new Audio());
    const avatarVideoRef = useRef(null);

    const currentScene = scenes && scenes.length > 0 ? scenes[currentSceneIndex] : null;
    const slideSrc = currentScene ? `http://localhost:8000${currentScene.slide_url}` : null;
    const audioSrc = currentScene ? `http://localhost:8000${currentScene.audio_url}` : null;
    const scriptText = currentScene ? currentScene.script : "Loading lecture...";

    // Audio Playback Logic
    useEffect(() => {
        if (audioSrc) {
            audioRef.current.src = audioSrc;
            if (isPlaying) {
                audioRef.current.play();
            }
        }
    }, [currentSceneIndex, audioSrc]);

    // Handle Play/Pause Toggle
    useEffect(() => {
        if (isPlaying) {
            audioRef.current.play().catch(e => console.error("Audio Playback Error:", e));
            if (avatarVideoRef.current) avatarVideoRef.current.play();
        } else {
            audioRef.current.pause();
            if (avatarVideoRef.current) avatarVideoRef.current.pause();
        }
    }, [isPlaying]);

    // Auto-advance scene when audio ends
    useEffect(() => {
        const handleAudioEnd = () => {
            if (currentSceneIndex < scenes.length - 1) {
                setCurrentSceneIndex(prev => prev + 1);
            } else {
                setIsPlaying(false); // End of lecture
            }
        };

        audioRef.current.addEventListener('ended', handleAudioEnd);
        return () => {
            audioRef.current.removeEventListener('ended', handleAudioEnd);
        };
    }, [scenes, currentSceneIndex]);

    const togglePlay = () => setIsPlaying(!isPlaying);

    const nextScene = () => {
        if (currentSceneIndex < scenes.length - 1) setCurrentSceneIndex(prev => prev + 1);
    }

    const prevScene = () => {
        if (currentSceneIndex > 0) setCurrentSceneIndex(prev => prev - 1);
    }

    return (
        <div className="w-full h-full p-6 flex flex-col gap-6">

            {/* Main Stage Area */}
            <div className="flex-1 flex gap-6 min-h-[600px]">

                {/* LEFT: Slide Container (Dominant) */}
                <div className="flex-[3] relative bg-black/40 rounded-2xl border border-white/10 overflow-hidden shadow-2xl backdrop-blur-sm group">
                    {slideSrc ? (
                        <img
                            src={slideSrc}
                            alt="Lecture Slide"
                            className="w-full h-full object-contain p-4"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-500 animate-pulse">
                            Waiting for generated slide...
                        </div>
                    )}

                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-end justify-center pb-4 opacity-0 group-hover:opacity-100">
                        <div className="bg-black/60 backdrop-blur-md px-6 py-2 rounded-full text-white text-sm">
                            Slide {currentSceneIndex + 1} of {scenes?.length || 0}
                        </div>
                    </div>
                </div>

                {/* RIGHT: Avatar Container */}
                <div className="flex-1 flex flex-col gap-4">

                    <div className="relative aspect-[3/4] rounded-2xl overflow-hidden border-2 border-purple-500/30 shadow-[0_0_30px_rgba(168,85,247,0.15)] bg-gradient-to-b from-slate-800 to-slate-900 ring-1 ring-white/10">
                        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-tr from-blue-500/10 to-purple-500/10 z-0"></div>

                        {/* If we had a real avatar video url, we'd use it here. 
                For 'Test Slide+Voice', we just show a static placeholder or loop a generic idle video if available. 
                Since user asked to just test slide+voice, we keep the video element but it might just be black/placeholder if no src.
            */}
                        <div className="w-full h-full flex items-center justify-center z-10 relative">
                            <div className="w-24 h-24 rounded-full bg-slate-700/50 flex items-center justify-center animate-pulse">
                                <span className="text-4xl">👨‍🏫</span>
                            </div>
                            {/* This would be the actual video element if we generated the avatar */}
                            {/* <video ref={avatarVideoRef} ... /> */}
                        </div>

                        <div className="absolute top-4 right-4 z-20 flex items-center gap-2 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full border border-red-500/30">
                            <div className={`w-2 h-2 bg-red-500 rounded-full ${isPlaying ? 'animate-pulse' : ''}`}></div>
                            <span className="text-xs font-semibold text-red-200 uppercase tracking-wider">AI Teacher</span>
                        </div>
                    </div>

                    <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md overflow-y-auto custom-scrollbar">
                        <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-3">Transcript</h3>
                        <p className="text-slate-200 text-lg leading-relaxed font-light">
                            {scriptText}
                        </p>
                    </div>

                </div>
            </div>

            {/* Control Bar */}
            <div className="h-20 bg-white/5 border-t border-white/10 rounded-2xl flex items-center px-8 justify-between backdrop-blur-xl">
                <div className="flex items-center gap-4">
                    <button
                        onClick={prevScene}
                        className="text-slate-400 hover:text-white transition-colors"
                    >
                        <SkipBack size={20} />
                    </button>
                    <button
                        onClick={togglePlay}
                        className="w-12 h-12 rounded-full bg-white text-slate-900 flex items-center justify-center hover:scale-105 transition-transform shadow-lg shadow-white/10"
                    >
                        {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-1" />}
                    </button>
                    <button
                        onClick={nextScene}
                        className="text-slate-400 hover:text-white transition-colors"
                    >
                        <SkipForward size={20} />
                    </button>

                    <div className="flex flex-col ml-4">
                        <span className="text-white font-medium">{currentScene?.heading || "Lecture"}</span>
                        <span className="text-slate-400 text-xs">Slide {currentSceneIndex + 1} / {scenes?.length || 0}</span>
                    </div>
                </div>

                <div className="flex items-center gap-6 text-slate-400">
                    <Volume2 size={20} className="hover:text-white cursor-pointer transition-colors" />
                    <Maximize2 size={20} className="hover:text-white cursor-pointer transition-colors" />
                </div>
            </div>
        </div>
    );
};

export default Player;
