import { orm } from "#src/database/index.js";
import { AnalysisEvent, AnalysisStatus } from "./analysis-event.entity.js";
import { AnalysisEventService } from "./analysis-event.service.js";
import { AiProvider } from "#src/modules/v1/ai-provider/ai-provider.entity.js";
import { aiAnalyzer } from "#src/services/ai/ai-analyzer.js";
import type { SqlEntityManager } from "@mikro-orm/mariadb";

export class AnalysisRetryService {
  async retry(eventGuid: string): Promise<void> {
    const em = orm.em.fork();
    const analysisService = new AnalysisEventService(em as SqlEntityManager);

    const event = await em.findOne(AnalysisEvent, { guid: eventGuid }, { populate: ['watcher', 'watcher.aiProvider'] });
    if (!event) return;

    const provider = event.watcher?.aiProvider
      ?? await em.findOne(AiProvider, { isDefault: true });

    if (!provider) {
      await analysisService.update(eventGuid, {
        status: AnalysisStatus.FAILED,
        error: 'No AI provider available',
      });
      return;
    }

    // Reset previous results before reprocessing.
    await analysisService.update(eventGuid, {
      status: AnalysisStatus.PROCESSING,
      aiResponse: null,
      description: null,
      error: undefined,
      processingTimeMs: undefined,
    });

    const startTime = Date.now();

    try {
      const analysisType = event.mediaPath?.endsWith('.mp4') ? 'video_clip' : 'snapshot';
      const mediaBase64 = event.mediaPath
        ? await this.fetchMediaAsBase64(event.mediaPath, analysisType)
        : undefined;

      if (event.descriptionPrompt) {
        // Two-stage retry: regenerate description and JSON.
        const { response } = await aiAnalyzer.runTwoStage(
          provider,
          event.descriptionPrompt,
          event.prompt,
          mediaBase64,
          analysisType,
          async (description) => {
            await analysisService.update(eventGuid, { description });
          },
        );

        await analysisService.update(eventGuid, {
          status: AnalysisStatus.COMPLETED,
          aiResponse: response,
          processingTimeMs: Date.now() - startTime,
        });
      } else {
        const response = await aiAnalyzer.callVisionJson(provider, event.prompt, mediaBase64, analysisType);

        await analysisService.update(eventGuid, {
          status: AnalysisStatus.COMPLETED,
          aiResponse: response,
          processingTimeMs: Date.now() - startTime,
        });
      }
    } catch (err) {
      await analysisService.update(eventGuid, {
        status: AnalysisStatus.FAILED,
        error: err instanceof Error ? err.message : 'Unknown error',
        processingTimeMs: Date.now() - startTime,
      });
    } finally {
      em.clear();
    }
  }

  private async fetchMediaAsBase64(url: string, analysisType: string): Promise<string> {
    const res = await fetch(url);

    if (!res.ok) {
      throw new Error(`Failed to fetch media: ${res.status}`);
    }

    const buffer = Buffer.from(await res.arrayBuffer());
    const base64 = buffer.toString('base64');
    const mimeType = analysisType === 'video_clip' ? 'video/mp4' : 'image/jpeg';
    return `data:${mimeType};base64,${base64}`;
  }
}
