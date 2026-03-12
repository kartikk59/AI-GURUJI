import React, { useState } from 'react';
import Navbar from './Navbar';
import HowItWorksScroller from './HowItWorksScroller';
import Footer from './Footer';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp } from 'lucide-react';
import CardSwap, { Card } from './CardSwap';
import Particles from './Particles';

// --- SVG Icons for Features ---
const FeatureIcon1 = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);
const FeatureIcon2 = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </svg>
);
const FeatureIcon3 = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
    </svg>
  );

// --- Components ---

const HeroSection = () => (
  <div className="relative flex items-center justify-center pt-40 pb-20 bg-transparent overflow-hidden">
    
    {/* Floating animated blobs for dark mode background aesthetic */}
    <div className="absolute top-20 right-10 w-96 h-96 bg-purple-600/20 rounded-full blur-[100px] pointer-events-none animate-pulse z-0"></div>
    <div className="absolute bottom-10 left-10 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none z-0"></div>

    <div className="container mx-auto px-6 z-10">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <div className="text-center md:text-left relative z-10">
          <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    style={{
                        fontSize: 'clamp(3rem, 4vw, 5rem)',
                        fontWeight: '800',
                        letterSpacing: '-0.04em',
                        lineHeight: '1.1',
                        marginBottom: '1.5rem',
                        color: '#ffffff' // Back to white since background is dark
                    }}
                >
                    Study Smarter. Score Higher. <br /> With{' '}
                    <span style={{ position: 'relative', display: 'inline-block', zIndex: 1, padding: '0 0.2em' }}>
                        {/* Animated Highlighter Background */}
                        <motion.span
                            initial={{ width: '0%', opacity: 0 }}
                            animate={{ width: '100%', opacity: 1 }}
                            transition={{ duration: 0.6, delay: 0.5, ease: "easeOut" }}
                            style={{
                                position: 'absolute',
                                left: 0,
                                top: '0.1em',
                                bottom: '0.1em',
                                backgroundColor: '#9333ea', // Darker purple highlight
                                zIndex: -1,
                                borderRadius: '4px',
                                opacity: 0.8,
                                boxShadow: '0 0 20px rgba(147, 51, 234, 0.5)'
                            }}
                        />
                        <span style={{ position: 'relative', zIndex: 2, fontFamily: '"Lobster", cursive', fontWeight: 'normal', fontStyle: 'normal', color: '#ffffff', textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>AI-GURUJI</span>
                    </span>
                </motion.h1>
          <p className="text-lg text-gray-300 mb-8 max-w-lg mx-auto md:mx-0">
            Upload your course material to generate beautifully interactive visual lectures or engaging dual-host podcasts instantly.
          </p>
          <Link to="/upload">
            <button className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold py-3 px-8 rounded-full text-lg hover:from-purple-500 hover:to-indigo-500 transition-all transform hover:scale-105 duration-300 shadow-[0_0_20px_rgba(147,51,234,0.4)] hover:shadow-[0_0_30px_rgba(147,51,234,0.6)] border border-purple-500/30">
              Start Generating
            </button>
          </Link>
        </div>
        <div className="flex justify-center">
          <img 
            src="/homechar.png"
            alt="AI Guruji Character" 
            className="w-full h-auto object-contain max-w-lg drop-shadow-2xl"
          />
        </div>
      </div>
    </div>
  </div>
);

const FeaturesSection = () => {
    const features = [
        { icon: <FeatureIcon1 />, title: 'Interactive Visual Lectures', description: 'Instantly convert PDFs into beautiful presentation slides accompanied by a virtual AI teacher explaining the concepts.' },
        { icon: <FeatureIcon3 />, title: 'Dual-Host Podcasts', description: 'Transform dry materials into an engaging, cinematic auditory experience featuring two AI hosts discussing the subject.' },
        { icon: <FeatureIcon2 />, title: 'Contextual Knowledge', description: 'Our algorithms intelligently parse and ingest your documents into contextual knowledge chunks for maximum synthesis accuracy.' },
    ];
    return (
        <section className="bg-transparent relative z-10 py-20 sm:py-24 overflow-hidden border-t border-white/5">
            <div className="container mx-auto px-6 max-w-6xl">
                <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
                    {/* Left text component */}
                    <div className="lg:w-1/2 text-center lg:text-left">
                        <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6 leading-tight">Everything You Need to <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400">Ace Your Studies</span></h2>
                        <p className="text-xl text-gray-400 leading-relaxed">
                            AI Guruji combines advanced document processing with cutting-edge generative models to give you the ultimate learning advantage. Swap out dense materials for engaging multimedia formats instantly.
                        </p>
                    </div>

                    {/* Right CardSwap component */}
                    <div className="lg:w-1/2 w-full flex justify-center lg:justify-end mt-12 lg:mt-0 relative">
                        {/* Purple Glow Background behind cards */}
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-purple-600/40 rounded-full blur-[100px] pointer-events-none z-0"></div>

                        <div style={{ height: '500px', width: '100%', maxWidth: '500px', position: 'relative', zIndex: 10 }}>
                            <CardSwap
                                cardDistance={100}
                                verticalDistance={70}
                                delay={3000}
                                pauseOnHover={true}
                                width={320}
                                height={380}
                            >
                                {features.map((feature, index) => (
                                    <Card key={index} className="p-8 flex flex-col justify-between shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/10 group hover:border-purple-500/50 transition-colors duration-300 backdrop-blur-sm">
                                        <div>
                                            <div className="bg-gradient-to-br from-purple-600/80 to-indigo-600/80 rounded-2xl w-20 h-20 flex items-center justify-center mb-8 shadow-[0_0_20px_rgba(147,51,234,0.3)] border border-purple-400/30 group-hover:scale-105 transition-transform duration-300">
                                                {feature.icon}
                                            </div>
                                            <h3 className="text-2xl font-bold text-white mb-4 leading-snug">{feature.title}</h3>
                                            <p className="text-gray-300 leading-relaxed text-[15px]">{feature.description}</p>
                                        </div>
                                        <div className="text-purple-400 text-sm font-semibold tracking-wider mt-4 opacity-50 uppercase group-hover:opacity-100 transition-opacity">
                                            Feature 0{index + 1}
                                        </div>
                                    </Card>
                                ))}
                            </CardSwap>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

const faqData = [
    {
        question: "How does AI Guruji's AI presentation generator work?",
        answer: "AI Guruji uses advanced AI algorithms to analyze your PDF documents and automatically creates professional visual lectures with smart slide layouts, virtual teachers, and engaging dual-host podcasts."
    },
    {
        question: "What file formats does AI Guruji accept?",
        answer: "Currently, we specialize in high-fidelity extraction from PDF documents. Ensure your PDFs have clear, extractable text for the best results."
    },
    {
        question: "Is AI Guruji suitable for both teachers and students?",
        answer: "Absolutely! Teachers can use it to create interactive materials and virtual lectures, while students can generate custom study guides or listen to podcast-style summaries of their course material."
    },
    {
        question: "What's the difference between visual lectures and podcasts?",
        answer: "Visual lectures create an interactive presentation deck guided by a 3D virtual teacher. Podcasts generate a conversational, audio-only experience between two AI hosts discussing the subject matter."
    },
    {
        question: "How secure is my educational data on AI Guruji?",
        answer: "We prioritize your privacy and security. All uploaded documents and generated content are encrypted securely. We never use your personal data or institutional materials to train our base AI models."
    }
];

const FAQItem = ({ faq, isOpen, onClick }) => {
    return (
        <div style={{ borderBottom: '1px solid #1e293b' }}>
            <button
                onClick={onClick}
                style={{
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '1.5rem 0',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                    color: isOpen ? '#a855f7' : '#f8fafc',
                    transition: 'color 0.2s',
                    fontWeight: '600',
                    fontSize: '1.1rem'
                }}
                aria-expanded={isOpen}
            >
                <span>{faq.question}</span>
                {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        style={{ overflow: 'hidden' }}
                    >
                        <div style={{
                            paddingBottom: '1.5rem',
                            color: '#9ca3af',
                            lineHeight: '1.6',
                            fontSize: '1rem'
                        }}>
                            {faq.answer}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const FAQSection = () => {
    const [openIndex, setOpenIndex] = useState(0);

    return (
        <section style={{ padding: '6rem 2rem 8rem', backgroundColor: 'transparent', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                <style>
                    {`
            .faq-container {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 4rem;
              align-items: flex-start;
            }
            @media (max-width: 1024px) {
              .faq-container {
                grid-template-columns: 1fr;
                gap: 3rem;
              }
            }
          `}
                </style>

                <div className="faq-container">
                    {/* Left Side - Image */}
                    <div style={{ position: 'relative' }}>
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                            style={{
                                borderRadius: '24px',
                                overflow: 'hidden',
                                boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
                                border: '1px solid rgba(147, 51, 234, 0.2)'
                            }}
                        >
                            <img
                                src="/faq.png"
                                alt="AI Guruji FAQ Illustration"
                                style={{
                                    width: '100%',
                                    height: 'auto',
                                    display: 'block',
                                    aspectRatio: '1/1',
                                    objectFit: 'fill'
                                }}
                            />
                        </motion.div>
                    </div>

                    {/* Right Side - FAQ Content */}
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5 }}
                            style={{ marginBottom: '2.5rem' }}
                        >
                            <h3 style={{
                                color: '#a855f7',
                                fontWeight: '700',
                                fontSize: '0.9rem',
                                letterSpacing: '0.05em',
                                textTransform: 'uppercase',
                                marginBottom: '0.75rem'
                            }}>
                                FAQ's
                            </h3>
                            <h2 style={{
                                fontSize: '2.5rem',
                                fontWeight: '800',
                                color: '#f8fafc',
                                letterSpacing: '-0.02em',
                                marginBottom: '1rem',
                                lineHeight: 1.2
                            }}>
                                Questions about AI Guruji?
                            </h2>
                            <p style={{
                                fontSize: '1.1rem',
                                color: '#9ca3af',
                                lineHeight: 1.6
                            }}>
                                Get answers to common questions about our AI-powered platform and discover how AI Guruji can transform your teaching and learning experience.
                            </p>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            style={{ borderTop: '1px solid #1e293b' }}
                        >
                            {faqData.map((faq, index) => (
                                <FAQItem
                                    key={index}
                                    faq={faq}
                                    isOpen={openIndex === index}
                                    onClick={() => setOpenIndex(index === openIndex ? -1 : index)}
                                />
                            ))}
                        </motion.div>
                    </div>
                </div>
            </div>
        </section>
    );
};

// --- Main Landing Page Component ---

const LandingPage = () => {
  return (
    <div className="flex flex-col min-h-screen text-white font-sans selection:bg-purple-500/30 relative">
      <div className="fixed inset-0 z-0 bg-[#0B0A10]">
          <Particles
              particleColors={["#e3c5fc", "#a855f7", "#ffffff"]}
              particleCount={200}
              particleSpread={10}
              speed={0.1}
              particleBaseSize={100}
              moveParticlesOnHover={false}
              alphaParticles
              disableRotation={false}
              pixelRatio={1}
          />
      </div>

      <Navbar />
      
      <div className="relative z-10 flex flex-col w-full">
          <HeroSection />
          <FeaturesSection />
          
          <section className="relative">
            <HowItWorksScroller />
          </section>
          
          <FAQSection />
      </div>

      <div className="relative z-20 bg-[#0B0A10]">
          <Footer />
      </div>
    </div>
  );
};

export default LandingPage;
