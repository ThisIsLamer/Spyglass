import { FastifyReply, FastifyRequest } from "fastify";
import { RouteMetadata, methods } from "../decorators/index.js";
import { ZodError } from "zod";
import { TokenService } from "#src/modules/v1/auth/token.service.js";
import type { IUserGeneric } from "#root/types/api/account.js";

const tokenService = new TokenService();

async function routeHook(request: FastifyRequest, reply: FastifyReply): Promise<RouteMetadata> {
  let path = request.url.split('?')[0]!;
  if (path.length > 1 && path.endsWith('/')) {
    path = path.slice(0, -1);
  }

  const rawRoute = methods.get(path);
  if (!rawRoute || !rawRoute.length) {
    reply.code(404).send({ success: false, message: 'Not Found' });
    return undefined as never;
  }

  const route = rawRoute.find(r => r.method === request.method);
  if (!route) {
    reply.code(404).send({ success: false, message: 'Not Found' });
    return undefined as never;
  }

  return route;
}

async function authHook(request: FastifyRequest, reply: FastifyReply, route: RouteMetadata) {
  if (route.isPublic) return;

  const header = request.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return reply.code(401).send({ success: false, message: 'Unauthorized' });
  }

  const token = header.slice(7);
  if (!token) {
    return reply.code(401).send({ success: false, message: 'Unauthorized' });
  }

  const payload = await tokenService.verify(token);
  if (!payload) {
    return reply.code(401).send({ success: false, message: 'Invalid or expired token' });
  }

  const user: IUserGeneric = {
    guid: payload.sub,
    username: payload.username,
    role: payload.role,
    createdAt: new Date(),
  };

  request.user = user;
  request.userToken = token;
}

async function rolesHook(request: FastifyRequest, reply: FastifyReply, route: RouteMetadata) {
  if (!route.roles || !route.roles.length) return;

  if (!route.roles.some(role => request.user.role === role)) {
    return reply.code(403).send({ success: false, message: 'Forbidden' });
  }
}

async function validationHook(request: FastifyRequest, reply: FastifyReply, route: RouteMetadata) {
  if (!route.validation) return;

  const validate = (field: 'body' | 'query' | 'params') => {
    const schema = route.validation![field];
    if (!schema) return;

    try {
      const source = field === 'body' ? request.body
        : field === 'query' ? request.query
        : request.params;

      const parsed = schema.parse(source);

      if (field === 'body') (request.body as typeof parsed) = parsed;
      else if (field === 'query') (request.query as typeof parsed) = parsed;
      else (request.params as typeof parsed) = parsed;
    } catch (err) {
      const issues = (err as ZodError).issues || [{ message: 'Validation failed' }];
      reply.code(400).send({ success: false, errors: issues });
    }
  };

  validate('body');
  validate('query');
  validate('params');
}

export async function preHandler(request: FastifyRequest, reply: FastifyReply) {
  const route = await routeHook(request, reply);
  if (reply.sent) return;

  await authHook(request, reply, route);
  if (reply.sent) return;

  await rolesHook(request, reply, route);
  if (reply.sent) return;

  await validationHook(request, reply, route);
}
