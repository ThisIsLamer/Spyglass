import { Controller, Get } from "#src/core/decorators/index.js";
import { FastifyReply, FastifyRequest } from "fastify";
import { eventBus } from "#src/core/events/event-bus.js";

@Controller('/sse')
export class SseController {
  @Get('/')
  async stream(request: FastifyRequest, reply: FastifyReply) {
    reply.raw.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    });

    reply.raw.write('event: connected\ndata: {}\n\n');

    eventBus.addClient(request.user.guid, request.user.role, reply);

    request.raw.on('close', () => {
      reply.raw.end();
    });
  }
}
