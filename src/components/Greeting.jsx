import React, { useState, useEffect } from 'react';
import { cn } from '../lib/utils';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

export function Greeting({ className }) {
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const getGreeting = () => {
        const hours = time.getHours();
        if (hours < 12) return 'Good Morning';
        if (hours < 18) return 'Good Afternoon';
        return 'Good Evening';
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className={cn("flex flex-col items-center text-center space-y-2", className)}
        >
            <h1 className="text-7xl md:text-9xl font-bold tracking-tight text-white mb-4 drop-shadow-2xl">
                {format(time, 'HH:mm')}
            </h1>
            <h2 className="text-2xl md:text-4xl font-light text-slate-200">
                {getGreeting()}, <span className="font-semibold text-blue-300">Traveler</span>.
            </h2>
        </motion.div>
    );
}
