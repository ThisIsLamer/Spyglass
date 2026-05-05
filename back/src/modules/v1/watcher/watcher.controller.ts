import { Controller, Delete, Get, Post, Put, Roles, ValidateBody, ValidateParams } from "#src/core/decorators/index.js";
import { FastifyRequest } from "fastify";
import { z } from "zod";
import { AnalysisType } from "./watcher.entity.js";
import { WatcherPresenter } from "./watcher.presenter.js";
import { WatcherService } from "./watcher.service.js";

const guidParams = z.object({
  guid: z.string().uuid(),
});

type GuidParams = z.infer<typeof guidParams>;

const createSchema = z.object({
  name: z.string().min(1).max(128),
  cameras: z.array(z.string()).min(1),
  analysisType: z.nativeEnum(AnalysisType),
  prompt: z.string().min(1),
  descriptionPrompt: z.string().nullable().optional(),
  zones: z.array(z.string()).optional(),
  objectLabels: z.array(z.string()).optional(),
  cooldownSeconds: z.number().int().min(0).optional(),
  enabled: z.boolean().optional(),
  aiProviderGuid: z.string().uuid().optional(),
});

type CreateDto = z.infer<typeof createSchema>;

const updateSchema = z.object({
  name: z.string().min(1).max(128).optional(),
  cameras: z.array(z.string()).min(1).optional(),
  analysisType: z.nativeEnum(AnalysisType).optional(),
  prompt: z.string().min(1).optional(),
  descriptionPrompt: z.string().nullable().optional(),
  zones: z.array(z.string()).optional(),
  objectLabels: z.array(z.string()).optional(),
  cooldownSeconds: z.number().int().min(0).optional(),
  enabled: z.boolean().optional(),
  aiProviderGuid: z.string().uuid().nullable().optional(),
});

type UpdateDto = z.infer<typeof updateSchema>;

@Controller('/watchers')
export class WatcherController {
  private watcherService = new WatcherService();

  @Get('/')
  async getAll() {
    const watchers = await this.watcherService.findAll();
    return { success: true, data: WatcherPresenter.presentMany(watchers) };
  }

  @Get('/:guid')
  @ValidateParams(guidParams)
  async getOne(request: FastifyRequest<{ Params: GuidParams }>) {
    const watcher = await this.watcherService.findByGuid(request.params.guid);

    if (!watcher) {
      return { success: false, message: 'Watcher not found' };
    }

    return { success: true, data: WatcherPresenter.present(watcher) };
  }

  @Post('/')
  @Roles('admin')
  @ValidateBody(createSchema)
  async create(request: FastifyRequest<{ Body: CreateDto }>) {
    const { zones, objectLabels, cooldownSeconds, enabled, aiProviderGuid, descriptionPrompt, ...rest } = request.body;

    const watcher = await this.watcherService.create({
      ...rest,
      ...(zones && { zones }),
      ...(objectLabels && { objectLabels }),
      ...(cooldownSeconds !== undefined && { cooldownSeconds }),
      ...(enabled !== undefined && { enabled }),
      ...(aiProviderGuid && { aiProviderGuid }),
      ...(descriptionPrompt !== undefined && { descriptionPrompt }),
    });

    return { success: true, data: WatcherPresenter.present(watcher) };
  }

  @Put('/:guid')
  @Roles('admin')
  @ValidateParams(guidParams)
  @ValidateBody(updateSchema)
  async update(request: FastifyRequest<{ Params: GuidParams; Body: UpdateDto }>) {
    const watcher = await this.watcherService.update(request.params.guid, request.body);

    if (!watcher) {
      return { success: false, message: 'Watcher not found' };
    }

    return { success: true, data: WatcherPresenter.present(watcher) };
  }

  @Delete('/:guid')
  @Roles('admin')
  @ValidateParams(guidParams)
  async remove(request: FastifyRequest<{ Params: GuidParams }>) {
    const watcher = await this.watcherService.remove(request.params.guid);

    if (!watcher) {
      return { success: false, message: 'Watcher not found' };
    }

    return { success: true, data: WatcherPresenter.present(watcher) };
  }

  @Post('/:guid/toggle')
  @Roles('admin')
  @ValidateParams(guidParams)
  async toggle(request: FastifyRequest<{ Params: GuidParams }>) {
    const watcher = await this.watcherService.toggle(request.params.guid);

    if (!watcher) {
      return { success: false, message: 'Watcher not found' };
    }

    return { success: true, data: WatcherPresenter.present(watcher) };
  }
}
