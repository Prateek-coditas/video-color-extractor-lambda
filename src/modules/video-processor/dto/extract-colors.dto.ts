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
  @IsString()
  @IsUrl({}, { message: 'videoUrl must be a valid URL' })
  videoUrl: string;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1, { message: 'At least 1 timestamp is required if provided' })
  @ArrayMaxSize(10, { message: 'Maximum 10 timestamps allowed per request' })
  @IsNumber({}, { each: true })
  @Min(0, { each: true, message: 'Each timestamp must be >= 0' })
  timestamps?: number[];

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
  timestamp: number;
  color: string;
}

export class ExtractColorsResponseDto {
  videoUrl: string;
  results: ColorResultDto[];
}
