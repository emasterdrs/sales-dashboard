import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Check, Circle } from 'lucide-react';
import { cn } from '../lib/utils';

export function TodoWidget() {
    const [todos, setTodos] = useState(() => {
        const saved = localStorage.getItem('dashboard-todos');
        return saved ? JSON.parse(saved) : [];
    });
    const [input, setInput] = useState('');

    useEffect(() => {
        localStorage.setItem('dashboard-todos', JSON.stringify(todos));
    }, [todos]);

    const addTodo = (e) => {
        e.preventDefault();
        if (!input.trim()) return;
        setTodos([...todos, { id: Date.now(), text: input, completed: false }]);
        setInput('');
    };

    const toggleTodo = (id) => {
        setTodos(todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
    };

    const removeTodo = (id) => {
        setTodos(todos.filter(t => t.id !== id));
    };

    return (
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-3xl h-full flex flex-col min-h-[300px]">
            <h3 className="text-xl font-semibold mb-4 text-slate-100 flex items-center">
                Tasks
                <span className="ml-auto text-xs font-normal px-2 py-1 bg-white/10 rounded-full text-slate-300">
                    {todos.filter(t => !t.completed).length} remaining
                </span>
            </h3>

            <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                <AnimatePresence>
                    {todos.length === 0 && (
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-slate-500 text-sm text-center mt-10"
                        >
                            No tasks yet. Add one!
                        </motion.p>
                    )}
                    {todos.map(todo => (
                        <motion.div
                            key={todo.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="group flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors"
                        >
                            <button
                                onClick={() => toggleTodo(todo.id)}
                                className={cn(
                                    "flex-shrink-0 w-5 h-5 rounded-full border border-slate-500 flex items-center justify-center transition-all",
                                    todo.completed ? "bg-emerald-500 border-emerald-500" : "hover:border-slate-300"
                                )}
                            >
                                {todo.completed && <Check size={12} className="text-white" />}
                            </button>
                            <span className={cn(
                                "flex-1 text-sm transition-all",
                                todo.completed ? "text-slate-500 line-through" : "text-slate-200"
                            )}>
                                {todo.text}
                            </span>
                            <button
                                onClick={() => removeTodo(todo.id)}
                                className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 transition-opacity"
                            >
                                <X size={16} />
                            </button>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            <form onSubmit={addTodo} className="mt-4 relative">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="New task..."
                    className="w-full bg-slate-800/50 border border-slate-700/50 focus:border-slate-500 rounded-xl px-4 py-2.5 text-sm outline-none placeholder:text-slate-600 transition-all text-white"
                />
                <button
                    type="submit"
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-slate-700 hover:bg-blue-600 rounded-lg text-slate-200 transition-colors"
                >
                    <Plus size={14} />
                </button>
            </form>
        </div>
    );
}
