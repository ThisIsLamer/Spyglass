import { FastifyReply, FastifyRequest } from "fastify";
import { ZodError, ZodType } from "zod";
import { TokenService } from "#src/modules/v1/auth/token.service.js";
import type { IUserGeneric } from "#root/types/api/account.js";

const tokenService = new TokenService();

interface RouteConfig {
  isPublic?: boolean;
  roles?: string[];
  validation?: {
    body?: ZodType;
    query?: ZodType;
    params?: ZodType;
  };
}

function getRouteConfig(request: FastifyRequest): RouteConfig {
  return (request.routeOptions?.config ?? {}) as RouteConfig;
}

async function authHook(request: FastifyRequest, reply: FastifyReply) {
  const { isPublic } = getRouteConfig(request);
  if (isPublic) return;

  const token = request.cookies?.token;
  if (!token) {
    return reply.code(401).send({ success: false, message: 'Unauthorized' });
  }

  const payload = await tokenService.verify(token);
  if (!payload) {
    return reply.code(401).send({ success: false, message: 'Invalid or expired token' });
  }

  request.user = {
    guid: payload.sub,
    username: payload.username,
    role: payload.role,
    createdAt: new Date(),
  } satisfies IUserGeneric;
}

async function rolesHook(request: FastifyRequest, reply: FastifyReply) {
  const { roles } = getRouteConfig(request);
  if (!roles || roles.length === 0) return;

  if (!roles.includes(request.user.role)) {
    return reply.code(403).send({ success: false, message: 'Forbidden' });
  }
}

async function validationHook(request: FastifyRequest, reply: FastifyReply) {
  const { validation } = getRouteConfig(request);
  if (!validation) return;

  const fields = ['body', 'query', 'params'] as const;

  for (const field of fields) {
    const schema = validation[field];
    if (!schema) continue;

    try {
      const source = field === 'body' ? request.body
        : field === 'query' ? request.query
        : request.params;

      const parsed = schema.parse(source);

      if (field === 'body') request.body = parsed;
      else if (field === 'query') request.query = parsed;
      else request.params = parsed;
    } catch (err) {
      const issues = (err as ZodError).issues || [{ message: 'Validation failed' }];
      return reply.code(400).send({ success: false, errors: issues });
    }
  }
}

export async function preHandler(request: FastifyRequest, reply: FastifyReply) {
  await authHook(request, reply);
  if (reply.sent) return;

  await rolesHook(request, reply);
  if (reply.sent) return;

  await validationHook(request, reply);
}
