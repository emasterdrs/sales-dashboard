import React from 'react';
import { cn } from '../lib/utils';

export function Layout({ children, className }) {
    return (
        <div className={cn(
            "min-h-screen w-full bg-slate-950 text-slate-100",
            "bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950",
            "flex flex-col items-center justify-center p-4 sm:p-8",
            "font-sans antialiased overflow-hidden relative",
            className
        )}>
            {/* Background Decor */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px]" />
            </div>

            <div className="relative z-10 w-full max-w-7xl mx-auto flex flex-col h-full">
                {children}
            </div>
        </div>
    );
}
