import React, { useState, useEffect } from 'react';
import { Link, NavLink } from 'react-router-dom';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isHidden, setIsHidden] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > 600) {
        setIsHidden(true);
        setIsScrolled(true);
      } else if (currentScrollY > 50) {
        setIsHidden(false);
        setIsScrolled(true);
      } else {
        setIsHidden(false);
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const navLinks = [
    { name: "Create Lecture", path: "/upload" },
    { name: "Sign In", path: "/signin" },
    { name: "Sign Up", path: "/signup" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex justify-center p-4 transition-all duration-300 ease-in-out">
      <nav
        className={`
          flex items-center justify-between
          transition-all duration-500 ease-in-out
          ${
            isScrolled
              ? 'w-[90%] md:w-[80%] max-w-6xl rounded-full bg-[#1e1436]/90 backdrop-blur-lg py-4 px-6 md:px-10 shadow-3xl shadow-purple-900/20 border border-purple-500/20'
              : 'w-full max-w-none rounded-none bg-transparent py-5 px-6 md:px-10 shadow-none'
          }
          ${isHidden ? 'opacity-0 pointer-events-none -translate-y-full' : 'opacity-100 translate-y-0'}
        `}
      >
        {/* Left: Logo */}
        <div className="text-xl md:text-2xl font-bold text-white tracking-wider flex items-center gap-2">
          <Link to="/" className="flex items-center gap-2">
            <img src="/AiGLogo.png" alt="AI Guruji" className="h-10 w-auto hidden sm:block rounded-md" />
          </Link>
        </div>

        {/* Center: Navigation Links */}
        <ul className="flex items-center gap-4 sm:gap-10">
          {navLinks.map((link) => (
            <li key={link.path}>
              <NavLink
                to={link.path}
                className="relative group text-gray-200 hover:text-purple-400 font-semibold transition-colors duration-300 text-sm md:text-base"
              >
                {({ isActive }) => (
                  <>
                    <span>{link.name}</span>
                    <span
                      className={`
                        absolute bottom-[-4px] left-0 w-full h-0.5 bg-purple-500
                        transform group-hover:scale-x-100
                        transition-transform duration-300 ease-out origin-center
                        ${isActive ? 'scale-x-100' : 'scale-x-0'}
                      `}
                    ></span>
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
};

export default Navbar;
