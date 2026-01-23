import { SQSEvent, Context } from 'aws-lambda';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { VideoProcessorService } from '../modules/video-processor/video.processor.service';

export const handler = async (event: SQSEvent, context: Context) => {
    context.callbackWaitsForEmptyEventLoop = false;

    const app = await NestFactory.createApplicationContext(AppModule);
    const videoService = app.get(VideoProcessorService);

    const failures: { itemIdentifier: string }[] = [];

    for (const record of event.Records) {
        try {
            const dto = JSON.parse(record.body);
            console.log(`Processing video: ${dto.videoUrl}`);
            console.log(`Timestamps/Percentages:`, dto.timestamps || dto.percentages);

            const result = await videoService.extractColors(dto);

            console.log(`Extracted ${result.results.length} colors:`);
            result.results.forEach((colorResult, index) => {
                console.log(`  [${index + 1}] Timestamp: ${colorResult.timestamp}ms → Color: ${colorResult.color}`);
            });
        } catch (error) {
            console.error(`Failed to process message ${record.messageId}:`, error.message);
            failures.push({ itemIdentifier: record.messageId });
        }
    }

    await app.close();
    return { batchItemFailures: failures };
};
