import { NextResponse } from 'next/server';
import mqtt from 'mqtt';

// --- CLOUD CONFIGURATION ---
const MQTT_BROKER = 'wss://broker.hivemq.com:8884/mqtt';
const USER_ID = 'my_garage_9988_unique'; // MATCH THIS TO ESP32
const TOPIC_STAT = `${USER_ID}/status`;

let latestStatus = 'unknown';

// Using a Singleton-ish pattern for the MQTT client connection to avoid leaks in serverless functions
// NOTE: Vercel functions are stateless, so for long-term status persistence we'd normally use Redis/DB.
// For this prototype, we'll try a fast fetch from the broker.

export async function GET() {
    return new Promise((resolve) => {
        const client = mqtt.connect(MQTT_BROKER);

        const timeout = setTimeout(() => {
            client.end();
            resolve(NextResponse.json({ connected: false, status: 'timed_out' }));
        }, 3000);

        client.on('connect', () => {
            client.subscribe(TOPIC_STAT);
            // In a real MQTT setup, we'd use Retained messages on the broker
        });

        client.on('message', (topic: string, message: Buffer) => {
            if (topic === TOPIC_STAT) {
                clearTimeout(timeout);
                client.end();
                resolve(NextResponse.json({
                    connected: true,
                    status: message.toString()
                }));
            }
        });
    });
}
