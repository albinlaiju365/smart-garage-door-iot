import { NextResponse } from 'next/server';
import mqtt from 'mqtt';

const MQTT_BROKER = 'wss://broker.hivemq.com:8884/mqtt';
const TOPIC_CMD = 'my_garage_9988_unique/cmd';

export async function POST() {
    return new Promise((resolve) => {
        const client = mqtt.connect(MQTT_BROKER);
        client.on('connect', () => {
            client.publish(TOPIC_CMD, 'STOP', { qos: 1 }, () => {
                client.end();
                resolve(NextResponse.json({ success: true, status: 'stopped' }));
            });
        });
        setTimeout(() => { client.end(); resolve(NextResponse.error()); }, 5000);
    });
}
