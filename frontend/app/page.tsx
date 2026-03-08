"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUpCircle, ArrowDownCircle, StopCircle, Wifi, Activity, Clock, ShieldCheck, Lock, Unlock, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import mqtt from "mqtt";

// --- CLOUD CONFIGURATION ---
const MQTT_BROKER = "wss://broker.hivemq.com:8884/mqtt";
const USER_ID = "my_garage_9988_unique";
const TOPIC_CMD = `${USER_ID}/cmd`;
const TOPIC_STAT = `${USER_ID}/status`;
const MASTER_PASSCODE = "1234"; // Default security code

interface LogEntry {
    id: string;
    time: Date;
    message: string;
}

export default function Dashboard() {
    const [doorStatus, setDoorStatus] = useState<string>("unknown");
    const [connected, setConnected] = useState<boolean>(false);
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [isLocked, setIsLocked] = useState<boolean>(true);
    const [passcodeInput, setPasscodeInput] = useState<string>("");
    const [showSecurityAlert, setShowSecurityAlert] = useState<boolean>(false);
    const mqttClient = useRef<mqtt.MqttClient | null>(null);

    useEffect(() => {
        // Connect directly to the MQTT broker from the browser for millisecond speeds
        const client = mqtt.connect(MQTT_BROKER);
        mqttClient.current = client;

        client.on("connect", () => {
            setConnected(true);
            addLog("System Secured: Encrypted Bridge Established");
            client.subscribe(TOPIC_STAT);
        });

        client.on("message", (topic, message) => {
            if (topic === TOPIC_STAT) {
                const newStatus = message.toString();
                setDoorStatus(newStatus);
                addLog(`Security Update: Door state is ${newStatus.toUpperCase()}`);
            }
        });

        client.on("close", () => setConnected(false));
        return () => { if (client) client.end(); };
    }, []);

    const handlePasscode = (val: string) => {
        const newCode = passcodeInput + val;
        if (newCode.length <= 4) {
            setPasscodeInput(newCode);
            if (newCode === MASTER_PASSCODE) {
                setIsLocked(false);
                setPasscodeInput("");
                addLog("Security: User authenticated successfully");
            } else if (newCode.length === 4) {
                setPasscodeInput("");
                setShowSecurityAlert(true);
                setTimeout(() => setShowSecurityAlert(false), 2000);
                addLog("Security Warning: Failed authentication attempt");
            }
        }
    };

    const addLog = (message: string) => {
        setLogs((prev) => [
            { id: Math.random().toString(36).substr(2, 9), time: new Date(), message },
            ...prev,
        ].slice(0, 15));
    };

    const sendCommand = (command: string) => {
        if (isLocked && command !== 'stop') return;
        if (!mqttClient.current || !connected) return;

        const cmd = command.toUpperCase();
        addLog(`Protocol: Executing ${cmd}`);
        mqttClient.current.publish(TOPIC_CMD, cmd, { qos: 1 });

        if (cmd === 'OPEN') setDoorStatus('opening');
        if (cmd === 'CLOSE') setDoorStatus('closing');
        if (cmd === 'STOP') {
            setDoorStatus('stopped');
            addLog("EMERGENCY: Motion halted by user");
        }
    };

    const getStatusColor = () => {
        switch (doorStatus) {
            case "open": return "bg-green-500/10 text-green-400 border-green-500/20";
            case "closed": return "bg-zinc-900 text-zinc-500 border-zinc-800";
            case "opening": return "bg-blue-500/10 text-blue-400 border-blue-500/20";
            case "closing": return "bg-orange-500/10 text-orange-400 border-orange-500/20";
            case "stopped": return "bg-red-500/10 text-red-400 border-red-500/20";
            default: return "bg-zinc-900 text-zinc-600 border-zinc-800";
        }
    };

    return (
        <div className="min-h-screen bg-[#050505] text-zinc-200 selection:bg-blue-500/30 font-sans">
            <div className="max-w-6xl mx-auto p-4 md:p-8 lg:p-12 flex flex-col gap-6 md:gap-10">

                {/* Header */}
                <header className="flex justify-between items-center bg-zinc-900/40 p-6 md:p-8 rounded-[2.5rem] border border-white/5 backdrop-blur-3xl">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-3">
                            <h1 className="text-xl md:text-2xl font-light tracking-tight text-white">Garage Command</h1>
                            <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-red-500'}`} />
                        </div>
                        <div className="flex items-center gap-2 text-zinc-500 text-[10px] uppercase tracking-widest font-bold">
                            <ShieldCheck size={12} className="text-blue-500" />
                            {isLocked ? "System Locked" : "Authenticated Access"}
                        </div>
                    </div>

                    <button
                        onClick={() => setIsLocked(true)}
                        className={`p-4 rounded-2xl transition-all duration-500 ${isLocked ? 'bg-zinc-800 text-zinc-500' : 'bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30'}`}
                    >
                        {isLocked ? <Lock size={20} /> : <Unlock size={20} />}
                    </button>
                </header>

                <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-10 relative">

                    {/* Security Overlay */}
                    <AnimatePresence>
                        {isLocked && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 z-50 rounded-[3rem] backdrop-blur-xl bg-black/60 border border-white/5 flex flex-col items-center justify-center p-8"
                            >
                                <motion.div
                                    initial={{ y: 20 }}
                                    animate={{ y: 0 }}
                                    className="text-center space-y-8"
                                >
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="w-16 h-16 rounded-full bg-zinc-900 flex items-center justify-center border border-white/10">
                                            <Lock className="text-zinc-500" size={28} />
                                        </div>
                                        <h2 className="text-xl font-light text-white">Enter Security Passcode</h2>
                                        <div className="flex gap-4">
                                            {[...Array(4)].map((_, i) => (
                                                <div key={i} className={`w-3 h-3 rounded-full border transition-all duration-300 ${passcodeInput.length > i ? 'bg-blue-500 border-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]' : 'border-zinc-700'}`} />
                                            ))}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-4">
                                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, "", 0, "⌫"].map((num, i) => (
                                            <button
                                                key={i}
                                                onClick={() => {
                                                    if (num === "⌫") setPasscodeInput(p => p.slice(0, -1));
                                                    else if (num !== "") handlePasscode(num.toString());
                                                }}
                                                className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center text-xl font-light border border-white/5 bg-zinc-900/50 hover:bg-zinc-800 transition-colors ${num === "" ? "opacity-0 cursor-default" : ""}`}
                                            >
                                                {num}
                                            </button>
                                        ))}
                                    </div>

                                    {showSecurityAlert && (
                                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 text-red-500 text-sm justify-center">
                                            <AlertTriangle size={16} /> Access Denied
                                        </motion.div>
                                    )}
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Primary Dashboard Area */}
                    <div className="lg:col-span-8 flex flex-col gap-6 md:gap-10">
                        {/* Visualization */}
                        <section className="bg-zinc-900/20 rounded-[3rem] p-10 md:p-16 border border-white/5 flex flex-col items-center justify-center min-h-[400px]">
                            <div className="z-10 text-center mb-10">
                                <div className={`px-10 py-3 rounded-full border text-xl font-light tracking-[0.1em] uppercase shadow-lg transition-all duration-500 ${getStatusColor()}`}>
                                    {doorStatus}
                                </div>
                            </div>
                            <div className="w-64 h-48 border-[8px] border-zinc-800 rounded-2xl relative overflow-hidden bg-black/40">
                                <motion.div
                                    className="absolute top-0 left-0 right-0 bg-gradient-to-b from-zinc-300 to-zinc-500 border-b-[6px] border-zinc-600 z-10"
                                    animate={{ height: doorStatus === 'closed' ? '100%' : (doorStatus === 'open' || doorStatus === 'opening') ? '15%' : '100%' }}
                                    transition={{ duration: 1.5, ease: "anticipate" }}
                                />
                                <div className="absolute inset-0 flex items-center justify-center opacity-5">
                                    <Activity size={120} />
                                </div>
                            </div>
                        </section>

                        {/* Controls */}
                        <div className="grid grid-cols-3 gap-6">
                            <ControlButton id="open" label="Open" icon={<ArrowUpCircle size={28} />} active={doorStatus !== 'open'} sendCommand={sendCommand} connected={connected} />
                            <ControlButton id="stop" label="STOP" icon={<StopCircle size={32} />} active={true} sendCommand={sendCommand} connected={connected} isStop />
                            <ControlButton id="close" label="Close" icon={<ArrowDownCircle size={28} />} active={doorStatus !== 'closed'} sendCommand={sendCommand} connected={connected} />
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="lg:col-span-4 flex flex-col gap-6 md:gap-10">
                        <section className="bg-zinc-900/40 rounded-[2.5rem] p-8 border border-white/5">
                            <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.3em] mb-8">System Telemetry</h3>
                            <div className="space-y-6">
                                <StatItem label="Signal Strength" value="Optimal" />
                                <StatItem label="Auth Layer" value="Enabled" />
                                <StatItem label="Bridge Latency" value={connected ? "72ms" : "---"} />
                            </div>
                        </section>

                        <section className="bg-zinc-900/40 rounded-[2.5rem] p-8 border border-white/5 flex-1 overflow-hidden max-h-[450px] flex flex-col">
                            <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.3em] mb-8">Live Audit Trail</h3>
                            <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar flex-1">
                                {logs.map((log) => (
                                    <div key={log.id} className="border-l border-zinc-800 pl-4 py-1">
                                        <div className="text-[10px] text-zinc-600 font-mono mb-1">{format(log.time, "HH:mm:ss")}</div>
                                        <div className="text-xs text-zinc-400 font-light">{log.message}</div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>
                </main>
            </div>
        </div>
    );
}

function ControlButton({ id, label, icon, active, sendCommand, connected, isStop = false }: any) {
    return (
        <button
            onClick={() => sendCommand(id)}
            disabled={!connected || !active}
            className={`flex flex-col items-center gap-4 p-8 rounded-[2.5rem] border border-white/5 transition-all duration-300 ${isStop ? 'hover:bg-red-500/10 text-red-500' : 'hover:bg-white/5 text-zinc-400'} ${(!connected || !active) ? 'opacity-30' : 'active:scale-95'}`}
        >
            <div className={`p-3 rounded-2xl ${isStop ? 'bg-red-500/10' : 'bg-white/5'}`}>{icon}</div>
            <span className="text-[10px] font-bold uppercase tracking-widest leading-none">{label}</span>
        </button>
    );
}

function StatItem({ label, value }: any) {
    return (
        <div className="flex justify-between items-center group">
            <span className="text-zinc-500 text-xs">{label}</span>
            <span className="text-xs font-semibold text-zinc-300 bg-white/5 px-2 py-1 rounded-md">{value}</span>
        </div>
    );
}
