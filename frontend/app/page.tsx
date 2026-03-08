"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Power, ArrowUpCircle, ArrowDownCircle, StopCircle, Wifi, Activity, Clock } from "lucide-react";
import { format } from "date-fns";

const API_URL = "/api";

interface LogEntry {
    id: string;
    time: Date;
    message: string;
}

export default function Dashboard() {
    const [doorStatus, setDoorStatus] = useState<string>("unknown");
    const [connected, setConnected] = useState<boolean>(false);
    const [logs, setLogs] = useState<LogEntry[]>([]);

    useEffect(() => {
        // Poll for status
        const fetchStatus = async () => {
            try {
                const res = await fetch(`${API_URL}/status`);
                const data = await res.json();
                if (data.status !== doorStatus && doorStatus !== "unknown") {
                    addLog(`Door status changed to ${data.status}`);
                }
                setDoorStatus(data.status);
                setConnected(data.connected);
            } catch (err) {
                setConnected(false);
            }
        };

        fetchStatus();
        const interval = setInterval(fetchStatus, 1000);
        return () => clearInterval(interval);
    }, [doorStatus]);

    const addLog = (message: string) => {
        setLogs((prev) => [
            { id: Math.random().toString(36).substr(2, 9), time: new Date(), message },
            ...prev,
        ].slice(0, 10)); // keep last 10
    };

    const sendCommand = async (command: string) => {
        try {
            addLog(`Sending ${command.toUpperCase()} command...`);
            const res = await fetch(`${API_URL}/${command}`, { method: 'POST' });
            const data = await res.json();
            if (data.success) {
                addLog(`Command successful: ${command.toUpperCase()}`);
                setDoorStatus(data.status);
            }
        } catch (err) {
            addLog(`Failed to send ${command} command.`);
        }
    };

    const getStatusColor = () => {
        switch (doorStatus) {
            case "open": return "bg-green-500/20 text-green-400 border-green-500/30";
            case "closed": return "bg-zinc-800 text-zinc-400 border-zinc-700";
            case "opening": return "bg-blue-500/20 text-blue-400 border-blue-500/30";
            case "closing": return "bg-orange-500/20 text-orange-400 border-orange-500/30";
            default: return "bg-zinc-800 text-zinc-500 border-zinc-700";
        }
    };

    return (
        <div className="min-h-screen p-4 md:p-8 flex flex-col items-center max-w-5xl mx-auto space-y-8">

            {/* Header */}
            <header className="w-full flex justify-between items-center bg-black/40 p-6 rounded-[2rem] glass-panel mt-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-medium tracking-tight">Smart Garage</h1>
                    <p className="text-zinc-500 text-sm mt-1 flex items-center gap-2">
                        <Wifi size={14} className={connected ? "text-green-500" : "text-red-500"} />
                        {connected ? "Connected to Wireless Controller" : "Controller Offline"}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="text-right hidden md:block">
                        <div className="text-sm font-medium">{format(new Date(), "h:mm a")}</div>
                        <div className="text-xs text-zinc-500">{format(new Date(), "MMM d, yyyy")}</div>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full">

                {/* Main Control Panel */}
                <section className="lg:col-span-2 space-y-8">

                    {/* Status Display */}
                    <div className="glass-panel rounded-[2rem] p-8 md:p-12 relative overflow-hidden flex flex-col items-center justify-center min-h-[300px]">
                        {/* Background animated gradient logic could go here */}

                        <div className="z-10 text-center">
                            <h2 className="text-zinc-400 text-sm uppercase tracking-[0.2em] mb-4">Door Status</h2>
                            <div className={`px-6 py-2 rounded-full border inline-flex items-center gap-2 mb-8 transition-colors duration-500 ${getStatusColor()}`}>
                                <div className={`w-2 h-2 rounded-full ${doorStatus === 'open' ? 'bg-green-400 animate-pulse' : doorStatus === 'opening' || doorStatus === 'closing' ? 'bg-current animate-ping' : 'bg-current'}`} />
                                <span className="text-sm font-medium tracking-wide uppercase">{doorStatus}</span>
                            </div>
                        </div>

                        {/* Door Visual Representation */}
                        <div className="w-48 h-32 border-4 border-zinc-800 rounded-lg relative overflow-hidden bg-zinc-950/50 mt-4">
                            <motion.div
                                className="absolute top-0 left-0 right-0 bg-zinc-200/90 rounded-b-sm border-b-4 border-zinc-400 shadow-[0_10px_30px_rgba(255,255,255,0.1)]"
                                initial={false}
                                animate={{
                                    height: doorStatus === 'closed' ? '100%' :
                                        doorStatus === 'open' ? '10%' :
                                            doorStatus === 'opening' ? '10%' : '100%'
                                }}
                                transition={{ duration: 2, ease: "easeInOut" }}
                            >
                                {/* Door panels */}
                                <div className="w-full h-full flex flex-col justify-evenly">
                                    {[1, 2, 3, 4].map(i => (
                                        <div key={i} className="w-full h-[1px] bg-black/20" />
                                    ))}
                                </div>
                            </motion.div>
                        </div>

                    </div>

                    {/* Controls */}
                    <div className="grid grid-cols-3 gap-4">
                        <button
                            onClick={() => sendCommand('open')}
                            disabled={!connected || doorStatus === 'open' || doorStatus === 'opening'}
                            className="glass-panel p-6 rounded-3xl flex flex-col items-center gap-4 hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed button-press group transition-colors"
                        >
                            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                                <ArrowUpCircle className="text-zinc-300" size={24} />
                            </div>
                            <span className="text-sm font-medium">Open</span>
                        </button>
                        <button
                            onClick={() => sendCommand('stop')}
                            disabled={!connected}
                            className="glass-panel p-6 rounded-3xl flex flex-col items-center gap-4 hover:bg-red-500/10 disabled:opacity-50 disabled:cursor-not-allowed button-press group transition-colors"
                        >
                            <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center group-hover:bg-red-500/20 transition-colors">
                                <StopCircle className="text-red-400" size={24} />
                            </div>
                            <span className="text-sm font-medium text-red-400">Stop</span>
                        </button>
                        <button
                            onClick={() => sendCommand('close')}
                            disabled={!connected || doorStatus === 'closed' || doorStatus === 'closing'}
                            className="glass-panel p-6 rounded-3xl flex flex-col items-center gap-4 hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed button-press group transition-colors"
                        >
                            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                                <ArrowDownCircle className="text-zinc-300" size={24} />
                            </div>
                            <span className="text-sm font-medium">Close</span>
                        </button>
                    </div>
                </section>

                {/* Sidebar */}
                <aside className="space-y-6">

                    {/* System Info */}
                    <div className="glass-panel p-6 rounded-3xl">
                        <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-6 flex items-center gap-2">
                            <Activity size={16} /> Device Stats
                        </h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-zinc-500 text-sm">Controller</span>
                                <span className="text-sm font-medium">ESP32 Wireless</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-zinc-500 text-sm">Connection</span>
                                <span className="text-sm font-medium">WiFi (Local Network)</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-zinc-500 text-sm">Status</span>
                                <span className="text-sm font-medium">Encrypted Bridge</span>
                            </div>
                        </div>
                    </div>

                    {/* Activity Log */}
                    <div className="glass-panel p-6 rounded-3xl flex-1 max-h-[400px] flex flex-col">
                        <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-6 flex items-center gap-2">
                            <Clock size={16} /> Activity Log
                        </h3>
                        <div className="space-y-4 overflow-y-auto pr-2 flex-1 scrollbar-hide">
                            <AnimatePresence>
                                {logs.length === 0 ? (
                                    <div className="text-zinc-600 text-sm italic text-center py-4">No recent activity</div>
                                ) : (
                                    logs.map((log) => (
                                        <motion.div
                                            key={log.id}
                                            initial={{ opacity: 0, x: 10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className="flex items-start justify-between border-b border-zinc-800/50 pb-3 last:border-0"
                                        >
                                            <span className="text-sm text-zinc-300">{log.message}</span>
                                            <span className="text-xs text-zinc-600 whitespace-nowrap ml-4">
                                                {format(log.time, "HH:mm:ss")}
                                            </span>
                                        </motion.div>
                                    ))
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                </aside>
            </div>
        </div>
    );
}
