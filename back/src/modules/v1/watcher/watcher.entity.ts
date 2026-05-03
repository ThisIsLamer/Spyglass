import { Entity, Enum, ManyToOne, Property } from '@mikro-orm/decorators/es';
import { BaseEntity } from '#src/database/base.entity.js';
import { AiProvider } from '#src/modules/v1/ai-provider/ai-provider.entity.js';
import { randomUUID } from 'crypto';

export enum AnalysisType {
  SNAPSHOT = 'snapshot',
  VIDEO_CLIP = 'video_clip',
}

@Entity({ tableName: 'watchers' })
export class Watcher extends BaseEntity<'guid' | 'enabled' | 'zones' | 'objectLabels' | 'cooldownSeconds' | 'aiProvider'> {
  @Property({ type: 'string', length: 36, unique: true, onCreate: () => randomUUID() })
  guid: string = randomUUID();

  @Property({ type: 'varchar', length: 128 })
  name!: string;

  @Property({ type: 'boolean', default: true })
  enabled: boolean = true;

  @Property({ type: 'json' })
  cameras!: string[];

  @Property({ type: 'json', default: '[]' })
  zones: string[] = [];

  @Property({ type: 'json', default: '[]' })
  objectLabels: string[] = [];

  @Enum({ items: () => AnalysisType })
  analysisType!: AnalysisType;

  @Property({ type: 'text' })
  prompt!: string;

  @Property({ type: 'integer', default: 0 })
  cooldownSeconds: number = 0;

  @ManyToOne(() => AiProvider, { nullable: true })
  aiProvider?: AiProvider | null;
}
