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
const rolesMetadata = new WeakMap<any, string[]>();
const validationMetadata = new WeakMap<any, Map<string, any>>();
export const routesByClass = new Map<string, RouteMetadata[]>();
export const methods = new Map<string, RouteMetadata[]>();

export function Controller(prefix: string = '') {
  return function <T extends new (...args: any[]) => any>(target: T, context: any) {
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
    const roles = rolesMetadata.get(target) || [];
    roles.push(...args);
    rolesMetadata.set(target, roles);
  }
}

function createRouteDecorator(method: string, path: string) {
  return function (target: any, context: ClassMethodDecoratorContext) {
    const className = 'temp';
    const routes = routesByClass.get(className) || [];
    const publicMethods = publicMetadata.get(target) || new Set();
    const validation = validationMetadata.get(target) || new Map();
    const isPublic = publicMethods.has(context.name as string);
    const methodValidation = validation.get(context.name as string);
    const roles = rolesMetadata.get(target) || [];

    routes.push({
      method,
      path,
      handler: context.name as string,
      isPublic,
      roles,
      validation: methodValidation
    });
    
    routesByClass.set(className, routes);
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

export function registerController(fastify: FastifyInstance, controller: any, modulePrefix: string = '') {
  const instance = new controller();
  const prefix = controllerMetadata.get(controller) || '';
  const className = controller.name;
  const routes = routesByClass.get(className) || [];

  routes.forEach(route => {
    const controllerPath = prefix + (route.path === '/' ? '' : route.path);
    const fullPath = modulePrefix + controllerPath;
    const handler = instance[route.handler].bind(instance);

    fastify.route({
      method: route.method as any,
      url: fullPath,
      handler: async (request: FastifyRequest, reply: FastifyReply) => {
        (request as any).isPublic = route.isPublic;
        (request as any).validation = route.validation;
        return handler(request, reply);
      }
    });

    if (route.path === '/') {
      fastify.route({
        method: route.method as any,
        url: fullPath + '/',
        handler: async (request: FastifyRequest, reply: FastifyReply) => {
          (request as any).isPublic = route.isPublic;
          (request as any).validation = route.validation;
          return handler(request, reply);
        }
      });
    }

    const existingRoutes = methods.get(fullPath) || [];
    existingRoutes.push(route);
    methods.set(fullPath, existingRoutes);
    routesByClass.delete(className)
  });
}