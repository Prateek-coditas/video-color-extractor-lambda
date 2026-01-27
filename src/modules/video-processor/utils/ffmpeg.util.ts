import ffmpeg from 'fluent-ffmpeg';
import * as fs from 'fs/promises';
import * as fsSync from 'fs';
import * as path from 'path';

export class FfmpegUtil {
  private static readonly TEMP_DIR = path.join(process.cwd(), 'temp-frames');
  private static cleanupInterval: NodeJS.Timeout | null = null;
  
  private static async ensureTempDir(): Promise<void> {
    try {
      await fs.access(this.TEMP_DIR);
    } catch {
      await fs.mkdir(this.TEMP_DIR, { recursive: true });
    }
  }
  static initCleanup(): void {
    if (this.cleanupInterval) return;

    this.cleanupInterval = setInterval(async () => {
      await this.cleanupOldTempFiles();
    }, 10 * 60 * 1000);
    
    process.on('beforeExit', async () => {
      if (this.cleanupInterval) {
        clearInterval(this.cleanupInterval);
      }
      await this.cleanupOldTempFiles();
    });
  }
  private static async cleanupOldTempFiles(): Promise<void> {
    try {
      await this.ensureTempDir();
      const files = await fs.readdir(this.TEMP_DIR);
      const now = Date.now();
      const maxAge = 60 * 60 * 1000;

      for (const file of files) {
        const filePath = path.join(this.TEMP_DIR, file);
        try {
          const stats = await fs.stat(filePath);
          if (now - stats.mtimeMs > maxAge) {
            await fs.unlink(filePath);
          }
        } catch (error) {
        }
      }
    } catch (error) {
    }
  }
  static async extractFrame(
    videoUrl: string,
    timestampMs: number,
  ): Promise<Buffer> {
    if (!this.isValidVideoUrl(videoUrl)) {
      throw new Error(
        'Invalid video URL. Please provide a direct link to a video file ' +
        '(e.g., .mp4, .avi, .mov) or an S3/CDN URL.'
      );
    }
    await this.ensureTempDir();
    const timestampSeconds = timestampMs / 1000;
    const outputPath = path.join(
      this.TEMP_DIR,
      `frame_${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`,
    );
    return new Promise((resolve, reject) => {
      ffmpeg(videoUrl)
        .inputOptions([
          '-ss', timestampSeconds.toString(),
          '-threads', '0', 
        ])
        .outputOptions([
          '-vframes', '1',              
          '-vf', 'scale=200:-1',        
          '-q:v', '3',                  
          '-f', 'image2',               
        ])
        .output(outputPath)
        .on('end', async () => {
          try {
            const frameBuffer = await fs.readFile(outputPath);
            await fs.unlink(outputPath).catch(() => {});
            resolve(frameBuffer);
          } catch (error) {
            reject(
              new Error(`Failed to read extracted frame: ${error.message}`),
            );
          }
        })
        .on('error', async (error) => {
          try {
            await fs.access(outputPath);
            await fs.unlink(outputPath);
          } catch {}

          reject(
            new Error(
              `FFmpeg extraction failed: ${error.message}. Ensure FFmpeg is installed and the video URL is accessible.`,
            ),
          );
        })
        .run();
    });
  }
  private static isValidVideoUrl(videoUrl: string): boolean {
    try {
      new URL(videoUrl);
    } catch {
      return false;
    }

    const lowerUrl = videoUrl.toLowerCase();

    const videoExtensions = ['.mp4', '.avi', '.mov', '.mkv', '.webm', '.flv', '.wmv', '.m4v', '.mpeg', '.mpg'];
    const hasVideoExtension = videoExtensions.some(ext => lowerUrl.includes(ext));
    if (hasVideoExtension) {
      return true;
    }

    const trustedDomains = [
      's3.', 
      'amazonaws.com', 
      'cloudfront.net', 
      'cdn.', 
      'storage.googleapis.com',
      'blob.core.windows.net',
      'digitaloceanspaces.com', 
    ];
    const isTrustedDomain = trustedDomains.some(domain => lowerUrl.includes(domain));
    
    return isTrustedDomain;
  }

  static async getVideoDuration(videoUrl: string): Promise<number> {
    if (!this.isValidVideoUrl(videoUrl)) {
      throw new Error(
        'Invalid video URL. Please provide a direct link to a video file ' +
        '(e.g., .mp4, .avi, .mov) or an S3/CDN URL.'
      );
    }

    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(videoUrl, (err, metadata) => {
        if (err) {
          const errMsg = err.message.toLowerCase();
          let errorMessage = `Failed to process video: ${err.message}`;

          if (errMsg.includes('404') || errMsg.includes('not found')) {
            errorMessage =
              'Video file not found (404). The URL does not point to an existing file. ' +
              'Please verify the URL is correct.';
          } else if (errMsg.includes('403') || errMsg.includes('forbidden')) {
            errorMessage =
              'Access denied (403). The video exists but is not publicly accessible. ' +
              'For S3 URLs, ensure the bucket/object has public read permissions or use pre-signed URLs.';
          } else if (errMsg.includes('connection') || errMsg.includes('timeout')) {
            errorMessage =
              'Connection failed or timed out. Please verify the URL is accessible and check your network.';
          } else if (errMsg.includes('invalid') && errMsg.includes('format')) {
            errorMessage =
              'Invalid video format or corrupted file. Ensure the URL points to a valid video.';
          } else if (errMsg.includes('moov atom not found')) {
            errorMessage =
              'Invalid MP4 file (missing MOOV atom). The file may be corrupted or incompatible. ' +
              'Try re-encoding the video or uploading a different file.';
          }

          reject(new Error(errorMessage));
          return;
        }

        const durationSeconds = metadata.format.duration;
        if (!durationSeconds) {
          reject(new Error('Could not determine video duration'));
          return;
        }

        resolve(Math.floor(durationSeconds * 1000));
      });
    });
  }

  static async isFfmpegAvailable(): Promise<boolean> {
    return new Promise((resolve) => {
      ffmpeg.getAvailableEncoders((err) => {
        resolve(!err);
      });
    });
  }
}

FfmpegUtil.initCleanup();