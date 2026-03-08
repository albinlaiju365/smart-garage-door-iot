import { NextResponse } from 'next/server';
import mqtt from 'mqtt';

const MQTT_BROKER = 'wss://broker.hivemq.com:8884/mqtt';
const TOPIC_CMD = 'my_garage_9988_unique/cmd';

export async function POST() {
    try {
        const client = mqtt.connect(MQTT_BROKER);

        const result = await new Promise<NextResponse>((resolve) => {
            const timeout = setTimeout(() => {
                client.end();
                resolve(NextResponse.json({ success: false, message: 'Timed out' }));
            }, 5000);

            client.on('connect', () => {
                client.publish(TOPIC_CMD, 'OPEN', { qos: 1 }, (err) => {
                    clearTimeout(timeout);
                    client.end();
                    if (err) {
                        resolve(NextResponse.json({ success: false, message: 'Publish error' }));
                    } else {
                        resolve(NextResponse.json({ success: true, status: 'opening' }));
                    }
                });
            });

            client.on('error', (err) => {
                clearTimeout(timeout);
                client.end();
                resolve(NextResponse.json({ success: false, message: 'MQTT error' }));
            });
        });

        return result;
    } catch (error) {
        return NextResponse.json({ success: false }, { status: 500 });
    }
}
