import { eventBus } from "#src/core/events/event-bus.js";
import { orm } from "#src/database/index.js";
import { AnalysisEventPresenter } from "./analysis-event.presenter.js";
import { AnalysisEvent, AnalysisStatus } from "./analysis-event.entity.js";
import { Watcher } from "#src/modules/v1/watcher/watcher.entity.js";
import type { SqlEntityManager } from "@mikro-orm/mariadb";

export interface CreateAnalysisEventDto {
  watcher: Watcher;
  frigateEventId: string;
  camera: string;
  prompt: string;
  descriptionPrompt?: string | null | undefined;
  aiProviderName: string;
  aiModel: string;
  label?: string | undefined;
  zone?: string | undefined;
  mediaPath?: string | undefined;
}

export interface UpdateAnalysisEventDto {
  status?: AnalysisStatus | undefined;
  aiResponse?: Record<string, unknown> | null | undefined;
  description?: string | null | undefined;
  processingTimeMs?: number | undefined;
  error?: string | undefined;
}

export interface AnalysisEventFilters {
  watcherGuid?: string | undefined;
  camera?: string | undefined;
  status?: AnalysisStatus | undefined;
}

export class AnalysisEventService {
  private forkedEm: SqlEntityManager | null;

  constructor(em?: SqlEntityManager) {
    this.forkedEm = em ?? null;
  }

  private get em(): SqlEntityManager {
    return this.forkedEm ?? orm.em as SqlEntityManager;
  }

  async findAll(filters?: AnalysisEventFilters) {
    const where: Record<string, unknown> = {};

    if (filters?.watcherGuid) where.watcher = { guid: filters.watcherGuid };
    if (filters?.camera) where.camera = filters.camera;
    if (filters?.status) where.status = filters.status;

    return this.em.find(AnalysisEvent, where, {
      populate: ['watcher'],
      orderBy: { createdAt: 'DESC' },
    });
  }

  async findByGuid(guid: string) {
    return this.em.findOne(AnalysisEvent, { guid }, { populate: ['watcher'] });
  }

  async create(dto: CreateAnalysisEventDto) {
    const event = this.em.create(AnalysisEvent, {
      watcher: dto.watcher,
      frigateEventId: dto.frigateEventId,
      camera: dto.camera,
      prompt: dto.prompt,
      aiProviderName: dto.aiProviderName,
      aiModel: dto.aiModel,
      status: AnalysisStatus.PENDING,
      ...(dto.descriptionPrompt !== undefined && { descriptionPrompt: dto.descriptionPrompt }),
      ...(dto.label && { label: dto.label }),
      ...(dto.zone && { zone: dto.zone }),
      ...(dto.mediaPath && { mediaPath: dto.mediaPath }),
    });

    await this.em.flush();

    eventBus.emit({
      event: 'analysis.created',
      data: AnalysisEventPresenter.present(event),
    });

    return event;
  }

  async update(guid: string, dto: UpdateAnalysisEventDto) {
    const event = await this.em.findOne(AnalysisEvent, { guid }, { populate: ['watcher'] });
    if (!event) return null;

    if (dto.status !== undefined) event.status = dto.status;
    if (dto.aiResponse !== undefined) event.aiResponse = dto.aiResponse;
    if (dto.description !== undefined) event.description = dto.description;
    if (dto.processingTimeMs !== undefined) event.processingTimeMs = dto.processingTimeMs;
    if (dto.error !== undefined) event.error = dto.error;

    await this.em.flush();

    eventBus.emit({
      event: 'analysis.updated',
      data: AnalysisEventPresenter.present(event),
    });

    return event;
  }
}
