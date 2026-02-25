import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'framer-motion';

export function Pomodoro() {
    const [timeLeft, setTimeLeft] = useState(25 * 60);
    const [isActive, setIsActive] = useState(false);
    const [mode, setMode] = useState('focus'); // 'focus' | 'break'

    useEffect(() => {
        let interval = null;
        if (isActive && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft((time) => time - 1);
            }, 1000);
        } else if (timeLeft === 0) {
            setIsActive(false);
            // Optional: Play sound here
        }
        return () => clearInterval(interval);
    }, [isActive, timeLeft]);

    const toggleTimer = () => setIsActive(!isActive);

    const resetTimer = () => {
        setIsActive(false);
        setTimeLeft(mode === 'focus' ? 25 * 60 : 5 * 60);
    };

    const switchMode = (newMode) => {
        setMode(newMode);
        setIsActive(false);
        setTimeLeft(newMode === 'focus' ? 25 * 60 : 5 * 60);
    };

    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    const progress = 1 - (timeLeft / (mode === 'focus' ? 25 * 60 : 5 * 60));

    return (
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-3xl h-full flex flex-col items-center justify-center relative overflow-hidden">
            {/* Background Progress visual */}
            <div
                className="absolute bottom-0 left-0 h-1 bg-blue-500/50 transition-all duration-1000"
                style={{ width: `${progress * 100}%` }}
            />

            <div className="flex gap-2 mb-6 p-1 bg-slate-800/50 rounded-full">
                <button
                    onClick={() => switchMode('focus')}
                    className={cn(
                        "px-4 py-1.5 rounded-full text-xs font-medium transition-all",
                        mode === 'focus' ? "bg-slate-700 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
                    )}
                >
                    Focus
                </button>
                <button
                    onClick={() => switchMode('break')}
                    className={cn(
                        "px-4 py-1.5 rounded-full text-xs font-medium transition-all",
                        mode === 'break' ? "bg-emerald-600 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
                    )}
                >
                    Break
                </button>
            </div>

            <div className="text-6xl font-bold font-mono tracking-wider tabular-nums text-slate-100 mb-8">
                {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </div>

            <div className="flex items-center gap-4">
                <button
                    onClick={toggleTimer}
                    className={cn(
                        "w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-lg hover:scale-105 active:scale-95",
                        isActive ? "bg-amber-500/20 text-amber-500 border border-amber-500/50" : "bg-blue-600 text-white"
                    )}
                >
                    {isActive ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />}
                </button>
                <button
                    onClick={resetTimer}
                    className="w-10 h-10 rounded-full bg-slate-800/50 text-slate-400 hover:bg-slate-800 hover:text-white flex items-center justify-center transition-all"
                >
                    <RotateCcw size={18} />
                </button>
            </div>
        </div>
    );
}
