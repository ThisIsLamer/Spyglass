import mqtt, { MqttClient } from 'mqtt';
import { GLOBAL_CONFIG } from '#src/config.js';
import { FrigateHandler } from './frigate.handler.js';

const { MQTT_URL, TOPIC_PREFIX } = GLOBAL_CONFIG.FRIGATE;

export class FrigateClient {
  private client: MqttClient | null = null;
  private handler = new FrigateHandler();

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.client = mqtt.connect(MQTT_URL, {
        clientId: `spyglass-${Date.now()}`,
        clean: true,
        reconnectPeriod: 5000,
      });

      this.client.on('connect', () => {
        console.log(`[Frigate] Connected to MQTT broker: ${MQTT_URL}`);
        this.subscribe();
        resolve();
      });

      this.client.on('error', (err) => {
        console.error('[Frigate] MQTT error:', err.message);
        reject(err);
      });

      this.client.on('reconnect', () => {
        console.log('[Frigate] Reconnecting to MQTT broker...');
      });

      this.client.on('message', (topic, payload) => {
        this.onMessage(topic, payload);
      });
    });
  }

  async disconnect(): Promise<void> {
    if (!this.client) return;

    return new Promise((resolve) => {
      this.client!.end(false, () => {
        console.log('[Frigate] Disconnected from MQTT broker');
        resolve();
      });
    });
  }

  private subscribe(): void {
    if (!this.client) return;

    const topics = [
      `${TOPIC_PREFIX}/reviews`,
      `${TOPIC_PREFIX}/events`,
    ];

    this.client.subscribe(topics, (err) => {
      if (err) {
        console.error('[Frigate] Failed to subscribe:', err.message);
      } else {
        console.log(`[Frigate] Subscribed to: ${topics.join(', ')}`);
      }
    });
  }

  private onMessage(topic: string, payload: Buffer): void {
    try {
      const data = JSON.parse(payload.toString());
      const relativeTopic = topic.replace(`${TOPIC_PREFIX}/`, '');
      this.handler.handle(relativeTopic, data);
    } catch (err) {
      console.error('[Frigate] Failed to parse message:', err);
    }
  }
}

export const frigateClient = new FrigateClient();
