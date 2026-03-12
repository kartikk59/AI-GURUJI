import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import Beams from './Beams';
import Particles from './Particles';
import DotGrid from './DotGrid';
import { Mail, Lock, UserPlus, User } from 'lucide-react';

// ---------- Animation Variants ----------
const cardVariants = {
    hidden: { opacity: 0, y: 32, scale: 0.97 },
    visible: {
        opacity: 1, y: 0, scale: 1,
        transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] }
    },
    exit: { opacity: 0, y: -20, transition: { duration: 0.3 } }
};

const itemVariants = {
    hidden: { y: 16, opacity: 0 },
    visible: (i) => ({
        y: 0, opacity: 1,
        transition: { delay: i * 0.08, type: 'spring', stiffness: 280, damping: 22 }
    })
};

// ---------- Focused Input ----------
const GlassInput = ({ icon: Icon, label, ...props }) => {
    const [focused, setFocused] = useState(false);

    return (
        <div style={{ position: 'relative' }}>
            {/* Icon */}
            <div style={{
                position: 'absolute',
                left: '1rem',
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 2,
                color: focused ? '#9B64FA' : 'rgba(255,255,255,0.35)',
                transition: 'color 0.25s',
                pointerEvents: 'none',
            }}>
                <Icon size={17} />
            </div>

            <input
                {...props}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                style={{
                    width: '100%',
                    padding: '0.75rem 1rem 0.75rem 2.7rem',
                    borderRadius: '12px',
                    background: focused
                        ? 'rgba(155, 100, 250, 0.08)'
                        : 'rgba(255, 255, 255, 0.06)',
                    border: `1px solid ${focused ? 'rgba(155, 100, 250, 0.6)' : 'rgba(255,255,255,0.12)'}`,
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    color: '#fff',
                    fontSize: '0.95rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                    boxShadow: focused ? '0 0 0 3px rgba(155,100,250,0.15), inset 0 0 20px rgba(155,100,250,0.05)' : 'none',
                    transition: 'all 0.25s ease',
                }}
                placeholder={label}
            />
        </div>
    );
};

// ---------- Main Component ----------
const SignUp = () => {
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({ name: '', email: '', password: '' });
    const [shake, setShake] = useState(false);

    const navigate = useNavigate();

    const triggerShake = () => {
        setShake(true);
        setTimeout(() => setShake(false), 500);
    };

    const handleEmailSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name || !formData.email || !formData.password) {
            setError('Please fill in all fields.');
            triggerShake();
            return;
        }

        setIsLoading(true);
        setError('');

        setTimeout(() => {
            setIsLoading(false);
            navigate('/upload');
        }, 300);
    };

    return (
        <div style={{
            height: '100vh',
            width: '100vw',
            background: '#111116',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden',
            fontFamily: '"Inter", sans-serif',
        }}>

            {/* ── Layer 0: Beams background ── */}
            <div style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'auto' }}>
                <Beams
                    beamWidth={3}
                    beamHeight={30}
                    beamNumber={20}
                    lightColor="#ac7ef1"
                    speed={2}
                    noiseIntensity={1.75}
                    scale={0.2}
                    rotation={30}
                />
            </div>

            {/* ── Layer 1: Particles starfield ── */}
            <div style={{ position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none' }}>
                <Particles
                    particleColors={['#ffffff']}
                    particleCount={160}
                    particleSpread={10}
                    speed={0.06}
                    particleBaseSize={80}
                    moveParticlesOnHover={false}
                    alphaParticles={true}
                    disableRotation={false}
                    pixelRatio={1}
                />
            </div>

            {/* ── Layer 2: Vignette overlay ── */}
            <div style={{
                position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none',
                background: 'radial-gradient(ellipse 80% 80% at 50% 50%, transparent 20%, rgba(17,17,22,0.75) 100%)',
            }} />

            {/* ── Layer 3: Card ── */}
            <motion.div
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: '420px', padding: '1rem' }}
            >
                {/* Outer glow ring — same as the slide panel style */}
                <div style={{
                    position: 'relative',
                    borderRadius: '20px',
                    background: 'rgba(255,255,255,0.07)',
                    backdropFilter: 'blur(24px)',
                    WebkitBackdropFilter: 'blur(24px)',
                    border: '1px solid rgba(255,255,255,0.14)',
                    boxShadow: '0 32px 64px rgba(0,0,0,0.55), 0 0 80px rgba(155,100,250,0.12)',
                    overflow: 'hidden',
                }}>

                    {/* DotGrid accent layer inside card top-right corner */}
                    <div style={{
                        position: 'absolute', top: 0, right: 0,
                        width: '60%', height: '50%', zIndex: 0, opacity: 0.4,
                        pointerEvents: 'none',
                        maskImage: 'radial-gradient(circle at top right, black 0%, transparent 70%)',
                        WebkitMaskImage: 'radial-gradient(circle at top right, black 0%, transparent 70%)',
                    }}>
                        <DotGrid
                            dotSize={3}
                            gap={12}
                            baseColor="#271E37"
                            activeColor="#9B64FA"
                            proximity={80}
                            shockRadius={120}
                            shockStrength={3}
                            resistance={500}
                            returnDuration={1.2}
                        />
                    </div>

                    {/* Card content */}
                    <div style={{ position: 'relative', zIndex: 1, padding: '1.75rem 2rem' }}>

                        {/* ── Header: Logo ── */}
                        <motion.div
                            custom={0} variants={itemVariants} initial="hidden" animate="visible"
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}
                        >
                            <img
                                src="/AiGLogo.png"
                                alt="AI-Guruji Logo"
                                style={{
                                    height: '62px',
                                    width: 'auto',
                                    objectFit: 'contain',
                                    filter: 'drop-shadow(0 0 16px rgba(155,100,250,0.5))',
                                    borderRadius: '8px',
                                }}
                            />
                        </motion.div>

                        {/* ── Heading ── */}
                        <motion.h1
                            custom={1} variants={itemVariants} initial="hidden" animate="visible"
                            style={{
                                fontSize: '1.4rem',
                                fontWeight: '700',
                                color: '#ffffff',
                                marginBottom: '0.15rem',
                                letterSpacing: '-0.01em',
                            }}
                        >
                            Create an Account
                        </motion.h1>
                        <motion.p
                            custom={2} variants={itemVariants} initial="hidden" animate="visible"
                            style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.85rem', marginBottom: '1rem' }}
                        >
                            Join AI Guruji and start learning
                        </motion.p>

                        {/* ── Error Banner ── */}
                        <AnimatePresence mode="wait">
                            {error && (
                                <motion.div
                                    key="err"
                                    initial={{ opacity: 0, y: -8 }}
                                    animate={shake
                                        ? { x: [0, -9, 9, -9, 9, 0], opacity: 1, y: 0 }
                                        : { opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.35 }}
                                    style={{
                                        background: 'rgba(239,68,68,0.1)',
                                        border: '1px solid rgba(239,68,68,0.25)',
                                        borderRadius: '10px',
                                        padding: '0.4rem 0.75rem',
                                        color: '#f87171',
                                        fontSize: '0.8rem',
                                        marginBottom: '0.8rem',
                                        textAlign: 'center',
                                    }}
                                >
                                    {error}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* ── Form ── */}
                        <form onSubmit={handleEmailSubmit}>
                            <motion.div
                                custom={3} variants={itemVariants} initial="hidden" animate="visible"
                                style={{ marginBottom: '0.65rem' }}
                            >
                                <GlassInput icon={User} label="Full Name" type="text"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </motion.div>

                            <motion.div
                                custom={4} variants={itemVariants} initial="hidden" animate="visible"
                                style={{ marginBottom: '0.65rem' }}
                            >
                                <GlassInput icon={Mail} label="Email Address" type="email"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    required
                                />
                            </motion.div>

                            <motion.div
                                custom={5} variants={itemVariants} initial="hidden" animate="visible"
                                style={{ marginBottom: '0.85rem' }}
                            >
                                <GlassInput icon={Lock} label="Password" type="password"
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    required
                                />
                            </motion.div>

                            {/* Primary CTA */}
                            <motion.div custom={6} variants={itemVariants} initial="hidden" animate="visible">
                                <motion.button
                                    type="submit"
                                    disabled={isLoading}
                                    whileHover={{ scale: 1.03, filter: 'brightness(1.12)' }}
                                    whileTap={{ scale: 0.97 }}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem 1.5rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '0.5rem',
                                        background: 'linear-gradient(90deg, #60a5fa, #9B64FA)',
                                        border: '2px solid rgba(155,100,250,0.5)',
                                        borderRadius: '50px',
                                        color: '#fff',
                                        fontWeight: '700',
                                        fontSize: '1rem',
                                        cursor: isLoading ? 'not-allowed' : 'pointer',
                                        boxShadow: '0 0 40px rgba(155,100,250,0.35)',
                                        opacity: isLoading ? 0.7 : 1,
                                    }}
                                >
                                    {isLoading ? (
                                        <motion.div
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}
                                            style={{
                                                width: 18, height: 18,
                                                border: '2px solid rgba(255,255,255,0.3)',
                                                borderTopColor: '#fff',
                                                borderRadius: '50%',
                                            }}
                                        />
                                    ) : (
                                        <>
                                            <UserPlus size={18} />
                                            Get Started
                                        </>
                                    )}
                                </motion.button>
                            </motion.div>
                        </form>

                        {/* ── Footer ── */}
                        <motion.div
                            custom={9} variants={itemVariants} initial="hidden" animate="visible"
                            style={{
                                marginTop: '1rem',
                                textAlign: 'center',
                                fontSize: '0.82rem',
                                color: 'rgba(255,255,255,0.35)',
                            }}
                        >
                            Already have an account?{' '}
                            <Link to="/signin" style={{ textDecoration: 'none' }}>
                                <motion.span
                                    whileHover={{ color: '#9B64FA' }}
                                    style={{
                                        color: 'rgba(155,100,250,0.85)',
                                        fontWeight: '700',
                                        display: 'inline-block',
                                        transition: 'color 0.2s',
                                    }}
                                >
                                    Sign in
                                </motion.span>
                            </Link>
                        </motion.div>

                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default SignUp;
