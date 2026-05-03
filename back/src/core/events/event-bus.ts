import { FastifyReply } from 'fastify';
import { randomUUID } from 'crypto';

export interface SseClient {
  id: string;
  userGuid: string;
  role: string;
  reply: FastifyReply;
}

export interface SseEventTarget {
  roles?: string[];
  userGuids?: string[];
}

export interface SseEvent {
  event: string;
  data: unknown;
  target?: SseEventTarget;
}

class EventBus {
  private clients: Map<string, SseClient> = new Map();

  addClient(userGuid: string, role: string, reply: FastifyReply): string {
    const id = randomUUID();
    this.clients.set(id, { id, userGuid, role, reply });

    reply.raw.on('close', () => {
      this.clients.delete(id);
    });

    return id;
  }

  removeClient(id: string): void {
    this.clients.delete(id);
  }

  emit(event: SseEvent): void {
    for (const client of this.clients.values()) {
      if (!this.shouldReceive(client, event.target)) continue;
      this.send(client, event.event, event.data);
    }
  }

  getClientCount(): number {
    return this.clients.size;
  }

  private shouldReceive(client: SseClient, target?: SseEventTarget): boolean {
    if (!target) return true;

    const matchesRole = target.roles?.includes(client.role) ?? false;
    const matchesUser = target.userGuids?.includes(client.userGuid) ?? false;

    return matchesRole || matchesUser;
  }

  private send(client: SseClient, event: string, data: unknown): void {
    try {
      const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
      client.reply.raw.write(payload);
    } catch {
      this.clients.delete(client.id);
    }
  }
}

export const eventBus = new EventBus();
