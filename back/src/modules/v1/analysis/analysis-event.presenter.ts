import { AnalysisEvent } from "./analysis-event.entity.js";

export class AnalysisEventPresenter {
  static present(event: AnalysisEvent) {
    return {
      guid: event.guid,
      frigateEventId: event.frigateEventId,
      camera: event.camera,
      label: event.label ?? null,
      zone: event.zone ?? null,
      prompt: event.prompt,
      aiResponse: event.aiResponse ?? null,
      aiProviderName: event.aiProviderName,
      aiModel: event.aiModel,
      status: event.status,
      processingTimeMs: event.processingTimeMs ?? null,
      error: event.error ?? null,
      mediaPath: event.mediaPath ?? null,
      watcher: event.watcher ? {
        guid: event.watcher.guid,
        name: event.watcher.name,
      } : null,
      createdAt: event.createdAt,
    };
  }

  static presentMany(events: AnalysisEvent[]) {
    return events.map(AnalysisEventPresenter.present);
  }
}
