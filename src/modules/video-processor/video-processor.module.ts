import { Module } from '@nestjs/common';
import { VideoProcessorController } from './video-processor.controller';
import { VideoProcessorService } from './video-processor.service';
import { VideoProcessorRepository } from './video-processor.repository';

@Module({
  controllers: [VideoProcessorController],
  providers: [VideoProcessorService, VideoProcessorRepository],
  exports: [VideoProcessorService],
})
export class VideoProcessorModule {}