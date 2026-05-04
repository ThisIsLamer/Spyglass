import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';

export interface RouteMetadata {
  method: string;
  path: string;
  handler: string;
  isPublic?: boolean;
  roles?: string[];
  validation?: {
    body?: z.ZodType;
    query?: z.ZodType;
    params?: z.ZodType;
  };
}

const controllerMetadata = new WeakMap<any, string>();
const publicMetadata = new WeakMap<any, Set<string>>();
const rolesMetadata = new WeakMap<any, Map<string, string[]>>();
const validationMetadata = new WeakMap<any, Map<string, any>>();
export const routesByClass = new Map<string, RouteMetadata[]>();

export function Controller(prefix: string = '') {
  return function <T extends new (...args: any[]) => any>(target: T, _context: any) {
    controllerMetadata.set(target, prefix);
    const tempRoutes = routesByClass.get('temp') || [];
    if (tempRoutes.length > 0) {
      routesByClass.set(target.name, tempRoutes);
      routesByClass.delete('temp');
    }
    return target;
  };
}

export function Get(path: string = '') {
  return createRouteDecorator('GET', path);
}

export function Post(path: string = '') {
  return createRouteDecorator('POST', path);
}

export function Put(path: string = '') {
  return createRouteDecorator('PUT', path);
}

export function Delete(path: string = '') {
  return createRouteDecorator('DELETE', path);
}

export function Public() {
  return function (target: any, context: ClassMethodDecoratorContext) {
    const publicMethods = publicMetadata.get(target) || new Set();
    publicMethods.add(context.name as string);
    publicMetadata.set(target, publicMethods);
  };
}

export function Roles(...args: string[]) {
  return function (target: any, context: ClassMethodDecoratorContext) {
    const allRoles = rolesMetadata.get(target) || new Map<string, string[]>();
    allRoles.set(context.name as string, args);
    rolesMetadata.set(target, allRoles);
  };
}

function createRouteDecorator(method: string, path: string) {
  return function (target: any, context: ClassMethodDecoratorContext) {
    const routes = routesByClass.get('temp') || [];
    const publicMethods = publicMetadata.get(target) || new Set();
    const validation = validationMetadata.get(target) || new Map();
    const allRoles = rolesMetadata.get(target) || new Map<string, string[]>();

    const isPublic = publicMethods.has(context.name as string);
    const methodValidation = validation.get(context.name as string);
    const roles = allRoles.get(context.name as string) || [];

    routes.push({
      method,
      path,
      handler: context.name as string,
      isPublic,
      roles,
      validation: methodValidation,
    });

    routesByClass.set('temp', routes);
  };
}

export function ValidateBody<T extends z.ZodType>(schema: T) {
  return function (target: any, context: ClassMethodDecoratorContext) {
    const validation = validationMetadata.get(target) || new Map();
    const methodValidation = validation.get(context.name as string) || {};
    methodValidation.body = schema;
    validation.set(context.name as string, methodValidation);
    validationMetadata.set(target, validation);
  };
}

export function ValidateQuery<T extends z.ZodType>(schema: T) {
  return function (target: any, context: ClassMethodDecoratorContext) {
    const validation = validationMetadata.get(target) || new Map();
    const methodValidation = validation.get(context.name as string) || {};
    methodValidation.query = schema;
    validation.set(context.name as string, methodValidation);
    validationMetadata.set(target, validation);
  };
}

export function ValidateParams<T extends z.ZodType>(schema: T) {
  return function (target: any, context: ClassMethodDecoratorContext) {
    const validation = validationMetadata.get(target) || new Map();
    const methodValidation = validation.get(context.name as string) || {};
    methodValidation.params = schema;
    validation.set(context.name as string, methodValidation);
    validationMetadata.set(target, validation);
  };
}

export { Module, registerModule } from './module.js';

function buildRoute(
  fastify: FastifyInstance,
  method: string,
  url: string,
  route: RouteMetadata,
  handler: (request: FastifyRequest, reply: FastifyReply) => Promise<unknown>,
) {
  fastify.route({
    method: method as any,
    url,
    config: {
      isPublic: route.isPublic ?? false,
      roles: route.roles ?? [],
      validation: route.validation,
    },
    handler,
  });
}

export function registerController(fastify: FastifyInstance, controller: any, modulePrefix: string = '') {
  const instance = new controller();
  const prefix = controllerMetadata.get(controller) || '';
  const className = controller.name;
  const routes = routesByClass.get(className) || [];

  for (const route of routes) {
    const controllerPath = prefix + (route.path === '/' ? '' : route.path);
    const fullPath = modulePrefix + controllerPath;
    const handler = instance[route.handler].bind(instance);

    buildRoute(fastify, route.method, fullPath, route, handler);

    if (route.path === '/') {
      buildRoute(fastify, route.method, fullPath + '/', route, handler);
    }
  }

  routesByClass.delete(className);
}
