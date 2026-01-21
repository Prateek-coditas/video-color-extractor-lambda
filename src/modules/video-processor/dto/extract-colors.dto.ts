import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsNumber,
  IsString,
  IsUrl,
  Min,
  Max,
  ArrayMaxSize,
  ArrayMinSize,
  IsOptional,
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
    description: 'Array of timestamps in milliseconds to extract frames from (max 10 per request). Provide either timestamps OR percentages, not both.',
    example: [2000, 8000],
    type: [Number],
    minItems: 1,
    maxItems: 10,
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1, { message: 'At least 1 timestamp is required if provided' })
  @ArrayMaxSize(10, { message: 'Maximum 10 timestamps allowed per request' })
  @IsNumber({}, { each: true })
  @Min(0, { each: true, message: 'Each timestamp must be >= 0' })
  timestamps?: number[];

  @ApiProperty({
    description: 'Array of percentages (0-100) of video duration to extract frames from (max 10 per request). Provide either timestamps OR percentages, not both.',
    example: [10, 25, 50, 75, 90],
    type: [Number],
    minItems: 1,
    maxItems: 10,
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1, { message: 'At least 1 percentage is required if provided' })
  @ArrayMaxSize(10, { message: 'Maximum 10 percentages allowed per request' })
  @IsNumber({}, { each: true })
  @Min(0, { each: true, message: 'Each percentage must be >= 0' })
  @Max(100, { each: true, message: 'Each percentage must be <= 100' })
  percentages?: number[];
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