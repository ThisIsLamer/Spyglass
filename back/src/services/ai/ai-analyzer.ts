import type { AiProvider } from '#src/modules/v1/ai-provider/ai-provider.entity.js';

export type AnalysisType = 'snapshot' | 'video_clip' | string;

export interface TwoStageResult {
  description: string;
  response: Record<string, unknown>;
}

/**
 * Centralized AI-call layer.
 *
 * Two modes:
 *   - Single-stage: vision → JSON (legacy path)
 *   - Two-stage:    vision → free-text description, then text-only → JSON
 *
 * The two-stage mode reduces cognitive load on the vision model:
 * stage 1 focuses on observation, stage 2 on extraction. This eliminates
 * common failure patterns like JSON fields contradicting the summary.
 */
export class AiAnalyzer {
  /**
   * Stage 1: vision model describes the scene in free text.
   * No JSON, no schema — just pure observation.
   */
  async describeScene(
    provider: AiProvider,
    descriptionPrompt: string,
    mediaBase64: string | undefined,
    analysisType: AnalysisType,
  ): Promise<string> {
    const messages = this.buildVisionMessages(descriptionPrompt, mediaBase64, analysisType);

    const content = await this.chatCompletion(provider, {
      messages,
      temperature: 0.2,
      top_k: 20,
      mm_processor_kwargs: { fps: 5, do_sample_frames: true },
      chat_template_kwargs: { enable_thinking: false },
    });

    return content.trim();
  }

  /**
   * Stage 2: text-only model maps description into a JSON schema.
   * No vision input, so latency is low and JSON compliance is high.
   */
  async structureFromDescription(
    provider: AiProvider,
    prompt: string,
    description: string,
  ): Promise<Record<string, unknown>> {
    const userContent = `${prompt}\n\n--- SCENE DESCRIPTION ---\n${description}\n--- END DESCRIPTION ---`;

    const content = await this.chatCompletion(provider, {
      messages: [{ role: 'user', content: userContent }],
      response_format: { type: 'json_object' },
      temperature: 0.1,
      top_k: 20,
      chat_template_kwargs: { enable_thinking: false },
    });

    return JSON.parse(content) as Record<string, unknown>;
  }

  /**
   * Single-stage mode: vision model returns JSON directly.
   * Used when no description prompt is configured for the watcher.
   */
  async callVisionJson(
    provider: AiProvider,
    prompt: string,
    mediaBase64: string | undefined,
    analysisType: AnalysisType,
  ): Promise<Record<string, unknown>> {
    const messages = this.buildVisionMessages(prompt, mediaBase64, analysisType);

    const content = await this.chatCompletion(provider, {
      messages,
      response_format: { type: 'json_object' },
      temperature: 0.3,
      top_k: 20,
      mm_processor_kwargs: { fps: 5, do_sample_frames: true },
      chat_template_kwargs: { enable_thinking: false },
    });

    return JSON.parse(content) as Record<string, unknown>;
  }

  /**
   * Convenience wrapper for the full two-stage flow.
   */
  async runTwoStage(
    provider: AiProvider,
    descriptionPrompt: string,
    structurePrompt: string,
    mediaBase64: string | undefined,
    analysisType: AnalysisType,
    onDescription?: (description: string) => Promise<void>,
  ): Promise<TwoStageResult> {
    const description = await this.describeScene(provider, descriptionPrompt, mediaBase64, analysisType);
    if (onDescription) await onDescription(description);
    const response = await this.structureFromDescription(provider, structurePrompt, description);
    return { description, response };
  }

  private buildVisionMessages(
    prompt: string,
    mediaBase64: string | undefined,
    analysisType: AnalysisType,
  ): Array<Record<string, unknown>> {
    if (!mediaBase64) {
      return [{ role: 'user', content: prompt }];
    }

    const mediaType = analysisType === 'video_clip' ? 'video_url' : 'image_url';

    return [{
      role: 'user',
      content: [
        { type: 'text', text: prompt },
        { type: mediaType, [mediaType]: { url: mediaBase64 } },
      ],
    }];
  }

  private async chatCompletion(
    provider: AiProvider,
    body: Record<string, unknown>,
  ): Promise<string> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (provider.apiKey) {
      headers['Authorization'] = `Bearer ${provider.apiKey}`;
    }

    const res = await fetch(`${provider.baseUrl}/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ model: provider.model, ...body }),
    });

    if (!res.ok) {
      throw new Error(`AI provider returned ${res.status}: ${await res.text()}`);
    }

    const data = await res.json() as { choices: Array<{ message: { content: string } }> };
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error('AI provider returned empty response');
    }

    return content;
  }
}

export const aiAnalyzer = new AiAnalyzer();
