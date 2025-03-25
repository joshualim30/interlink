import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { collection, query, where, orderBy, limit, onSnapshot, deleteDoc, doc, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';

interface GameState {
    isActive: boolean;
    timeLeft: number;
    submissionTime: number;
    wager: number;
    word: string;
    userId: string;
}

export default function TimerOverlay() {
    const { user } = useAuth();
    const [gameState, setGameState] = useState<GameState | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Effect to fetch and update game state
    useEffect(() => {
        if (!user) {
            setIsLoading(false);
            return;
        }

        const q = query(
            collection(db, 'submittedWords'),
            where('userId', '==', user.uid),
            orderBy('timestamp', 'desc'),
            limit(1)
        );

        const unsubscribe = onSnapshot(q, async (snapshot) => {
            if (!snapshot.empty) {
                const docSnapshot = snapshot.docs[0];
                const data = docSnapshot.data();
                const submissionTime = data.timestamp.toDate().getTime();
                const timeLeft = Math.max(0, data.wager - (Date.now() - submissionTime) / 1000);

                // If time has expired, delete the submission
                if (timeLeft <= 0) {
                    // await deleteDoc(doc(db, 'submittedWords', docSnapshot.id));
                    // setGameState(null);
                } else {
                    setGameState({
                        isActive: true,
                        timeLeft,
                        submissionTime,
                        word: data.word,
                        wager: data.wager,
                        userId: data.userId
                    });
                }
            } else {
                setGameState(null);
            }
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    // Effect to update timer in real-time
    useEffect(() => {
        if (!gameState?.isActive) return;

        const timer = setInterval(() => {
            setGameState(prev => {
                if (!prev) return null;
                const newTimeLeft = Math.max(0, gameState.wager - (Date.now() - prev.submissionTime) / 1000);

                if (newTimeLeft <= 0) {
                    // Delete the submission when time expires
                    const submittedWordsRef = collection(db, 'submittedWords');
                    const q = query(
                        submittedWordsRef,
                        where('userId', '==', user?.uid),
                        orderBy('timestamp', 'desc'),
                        limit(1)
                    );
                    getDocs(q).then(snapshot => {
                        if (!snapshot.empty) {
                            deleteDoc(doc(db, 'submittedWords', snapshot.docs[0].id));
                        }
                    });
                    return null;
                }

                return {
                    ...prev,
                    timeLeft: newTimeLeft
                };
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [gameState?.isActive, gameState?.submissionTime, user?.uid]);

    if (isLoading) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="fixed bottom-4 right-4 bg-white/10 backdrop-blur-lg rounded-lg border border-white/20 p-3 shadow-lg z-50"
            >
                <div className="text-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-indigo-500 border-t-transparent mx-auto"></div>
                </div>
            </motion.div>
        );
    }

    if (!gameState?.isActive) return null;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="fixed bottom-4 right-4 bg-white/10 backdrop-blur-lg rounded-lg border border-white/20 p-3 shadow-lg z-50"
        >
            <div className="text-center">
                <div className="text-sm text-slate-300 mb-1">Time Remaining</div>
                <div className="text-2xl font-bold bg-gradient-to-r from-indigo-500 to-pink-500 bg-clip-text text-transparent">
                    {Math.ceil(gameState.timeLeft)}s
                </div>
                <div className="text-sm text-slate-400 mt-1">
                    Word: <span className="text-indigo-400">{gameState.word}</span>
                </div>
            </div>
        </motion.div>
    );
} 