import { ApiProperty } from '@nestjs/swagger';
import { 
  IsArray, 
  IsNumber, 
  IsString, 
  IsUrl, 
  Min, 
  ArrayMaxSize, 
  ArrayMinSize 
} from 'class-validator';

export class ExtractColorsDto {
  @ApiProperty({
    description: 'Direct video file URL (S3, CDN, or direct .mp4/.mov etc)',
    example: 'https://my-bucket.s3.us-east-1.amazonaws.com/videos/sample.mp4',
  })
  @IsString()
  @IsUrl({}, { message: 'videoUrl must be a valid URL' })
  videoUrl: string;

  @ApiProperty({
    description: 'Array of timestamps in milliseconds to extract frames from (max 10 per request)',
    example: [2000, 8000],
    type: [Number],
    minItems: 1,
    maxItems: 10,
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'At least 1 timestamp is required' })
  @ArrayMaxSize(10, { message: 'Maximum 10 timestamps allowed per request to prevent resource exhaustion' })
  @IsNumber({}, { each: true })
  @Min(0, { each: true, message: 'Each timestamp must be >= 0' })
  timestamps: number[];
}

export class ColorResultDto {
  @ApiProperty({
    description: 'Timestamp in milliseconds',
    example: 2000,
  })
  timestamp: number;

  @ApiProperty({
    description: 'Dominant color in HEX format',
    example: '#FF7850',
  })
  color: string;
}

export class ExtractColorsResponseDto {
  @ApiProperty({
    description: 'URL of the processed video',
    example: 'https://my-bucket.s3.us-east-1.amazonaws.com/videos/sample.mp4',
  })
  videoUrl: string;

  @ApiProperty({
    description: 'Array of color results for each timestamp',
    type: [ColorResultDto],
  })
  results: ColorResultDto[];
}