import { NextResponse } from 'next/server';
import mqtt from 'mqtt';

const MQTT_BROKER = 'wss://broker.hivemq.com:8884/mqtt';
const TOPIC_CMD = 'my_garage_9988_unique/cmd';

export async function POST() {
    try {
        const client = mqtt.connect(MQTT_BROKER);
        const result = await new Promise<NextResponse>((resolve) => {
            client.on('connect', () => {
                client.publish(TOPIC_CMD, 'STOP', { qos: 1 }, () => {
                    client.end();
                    resolve(NextResponse.json({ success: true, status: 'stopped' }));
                });
            });
            setTimeout(() => { client.end(); resolve(NextResponse.json({ success: false }, { status: 504 })); }, 5000);
        });
        return result;
    } catch (e) {
        return NextResponse.json({ success: false }, { status: 500 });
    }
}
