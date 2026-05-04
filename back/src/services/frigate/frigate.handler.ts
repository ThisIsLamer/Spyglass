import { FrigateProcessor } from './frigate.processor.js';

export interface FrigateReviewEvent {
  type: 'new' | 'update' | 'end';
  before: FrigateReviewData;
  after: FrigateReviewData;
}

export interface FrigateReviewData {
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

export class FrigateHandler {
  private processor = new FrigateProcessor();

  handle(topic: string, data: unknown): void {
    if (topic === 'reviews') {
      this.handleReview(data as FrigateReviewEvent);
    }
  }

  private handleReview(event: FrigateReviewEvent): void {
    if (event.type !== 'end') return;

    console.log(`[FrigateHandler] Review ended: id=${event.after.id}, camera=${event.after.camera}`);

    this.processor.processReview(event.after).catch(err => {
      console.error('[FrigateHandler] Error processing review:', err);
    });
  }
}
