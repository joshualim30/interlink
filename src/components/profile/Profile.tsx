import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { auth, db } from '../../config/firebase';
import { doc, getDoc, updateDoc, deleteDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { deleteUser } from 'firebase/auth';
import { useAuth } from '../../contexts/AuthContext';

interface UserStats {
    totalGames: number;
    totalWins: number;
    totalLosses: number;
    highestScore: number;
    averageWager: number;
}

interface GameState {
    isActive: boolean;
    word: string;
    timeLeft: number;
    score: number;
}

export default function Profile() {
    const { signOut } = useAuth();
    const [username, setUsername] = useState('');
    const [newUsername, setNewUsername] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [profanityFilter, setProfanityFilter] = useState(true);
    const [stats, setStats] = useState<UserStats>({
        totalGames: 0,
        totalWins: 0,
        totalLosses: 0,
        highestScore: 0,
        averageWager: 0
    });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [hasActiveWord, setHasActiveWord] = useState(false);

    useEffect(() => {
        fetchUserData();
        checkActiveWord();
    }, []);

    const checkActiveWord = async () => {
        // Search for active word in submittedWords collection
        const submittedWordsRef = collection(db, 'submittedWords');
        const q = query(submittedWordsRef, where('username', '==', auth.currentUser?.displayName));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            setHasActiveWord(true);
        }
    };

    const fetchUserData = async () => {
        if (!auth.currentUser) return;

        try {
            // Get user document
            const userRef = collection(db, 'users');
            const userQuery = query(userRef, where('username', '==', auth.currentUser.displayName));
            const userSnapshot = await getDocs(userQuery);
            const userDoc = userSnapshot.docs[0];

            if (userDoc.exists()) {
                const userData = userDoc.data();
                console.log("USER DATA", userData);
                setUsername(userData.username || '');
                setNewUsername(userData.username || '');
                setProfanityFilter(userData.profanityFilter ?? true); // Default to true if not set

                // Set stats from user document
                setStats({
                    totalGames: userData.totalGames || 10,
                    totalWins: userData.totalWins || 10,
                    totalLosses: userData.totalLosses || 10,
                    highestScore: userData.highestScore || 10,
                    averageWager: userData.averageWager || 10
                });
            }
        } catch (error) {
            console.error('Error fetching user data:', error);
            setError('Failed to load user data');
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateUsername = async () => {
        if (!auth.currentUser || !newUsername.trim() || hasActiveWord) return;

        try {
            // Check if username is already taken
            const usersRef = collection(db, 'users');
            const q = query(usersRef, where('username', '==', newUsername.trim()));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty && querySnapshot.docs[0].id !== auth.currentUser.uid) {
                setError('Username is already taken');
                setTimeout(() => setError(''), 3000);
                return;
            }

            // Update username in users collection
            const userRef = doc(db, 'users', auth.currentUser.uid);
            await updateDoc(userRef, {
                username: newUsername.trim()
            });

            // Update username in all submitted words
            const submittedWordsRef = collection(db, 'submittedWords');
            const submittedWordsQuery = query(submittedWordsRef, where('userId', '==', auth.currentUser.uid));
            const submittedWordsSnapshot = await getDocs(submittedWordsQuery);

            const updatePromises = submittedWordsSnapshot.docs.map(doc =>
                updateDoc(doc.ref, { username: newUsername.trim() })
            );
            await Promise.all(updatePromises);

            setUsername(newUsername.trim());
            setIsEditing(false);
            setSuccess('Username updated successfully');
            setTimeout(() => setSuccess(''), 3000);
        } catch (error) {
            console.error('Error updating username:', error);
            setError('Failed to update username');
            setTimeout(() => setError(''), 3000);
        }
    };

    const handleToggleProfanityFilter = async () => {
        if (!auth.currentUser) return;

        try {
            const userRef = doc(db, 'users', auth.currentUser.uid);
            await updateDoc(userRef, {
                profanityFilter: !profanityFilter
            });
            setProfanityFilter(!profanityFilter);
            setSuccess('Profanity filter preference updated');
            setTimeout(() => setSuccess(''), 3000);
        } catch (error) {
            console.error('Error updating profanity filter:', error);
            setError('Failed to update profanity filter preference');
            setTimeout(() => setError(''), 3000);
        }
    };

    const handleSignOut = async () => {
        try {
            await signOut();
            // Clear game state when signing out
            localStorage.removeItem('gameState');
        } catch (error) {
            console.error('Error signing out:', error);
            setError('Failed to sign out. Please try again.');
            setTimeout(() => setError(''), 3000);
        }
    };

    const handleDeleteAccount = async () => {
        if (!auth.currentUser || hasActiveWord) return;

        if (!window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
            return;
        }

        try {
            // Delete user's data from Firestore
            const userRef = doc(db, 'users', auth.currentUser.uid);
            await deleteDoc(userRef);

            // Delete user's submitted words
            const submittedWordsRef = collection(db, 'submittedWords');
            const q = query(submittedWordsRef, where('userId', '==', auth.currentUser.uid));
            const querySnapshot = await getDocs(q);
            const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
            await Promise.all(deletePromises);

            // Delete the user account
            await deleteUser(auth.currentUser);

            // Sign out after successful deletion
            await signOut();
        } catch (error) {
            console.error('Error deleting account:', error);
            setError('Failed to delete account. Please try again.');
            setTimeout(() => setError(''), 3000);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto"
        >
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 shadow-xl p-6 transform hover:scale-[1.02] transition-all duration-300 hover:bg-white/15">
                <h2 className="text-2xl font-bold text-white mb-6">Profile</h2>

                {error && (
                    <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="mb-4 p-3 bg-green-500/20 border border-green-500/50 rounded-lg text-green-300">
                        {success}
                    </div>
                )}

                <div className="space-y-6">
                    {/* Username Section */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Username
                        </label>
                        <div className="flex gap-2">
                            {isEditing ? (
                                <>
                                    <input
                                        type="text"
                                        value={newUsername}
                                        onChange={(e) => setNewUsername(e.target.value)}
                                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                        disabled={hasActiveWord}
                                    />
                                    <button
                                        onClick={handleUpdateUsername}
                                        className={`px-4 py-2 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 transition-colors ${hasActiveWord ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        disabled={hasActiveWord}
                                    >
                                        Save
                                    </button>
                                    <button
                                        onClick={() => {
                                            setIsEditing(false);
                                            setNewUsername(username);
                                        }}
                                        className="px-4 py-2 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </>
                            ) : (
                                <>
                                    <div className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white">
                                        {username}
                                    </div>
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className={`px-4 py-2 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-colors ${hasActiveWord ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        disabled={hasActiveWord}
                                    >
                                        Edit
                                    </button>
                                </>
                            )}
                        </div>
                        {hasActiveWord && (
                            <p className="mt-2 text-sm text-yellow-400">
                                Username cannot be changed while you have an active word
                            </p>
                        )}
                    </div>

                    {/* Stats Section */}
                    <div>
                        <h3 className="text-lg font-medium text-white mb-4">Statistics</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                                <div className="text-sm text-slate-300">Total Games</div>
                                <div className="text-2xl font-bold text-white">{stats.totalGames}</div>
                            </div>
                            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                                <div className="text-sm text-slate-300">Wins</div>
                                <div className="text-2xl font-bold text-white">{stats.totalWins}</div>
                            </div>
                            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                                <div className="text-sm text-slate-300">Losses</div>
                                <div className="text-2xl font-bold text-white">{stats.totalLosses}</div>
                            </div>
                            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                                <div className="text-sm text-slate-300">Highest Score</div>
                                <div className="text-2xl font-bold text-white">{stats.highestScore}</div>
                            </div>
                            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                                <div className="text-sm text-slate-300">Avg. Wager</div>
                                <div className="text-2xl font-bold text-white">{stats.averageWager}s</div>
                            </div>
                        </div>
                    </div>

                    {/* Account Actions Section */}
                    <div className="pt-6 border-t border-white/10">
                        <h3 className="text-lg font-medium text-white mb-4">Account Actions</h3>
                        <div className="space-y-4">
                            <button
                                onClick={handleSignOut}
                                className="w-full px-4 py-2 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-colors"
                            >
                                Sign Out
                            </button>
                        </div>
                    </div>

                    {/* Preferences Section */}
                    <div className="pt-6 border-t border-white/10">
                        <h3 className="text-lg font-medium text-white mb-4">Preferences</h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium text-slate-300">
                                        Profanity Filter
                                    </span>
                                    <span className="text-xs text-slate-400">
                                        {profanityFilter ? 'Bad words will be starred out' : 'All words are allowed'}
                                    </span>
                                </div>
                                <button
                                    onClick={handleToggleProfanityFilter}
                                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${profanityFilter ? 'bg-gradient-to-r from-indigo-500 to-pink-500' : 'bg-white/10'
                                        }`}
                                >
                                    <span
                                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${profanityFilter ? 'translate-x-5' : 'translate-x-0'
                                            }`}
                                    />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Delete Account Section */}
                    <div className="pt-6 border-t border-white/10">
                        <h3 className="text-lg font-medium text-red-400 mb-4">Danger Zone</h3>
                        <button
                            onClick={handleDeleteAccount}
                            className={`w-full px-4 py-2 bg-red-500/20 text-red-400 rounded-xl hover:bg-red-500/30 transition-colors border border-red-500/50 ${hasActiveWord ? 'opacity-50 cursor-not-allowed' : ''}`}
                            disabled={hasActiveWord}
                        >
                            Delete Account
                        </button>
                        {hasActiveWord && (
                            <p className="mt-2 text-sm text-yellow-400">
                                Account cannot be deleted while you have an active word
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
} 