import { Controller, Get } from "#src/core/decorators/index.js";
import { frigateApi } from "#src/services/frigate/frigate.api.js";

@Controller('/frigate')
export class FrigateController {
  @Get('/info')
  async getInfo() {
    try {
      const info = await frigateApi.getInfo();
      return { success: true, data: info };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to connect to Frigate';
      return { success: false, message };
    }
  }
}
