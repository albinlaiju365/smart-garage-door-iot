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
    try {
        const client = mqtt.connect(MQTT_BROKER);

        const result = await new Promise<NextResponse>((resolve) => {
            const timeout = setTimeout(() => {
                client.end();
                resolve(NextResponse.json({ connected: false, status: 'offline' }));
            }, 4000);

            client.on('connect', () => {
                client.subscribe(TOPIC_STAT);
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

            client.on('error', (err) => {
                clearTimeout(timeout);
                client.end();
                resolve(NextResponse.json({ connected: false, status: 'error' }));
            });
        });

        return result;
    } catch (error) {
        return NextResponse.json({ connected: false, status: 'server_error' }, { status: 500 });
    }
}
