import { Entity, Enum, Property, Unique } from '@mikro-orm/decorators/es';
import { BaseEntity } from '#src/database/base.entity.js';
import { randomUUID } from 'crypto';

export enum UserRole {
  ADMIN = 'admin',
  OPERATOR = 'operator',
  VIEWER = 'viewer',
}

@Entity({ tableName: 'users' })
export class User extends BaseEntity<'guid' | 'displayName' | 'isActive' | 'lastLoginAt' | 'language'> {
  @Property({ type: 'string', length: 36, unique: true, onCreate: () => randomUUID() })
  guid: string = randomUUID();
  
  @Property({ type: 'varchar', length: 24 })
  @Unique()
  username!: string;

  @Property({ type: 'varchar', length: 255 })
  passwordHash!: string;

  @Property({ type: 'varchar', length: 24, nullable: true })
  displayName?: string;

  @Enum({ items: () => UserRole, default: UserRole.VIEWER })
  role: UserRole = UserRole.VIEWER;

  @Property({ type: 'boolean', default: true })
  isActive: boolean = true;

  @Property({ type: 'datetime', nullable: true })
  lastLoginAt?: Date;

  @Property({ type: 'varchar', length: 5, nullable: true })
  language?: string;
}
