import React, { useState, useEffect, useRef } from 'react';

// Define the content for each step with contextual online placeholders
const steps = [
  {
    title: 'Upload Course PDF',
    description: 'Select your study material and securely upload it.',
    image: 'https://images.unsplash.com/photo-1544396821-4dd40b938ad3?q=80&w=2073&auto=format&fit=crop'
  },
  {
    title: 'Content Ingestion',
    description: 'Our backend breaks down your PDF into knowledge chunks.',
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop'
  },
  {
    title: 'AI Synthesis',
    description: 'The AI model synthesizes the chunks into lectures or podcasts.',
    image: 'https://rejolut.com/wp-content/uploads/2024/02/unnamed-16.jpg'
  },
  {
    title: 'Start Learning',
    description: 'Immerse yourself in interactive slides or auditory learning.',
    image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=2070&auto=format&fit=crop',
  },
];

const HowItWorksScroller = () => {
  const [activeStep, setActiveStep] = useState(0);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      const container = containerRef.current;
      if (!container) return;

      const { top, height } = container.getBoundingClientRect();
      const scrollableHeight = height - window.innerHeight;

      // Exit if the component is not in the viewport
      if (top > window.innerHeight || top < -height) {
        return;
      }

      // Calculate scroll progress from 0 to 1
      const progress = Math.max(0, Math.min(1, -top / scrollableHeight));
      
      // Determine the new step, snapping to the nearest one
      const newStep = Math.round(progress * (steps.length - 1));

      // Use the functional update to avoid stale state issues
      setActiveStep(prevStep => {
        if (newStep !== prevStep) {
          return newStep;
        }
        return prevStep; 
      });
    };

    // Add the event listener once when the component mounts
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Clean up the listener when the component unmounts
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []); 

  return (
    <div ref={containerRef} className="relative h-[250vh] bg-transparent py-16 text-white">
      <div className="sticky top-0 h-screen w-full flex items-center justify-center overflow-hidden">
        <div className="container mx-auto px-6">
          <h2 className="text-5xl font-bold text-white mb-12 text-center">The Journey of Your Document</h2>
          <div className="flex flex-col md:flex-row items-center gap-16">
            
            {/* Left side: The text steps */}
            <div className="w-full md:w-1/2 flex justify-start md:justify-end">
              <div className="relative">
                {/* The vertical line. Aligned to the center of the 48px (w-12) circle. Left: 24px (1.5rem) from the container's left edge. */}
                <div className="absolute left-[24px] md:right-auto md:left-[24px] top-0 h-full w-px border-l-2 border-dotted border-purple-300"></div>
                
                <div className="space-y-12">
                  {steps.map((step, index) => {
                    const isActive = activeStep === index;
                    const isCompleted = activeStep > index;

                    return (
                      <div key={index} className="relative flex items-center transition-transform duration-300 transform hover:scale-105">
                        <div
                          className={`z-10 flex h-12 w-12 items-center justify-center rounded-full transition-all duration-500 ease-in-out transform shadow-lg
                            ${isActive ? 'bg-purple-600 ring-8 ring-purple-600/30 scale-110' : ''}
                            ${isCompleted ? 'bg-purple-800 scale-100' : ''}
                            ${!isActive && !isCompleted ? 'bg-gray-800 border border-gray-700 scale-100' : ''}
                          `}
                        >
                          <span className={`text-base font-bold transition-colors duration-300 ${isActive || isCompleted ? 'text-white' : 'text-gray-500'}`}>
                            {index + 1}
                          </span>
                        </div>
                        
                        <div className="ml-8">
                          <h3 className={`text-xl font-bold transition-colors duration-300 ${isActive ? 'text-white' : 'text-gray-500'}`}>
                            {step.title}
                          </h3>
                          <p className={`mt-1 text-sm font-medium transition-opacity duration-300 ${isActive ? 'opacity-100 text-gray-300' : 'opacity-40 text-gray-500'}`}>
                            {step.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right side: The fading images */}
            <div className="hidden md:flex w-1/2 h-[450px] relative items-center justify-start">
              {steps.map((step, index) => (
                <img
                  key={index}
                  src={step.image}
                  alt={step.title}
                  className={`absolute w-full h-full object-cover rounded-2xl shadow-[0_0_50px_rgba(168,85,247,0.3)] border border-purple-500/20 transition-opacity duration-700 ease-in-out ${
                    activeStep === index ? 'opacity-100' : 'opacity-0'
                  }`}
                />
              ))}
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
};

export default HowItWorksScroller;
