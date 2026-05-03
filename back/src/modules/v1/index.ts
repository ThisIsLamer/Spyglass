import { Module } from "#src/core/decorators/index.js";
import { AuthController } from "./auth/auth.controller.js";
import { UserController } from "./user/user.controller.js";
import { WatcherController } from "./watcher/watcher.controller.js";
import { AiProviderController } from "./ai-provider/ai-provider.controller.js";
import { AnalysisEventController } from "./analysis/analysis-event.controller.js";
import { FrigateController } from "./frigate/frigate.controller.js";

@Module({
  prefix: 'ai',
  version: 'v1',
  controllers: [
    AuthController,
    UserController,
    WatcherController,
    AiProviderController,
    AnalysisEventController,
    FrigateController,
  ]
})
export class V1Module {}
