import { NextResponse } from 'next/server';
import mqtt from 'mqtt';

const MQTT_BROKER = 'wss://broker.hivemq.com:8884/mqtt';
const TOPIC_CMD = 'my_garage_9988_unique/cmd';

export async function POST() {
    return new Promise((resolve) => {
        const client = mqtt.connect(MQTT_BROKER);

        client.on('connect', () => {
            console.log('API: Connected to Broker for OPEN');
            client.publish(TOPIC_CMD, 'OPEN', { qos: 1 }, (err: Error | null) => {
                if (err) {
                    console.error('MQTT Publish Error:', err);
                    client.end();
                    resolve(NextResponse.json({ success: false, message: 'CMD Failed' }));
                } else {
                    console.log('API: Sent OPEN command');
                    client.end();
                    // Return temporary 'opening' state for UI feel
                    resolve(NextResponse.json({ success: true, status: 'opening' }));
                }
            });
        });

        // Set safety timeout for serverless
        setTimeout(() => {
            client.end();
            resolve(NextResponse.error());
        }, 5000);
    });
}
