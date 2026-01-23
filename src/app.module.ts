import { Module } from '@nestjs/common';
import { VideoProcessorModule } from './modules/video-processor/video.processor.module';

@Module({
  imports: [VideoProcessorModule],
})
export class AppModule { }
