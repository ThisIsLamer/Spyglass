import { Migration } from '@mikro-orm/migrations';

export class Migration20260503101852 extends Migration {

  override up(): void | Promise<void> {
    this.addSql(`create table \`ai_providers\` (\`id\` int unsigned not null auto_increment primary key, \`created_at\` datetime not null, \`updated_at\` datetime not null, \`guid\` varchar(36) not null, \`name\` varchar(128) not null, \`base_url\` varchar(512) not null, \`api_key\` varchar(512) null, \`model\` varchar(128) not null, \`is_default\` tinyint(1) not null default false) default character set utf8mb4 engine = InnoDB;`);
    this.addSql(`alter table \`ai_providers\` add unique \`ai_providers_guid_unique\` (\`guid\`);`);

    this.addSql(`create table \`users\` (\`id\` int unsigned not null auto_increment primary key, \`created_at\` datetime not null, \`updated_at\` datetime not null, \`guid\` varchar(36) not null, \`username\` varchar(24) not null, \`password_hash\` varchar(255) not null, \`display_name\` varchar(24) null, \`role\` enum('admin','operator','viewer') not null default 'viewer', \`is_active\` tinyint(1) not null default true, \`last_login_at\` datetime null, \`language\` varchar(5) null) default character set utf8mb4 engine = InnoDB;`);
    this.addSql(`alter table \`users\` add unique \`users_guid_unique\` (\`guid\`);`);
    this.addSql(`alter table \`users\` add unique \`users_username_unique\` (\`username\`);`);

    this.addSql(`create table \`watchers\` (\`id\` int unsigned not null auto_increment primary key, \`created_at\` datetime not null, \`updated_at\` datetime not null, \`guid\` varchar(36) not null, \`name\` varchar(128) not null, \`enabled\` tinyint(1) not null default true, \`cameras\` json not null, \`zones\` json not null default ('[]'), \`object_labels\` json not null default ('[]'), \`analysis_type\` enum('snapshot','video_clip') not null, \`prompt\` text not null, \`cooldown_seconds\` int not null default 0, \`ai_provider_id\` int unsigned null) default character set utf8mb4 engine = InnoDB;`);
    this.addSql(`alter table \`watchers\` add unique \`watchers_guid_unique\` (\`guid\`);`);
    this.addSql(`alter table \`watchers\` add index \`watchers_ai_provider_id_index\` (\`ai_provider_id\`);`);

    this.addSql(`create table \`analysis_events\` (\`id\` int unsigned not null auto_increment primary key, \`created_at\` datetime not null, \`updated_at\` datetime not null, \`guid\` varchar(36) not null, \`watcher_id\` int unsigned null, \`frigate_event_id\` varchar(128) not null, \`camera\` varchar(128) not null, \`label\` varchar(64) null, \`zone\` varchar(64) null, \`prompt\` text not null, \`ai_response\` json null, \`ai_provider_name\` varchar(128) not null, \`ai_model\` varchar(128) not null, \`status\` enum('pending','processing','completed','failed') not null default 'pending', \`processing_time_ms\` int null, \`error\` text null, \`media_path\` varchar(512) null) default character set utf8mb4 engine = InnoDB;`);
    this.addSql(`alter table \`analysis_events\` add unique \`analysis_events_guid_unique\` (\`guid\`);`);
    this.addSql(`alter table \`analysis_events\` add index \`analysis_events_watcher_id_index\` (\`watcher_id\`);`);

    this.addSql(`alter table \`watchers\` add constraint \`watchers_ai_provider_id_foreign\` foreign key (\`ai_provider_id\`) references \`ai_providers\` (\`id\`) on delete set null;`);

    this.addSql(`alter table \`analysis_events\` add constraint \`analysis_events_watcher_id_foreign\` foreign key (\`watcher_id\`) references \`watchers\` (\`id\`) on delete set null;`);
  }

  override down(): void | Promise<void> {
    this.addSql(`alter table \`watchers\` drop foreign key \`watchers_ai_provider_id_foreign\`;`);
    this.addSql(`alter table \`analysis_events\` drop foreign key \`analysis_events_watcher_id_foreign\`;`);

    this.addSql(`drop table if exists \`ai_providers\`;`);
    this.addSql(`drop table if exists \`users\`;`);
    this.addSql(`drop table if exists \`watchers\`;`);
    this.addSql(`drop table if exists \`analysis_events\`;`);
  }

}
