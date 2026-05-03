import { orm } from '#src/database/index.js';
import { GLOBAL_CONFIG } from '#src/config.js';
import { Watcher } from '#src/modules/v1/watcher/watcher.entity.js';
import { AiProvider } from '#src/modules/v1/ai-provider/ai-provider.entity.js';
import { AnalysisEventService } from '#src/modules/v1/analysis/analysis-event.service.js';
import { AnalysisStatus } from '#src/modules/v1/analysis/analysis-event.entity.js';
import type { FrigateReviewEvent } from './frigate.handler.js';

const { API_URL } = GLOBAL_CONFIG.FRIGATE;

interface ReviewData {
  id: string;
  camera: string;
  start_time: number;
  end_time: number | null;
  severity: string;
  data: {
    detections: string[];
    objects: string[];
    sub_labels: string[];
    zones: string[];
    audio: string[];
  };
}

export class FrigateProcessor {
  private analysisService = new AnalysisEventService();
  private cooldowns = new Map<string, number>();

  async processReview(review: ReviewData): Promise<void> {
    const em = orm.em.fork();

    try {
      const watchers = await em.find(Watcher, { enabled: true }, { populate: ['aiProvider'] });

      for (const watcher of watchers) {
        if (!this.matchesWatcher(watcher, review)) continue;
        if (this.isOnCooldown(watcher.guid, review.camera)) continue;

        this.setCooldown(watcher.guid, review.camera, watcher.cooldownSeconds);
        await this.runAnalysis(watcher, review);
      }
    } catch (err) {
      console.error('[FrigateProcessor] Error processing review:', err);
    } finally {
      em.clear();
    }
  }

  private matchesWatcher(watcher: Watcher, review: ReviewData): boolean {
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

  private async runAnalysis(watcher: Watcher, review: ReviewData): Promise<void> {
    const provider = watcher.aiProvider ?? await this.getDefaultProvider();
    if (!provider) {
      console.warn(`[FrigateProcessor] No AI provider for watcher "${watcher.name}", skipping`);
      return;
    }

    const prompt = this.buildPrompt(watcher.prompt, review);
    const mediaUrl = this.getMediaUrl(review, watcher.analysisType);
    const mediaBase64 = mediaUrl ? await this.fetchMediaAsBase64(mediaUrl, watcher.analysisType) : undefined;

    const event = await this.analysisService.create({
      watcher,
      frigateEventId: review.id,
      camera: review.camera,
      prompt,
      aiProviderName: provider.name,
      aiModel: provider.model,
      label: review.data.objects[0],
      zone: review.data.zones[0],
      mediaPath: mediaUrl ?? undefined,
    });

    this.analyze(event.guid, provider, prompt, mediaBase64);
  }

  private async analyze(eventGuid: string, provider: AiProvider, prompt: string, mediaBase64: string | undefined): Promise<void> {
    const startTime = Date.now();

    try {
      await this.analysisService.update(eventGuid, { status: AnalysisStatus.PROCESSING });

      const response = await this.callAiProvider(provider, prompt, mediaBase64);

      await this.analysisService.update(eventGuid, {
        status: AnalysisStatus.COMPLETED,
        aiResponse: response,
        processingTimeMs: Date.now() - startTime,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';

      await this.analysisService.update(eventGuid, {
        status: AnalysisStatus.FAILED,
        error: errorMessage,
        processingTimeMs: Date.now() - startTime,
      });
    }
  }

  private async callAiProvider(provider: AiProvider, prompt: string, mediaBase64: string | undefined): Promise<Record<string, unknown>> {
    const messages: Array<Record<string, unknown>> = [];

    if (mediaBase64) {
      messages.push({
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          { type: 'image_url', image_url: { url: mediaBase64 } },
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
      throw new Error(`Failed to fetch media from Frigate: ${res.status}`);
    }

    const buffer = Buffer.from(await res.arrayBuffer());
    const base64 = buffer.toString('base64');

    const mimeType = analysisType === 'video_clip' ? 'video/mp4' : 'image/jpeg';
    return `data:${mimeType};base64,${base64}`;
  }

  private buildPrompt(template: string, review: ReviewData): string {
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

  private getMediaUrl(review: ReviewData, analysisType: string): string | null {
    if (analysisType === 'video_clip') {
      return `${API_URL}/api/events/${review.id}/clip.mp4`;
    }
    if (analysisType === 'snapshot') {
      return `${API_URL}/api/events/${review.id}/snapshot.jpg`;
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
