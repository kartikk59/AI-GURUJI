import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronUp } from 'lucide-react';

const Footer = () => {
    return (
        <footer className="bg-[#0B0A10] border-t border-white/5 pt-12 pb-8">
            <div className="container mx-auto px-6 max-w-6xl">
                <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-8 mb-8">
                    {/* Logo (Left) */}
                    <Link to="/" className="flex items-center gap-3">
                        <img src="/AiGLogo.png" alt="AI Guruji Logo" className="h-10 w-auto rounded-md" />
                    </Link>

                    {/* Text (Right) */}
                    <div className="md:text-right md:max-w-sm text-center">
                        <p className="text-gray-400 text-sm leading-relaxed">
                            Empowering the future of education with cinematic AI visual lectures and engaging dual-host podcasts. Transform your study material into interactive multimedia effortlessly.
                        </p>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
                    <p className="text-sm text-gray-500 text-center md:text-left">
                        &copy; {new Date().getFullYear()} AI Guruji. All rights reserved.
                    </p>
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                            <span>Made with</span>
                            <span className="text-purple-500 mx-1">♥</span>
                            <span>for Education</span>
                        </div>
                        <button
                            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                            className="p-2 rounded-full bg-white/5 text-gray-400 hover:bg-purple-500/20 hover:text-purple-400 transition-all duration-300 focus:outline-none"
                            aria-label="Scroll to top"
                        >
                            <ChevronUp size={20} />
                        </button>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
