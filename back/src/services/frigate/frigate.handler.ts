import { FrigateProcessor } from './frigate.processor.js';

export interface FrigateReviewEvent {
  type: 'new' | 'update' | 'end';
  before: {
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
  };
  after: {
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
  };
}

export interface FrigateTrackedEvent {
  type: 'new' | 'update' | 'end';
  before: {
    id: string;
    camera: string;
    label: string;
    current_zones: string[];
    entered_zones: string[];
    start_time: number;
    end_time: number | null;
    has_clip: boolean;
    has_snapshot: boolean;
  };
  after: {
    id: string;
    camera: string;
    label: string;
    current_zones: string[];
    entered_zones: string[];
    start_time: number;
    end_time: number | null;
    has_clip: boolean;
    has_snapshot: boolean;
  };
}

export class FrigateHandler {
  private processor = new FrigateProcessor();

  handle(topic: string, data: unknown): void {
    switch (topic) {
      case 'reviews':
        this.handleReview(data as FrigateReviewEvent);
        break;
      case 'events':
        this.handleEvent(data as FrigateTrackedEvent);
        break;
    }
  }

  private handleReview(event: FrigateReviewEvent): void {
    if (event.type !== 'end') return;

    this.processor.processReview(event.after);
  }

  private handleEvent(event: FrigateTrackedEvent): void {
    if (event.type !== 'end') return;
    if (!event.after.end_time) return;

    // Пока обрабатываем только reviews, events оставляем на будущее
  }
}
