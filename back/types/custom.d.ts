import 'fastify';
import type { IUserGeneric } from './api/account.js';

declare module 'fastify' {
  interface FastifyRequest {
    user: IUserGeneric;
  }

  interface FastifyContextConfig {
    isPublic?: boolean;
    roles?: string[];
    validation?: {
      body?: import('zod').ZodType;
      query?: import('zod').ZodType;
      params?: import('zod').ZodType;
    };
  }
}
