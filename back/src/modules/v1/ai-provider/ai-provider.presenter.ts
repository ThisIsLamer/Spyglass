import { AiProvider } from "./ai-provider.entity.js";

export class AiProviderPresenter {
  static present(provider: AiProvider) {
    return {
      guid: provider.guid,
      name: provider.name,
      baseUrl: provider.baseUrl,
      model: provider.model,
      hasApiKey: !!provider.apiKey,
      isDefault: provider.isDefault,
      createdAt: provider.createdAt,
      updatedAt: provider.updatedAt,
    };
  }

  static presentMany(providers: AiProvider[]) {
    return providers.map(AiProviderPresenter.present);
  }
}
