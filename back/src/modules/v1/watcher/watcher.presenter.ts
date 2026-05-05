import { Watcher } from "./watcher.entity.js";

export class WatcherPresenter {
  static present(watcher: Watcher) {
    return {
      guid: watcher.guid,
      name: watcher.name,
      enabled: watcher.enabled,
      cameras: watcher.cameras,
      zones: watcher.zones,
      objectLabels: watcher.objectLabels,
      analysisType: watcher.analysisType,
      prompt: watcher.prompt,
      descriptionPrompt: watcher.descriptionPrompt ?? null,
      cooldownSeconds: watcher.cooldownSeconds,
      aiProvider: watcher.aiProvider ? {
        guid: watcher.aiProvider.guid,
        name: watcher.aiProvider.name,
        model: watcher.aiProvider.model,
      } : null,
      createdAt: watcher.createdAt,
      updatedAt: watcher.updatedAt,
    };
  }

  static presentMany(watchers: Watcher[]) {
    return watchers.map(WatcherPresenter.present);
  }
}
