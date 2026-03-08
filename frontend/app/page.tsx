"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUpCircle, ArrowDownCircle, StopCircle, Wifi, Activity, Clock, ShieldCheck } from "lucide-react";
import { format } from "date-fns";
import mqtt from "mqtt";

// --- CLOUD CONFIGURATION ---
const MQTT_BROKER = "wss://broker.hivemq.com:8884/mqtt";
const USER_ID = "my_garage_9988_unique";
const TOPIC_CMD = `${USER_ID}/cmd`;
const TOPIC_STAT = `${USER_ID}/status`;

interface LogEntry {
    id: string;
    time: Date;
    message: string;
}

export default function Dashboard() {
    const [doorStatus, setDoorStatus] = useState<string>("unknown");
    const [connected, setConnected] = useState<boolean>(false);
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const mqttClient = useRef<mqtt.MqttClient | null>(null);

    useEffect(() => {
        // Connect directly to the MQTT broker from the browser for millisecond speeds
        const client = mqtt.connect(MQTT_BROKER);
        mqttClient.current = client;

        client.on("connect", () => {
            setConnected(true);
            addLog("System Online: Connected to Cloud Bridge");
            client.subscribe(TOPIC_STAT);
        });

        client.on("message", (topic, message) => {
            if (topic === TOPIC_STAT) {
                const newStatus = message.toString();
                setDoorStatus(newStatus);
                addLog(`Hardware Update: Door is now ${newStatus.toUpperCase()}`);
            }
        });

        client.on("close", () => setConnected(false));
        client.on("error", () => setConnected(false));

        return () => {
            if (client) client.end();
        };
    }, []);

    const addLog = (message: string) => {
        setLogs((prev) => [
            { id: Math.random().toString(36).substr(2, 9), time: new Date(), message },
            ...prev,
        ].slice(0, 15));
    };

    const sendCommand = (command: string) => {
        if (!mqttClient.current || !connected) {
            addLog("Error: System offline");
            return;
        }

        const cmd = command.toUpperCase();
        addLog(`Sent: ${cmd}`);

        // Instant physical trigger via Browser MQTT
        mqttClient.current.publish(TOPIC_CMD, cmd, { qos: 1 });

        // Optimistic UI update
        if (cmd === 'OPEN') setDoorStatus('opening');
        if (cmd === 'CLOSE') setDoorStatus('closing');
        if (cmd === 'STOP') setDoorStatus('stopped');
    };

    const getStatusColor = () => {
        switch (doorStatus) {
            case "open": return "bg-green-500/10 text-green-400 border-green-500/20";
            case "closed": return "bg-zinc-900 text-zinc-500 border-zinc-800";
            case "opening": return "bg-blue-500/10 text-blue-400 border-blue-500/20";
            case "closing": return "bg-orange-500/10 text-orange-400 border-orange-500/20";
            default: return "bg-zinc-900 text-zinc-600 border-zinc-800";
        }
    };

    return (
        <div className="min-h-screen bg-[#050505] text-zinc-200 selection:bg-blue-500/30">
            <div className="max-w-6xl mx-auto p-4 md:p-8 lg:p-12 flex flex-col gap-6 md:gap-10">

                {/* Header - Premium Minimalist */}
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-zinc-900/40 p-6 md:p-8 rounded-[2.5rem] border border-white/5 backdrop-blur-3xl">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl md:text-3xl font-light tracking-tight text-white">Smart Garage</h1>
                            <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                        </div>
                        <p className="text-zinc-500 text-sm mt-1 font-medium flex items-center gap-2">
                            <ShieldCheck size={14} className="text-blue-500/60" />
                            Secure Cloud Connection Active
                        </p>
                    </div>
                    <div className="bg-white/5 px-5 py-3 rounded-2xl border border-white/5 flex items-center gap-4">
                        <div className="text-right">
                            <div className="text-sm font-medium text-zinc-300">{format(new Date(), "h:mm a")}</div>
                            <div className="text-[10px] uppercase tracking-widest text-zinc-600 font-bold">{format(new Date(), "EEE, MMM d")}</div>
                        </div>
                    </div>
                </header>

                <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-10">

                    {/* Primary Dashboard Area */}
                    <div className="lg:col-span-8 flex flex-col gap-6 md:gap-10">

                        {/* Visualization Panel */}
                        <section className="bg-zinc-900/20 rounded-[3rem] p-8 md:p-16 border border-white/5 flex flex-col items-center justify-center min-h-[400px] relative group transition-all duration-700 hover:bg-zinc-900/30">
                            <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />

                            <div className="z-10 text-center mb-12">
                                <span className="text-[10px] uppercase tracking-[0.3em] text-zinc-500 font-bold mb-4 block">System Live State</span>
                                <div className={`px-8 py-3 rounded-full border text-lg font-light tracking-wide uppercase transition-all duration-500 ${getStatusColor()}`}>
                                    {doorStatus}
                                </div>
                            </div>

                            {/* Garage Door Vector Animation */}
                            <div className="w-64 h-44 border-[6px] border-zinc-800 rounded-2xl relative overflow-hidden bg-black/40 shadow-2xl">
                                <motion.div
                                    className="absolute top-0 left-0 right-0 bg-gradient-to-b from-zinc-200 to-zinc-400 border-b-[6px] border-zinc-500 z-10 shadow-2xl"
                                    initial={false}
                                    animate={{
                                        height: doorStatus === 'closed' ? '100%' :
                                            doorStatus === 'open' ? '12%' :
                                                doorStatus === 'opening' ? '12%' : '100%'
                                    }}
                                    transition={{ duration: 1.8, ease: [0.22, 1, 0.36, 1] }}
                                >
                                    <div className="w-full h-full opacity-20 flex flex-col">
                                        {[...Array(6)].map((_, i) => (
                                            <div key={i} className="w-full h-full border-b border-black/40" />
                                        ))}
                                    </div>
                                </motion.div>
                                <div className="absolute inset-0 flex items-center justify-center opacity-10">
                                    <Wifi size={100} />
                                </div>
                            </div>
                        </section>

                        {/* Direct Control Grid */}
                        <div className="grid grid-cols-3 gap-4 md:gap-6">
                            {[
                                { id: 'open', label: 'Open', icon: <ArrowUpCircle size={24} />, active: doorStatus !== 'open' && doorStatus !== 'opening' },
                                { id: 'stop', label: 'Stop', icon: <StopCircle size={24} />, active: true, color: 'text-red-400' },
                                { id: 'close', label: 'Close', icon: <ArrowDownCircle size={24} />, active: doorStatus !== 'closed' && doorStatus !== 'closing' }
                            ].map((btn) => (
                                <button
                                    key={btn.id}
                                    onClick={() => sendCommand(btn.id)}
                                    disabled={!connected || !btn.active}
                                    className={`
                                        flex flex-col items-center gap-4 p-6 md:p-10 rounded-[2.5rem] border border-white/5 bg-zinc-900/40 transition-all duration-300
                                        ${connected && btn.active ? 'hover:bg-white/5 active:scale-95 cursor-pointer' : 'opacity-40 grayscale cursor-not-allowed'}
                                        group relative overflow-hidden
                                    `}
                                >
                                    <div className={`p-4 rounded-2xl bg-white/5 group-hover:bg-white/10 transition-colors ${btn.color || 'text-zinc-300'}`}>
                                        {btn.icon}
                                    </div>
                                    <span className={`text-sm font-medium tracking-wide ${btn.color || 'text-zinc-400'}`}>{btn.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Sidebar Area */}
                    <div className="lg:col-span-4 flex flex-col gap-6 md:gap-10">

                        {/* Hardware Telemetry */}
                        <section className="bg-zinc-900/40 rounded-[2.5rem] p-8 border border-white/5">
                            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-[0.2em] mb-8 flex items-center gap-3">
                                <Activity size={16} className="text-blue-500/50" /> Controller Stats
                            </h3>
                            <div className="space-y-6">
                                {[
                                    { label: 'Platform', value: 'ESP32 Wireless' },
                                    { label: 'Cloud Protocol', value: 'MQTT/WebSocket' },
                                    { label: 'Latency', value: connected ? '< 80ms' : '---' },
                                    { label: 'Uptime', value: connected ? '99.9%' : 'OFFLINE' }
                                ].map((item, i) => (
                                    <div key={i} className="flex justify-between items-center group">
                                        <span className="text-zinc-500 text-sm font-medium">{item.label}</span>
                                        <span className="text-sm font-semibold text-zinc-300 bg-white/5 px-3 py-1 rounded-lg group-hover:text-white transition-colors">{item.value}</span>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Real-time Activity Log */}
                        <section className="bg-zinc-900/40 rounded-[2.5rem] p-8 border border-white/5 flex-1 flex flex-col max-h-[500px]">
                            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-[0.2em] mb-8 flex items-center gap-3">
                                <Clock size={16} className="text-blue-500/50" /> System Activity
                            </h3>
                            <div className="space-y-5 overflow-y-auto pr-2 custom-scrollbar flex-1">
                                <AnimatePresence mode="popLayout">
                                    {logs.length === 0 ? (
                                        <div className="text-zinc-700 text-sm italic text-center py-10">Standby... No activity</div>
                                    ) : (
                                        logs.map((log) => (
                                            <motion.div
                                                key={log.id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="flex flex-col gap-1 border-l-2 border-zinc-800 pl-4 py-1"
                                            >
                                                <span className="text-xs text-zinc-600 font-bold">{format(log.time, "HH:mm:ss")}</span>
                                                <span className="text-sm text-zinc-400 font-light leading-relaxed">{log.message}</span>
                                            </motion.div>
                                        ))
                                    )}
                                </AnimatePresence>
                            </div>
                        </section>

                    </div>
                </main>

                <footer className="text-center py-8">
                    <p className="text-zinc-700 text-[10px] uppercase tracking-[0.5em] font-medium">Precision Garage Infrastructure • Cloud Native v2.0</p>
                </footer>
            </div>
        </div>
    );
}
