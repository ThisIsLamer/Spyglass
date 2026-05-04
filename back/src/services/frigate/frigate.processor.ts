import { orm } from '#src/database/index.js';
import { GLOBAL_CONFIG } from '#src/config.js';
import { Watcher } from '#src/modules/v1/watcher/watcher.entity.js';
import { AiProvider } from '#src/modules/v1/ai-provider/ai-provider.entity.js';
import { AnalysisEventService } from '#src/modules/v1/analysis/analysis-event.service.js';
import { AnalysisStatus } from '#src/modules/v1/analysis/analysis-event.entity.js';
import type { FrigateReviewData } from './frigate.handler.js';

const { API_URL } = GLOBAL_CONFIG.FRIGATE;

export class FrigateProcessor {
  private cooldowns = new Map<string, number>();

  async processReview(review: FrigateReviewData): Promise<void> {
    const em = orm.em.fork();
    const analysisService = new AnalysisEventService(em);

    try {
      const watchers = await em.find(Watcher, { enabled: true }, { populate: ['aiProvider'] });

      console.log(`[FrigateProcessor] Review received: camera=${review.camera}, objects=${review.data.objects.join(',')}, zones=${review.data.zones.join(',') || 'none'}`);
      console.log(`[FrigateProcessor] Active watchers: ${watchers.length}`);

      for (const watcher of watchers) {
        if (!this.matchesWatcher(watcher, review)) {
          console.log(`[FrigateProcessor] Watcher "${watcher.name}" does not match (cameras: ${watcher.cameras.join(',')}, labels: ${watcher.objectLabels.join(',') || 'any'})`);
          continue;
        }
        if (this.isOnCooldown(watcher.guid, review.camera)) {
          console.log(`[FrigateProcessor] Watcher "${watcher.name}" is on cooldown`);
          continue;
        }

        console.log(`[FrigateProcessor] Watcher "${watcher.name}" matched, starting analysis`);
        this.setCooldown(watcher.guid, review.camera, watcher.cooldownSeconds);
        await this.runAnalysis(watcher, review, analysisService);
      }
    } catch (err) {
      console.error('[FrigateProcessor] Error processing review:', err);
    } finally {
      em.clear();
    }
  }

  private matchesWatcher(watcher: Watcher, review: FrigateReviewData): boolean {
    if (!watcher.cameras.includes(review.camera)) return false;

    if (watcher.zones.length > 0) {
      const hasMatchingZone = watcher.zones.some(z => review.data.zones.includes(z));
      if (!hasMatchingZone) return false;
    }

    if (watcher.objectLabels.length > 0) {
      const hasMatchingLabel = watcher.objectLabels.some(l => review.data.objects.includes(l));
      if (!hasMatchingLabel) return false;
    }

    return true;
  }

  private isOnCooldown(watcherGuid: string, camera: string): boolean {
    const key = `${watcherGuid}:${camera}`;
    const expiresAt = this.cooldowns.get(key);
    if (!expiresAt) return false;

    if (Date.now() < expiresAt) return true;

    this.cooldowns.delete(key);
    return false;
  }

  private setCooldown(watcherGuid: string, camera: string, seconds: number): void {
    if (seconds <= 0) return;
    const key = `${watcherGuid}:${camera}`;
    this.cooldowns.set(key, Date.now() + seconds * 1000);
  }

  private async runAnalysis(watcher: Watcher, review: FrigateReviewData, analysisService: AnalysisEventService): Promise<void> {
    const provider = watcher.aiProvider ?? await this.getDefaultProvider();
    if (!provider) {
      console.warn(`[FrigateProcessor] No AI provider for watcher "${watcher.name}", skipping`);
      return;
    }

    const prompt = this.buildPrompt(watcher.prompt, review);
    const mediaUrl = this.getMediaUrl(review, watcher.analysisType);
    const mediaBase64 = mediaUrl ? await this.fetchMediaAsBase64(mediaUrl, watcher.analysisType) : undefined;

    const event = await analysisService.create({
      watcher,
      frigateEventId: review.data.detections[0] ?? review.id,
      camera: review.camera,
      prompt,
      aiProviderName: provider.name,
      aiModel: provider.model,
      label: review.data.objects[0],
      zone: review.data.zones[0],
      mediaPath: mediaUrl ?? undefined,
    });

    this.analyze(event.guid, provider, prompt, mediaBase64, analysisService, watcher.analysisType).catch(err => {
      console.error(`[FrigateProcessor] Analysis failed for event ${event.guid}:`, err);
    });
  }

  private async analyze(eventGuid: string, provider: AiProvider, prompt: string, mediaBase64: string | undefined, analysisService: AnalysisEventService, analysisType: string): Promise<void> {
    const startTime = Date.now();

    try {
      await analysisService.update(eventGuid, { status: AnalysisStatus.PROCESSING });

      const response = await this.callAiProvider(provider, prompt, mediaBase64, analysisType);

      await analysisService.update(eventGuid, {
        status: AnalysisStatus.COMPLETED,
        aiResponse: response,
        processingTimeMs: Date.now() - startTime,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';

      await analysisService.update(eventGuid, {
        status: AnalysisStatus.FAILED,
        error: errorMessage,
        processingTimeMs: Date.now() - startTime,
      });
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
    console.log(`[FrigateProcessor] Fetching media: ${url}`);
    const res = await fetch(url);

    if (!res.ok) {
      throw new Error(`Failed to fetch media from Frigate: ${res.status}`);
    }

    const buffer = Buffer.from(await res.arrayBuffer());
    const base64 = buffer.toString('base64');

    const mimeType = analysisType === 'video_clip' ? 'video/mp4' : 'image/jpeg';
    return `data:${mimeType};base64,${base64}`;
  }

  private buildPrompt(template: string, review: FrigateReviewData): string {
    const duration = review.end_time && review.start_time
      ? Math.round(review.end_time - review.start_time)
      : 0;

    return template
      .replace(/\{\{camera\}\}/g, review.camera)
      .replace(/\{\{zone\}\}/g, review.data.zones.join(', ') || 'unknown')
      .replace(/\{\{label\}\}/g, review.data.objects.join(', ') || 'unknown')
      .replace(/\{\{time\}\}/g, new Date(review.start_time * 1000).toISOString())
      .replace(/\{\{duration\}\}/g, `${duration}s`);
  }

  private getMediaUrl(review: FrigateReviewData, analysisType: string): string | null {
    const detectionId = review.data.detections[0];

    if (analysisType === 'video_clip') {
      if (review.start_time && review.end_time) {
        return `${API_URL}/api/${review.camera}/start/${review.start_time}/end/${review.end_time}/clip.mp4`;
      }
      if (detectionId) {
        return `${API_URL}/api/events/${detectionId}/clip.mp4`;
      }
    }

    if (analysisType === 'snapshot') {
      if (detectionId) {
        return `${API_URL}/api/events/${detectionId}/snapshot.jpg`;
      }
    }

    return null;
  }

  private async getDefaultProvider(): Promise<AiProvider | null> {
    const em = orm.em.fork();
    const provider = await em.findOne(AiProvider, { isDefault: true });
    em.clear();
    return provider;
  }
}
