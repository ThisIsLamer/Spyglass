import { defineConfig } from '@mikro-orm/mariadb';
import { GLOBAL_CONFIG } from '#src/config.js';

import { User } from '#src/modules/v1/user/user.entity.js';
import { Watcher } from '#src/modules/v1/watcher/watcher.entity.js';
import { AiProvider } from '#src/modules/v1/ai-provider/ai-provider.entity.js';
import { AnalysisEvent } from '#src/modules/v1/analysis/analysis-event.entity.js';

import { Migrator } from '@mikro-orm/migrations';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  clientUrl: GLOBAL_CONFIG.DATABASE.SQL.URL,
  entities: [User, Watcher, AiProvider, AnalysisEvent],
  debug: GLOBAL_CONFIG.DATABASE.LOGGING,
  extensions: [Migrator],
  migrations: {
    path: path.join(__dirname, 'migrations'),
  },
});
