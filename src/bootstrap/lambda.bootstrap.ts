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
            await videoService.extractColors(dto);
        } catch {
            failures.push({ itemIdentifier: record.messageId });
        }
    }

    await app.close();
    return { batchItemFailures: failures };
};
