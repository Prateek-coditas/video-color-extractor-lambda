import { Injectable, BadRequestException } from '@nestjs/common';
import PQueue from 'p-queue';
import { VideoProcessorRepository } from './video-processor.repository';
import {
  ExtractColorsDto,
  ExtractColorsResponseDto,
  ColorResultDto,
} from './dto/extract-colors.dto';

@Injectable()
export class VideoProcessorService {
  private readonly queue: PQueue;

  constructor(private readonly repository: VideoProcessorRepository) {
    this.queue = new PQueue({
      concurrency: 4,
      timeout: 600000, 
      throwOnTimeout: true,
    });
  }
  
  async extractColors(
    dto: ExtractColorsDto,
  ): Promise<ExtractColorsResponseDto> {
    try {
      const videoDuration = await this.repository.getVideoDuration(dto.videoUrl);

      const invalidTimestamps = dto.timestamps.filter(
        (ts) => ts > videoDuration,
      );

      if (invalidTimestamps.length > 0) {
        throw new BadRequestException(
          `Timestamps [${invalidTimestamps.join(', ')}] exceed video duration of ${videoDuration}ms`,
        );
      }

      const colorPromises = dto.timestamps.map((timestamp) =>
        this.queue.add(() => this.processTimestamp(dto.videoUrl, timestamp))
      );

      const colorResults = await Promise.all(colorPromises).then(results => 
        results.filter((result): result is ColorResultDto => result !== undefined)
      );

      return {
        videoUrl: dto.videoUrl,
        results: colorResults,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new BadRequestException(
        `Failed to extract colors: ${error.message}`,
      );
    }
  }

  private async processTimestamp(
    videoUrl: string,
    timestamp: number,
  ): Promise<ColorResultDto> {
    try {
      const dominantColor = await this.repository.extractColorFromFrame(
        videoUrl,
        timestamp,
      );

      return {
        timestamp,
        color: dominantColor,
      };
    } catch (error) {
      throw new Error(
        `Failed to process timestamp ${timestamp}ms: ${error.message}`,
      );
    }
  }


  async validateFfmpeg(): Promise<boolean> {
    return this.repository.isFfmpegAvailable();
  }

  getCacheStats() {
    return this.repository.getCacheStats();
  }

  clearCache(): void {
    this.repository.clearCache();
  }
}
