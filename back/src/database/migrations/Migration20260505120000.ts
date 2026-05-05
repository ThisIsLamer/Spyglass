import { Migration } from '@mikro-orm/migrations';

export class Migration20260505120000 extends Migration {

  override up(): void | Promise<void> {
    // Two-stage analysis: describe-then-structure
    this.addSql(`alter table \`watchers\` add \`description_prompt\` text null;`);

    this.addSql(`alter table \`analysis_events\` add \`description\` text null;`);
    this.addSql(`alter table \`analysis_events\` add \`description_prompt\` text null;`);
  }

  override down(): void | Promise<void> {
    this.addSql(`alter table \`analysis_events\` drop column \`description_prompt\`;`);
    this.addSql(`alter table \`analysis_events\` drop column \`description\`;`);

    this.addSql(`alter table \`watchers\` drop column \`description_prompt\`;`);
  }

}
