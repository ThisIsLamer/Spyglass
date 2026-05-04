import { orm } from "#src/database/index.js";
import { GLOBAL_CONFIG } from "#src/config.js";
import { AnalysisEvent, AnalysisStatus } from "./analysis-event.entity.js";
import { AnalysisEventService } from "./analysis-event.service.js";
import { AiProvider } from "#src/modules/v1/ai-provider/ai-provider.entity.js";
import type { SqlEntityManager } from "@mikro-orm/mariadb";

const { API_URL } = GLOBAL_CONFIG.FRIGATE;

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

    await analysisService.update(eventGuid, {
      status: AnalysisStatus.PROCESSING,
      aiResponse: null,
      error: undefined,
      processingTimeMs: undefined,
    });

    const startTime = Date.now();

    try {
      const mediaBase64 = event.mediaPath
        ? await this.fetchMediaAsBase64(event.mediaPath, event.mediaPath.endsWith('.mp4') ? 'video_clip' : 'snapshot')
        : undefined;

      const analysisType = event.mediaPath?.endsWith('.mp4') ? 'video_clip' : 'snapshot';
      const response = await this.callAiProvider(provider, event.prompt, mediaBase64, analysisType);

      await analysisService.update(eventGuid, {
        status: AnalysisStatus.COMPLETED,
        aiResponse: response,
        processingTimeMs: Date.now() - startTime,
      });
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

  private async callAiProvider(provider: AiProvider, prompt: string, mediaBase64: string | undefined, analysisType: string): Promise<Record<string, unknown>> {
    const messages: Array<Record<string, unknown>> = [];

    if (mediaBase64) {
      const mediaType = analysisType === 'video_clip' ? 'video_url' : 'image_url';
      messages.push({
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          { type: mediaType, [mediaType]: { url: mediaBase64 } },
        ],
      });
    } else {
      messages.push({ role: 'user', content: prompt });
    }

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (provider.apiKey) {
      headers['Authorization'] = `Bearer ${provider.apiKey}`;
    }

    const res = await fetch(`${provider.baseUrl}/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: provider.model,
        messages,
        response_format: { type: 'json_object' },
        chat_template_kwargs: { enable_thinking: false },
      }),
    });

    if (!res.ok) {
      throw new Error(`AI provider returned ${res.status}: ${await res.text()}`);
    }

    const data = await res.json() as { choices: Array<{ message: { content: string } }> };
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error('AI provider returned empty response');
    }

    return JSON.parse(content) as Record<string, unknown>;
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
