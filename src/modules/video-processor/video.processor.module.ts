import { Module } from '@nestjs/common';
import { VideoProcessorService } from './video.processor.service';
import { VideoProcessorRepository } from './video.processor.repository';

@Module({
  providers: [VideoProcessorService, VideoProcessorRepository],
  exports: [VideoProcessorService],
})
export class VideoProcessorModule { }