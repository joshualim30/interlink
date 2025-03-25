import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../../config/firebase';

interface FeedEntry {
    id: string;
    word: string;
    username: string;
    timestamp: any;
    userId: string;
    wager: number;
}

interface LiveFeedProps {
    profanityFilter?: boolean;
    censorWord?: (word: string) => string;
}

export default function LiveFeed({ profanityFilter = true, censorWord = (word: string) => word }: LiveFeedProps) {
    const [entries, setEntries] = useState<FeedEntry[]>([]);

    useEffect(() => {
        const q = query(
            collection(db, 'submittedWords'),
            orderBy('timestamp', 'desc'),
            limit(5)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const newEntries = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as FeedEntry));

            // Filter out expired entries (older than 5 minutes)
            const now = Date.now();
            const activeEntries = newEntries.filter(entry => {
                const entryTime = entry.timestamp.toDate().getTime();
                return now - entryTime < 300000; // 5 minutes in milliseconds
            });

            setEntries(activeEntries);
        });

        return () => unsubscribe();
    }, []);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8"
        >
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 shadow-xl p-6">
                <h3 className="text-lg font-medium text-white mb-4">Active Words</h3>
                <div className="space-y-4">
                    <AnimatePresence>
                        {entries.map((entry) => (
                            <motion.div
                                key={entry.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="flex items-center justify-between bg-white/5 rounded-xl p-4"
                            >
                                <div className="flex items-center space-x-3">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-500 to-pink-500 flex items-center justify-center text-white font-bold">
                                        {entry.username[0].toUpperCase()}
                                    </div>
                                    <div>
                                        <div className="text-white font-medium">{entry.username}</div>
                                        <div className="text-slate-400 text-sm">{censorWord(entry.word)}</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-white font-medium">{entry.wager}s</div>
                                    <div className="text-slate-400 text-sm">wager</div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </div>
        </motion.div>
    );
} 