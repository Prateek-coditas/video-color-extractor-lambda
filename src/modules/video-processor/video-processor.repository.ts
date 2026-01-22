import NodeCache from 'node-cache';
import { FfmpegUtil } from './utils/ffmpeg.util';
import { ColorUtil } from './utils/color.util';

export class VideoProcessorRepository {
  private readonly cache: NodeCache;

  constructor() {
    this.cache = new NodeCache({
      stdTTL: 3600,           
      maxKeys: 10000,         
      checkperiod: 600,       
      useClones: false,       
    });
  }

  async getVideoDuration(videoUrl: string): Promise<number> {
    const cacheKey = `duration:${videoUrl}`;

    const cached = this.cache.get<number>(cacheKey);
    if (cached !== undefined) {
      return cached;
    }

    const duration = await FfmpegUtil.getVideoDuration(videoUrl);

    this.cache.set(cacheKey, duration);

    return duration;
  }

  async extractColorFromFrame(
    videoUrl: string,
    timestampMs: number,
  ): Promise<string> {
    const cacheKey = `color:${videoUrl}:${timestampMs}`;

    const cached = this.cache.get<string>(cacheKey);
    if (cached !== undefined) {
      return cached;
    }

    const frameBuffer = await FfmpegUtil.extractFrame(videoUrl, timestampMs);

    const dominantColor = await ColorUtil.extractDominantColor(frameBuffer);

    this.cache.set(cacheKey, dominantColor);

    return dominantColor;
  }

  async isFfmpegAvailable(): Promise<boolean> {
    return FfmpegUtil.isFfmpegAvailable();
  }


  clearCache(): void {
    this.cache.flushAll();
  }

  getCacheStats() {
    return this.cache.getStats();
  }
  
  deleteCacheEntry(videoUrl: string, timestampMs?: number): void {
    if (timestampMs !== undefined) {
      this.cache.del(`color:${videoUrl}:${timestampMs}`);
    } else {
      const keys = this.cache.keys();
      keys.forEach(key => {
        if (key.includes(videoUrl)) {
          this.cache.del(key);
        }
      });
    }
  }
}