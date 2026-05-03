import { GLOBAL_CONFIG } from '#src/config.js';

const { API_URL } = GLOBAL_CONFIG.FRIGATE;

export interface FrigateCamera {
  name: string;
  zones: string[];
}

interface FrigateConfig {
  cameras: Record<string, { zones?: Record<string, unknown> }>;
  objects?: { track?: string[] };
}

export class FrigateApi {
  async getCameras(): Promise<FrigateCamera[]> {
    const config = await this.fetchConfig();

    return Object.entries(config.cameras).map(([name, camera]) => ({
      name,
      zones: camera.zones ? Object.keys(camera.zones) : [],
    }));
  }

  async getLabels(): Promise<string[]> {
    const config = await this.fetchConfig();
    return config.objects?.track ?? ['person', 'car', 'dog', 'cat'];
  }

  async getInfo(): Promise<{ cameras: FrigateCamera[]; labels: string[] }> {
    const config = await this.fetchConfig();

    const cameras = Object.entries(config.cameras).map(([name, camera]) => ({
      name,
      zones: camera.zones ? Object.keys(camera.zones) : [],
    }));

    const labels = config.objects?.track ?? ['person', 'car', 'dog', 'cat'];

    return { cameras, labels };
  }

  private async fetchConfig(): Promise<FrigateConfig> {
    const res = await fetch(`${API_URL}/api/config`);

    if (!res.ok) {
      throw new Error(`Frigate API returned ${res.status}`);
    }

    return res.json() as Promise<FrigateConfig>;
  }
}

export const frigateApi = new FrigateApi();
