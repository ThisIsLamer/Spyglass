import { Entity, Property } from '@mikro-orm/decorators/es';
import { BaseEntity } from '#src/database/base.entity.js';
import { randomUUID } from 'crypto';

@Entity({ tableName: 'ai_providers' })
export class AiProvider extends BaseEntity<'guid' | 'apiKey' | 'isDefault'> {
  @Property({ type: 'string', length: 36, unique: true, onCreate: () => randomUUID() })
  guid: string = randomUUID();

  @Property({ type: 'varchar', length: 128 })
  name!: string;

  @Property({ type: 'varchar', length: 512 })
  baseUrl!: string;

  @Property({ type: 'varchar', length: 512, nullable: true })
  apiKey?: string;

  @Property({ type: 'varchar', length: 128 })
  model!: string;

  @Property({ type: 'boolean', default: false })
  isDefault: boolean = false;
}
