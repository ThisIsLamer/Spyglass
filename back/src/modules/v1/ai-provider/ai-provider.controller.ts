import { Controller, Delete, Get, Post, Put, Roles, ValidateBody, ValidateParams } from "#src/core/decorators/index.js";
import { FastifyRequest } from "fastify";
import { z } from "zod";
import { AiProviderPresenter } from "./ai-provider.presenter.js";
import { AiProviderService } from "./ai-provider.service.js";

const guidParams = z.object({
  guid: z.string().uuid(),
});

type GuidParams = z.infer<typeof guidParams>;

const createSchema = z.object({
  name: z.string().min(1).max(128),
  baseUrl: z.string().url().max(512),
  model: z.string().min(1).max(128),
  apiKey: z.string().max(512).optional(),
  isDefault: z.boolean().optional(),
});

type CreateDto = z.infer<typeof createSchema>;

const updateSchema = z.object({
  name: z.string().min(1).max(128).optional(),
  baseUrl: z.string().url().max(512).optional(),
  model: z.string().min(1).max(128).optional(),
  apiKey: z.string().max(512).nullable().optional(),
  isDefault: z.boolean().optional(),
});

type UpdateDto = z.infer<typeof updateSchema>;

@Controller('/ai-providers')
export class AiProviderController {
  private aiProviderService = new AiProviderService();

  @Get('/')
  async getAll() {
    const providers = await this.aiProviderService.findAll();
    return { success: true, data: AiProviderPresenter.presentMany(providers) };
  }

  @Get('/:guid')
  @ValidateParams(guidParams)
  async getOne(request: FastifyRequest<{ Params: GuidParams }>) {
    const provider = await this.aiProviderService.findByGuid(request.params.guid);

    if (!provider) {
      return { success: false, message: 'AI Provider not found' };
    }

    return { success: true, data: AiProviderPresenter.present(provider) };
  }

  @Post('/')
  @Roles('admin')
  @ValidateBody(createSchema)
  async create(request: FastifyRequest<{ Body: CreateDto }>) {
    const { apiKey, isDefault, ...rest } = request.body;

    const provider = await this.aiProviderService.create({
      ...rest,
      ...(apiKey && { apiKey }),
      ...(isDefault !== undefined && { isDefault }),
    });

    return { success: true, data: AiProviderPresenter.present(provider) };
  }

  @Put('/:guid')
  @Roles('admin')
  @ValidateParams(guidParams)
  @ValidateBody(updateSchema)
  async update(request: FastifyRequest<{ Params: GuidParams; Body: UpdateDto }>) {
    const provider = await this.aiProviderService.update(request.params.guid, request.body);

    if (!provider) {
      return { success: false, message: 'AI Provider not found' };
    }

    return { success: true, data: AiProviderPresenter.present(provider) };
  }

  @Delete('/:guid')
  @Roles('admin')
  @ValidateParams(guidParams)
  async remove(request: FastifyRequest<{ Params: GuidParams }>) {
    const provider = await this.aiProviderService.remove(request.params.guid);

    if (!provider) {
      return { success: false, message: 'AI Provider not found' };
    }

    return { success: true, data: AiProviderPresenter.present(provider) };
  }
}
