import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Get,
  Delete,
} from '@nestjs/common';
import { VideoProcessorService } from './video.processor.service';
import {
  ExtractColorsDto,
  ExtractColorsResponseDto,
} from './dto/extract-colors.dto';

@Controller('video')
export class VideoProcessorController {
  constructor(private readonly videoProcessorService: VideoProcessorService) { }

  @Post('extract-colors')
  @HttpCode(HttpStatus.OK)
  async extractColors(
    @Body() dto: ExtractColorsDto,
  ): Promise<ExtractColorsResponseDto> {
    return this.videoProcessorService.extractColors(dto);
  }

  @Get('health')
  @HttpCode(HttpStatus.OK)
  async healthCheck(): Promise<{ ffmpegAvailable: boolean; message: string }> {
    const isAvailable = await this.videoProcessorService.validateFfmpeg();
    return {
      ffmpegAvailable: isAvailable,
      message: isAvailable
        ? 'FFmpeg is installed and accessible'
        : 'FFmpeg is not available. Please install FFmpeg.',
    };
  }

  @Get('cache/stats')
  @HttpCode(HttpStatus.OK)
  getCacheStats() {
    const stats = this.videoProcessorService.getCacheStats();
    return {
      keys: stats.keys,
      hits: stats.hits,
      misses: stats.misses,
      hitRate: stats.hits / (stats.hits + stats.misses) || 0,
    };
  }

  @Delete('cache')
  @HttpCode(HttpStatus.OK)
  clearCache(): { message: string } {
    this.videoProcessorService.clearCache();
    return { message: 'Cache cleared successfully' };
  }
}
