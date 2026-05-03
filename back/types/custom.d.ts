import 'fastify';
import type { IUserGeneric } from './api/account.js'

declare module 'fastify' {
  interface FastifyRequest {
    user: IUserGeneric;
    userToken: string;
  }
}