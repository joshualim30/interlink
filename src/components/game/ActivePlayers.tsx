import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { motion } from 'framer-motion';

export default function ActivePlayers() {
    const [count, setCount] = useState(0);

    useEffect(() => {
        const fiveMinutesAgo = new Date();
        fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5);

        const q = query(
            collection(db, 'users'),
            where('lastActive', '>=', fiveMinutesAgo),
            orderBy('lastActive', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            setCount(snapshot.size);
        });

        return () => unsubscribe();
    }, []);

    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center space-x-2 text-slate-300 mb-4"
        >
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-sm font-medium">
                {count} {count === 1 ? 'player' : 'players'} online
            </span>
        </motion.div>
    );
} 