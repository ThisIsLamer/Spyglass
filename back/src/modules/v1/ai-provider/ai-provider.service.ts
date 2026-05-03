import { eventBus } from "#src/core/events/event-bus.js";
import { orm } from "#src/database/index.js";
import { AiProviderPresenter } from "./ai-provider.presenter.js";
import { AiProvider } from "./ai-provider.entity.js";

export interface CreateAiProviderDto {
  name: string;
  baseUrl: string;
  model: string;
  apiKey?: string | undefined;
  isDefault?: boolean | undefined;
}

export interface UpdateAiProviderDto {
  name?: string | undefined;
  baseUrl?: string | undefined;
  model?: string | undefined;
  apiKey?: string | null | undefined;
  isDefault?: boolean | undefined;
}

export class AiProviderService {
  private get em() { return orm.em; }

  async findAll() {
    return this.em.find(AiProvider, {});
  }

  async findByGuid(guid: string) {
    return this.em.findOne(AiProvider, { guid });
  }

  async findDefault() {
    return this.em.findOne(AiProvider, { isDefault: true });
  }

  async create(dto: CreateAiProviderDto) {
    if (dto.isDefault) {
      await this.clearDefault();
    }

    const provider = this.em.create(AiProvider, {
      name: dto.name,
      baseUrl: dto.baseUrl,
      model: dto.model,
      ...(dto.apiKey && { apiKey: dto.apiKey }),
      ...(dto.isDefault !== undefined && { isDefault: dto.isDefault }),
    });

    await this.em.flush();

    eventBus.emit({
      event: 'ai-provider.created',
      data: AiProviderPresenter.present(provider),
      target: { roles: ['admin'] },
    });

    return provider;
  }

  async update(guid: string, dto: UpdateAiProviderDto) {
    const provider = await this.findByGuid(guid);
    if (!provider) return null;

    if (dto.isDefault) {
      await this.clearDefault();
    }

    if (dto.name !== undefined) provider.name = dto.name;
    if (dto.baseUrl !== undefined) provider.baseUrl = dto.baseUrl;
    if (dto.model !== undefined) provider.model = dto.model;
    if (dto.apiKey === null) delete provider.apiKey;
    else if (dto.apiKey !== undefined) provider.apiKey = dto.apiKey;
    if (dto.isDefault !== undefined) provider.isDefault = dto.isDefault;

    await this.em.flush();

    eventBus.emit({
      event: 'ai-provider.updated',
      data: AiProviderPresenter.present(provider),
      target: { roles: ['admin'] },
    });

    return provider;
  }

  async remove(guid: string) {
    const provider = await this.findByGuid(guid);
    if (!provider) return null;

    const presented = AiProviderPresenter.present(provider);
    this.em.remove(provider);
    await this.em.flush();

    eventBus.emit({
      event: 'ai-provider.deleted',
      data: presented,
      target: { roles: ['admin'] },
    });

    return provider;
  }

  private async clearDefault() {
    const current = await this.findDefault();
    if (current) {
      current.isDefault = false;
    }
  }
}
