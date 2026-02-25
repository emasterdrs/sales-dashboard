import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, X, Globe, ExternalLink } from 'lucide-react';
import { cn } from '../lib/utils';

const DEFAULT_LINKS = [
    { id: '1', title: 'Google', url: 'https://google.com' },
    { id: '2', title: 'YouTube', url: 'https://youtube.com' },
    { id: '3', title: 'GitHub', url: 'https://github.com' },
];

export function QuickLinks() {
    const [links, setLinks] = useState(() => {
        const saved = localStorage.getItem('dashboard-links');
        return saved ? JSON.parse(saved) : DEFAULT_LINKS;
    });
    const [isAdding, setIsAdding] = useState(false);
    const [newLink, setNewLink] = useState({ title: '', url: '' });

    useEffect(() => {
        localStorage.setItem('dashboard-links', JSON.stringify(links));
    }, [links]);

    const addLink = (e) => {
        e.preventDefault();
        if (!newLink.title || !newLink.url) return;

        let url = newLink.url;
        if (!url.startsWith('http')) url = `https://${url}`;

        setLinks([...links, { id: Date.now().toString(), title: newLink.title, url }]);
        setNewLink({ title: '', url: '' });
        setIsAdding(false);
    };

    const removeLink = (e, id) => {
        e.preventDefault();
        e.stopPropagation();
        setLinks(links.filter(l => l.id !== id));
    };

    return (
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-3xl h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-slate-100">Quick Links</h3>
                <button
                    onClick={() => setIsAdding(!isAdding)}
                    className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 transition-colors"
                >
                    {isAdding ? <X size={16} /> : <Plus size={16} />}
                </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 overflow-y-auto pr-1 custom-scrollbar">
                {links.map(link => (
                    <motion.a
                        key={link.id}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="group relative flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-800/40 border border-slate-700/50 hover:bg-slate-700/60 hover:border-slate-500 transition-all text-center gap-2"
                    >
                        <div className="w-8 h-8 rounded-full bg-slate-700 group-hover:bg-blue-600/20 flex items-center justify-center transition-colors text-slate-400 group-hover:text-blue-400">
                            <Globe size={18} />
                        </div>
                        <span className="text-xs font-medium text-slate-300 group-hover:text-white truncate w-full">
                            {link.title}
                        </span>

                        <button
                            onClick={(e) => removeLink(e, link.id)}
                            className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-red-400 transition-all"
                        >
                            <X size={12} />
                        </button>
                    </motion.a>
                ))}
            </div>

            {isAdding && (
                <motion.form
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    onSubmit={addLink}
                    className="mt-4 p-3 bg-slate-900/50 rounded-xl border border-white/5 space-y-2"
                >
                    <input
                        type="text"
                        placeholder="Title"
                        value={newLink.title}
                        onChange={e => setNewLink({ ...newLink, title: e.target.value })}
                        className="w-full bg-transparent border-b border-white/10 py-1 text-sm outline-none focus:border-blue-500/50 transition-colors placeholder:text-slate-600"
                        autoFocus
                    />
                    <input
                        type="text"
                        placeholder="URL"
                        value={newLink.url}
                        onChange={e => setNewLink({ ...newLink, url: e.target.value })}
                        className="w-full bg-transparent border-b border-white/10 py-1 text-sm outline-none focus:border-blue-500/50 transition-colors placeholder:text-slate-600"
                    />
                    <button
                        type="submit"
                        className="w-full mt-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium py-1.5 rounded-lg transition-colors"
                    >
                        Add Link
                    </button>
                </motion.form>
            )}
        </div>
    );
}
