import { FastifyInstance } from 'fastify';
import { registerController } from './index.js';

export interface ModuleMetadata {
  prefix: string;
  controllers: any[];
  version?: string;
}

const moduleMetadata = new WeakMap<any, ModuleMetadata>();

export function Module(options: { 
  prefix: string; 
  controllers: any[]; 
  version?: string;
}) {
  return function <T extends new (...args: any[]) => any>(target: T, context: any) {
    moduleMetadata.set(target, {
      prefix: options.prefix,
      controllers: options.controllers,
      ...(options.version && { version: options.version })
    });
    return target;
  };
}

export function registerModule(fastify: FastifyInstance, moduleClass: any) {
  const metadata = moduleMetadata.get(moduleClass);
  if (!metadata) {
    throw new Error(`Module ${moduleClass.name} is not decorated with @Module`);
  }

  const { prefix, controllers, version } = metadata;
  const modulePrefix = version ? `/${prefix}/${version}` : prefix;

  controllers.forEach(controller => {
    registerController(fastify, controller, modulePrefix);
  });
}