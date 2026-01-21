import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Get,
  Delete,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
} from '@nestjs/swagger';
import { VideoProcessorService } from './video-processor.service';
import {
  ExtractColorsDto,
  ExtractColorsResponseDto,
} from './dto/extract-colors.dto';

@ApiTags('video')
@Controller('video')
export class VideoProcessorController {
  constructor(private readonly videoProcessorService: VideoProcessorService) {}

  @Post('extract-colors')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Extract dominant colors from video frames',
    description:
      'Accepts a direct video URL (S3, CDN, etc) and array of timestamps, extracts frames at those timestamps, and returns the dominant color for each frame in HEX format. Results are cached for 1 hour.',
  })
  @ApiBody({ type: ExtractColorsDto })
  @ApiResponse({
    status: 200,
    description: 'Colors extracted successfully',
    type: ExtractColorsResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request or processing error',
  })
  async extractColors(
    @Body() dto: ExtractColorsDto,
  ): Promise<ExtractColorsResponseDto> {
    return this.videoProcessorService.extractColors(dto);
  }

  @Get('health')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Check FFmpeg availability',
    description: 'Validates that FFmpeg is installed and accessible',
  })
  @ApiResponse({
    status: 200,
    description: 'FFmpeg status',
    schema: {
      type: 'object',
      properties: {
        ffmpegAvailable: { type: 'boolean' },
        message: { type: 'string' },
      },
    },
  })
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
  @ApiOperation({
    summary: 'Get cache statistics',
    description: 'Returns cache hit rate and other statistics for monitoring',
  })
  @ApiResponse({
    status: 200,
    description: 'Cache statistics',
    schema: {
      type: 'object',
      properties: {
        keys: { type: 'number' },
        hits: { type: 'number' },
        misses: { type: 'number' },
        hitRate: { type: 'number' },
      },
    },
  })
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
  @ApiOperation({
    summary: 'Clear cache',
    description: 'Clears all cached color extraction results (useful for testing)',
  })
  @ApiResponse({
    status: 200,
    description: 'Cache cleared successfully',
  })
  clearCache(): { message: string } {
    this.videoProcessorService.clearCache();
    return { message: 'Cache cleared successfully' };
  }
}