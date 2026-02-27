import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const QUOTES = [
    { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
    { text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
    { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
    { text: "Act as if what you do makes a difference. It does.", author: "William James" },
    { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
];

export function Quote() {
    const [quote, setQuote] = useState(QUOTES[0]);

    useEffect(() => {
        // Pick a random quote on mount
        const random = Math.floor(Math.random() * QUOTES.length);
        setQuote(QUOTES[random]);
    }, []);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="max-w-xl mx-auto text-center mt-8 p-6 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group"
        >
            <p className="text-lg md:text-xl font-medium italic text-slate-700 mb-3 group-hover:text-indigo-600 transition-colors">"{quote.text}"</p>
            <span className="text-sm font-bold text-slate-400 block tracking-tight uppercase">— {quote.author}</span>
        </motion.div>
    );
}
