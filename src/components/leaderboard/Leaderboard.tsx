import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';
import PopularWords from './PopularWords';

interface User {
    username: string;
    score: number;
    rank: number;
}

export default function Leaderboard() {
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                const usersRef = collection(db, 'users');
                const q = query(usersRef, orderBy('score', 'desc'), limit(10));
                const querySnapshot = await getDocs(q);

                const leaderboard = querySnapshot.docs.map((doc, index) => ({
                    username: doc.data().username,
                    score: doc.data().score,
                    rank: index + 1
                }));

                setUsers(leaderboard);
            } catch (error) {
                console.error('Error fetching leaderboard:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchLeaderboard();
    }, []);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-400"></div>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 shadow-xl p-6">
                <h2 className="text-2xl font-bold text-center mb-6 bg-gradient-to-r from-indigo-500 to-pink-500 bg-clip-text text-transparent">
                    Top Players
                </h2>
                <div className="space-y-4">
                    {users.map((user, index) => (
                        <motion.div
                            key={user.username}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="flex items-center justify-between p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-all duration-200"
                        >
                            <div className="flex items-center space-x-4">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-500 to-pink-500 flex items-center justify-center text-white font-bold">
                                    {user.rank}
                                </div>
                                <div className="text-white font-medium">{user.username}</div>
                            </div>
                            <div className="text-cyan-400 font-semibold">{user.score} points</div>
                        </motion.div>
                    ))}
                </div>
            </div>
            <PopularWords />
        </div>
    );
} 