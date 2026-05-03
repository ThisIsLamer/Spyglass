import { Module } from "#src/core/decorators/index.js";
import { ApiController } from "./api.controller.js";

@Module({
  prefix: '',
  controllers: [ApiController]
})
export class BaseModule {}
