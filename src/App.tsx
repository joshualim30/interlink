import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { motion, AnimatePresence } from 'framer-motion';
import LoginForm from './components/auth/LoginForm';
import RegisterForm from './components/auth/RegisterForm';
import GameInterface from './components/game/GameInterface';
import Leaderboard from './components/leaderboard/Leaderboard';
import TimerOverlay from './components/game/TimerOverlay';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Profile from './components/profile/Profile';

export default function App() {
  const { user, signOut } = useAuth();
  const [showRegister, setShowRegister] = useState(false);
  const [currentView, setCurrentView] = useState<'play' | 'leaderboard' | 'profile'>('play');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Add AdSense script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8037794323311912';
    script.async = true;
    script.crossOrigin = 'anonymous';
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  useEffect(() => {
    // If user is signed in, check for existing game state
    if (user) {
      const savedState = localStorage.getItem('gameState');
      if (savedState) {
        const gameState = JSON.parse(savedState);
        if (gameState.isActive) {
          // If there's an active game, prevent starting a new one
          setCurrentView('play');
        }
      }
    }
  }, [user]);

  const handleSignOut = async () => {
    try {
      await signOut();
      // Clear game state when signing out
      localStorage.removeItem('gameState');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 flex flex-col items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="text-center mb-8">
            <motion.h1
              className="text-5xl font-bold bg-gradient-to-r from-indigo-500 to-pink-500 bg-clip-text text-transparent mb-2"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              Interlink
            </motion.h1>
            <p className="text-slate-300 text-lg">The game of unique thinking</p>
          </div>

          <AnimatePresence mode="wait">
            {showRegister ? (
              <motion.div
                key="register"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 shadow-xl p-6 transform hover:scale-[1.02] transition-all duration-300 hover:bg-white/15"
              >
                <RegisterForm />
                <p className="text-center mt-4 text-slate-300">
                  Already have an account?{' '}
                  <button
                    onClick={() => setShowRegister(false)}
                    className="text-cyan-400 hover:text-cyan-300 font-medium"
                  >
                    Login
                  </button>
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="login"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 shadow-xl p-6 transform hover:scale-[1.02] transition-all duration-300 hover:bg-white/15"
              >
                <LoginForm />
                <p className="text-center mt-4 text-slate-300">
                  Don't have an account?{' '}
                  <button
                    onClick={() => setShowRegister(true)}
                    className="text-cyan-400 hover:text-cyan-300 font-medium"
                  >
                    Register
                  </button>
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950">
      <nav className="bg-white/5 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link
                to="/"
                className="flex items-center space-x-2"
                onClick={() => setCurrentView('play')}
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 260, damping: 20 }}
                  className="text-2xl font-bold bg-gradient-to-r from-indigo-500 to-pink-500 bg-clip-text text-transparent"
                >
                  Interlink
                </motion.div>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-4">
              <button
                onClick={() => setCurrentView('play')}
                className={`px-4 py-2 rounded-lg transition-all duration-200 ${currentView === 'play'
                  ? 'bg-gradient-to-r from-indigo-500 to-pink-500 text-white'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
                  }`}
              >
                Play
              </button>
              <button
                onClick={() => setCurrentView('leaderboard')}
                className={`px-4 py-2 rounded-lg transition-all duration-200 ${currentView === 'leaderboard'
                  ? 'bg-gradient-to-r from-indigo-500 to-pink-500 text-white'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
                  }`}
              >
                Leaderboard
              </button>
              <button
                onClick={() => setCurrentView('profile')}
                className={`px-4 py-2 rounded-lg transition-all duration-200 ${currentView === 'profile'
                  ? 'bg-gradient-to-r from-indigo-500 to-pink-500 text-white'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
                  }`}
              >
                Profile
              </button>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 focus:outline-none"
              >
                <span className="sr-only">Open main menu</span>
                {!isMenuOpen ? (
                  <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                ) : (
                  <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden"
            >
              <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                <button
                  onClick={() => {
                    setCurrentView('play');
                    setIsMenuOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-all duration-200 ${currentView === 'play'
                    ? 'bg-gradient-to-r from-indigo-500 to-pink-500 text-white'
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                    }`}
                >
                  Play
                </button>
                <button
                  onClick={() => {
                    setCurrentView('leaderboard');
                    setIsMenuOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-all duration-200 ${currentView === 'leaderboard'
                    ? 'bg-gradient-to-r from-indigo-500 to-pink-500 text-white'
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                    }`}
                >
                  Leaderboard
                </button>
                <button
                  onClick={() => {
                    setCurrentView('profile');
                    setIsMenuOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-all duration-200 ${currentView === 'profile'
                    ? 'bg-gradient-to-r from-indigo-500 to-pink-500 text-white'
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                    }`}
                >
                  Profile
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <main className="py-8 px-4">
        <AnimatePresence mode="wait">
          {currentView === 'play' ? (
            <motion.div
              key="game"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <GameInterface />
            </motion.div>
          ) : currentView === 'leaderboard' ? (
            <motion.div
              key="leaderboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Leaderboard />
            </motion.div>
          ) : (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Profile />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <TimerOverlay />
    </div>
  );
}
