import { Controller, Get, Post, Roles, ValidateParams, ValidateQuery } from "#src/core/decorators/index.js";
import { FastifyRequest } from "fastify";
import { z } from "zod";
import { AnalysisStatus } from "./analysis-event.entity.js";
import { AnalysisEventPresenter } from "./analysis-event.presenter.js";
import { AnalysisEventService } from "./analysis-event.service.js";
import { AnalysisRetryService } from "./analysis-retry.service.js";

const guidParams = z.object({
  guid: z.string().uuid(),
});

type GuidParams = z.infer<typeof guidParams>;

const listQuery = z.object({
  watcherGuid: z.string().uuid().optional(),
  camera: z.string().optional(),
  status: z.nativeEnum(AnalysisStatus).optional(),
});

type ListQuery = z.infer<typeof listQuery>;

@Controller('/analysis')
export class AnalysisEventController {
  private analysisService = new AnalysisEventService();
  private retryService = new AnalysisRetryService();

  @Get('/')
  @ValidateQuery(listQuery)
  async getAll(request: FastifyRequest<{ Querystring: ListQuery }>) {
    const events = await this.analysisService.findAll(request.query);
    return { success: true, data: AnalysisEventPresenter.presentMany(events) };
  }

  @Get('/:guid')
  @ValidateParams(guidParams)
  async getOne(request: FastifyRequest<{ Params: GuidParams }>) {
    const event = await this.analysisService.findByGuid(request.params.guid);

    if (!event) {
      return { success: false, message: 'Analysis event not found' };
    }

    return { success: true, data: AnalysisEventPresenter.present(event) };
  }

  @Post('/:guid/retry')
  @Roles('admin')
  @ValidateParams(guidParams)
  async retry(request: FastifyRequest<{ Params: GuidParams }>) {
    const event = await this.analysisService.findByGuid(request.params.guid);

    if (!event) {
      return { success: false, message: 'Analysis event not found' };
    }

    this.retryService.retry(event.guid).catch((err: Error) => {
      console.error(`[AnalysisRetry] Failed to retry ${event.guid}:`, err);
    });

    return { success: true, data: AnalysisEventPresenter.present(event) };
  }
}
