import { Module } from '@nestjs/common';
import { VideoProcessorModule } from './modules/video-processor/video-processor.module';

@Module({
  imports: [VideoProcessorModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
