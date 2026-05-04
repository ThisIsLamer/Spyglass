import { Controller, Get, ValidateParams, ValidateQuery } from "#src/core/decorators/index.js";
import { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { GLOBAL_CONFIG } from "#src/config.js";
import { frigateApi } from "#src/services/frigate/frigate.api.js";

const { API_URL } = GLOBAL_CONFIG.FRIGATE;

const eventParams = z.object({
  eventId: z.string().min(1),
});

type EventParams = z.infer<typeof eventParams>;

const clipQuery = z.object({
  start: z.string().min(1),
  end: z.string().min(1),
});

type ClipQuery = z.infer<typeof clipQuery>;

@Controller('/frigate')
export class FrigateController {
  @Get('/info')
  async getInfo() {
    try {
      const info = await frigateApi.getInfo();
      return { success: true, data: { ...info, status: 'connected' } };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to connect to Frigate';
      return { success: true, data: { cameras: [], labels: [], status: 'disconnected', error: message } };
    }
  }

  @Get('/events/:eventId/snapshot')
  @ValidateParams(eventParams)
  async getSnapshot(request: FastifyRequest<{ Params: EventParams }>, reply: FastifyReply) {
    const url = `${API_URL}/api/events/${request.params.eventId}/snapshot.jpg`;
    return this.proxyMedia(url, reply);
  }

  @Get('/events/:eventId/thumbnail')
  @ValidateParams(eventParams)
  async getThumbnail(request: FastifyRequest<{ Params: EventParams }>, reply: FastifyReply) {
    const url = `${API_URL}/api/events/${request.params.eventId}/thumbnail.webp`;
    return this.proxyMedia(url, reply);
  }

  @Get('/events/:eventId/clip')
  @ValidateParams(eventParams)
  async getClip(request: FastifyRequest<{ Params: EventParams }>, reply: FastifyReply) {
    const url = `${API_URL}/api/events/${request.params.eventId}/clip.mp4`;
    return this.proxyMedia(url, reply);
  }

  @Get('/clip')
  @ValidateQuery(clipQuery)
  async getClipByRange(request: FastifyRequest<{ Querystring: ClipQuery }>, reply: FastifyReply) {
    const url = `${API_URL}/api/Entry/start/${request.query.start}/end/${request.query.end}/clip.mp4`;
    return this.proxyMedia(url, reply);
  }

  private async proxyMedia(url: string, reply: FastifyReply) {
    try {
      const res = await fetch(url);

      if (!res.ok) {
        return reply.code(res.status).send({ success: false, message: 'Media not found' });
      }

      const contentType = res.headers.get('content-type') ?? 'application/octet-stream';
      const contentLength = res.headers.get('content-length');

      reply.header('Content-Type', contentType);
      if (contentLength) reply.header('Content-Length', contentLength);
      reply.header('Cache-Control', 'private, max-age=3600');

      return reply.send(res.body);
    } catch (err) {
      return reply.code(502).send({ success: false, message: 'Failed to fetch media from Frigate' });
    }
  }
}
