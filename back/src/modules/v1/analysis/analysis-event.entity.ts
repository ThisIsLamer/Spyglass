import { Entity, Enum, ManyToOne, Property } from '@mikro-orm/decorators/es';
import { BaseEntity } from '#src/database/base.entity.js';
import { Watcher } from '#src/modules/v1/watcher/watcher.entity.js';
import { randomUUID } from 'crypto';

export enum AnalysisStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

@Entity({ tableName: 'analysis_events' })
export class AnalysisEvent extends BaseEntity<'guid' | 'label' | 'zone' | 'aiResponse' | 'processingTimeMs' | 'error' | 'mediaPath' | 'description' | 'descriptionPrompt'> {
  @Property({ type: 'string', length: 36, unique: true, onCreate: () => randomUUID() })
  guid: string = randomUUID();

  @ManyToOne(() => Watcher, { nullable: true })
  watcher?: Watcher | null;

  @Property({ type: 'varchar', length: 128 })
  frigateEventId!: string;

  @Property({ type: 'varchar', length: 128 })
  camera!: string;

  @Property({ type: 'varchar', length: 64, nullable: true })
  label?: string;

  @Property({ type: 'varchar', length: 64, nullable: true })
  zone?: string;

  @Property({ type: 'text' })
  prompt!: string;

  /**
   * Description prompt used for stage 1 (vision → free text) in two-stage mode.
   * Null when single-stage mode was used.
   */
  @Property({ type: 'text', nullable: true })
  descriptionPrompt?: string | null;

  /**
   * Free-text description produced by stage 1 in two-stage mode.
   * Null when single-stage mode was used or stage 1 failed.
   */
  @Property({ type: 'text', nullable: true })
  description?: string | null;

  @Property({ type: 'json', nullable: true })
  aiResponse?: Record<string, unknown> | null;

  @Property({ type: 'varchar', length: 128 })
  aiProviderName!: string;

  @Property({ type: 'varchar', length: 128 })
  aiModel!: string;

  @Enum({ items: () => AnalysisStatus, default: AnalysisStatus.PENDING })
  status: AnalysisStatus = AnalysisStatus.PENDING;

  @Property({ type: 'integer', nullable: true })
  processingTimeMs?: number;

  @Property({ type: 'text', nullable: true })
  error?: string;

  @Property({ type: 'varchar', length: 512, nullable: true })
  mediaPath?: string;
}
