import { eventBus } from "#src/core/events/event-bus.js";
import { orm } from "#src/database/index.js";
import { AiProvider } from "#src/modules/v1/ai-provider/ai-provider.entity.js";
import { WatcherPresenter } from "./watcher.presenter.js";
import { Watcher, AnalysisType } from "./watcher.entity.js";

export interface CreateWatcherDto {
  name: string;
  cameras: string[];
  analysisType: AnalysisType;
  prompt: string;
  zones?: string[] | undefined;
  objectLabels?: string[] | undefined;
  cooldownSeconds?: number | undefined;
  enabled?: boolean | undefined;
  aiProviderGuid?: string | undefined;
  descriptionPrompt?: string | null | undefined;
}

export interface UpdateWatcherDto {
  name?: string | undefined;
  cameras?: string[] | undefined;
  zones?: string[] | undefined;
  objectLabels?: string[] | undefined;
  analysisType?: AnalysisType | undefined;
  prompt?: string | undefined;
  cooldownSeconds?: number | undefined;
  enabled?: boolean | undefined;
  aiProviderGuid?: string | null | undefined;
  descriptionPrompt?: string | null | undefined;
}

export class WatcherService {
  private get em() { return orm.em; }

  async findAll() {
    return this.em.find(Watcher, {}, { populate: ['aiProvider'] });
  }

  async findByGuid(guid: string) {
    return this.em.findOne(Watcher, { guid }, { populate: ['aiProvider'] });
  }

  async create(dto: CreateWatcherDto) {
    const aiProvider = dto.aiProviderGuid
      ? await this.em.findOne(AiProvider, { guid: dto.aiProviderGuid })
      : null;

    const watcher = this.em.create(Watcher, {
      name: dto.name,
      cameras: dto.cameras,
      analysisType: dto.analysisType,
      prompt: dto.prompt,
      ...(dto.zones && { zones: dto.zones }),
      ...(dto.objectLabels && { objectLabels: dto.objectLabels }),
      ...(dto.cooldownSeconds !== undefined && { cooldownSeconds: dto.cooldownSeconds }),
      ...(dto.enabled !== undefined && { enabled: dto.enabled }),
      ...(aiProvider && { aiProvider }),
      ...(dto.descriptionPrompt !== undefined && { descriptionPrompt: dto.descriptionPrompt }),
    });

    await this.em.flush();

    eventBus.emit({
      event: 'watcher.created',
      data: WatcherPresenter.present(watcher),
    });

    return watcher;
  }

  async update(guid: string, dto: UpdateWatcherDto) {
    const watcher = await this.findByGuid(guid);
    if (!watcher) return null;

    if (dto.name !== undefined) watcher.name = dto.name;
    if (dto.cameras !== undefined) watcher.cameras = dto.cameras;
    if (dto.zones !== undefined) watcher.zones = dto.zones;
    if (dto.objectLabels !== undefined) watcher.objectLabels = dto.objectLabels;
    if (dto.analysisType !== undefined) watcher.analysisType = dto.analysisType;
    if (dto.prompt !== undefined) watcher.prompt = dto.prompt;
    if (dto.cooldownSeconds !== undefined) watcher.cooldownSeconds = dto.cooldownSeconds;
    if (dto.enabled !== undefined) watcher.enabled = dto.enabled;
    if (dto.descriptionPrompt !== undefined) watcher.descriptionPrompt = dto.descriptionPrompt;

    if (dto.aiProviderGuid === null) {
      watcher.aiProvider = null;
    } else if (dto.aiProviderGuid !== undefined) {
      const provider = await this.em.findOne(AiProvider, { guid: dto.aiProviderGuid });
      if (provider) watcher.aiProvider = provider;
    }

    await this.em.flush();

    eventBus.emit({
      event: 'watcher.updated',
      data: WatcherPresenter.present(watcher),
    });

    return watcher;
  }

  async remove(guid: string) {
    const watcher = await this.findByGuid(guid);
    if (!watcher) return null;

    const presented = WatcherPresenter.present(watcher);
    this.em.remove(watcher);
    await this.em.flush();

    eventBus.emit({
      event: 'watcher.deleted',
      data: presented,
    });

    return watcher;
  }

  async toggle(guid: string) {
    const watcher = await this.findByGuid(guid);
    if (!watcher) return null;

    watcher.enabled = !watcher.enabled;
    await this.em.flush();

    eventBus.emit({
      event: 'watcher.toggled',
      data: WatcherPresenter.present(watcher),
    });

    return watcher;
  }
}
