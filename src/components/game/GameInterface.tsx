import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { auth, db } from '../../config/firebase';
import { collection, query, where, getDocs, addDoc, updateDoc, doc, getDoc, deleteDoc, serverTimestamp, orderBy, limit, onSnapshot } from 'firebase/firestore';
import debounce from 'lodash/debounce';
import LiveFeed from './LiveFeed';
import ActivePlayers from './ActivePlayers';

interface GameState {
    word: string;
    wager: number;
    timeLeft: number;
    isActive: boolean;
    score: number;
    useMultiplier: boolean;
}

interface WordSuggestion {
    word: string;
    definition: string;
}

interface FeedbackMessage {
    message: string;
    type: 'success' | 'error';
    id: number;
}

interface User {
    userId: string;
    username: string;
    score: number;
}

interface Word {
    word: string;
    username: string;
    count: number;
}

export default function GameInterface() {
    const [gameState, setGameState] = useState<GameState>({
        word: '',
        wager: 60,
        timeLeft: 0,
        isActive: false,
        score: 0,
        useMultiplier: false
    });
    const [suggestions, setSuggestions] = useState<WordSuggestion[]>([]);
    const [isValidWord, setIsValidWord] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [feedback, setFeedback] = useState<FeedbackMessage[]>([]);
    const [feedbackId, setFeedbackId] = useState(0);
    const [isCheckingWord, setIsCheckingWord] = useState(false);
    const [profanityFilter, setProfanityFilter] = useState(true);

    // Add profanity list
    const PROFANITY_LIST = [
        '4r5e', '5h1t', '5hit', 'a55', 'anal', 'anus', 'ar5e', 'arrse', 'arse', 'ass', 'ass-fucker', 'asses', 'assfucker', 'assfukka', 'asshole', 'assholes', 'asswhole', 'a_s_s', 'b!tch', 'b00bs', 'b17ch', 'b1tch', 'ballbag', 'balls', 'ballsack', 'bastard', 'beastial', 'beastiality', 'bellend', 'bestial', 'bestiality', 'bi+ch', 'biatch', 'bitch', 'bitcher', 'bitchers', 'bitches', 'bitchin', 'bitching', 'bloody', 'blow job', 'blowjob', 'blowjobs', 'boiolas', 'bollock', 'bollok', 'boner', 'boob', 'boobs', 'booobs', 'boooobs', 'booooobs', 'booooooobs', 'breasts', 'buceta', 'bugger', 'bum', 'bunny fucker', 'butt', 'butthole', 'buttmuch', 'buttplug', 'c0ck', 'c0cksucker', 'carpet muncher', 'cawk', 'chink', 'cipa', 'cl1t', 'clit', 'clitoris', 'clits', 'cnut', 'cock', 'cock-sucker', 'cockface', 'cockhead', 'cockmunch', 'cockmuncher', 'cocks', 'cocksuck', 'cocksucked', 'cocksucker', 'cocksucking', 'cocksucks', 'cocksuka', 'cocksukka', 'cok', 'cokmuncher', 'coksucka', 'coon', 'cox', 'crap', 'cum', 'cummer', 'cumming', 'cums', 'cumshot', 'cunilingus', 'cunillingus', 'cunnilingus', 'cunt', 'cuntlick', 'cuntlicker', 'cuntlicking', 'cunts', 'cyalis', 'cyberfuc', 'cyberfuck', 'cyberfucked', 'cyberfucker', 'cyberfuckers', 'cyberfucking', 'd1ck', 'damn', 'dick', 'dickhead', 'dildo', 'dildos', 'dink', 'dinks', 'dirsa', 'dlck', 'dog-fucker', 'doggin', 'dogging', 'donkeyribber', 'doosh', 'duche', 'dyke', 'ejaculate', 'ejaculated', 'ejaculates', 'ejaculating', 'ejaculatings', 'ejaculation', 'ejakulate', 'f u c k', 'f u c k e r', 'f4nny', 'fag', 'fagging', 'faggitt', 'faggot', 'faggs', 'fagot', 'fagots', 'fags', 'fanny', 'fannyflaps', 'fannyfucker', 'fanyy', 'fatass', 'fcuk', 'fcuker', 'fcuking', 'feck', 'fecker', 'felching', 'fellate', 'fellatio', 'fingerfuck', 'fingerfucked', 'fingerfucker', 'fingerfuckers', 'fingerfucking', 'fingerfucks', 'fistfuck', 'fistfucked', 'fistfucker', 'fistfuckers', 'fistfucking', 'fistfuckings', 'fistfucks', 'flange', 'fook', 'fooker', 'fuck', 'fucka', 'fucked', 'fucker', 'fuckers', 'fuckhead', 'fuckheads', 'fuckin', 'fucking', 'fuckings', 'fuckingshitmotherfucker', 'fuckme', 'fucks', 'fuckwhit', 'fuckwit', 'fudge packer', 'fudgepacker', 'fuk', 'fuker', 'fukker', 'fukkin', 'fuks', 'fukwhit', 'fukwit', 'fux', 'fux0r', 'f_u_c_k', 'gangbang', 'gangbanged', 'gangbangs', 'gaylord', 'gaysex', 'goatse', 'God', 'god-dam', 'god-damned', 'goddamn', 'goddamned', 'hardcoresex', 'hell', 'heshe', 'hoar', 'hoare', 'hoer', 'homo', 'hore', 'horniest', 'horny', 'hotsex', 'jack-off', 'jackoff', 'jap', 'jerk-off', 'jism', 'jiz', 'jizm', 'jizz', 'kawk', 'knob', 'knobead', 'knobed', 'knobend', 'knobhead', 'knobjocky', 'knobjokey', 'kock', 'kondum', 'kondums', 'kum', 'kummer', 'kumming', 'kums', 'kunilingus', 'l3i+ch', 'l3itch', 'labia', 'lmfao', 'lust', 'lusting', 'm0f0', 'm0fo', 'm45terbate', 'ma5terb8', 'ma5terbate', 'masochist', 'master-bate', 'masterb8', 'masterbat*', 'masterbat3', 'masterbate', 'masterbation', 'masterbations', 'masturbate', 'mo-fo', 'mof0', 'mofo', 'mothafuck', 'mothafucka', 'mothafuckas', 'mothafuckaz', 'mothafucked', 'mothafucker', 'mothafuckers', 'mothafuckin', 'mothafucking', 'mothafuckings', 'mothafucks', 'mother fucker', 'motherfuck', 'motherfucked', 'motherfucker', 'motherfuckers', 'motherfuckin', 'motherfucking', 'motherfuckings', 'motherfuckka', 'motherfucks', 'muff', 'mutha', 'muthafecker', 'muthafuckker', 'muther', 'mutherfucker', 'n1gga', 'n1gger', 'nazi', 'nigg3r', 'nigg4h', 'nigga', 'niggah', 'niggas', 'niggaz', 'nigger', 'niggers', 'nob', 'nob jokey', 'nobhead', 'nobjocky', 'nobjokey', 'numbnuts', 'nutsack', 'orgasim', 'orgasims', 'orgasm', 'orgasms', 'p0rn', 'pawn', 'pecker', 'penis', 'penisfucker', 'phonesex', 'phuck', 'phuk', 'phuked', 'phuking', 'phukked', 'phukking', 'phuks', 'phuq', 'pigfucker', 'pimpis', 'piss', 'pissed', 'pisser', 'pissers', 'pisses', 'pissflaps', 'pissin', 'pissing', 'pissoff', 'poop', 'porn', 'porno', 'pornography', 'pornos', 'prick', 'pricks', 'pron', 'pube', 'pusse', 'pussi', 'pussies', 'pussy', 'pussys', 'rectum', 'retard', 'rimjaw', 'rimming', 's hit', 's.o.b.', 'sadist', 'schlong', 'screwing', 'scroat', 'scrote', 'scrotum', 'semen', 'sex', 'sh!+', 'sh!t', 'sh1t', 'shag', 'shagger', 'shaggin', 'shagging', 'shemale', 'shi+', 'shit', 'shitdick', 'shite', 'shited', 'shitey', 'shitfuck', 'shitfull', 'shithead', 'shiting', 'shitings', 'shits', 'shitted', 'shitter', 'shitters', 'shitting', 'shittings', 'shitty', 'skank', 'slut', 'sluts', 'smegma', 'smut', 'snatch', 'son-of-a-bitch', 'spac', 'spunk', 's_h_i_t', 't1tt1e5', 't1tties', 'teets', 'teez', 'testical', 'testicle', 'tit', 'titfuck', 'tits', 'titt', 'tittie5', 'tittiefucker', 'titties', 'tittyfuck', 'tittywank', 'titwank', 'tosser', 'turd', 'tw4t', 'twat', 'twathead', 'twatty', 'twunt', 'twunter', 'v14gra', 'v1gra', 'vagina', 'viagra', 'vulva', 'w00se', 'wang', 'wank', 'wanker', 'wanky', 'whoar', 'whore', 'willies', 'willy', 'xrated', 'xxx'
    ];

    // Add function to check for profanity
    const containsProfanity = (word: string): boolean => {
        if (!profanityFilter) return false;
        const lowerWord = word.toLowerCase();
        return PROFANITY_LIST.some(badWord => lowerWord.includes(badWord));
    };

    // Add function to censor profanity
    const censorWord = (word: string): string => {
        if (!profanityFilter) return word;
        let censoredWord = word;
        PROFANITY_LIST.forEach(badWord => {
            const regex = new RegExp(badWord, 'gi');
            censoredWord = censoredWord.replace(regex, '*'.repeat(badWord.length));
        });
        return censoredWord;
    };

    // Fetch user preferences
    useEffect(() => {
        const fetchUserPreferences = async () => {
            if (!auth.currentUser) return;

            try {
                const userRef = doc(db, 'users', auth.currentUser.uid);
                const userDoc = await getDoc(userRef);
                if (userDoc.exists()) {
                    setProfanityFilter(userDoc.data().profanityFilter ?? true);
                }
            } catch (error) {
                console.error('Error fetching user preferences:', error);
            }
        };

        fetchUserPreferences();
    }, []);

    // Debounced function to check word validity and get suggestions
    const checkWord = useCallback(
        debounce(async (word: string) => {
            if (!word.trim()) {
                setSuggestions([]);
                setIsValidWord(false);
                setIsCheckingWord(false);
                return;
            }

            if (word.includes(' ') && !word.includes('-')) {
                setIsValidWord(false);
                setSuggestions([]);
                setIsCheckingWord(false);
                return;
            }

            setIsCheckingWord(true);
            try {
                const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
                const data = await response.json();

                if (Array.isArray(data)) {
                    setIsValidWord(true);
                    setSuggestions([{
                        word: data[0].word,
                        definition: data[0].meanings[0].definitions[0].definition
                    }]);
                } else {
                    setIsValidWord(false);
                    setSuggestions([]);
                }

                if (!word.includes('-')) {
                    const suggestionsResponse = await fetch(`https://api.datamuse.com/words?sp=${word}*&max=5`);
                    const suggestionsData = await suggestionsResponse.json();

                    if (Array.isArray(suggestionsData)) {
                        const wordPromises = suggestionsData.map(async (suggestion: { word: string }) => {
                            try {
                                const defResponse = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${suggestion.word}`);
                                const defData = await defResponse.json();
                                if (Array.isArray(defData)) {
                                    return {
                                        word: suggestion.word,
                                        definition: defData[0].meanings[0].definitions[0].definition
                                    };
                                }
                                return null;
                            } catch {
                                return null;
                            }
                        });

                        const validSuggestions = (await Promise.all(wordPromises)).filter(Boolean) as WordSuggestion[];
                        setSuggestions(prev => {
                            const exactMatch = prev.find(s => s.word === word);
                            return exactMatch ? [exactMatch, ...validSuggestions.filter(s => s.word !== word)] : validSuggestions;
                        });
                    }
                } else {
                    setSuggestions([]);
                }
            } catch (error) {
                setIsValidWord(false);
                setSuggestions([]);
            } finally {
                setIsCheckingWord(false);
            }
        }, 300),
        []
    );

    // Update word suggestions when input changes
    useEffect(() => {
        checkWord(gameState.word);
    }, [gameState.word, checkWord]);

    // Fetch initial game state
    useEffect(() => {
        const fetchGameState = async () => {
            if (!auth.currentUser) return;

            try {
                // Fetch user's score
                const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
                if (userDoc.exists()) {
                    setGameState(prev => ({
                        ...prev,
                        score: userDoc.data().score || 0
                    }));
                }

                // Check for active submission
                const submittedWordsRef = collection(db, 'submittedWords');
                const q = query(
                    submittedWordsRef,
                    where('userId', '==', auth.currentUser.uid),
                    orderBy('timestamp', 'desc'),
                    limit(1)
                );
                const querySnapshot = await getDocs(q);

                if (!querySnapshot.empty) {
                    const entry = querySnapshot.docs[0].data();
                    const submissionTime = entry.timestamp.toDate().getTime();
                    var timeLeft = Math.max(0, entry.wager - (Date.now() - submissionTime) / 1000);

                    if (timeLeft > 0) {
                        setGameState(prev => ({
                            ...prev,
                            word: entry.word,
                            wager: entry.wager,
                            timeLeft,
                            isActive: true,
                            useMultiplier: entry.useMultiplier
                        }));
                    } else {
                        // If time has expired, handle win
                        console.log('time expired');
                        handleWin();
                    }
                }
            } catch (error) {
                // Only show error if it's a critical error (not a missing document)
                if (error instanceof Error &&
                    !error.message.includes('No document to update') &&
                    !error.message.includes('Document does not exist')) {
                    console.error('Error fetching game state:', error);
                    addFeedback('Error loading game state. Please refresh the page.', 'error');
                }
            }
        };

        fetchGameState();
    }, []);

    // Timer effect
    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (gameState.isActive && gameState.timeLeft > 0) {
            timer = setInterval(() => {
                setGameState(prev => {
                    const newTimeLeft = prev.timeLeft - 1;
                    if (newTimeLeft <= 0) {
                        handleWin();
                        return { ...prev, timeLeft: 0, isActive: false, word: '' };
                    }
                    return { ...prev, timeLeft: newTimeLeft };
                });
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [gameState.isActive, gameState.timeLeft]);

    // Watch for word deletion
    useEffect(() => {
        if (!gameState.isActive || !gameState.word || !auth.currentUser) return;

        const submittedWordsRef = collection(db, 'submittedWords');
        const q = query(
            submittedWordsRef,
            where('word', '==', gameState.word),
            where('userId', '==', auth.currentUser.uid)
        );

        const unsubscribe = onSnapshot(q, async (snapshot) => {
            if (snapshot.empty) {
                // See if the word was deleted by someone else
                const wordQuery = query(submittedWordsRef, where('word', '==', gameState.word));

                const wordSnapshot = await getDocs(wordQuery);

                if (!wordSnapshot.empty) {
                    // Word was deleted by someone else
                    handleLoss();
                } else {
                    // Show loss message, already handled loss
                    addFeedback('Uh-oh! Someone else submitted this word first. You lose your wager.', 'error');

                    // Update local state
                    setGameState(prev => ({
                        ...prev,
                        isActive: false,
                        timeLeft: 0,
                        word: '',
                    }));

                    // Get user's score from database
                    const userRef = doc(db, 'users', auth.currentUser!.uid);
                    const userDoc = await getDoc(userRef);
                    const userData = userDoc.data();

                    setGameState(prev => ({
                        ...prev,
                        score: userData?.score || 0
                    }));
                }
            }
        });

        return () => unsubscribe();
    }, [gameState.isActive, gameState.word]);

    // Update user's last active status
    useEffect(() => {
        if (!auth.currentUser) return;

        const updateLastActive = async () => {
            const userRef = doc(db, 'users', auth.currentUser!.uid);
            await updateDoc(userRef, {
                lastActive: serverTimestamp()
            });
        };

        updateLastActive();
        const interval = setInterval(updateLastActive, 30000);
        return () => clearInterval(interval);
    }, []);

    const addFeedback = (message: string, type: 'success' | 'error') => {
        const id = feedbackId;
        setFeedbackId(prev => prev + 1);
        setFeedback(prev => [...prev, { message, type, id }]);

        setTimeout(() => {
            setFeedback(prev => prev.filter(f => f.id !== id));
        }, 5000);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!auth.currentUser || gameState.isActive || !isValidWord) {
            if (!isValidWord) {
                addFeedback('Please enter a valid word.', 'error');
            }
            return;
        }

        if (containsProfanity(gameState.word)) {
            addFeedback('This word is not allowed with profanity filter enabled.', 'error');
            return;
        }

        setIsLoading(true);
        try {
            const timestamp = serverTimestamp();
            // Check if the word is submitted by the user
            const submittedWordsRef = collection(db, 'submittedWords');
            const q = query(
                submittedWordsRef,
                where('word', '==', gameState.word.toLowerCase())
            );
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
                addFeedback('Uh-oh! Someone else submitted this word first. You lose your wager.', 'error');
                setIsLoading(false);
                handleLoss();
                return;
            }

            // Add the submission
            await addDoc(collection(db, 'submittedWords'), {
                userId: auth.currentUser.uid,
                username: auth.currentUser.displayName,
                word: gameState.word,
                timestamp,
                wager: gameState.wager,
                useMultiplier: gameState.useMultiplier
            });

            // Update dictionary entry
            const dictionaryRef = collection(db, 'dictionary');
            const wordQuery = query(dictionaryRef, where('word', '==', gameState.word.toLowerCase()));
            const wordSnapshot = await getDocs(wordQuery);

            if (wordSnapshot.empty) {
                // Create new word entry
                await addDoc(dictionaryRef, {
                    word: gameState.word.toLowerCase(),
                    count: 1,
                    lastUsed: timestamp
                });
            } else {
                // Update existing word entry
                const wordDoc = wordSnapshot.docs[0];
                await updateDoc(doc(db, 'dictionary', wordDoc.id), {
                    count: (wordDoc.data().count || 0) + 1,
                    lastUsed: timestamp
                });
            }

            // Update local state immediately
            setGameState(prev => ({
                ...prev,
                isActive: true,
                timeLeft: gameState.wager,
                word: gameState.word
            }));

            addFeedback('Entry submitted! Waiting for results...', 'success');
        } catch (error) {
            console.error('Error submitting word:', error);
            addFeedback('Error submitting word. Please try again.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleWin = async () => {
        if (!auth.currentUser) return;

        try {
            const userRef = doc(db, 'users', auth.currentUser.uid);
            const userDoc = await getDoc(userRef);

            if (!userDoc.exists()) return;

            const userData = userDoc.data();
            if (!userData) return;

            // Calculate new score
            const newScore = (userData.score || 0) + gameState.wager;

            // Update user's score and stats
            await updateDoc(userRef, {
                score: newScore,
                totalGames: (userData.totalGames || 0) + 1,
                totalWins: (userData.totalWins || 0) + 1,
                highestScore: Math.max(newScore, userData.highestScore || 0)
            });

            // Delete the submitted word from active submissions
            const submittedWordsRef = collection(db, 'submittedWords');
            const q = query(
                submittedWordsRef,
                where('word', '==', gameState.word),
                where('userId', '==', auth.currentUser.uid)
            );
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                await deleteDoc(doc(db, 'submittedWords', querySnapshot.docs[0].id));
            }

            // Update local state
            setGameState(prev => ({
                ...prev,
                isActive: false,
                timeLeft: 0,
                score: newScore,
                word: '',
                wager: 60, // Reset to default wager
                useMultiplier: false
            }));

            addFeedback(`Congratulations! You won ${gameState.wager} points!`, 'success');
        } catch (error) {
            console.error('Error handling win:', error);
            addFeedback('Error updating score. Please try again.', 'error');
        }
    };

    const handleLoss = async () => {
        if (!auth.currentUser) return;

        try {
            const userRef = doc(db, 'users', auth.currentUser.uid);
            const userDoc = await getDoc(userRef);

            if (!userDoc.exists()) return;

            const userData = userDoc.data();
            if (!userData) return;

            // If normal mode, subtract wager from score, if multiplier mode, reset wager to 60
            const newScore = gameState.useMultiplier ? (userData.score || 0) - 60 : (userData.score || 0) - gameState.wager;

            // Update user's score and stats
            await updateDoc(userRef, {
                score: newScore,
                totalGames: (userData.totalGames || 0) + 1,
                totalLosses: (userData.totalLosses || 0) + 1
            });

            // Get the submitted word
            const submittedWordsRef = collection(db, 'submittedWords');
            const q = query(
                submittedWordsRef,
                where('word', '==', gameState.word),
                where('userId', '==', auth.currentUser.uid)
            );
            const querySnapshot = await getDocs(q);

            // Delete the submitted word from active submissions
            if (!querySnapshot.empty) {
                await deleteDoc(doc(db, 'submittedWords', querySnapshot.docs[0].id));
            }

            // Update local state
            setGameState(prev => ({
                ...prev,
                isActive: false,
                timeLeft: 0,
                score: newScore,
                word: '',
                wager: 60, // Reset to default wager
                useMultiplier: false
            }));

            addFeedback('Uh-oh! Someone else submitted this word first. You lose your wager.', 'error');
        } catch (error) {
            console.error('Error handling loss:', error);
            addFeedback('Error updating score. Please try again.', 'error');
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="max-w-2xl mx-auto"
        >
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 shadow-xl p-6 transform hover:scale-[1.02] transition-all duration-300">
                <div className="flex flex-col items-center mb-6">
                    <ActivePlayers />
                    <div className="text-4xl font-bold bg-gradient-to-r from-indigo-500 to-pink-500 bg-clip-text text-transparent">
                        {gameState.score}
                    </div>
                    <div className="text-sm text-slate-400">Score</div>
                </div>

                <div className="fixed top-4 right-4 z-50 space-y-2">
                    <AnimatePresence>
                        {feedback.map(({ message, type, id }) => (
                            <motion.div
                                key={id}
                                initial={{ opacity: 0, x: 100, scale: 0.9 }}
                                animate={{ opacity: 1, x: 0, scale: 1 }}
                                exit={{ opacity: 0, x: 100, scale: 0.9 }}
                                transition={{ duration: 0.3 }}
                                className={`relative overflow-hidden rounded-lg shadow-lg ${type === 'success'
                                    ? 'bg-gradient-to-r from-green-500/90 to-emerald-500/90'
                                    : 'bg-gradient-to-r from-red-500/90 to-rose-500/90'
                                    } backdrop-blur-sm border border-white/20`}
                            >
                                <div className="px-4 py-3 text-white">
                                    <div className="flex items-center space-x-2">
                                        <span className="text-lg">{message}</span>
                                        <button
                                            onClick={() => setFeedback(prev => prev.filter(f => f.id !== id))}
                                            className="ml-2 text-white/80 hover:text-white transition-colors"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                                <div
                                    className="absolute bottom-0 left-0 h-1 bg-white/20"
                                    style={{
                                        animation: 'progress 5s linear forwards',
                                        width: '100%'
                                    }}
                                />
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="relative">
                        <label htmlFor="word" className="block text-sm font-medium text-slate-300 mb-2">
                            Enter a word or hyphenated phrase
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                id="word"
                                value={gameState.word}
                                onChange={(e) => setGameState(prev => ({ ...prev, word: e.target.value }))}
                                className={`w-full bg-white/5 border ${isCheckingWord
                                    ? 'border-yellow-500/50'
                                    : isValidWord
                                        ? 'border-green-500/50'
                                        : 'border-white/10'
                                    } rounded-xl px-4 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all`}
                                disabled={gameState.isActive}
                                required
                                placeholder="Type a word or hyphenated phrase..."
                            />
                            {isCheckingWord && (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-yellow-500 border-t-transparent"></div>
                                </div>
                            )}
                            {!isCheckingWord && isValidWord && (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                </div>
                            )}
                        </div>
                        <AnimatePresence>
                            {suggestions.length > 0 && !gameState.isActive && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="absolute z-10 w-full mt-1 bg-white/90 backdrop-blur-lg rounded-lg border border-white/20 shadow-lg max-h-60 overflow-y-auto"
                                >
                                    {suggestions.map((suggestion, index) => (
                                        <div
                                            key={index}
                                            className="p-3 hover:bg-white/5 hover:bg-white cursor-pointer border-b border-white/5 last:border-0"
                                            onClick={() => {
                                                setGameState(prev => ({ ...prev, word: suggestion.word }));
                                                setSuggestions([]);
                                            }}
                                        >
                                            <div className="text-black/90 font-medium">{suggestion.word}</div>
                                            <div className="text-slate-400 text-sm">{suggestion.definition}</div>
                                        </div>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label htmlFor="wager" className="block text-sm font-medium text-slate-300 mb-2">
                                Wager (seconds)
                            </label>
                            <div className="relative">
                                <select
                                    id="wager"
                                    value={gameState.wager}
                                    onChange={(e) => setGameState(prev => ({ ...prev, wager: Number(e.target.value) }))}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={gameState.isActive}
                                >
                                    <option value="30">30 seconds</option>
                                    <option value="60">60 seconds</option>
                                    <option value="120">120 seconds</option>
                                    <option value="300">300 seconds</option>
                                </select>
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white/50" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center space-x-2">
                            <button
                                type="button"
                                onClick={() => setGameState(prev => ({ ...prev, useMultiplier: !prev.useMultiplier }))}
                                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${gameState.useMultiplier ? 'bg-gradient-to-r from-indigo-500 to-pink-500' : 'bg-white/10'
                                    }`}
                                disabled={gameState.isActive}
                            >
                                <span
                                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${gameState.useMultiplier ? 'translate-x-5' : 'translate-x-0'
                                        }`}
                                />
                            </button>
                            <div className="flex flex-col">
                                <span className="text-sm font-medium text-slate-300">
                                    {gameState.useMultiplier ? '2x Multiplier Enabled' : 'Normal Mode'}
                                </span>
                                <span className="text-xs text-slate-400">
                                    {gameState.useMultiplier
                                        ? 'Win 2x points or lose all points'
                                        : 'Win wager points or lose wager points'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <motion.button
                        type="submit"
                        className="w-full bg-gradient-to-r from-indigo-500 to-pink-500 text-white px-6 py-3 rounded-xl font-semibold hover:opacity-90 transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={gameState.isActive || isLoading}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        {isLoading ? 'Submitting...' : 'Submit Entry'}
                    </motion.button>
                </form>
            </div>

            {/* Live Feed */}
            {gameState.word && gameState.timeLeft > 0 && (
                <LiveFeed
                    profanityFilter={profanityFilter}
                    censorWord={censorWord}
                />
            )}
        </motion.div>
    );
} 