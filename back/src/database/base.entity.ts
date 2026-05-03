import { OptionalProps } from "@mikro-orm/core";
import { PrimaryKey, Property } from "@mikro-orm/decorators/es";

export { OptionalProps };

export abstract class BaseEntity<Optional extends string = never> {
  [OptionalProps]?: 'id' | 'createdAt' | 'updatedAt' | Optional;

  @PrimaryKey({ type: 'integer' })
  id!: number;

  @Property({ type: 'datetime', onCreate: () => new Date() })
  createdAt: Date = new Date();

  @Property({ type: 'datetime', onCreate: () => new Date(), onUpdate: () => new Date() })
  updatedAt: Date = new Date();
}
